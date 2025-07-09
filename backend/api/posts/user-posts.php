<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';
include_once '../../config/jwt.php';

$database = new Database();
$db = $database->getConnection();

// Get JWT token from header
$headers = apache_request_headers();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';

if (empty($token)) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Access denied"));
    exit();
}

$jwt = new JWTHandler();
$user_data = $jwt->validateToken($token);

if (!$user_data) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Invalid token"));
    exit();
}

$user_id = $user_data->id;

$query = "SELECT p.*,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
          FROM posts p 
          WHERE p.user_id = :user_id
          ORDER BY p.created_at DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(":user_id", $user_id);
$stmt->execute();

$posts = array();
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $posts[] = $row;
}

http_response_code(200);
echo json_encode(array("success" => true, "posts" => $posts));
?>
