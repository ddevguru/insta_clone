<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

$data = json_decode(file_get_contents("php://input"));
$user_id = $user_data->id;
$reel_id = $data->reel_id;

// Check if already liked
$check_query = "SELECT id FROM reel_likes WHERE user_id = :user_id AND reel_id = :reel_id";
$check_stmt = $db->prepare($check_query);
$check_stmt->bindParam(":user_id", $user_id);
$check_stmt->bindParam(":reel_id", $reel_id);
$check_stmt->execute();

if ($check_stmt->rowCount() > 0) {
    // Unlike
    $delete_query = "DELETE FROM reel_likes WHERE user_id = :user_id AND reel_id = :reel_id";
    $delete_stmt = $db->prepare($delete_query);
    $delete_stmt->bindParam(":user_id", $user_id);
    $delete_stmt->bindParam(":reel_id", $reel_id);
    $delete_stmt->execute();
    
    $message = "Reel unliked";
} else {
    // Like
    $insert_query = "INSERT INTO reel_likes (user_id, reel_id) VALUES (:user_id, :reel_id)";
    $insert_stmt = $db->prepare($insert_query);
    $insert_stmt->bindParam(":user_id", $user_id);
    $insert_stmt->bindParam(":reel_id", $reel_id);
    $insert_stmt->execute();
    
    $message = "Reel liked";
}

http_response_code(200);
echo json_encode(array("success" => true, "message" => $message));
?>
