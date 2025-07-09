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

$current_user_id = $user_data->id;
$search_query = $_GET['q'] ?? '';

if (empty($search_query)) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Search query is required"));
    exit();
}

$query = "SELECT u.id, u.username, u.full_name, u.profile_photo, u.is_private,
          CASE 
            WHEN f.status = 'accepted' THEN 'following'
            WHEN f.status = 'pending' THEN 'requested'
            ELSE 'not_following'
          END as follow_status
          FROM users u 
          LEFT JOIN follows f ON f.follower_id = :current_user_id AND f.following_id = u.id
          WHERE (u.username LIKE :search OR u.full_name LIKE :search) 
          AND u.id != :current_user_id AND u.is_active = 1
          LIMIT 20";

$stmt = $db->prepare($query);
$search_param = '%' . $search_query . '%';
$stmt->bindParam(":search", $search_param);
$stmt->bindParam(":current_user_id", $current_user_id);
$stmt->execute();

$users = array();
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $users[] = $row;
}

http_response_code(200);
echo json_encode(array("success" => true, "users" => $users));
?>
