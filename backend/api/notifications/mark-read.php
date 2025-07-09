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
$notification_id = $data->notification_id;
$user_id = $user_data->id;

if (!empty($notification_id)) {
    $query = "UPDATE notifications SET is_read = 1 WHERE id = :notification_id AND to_user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":notification_id", $notification_id);
    $stmt->bindParam(":user_id", $user_id);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array("success" => true, "message" => "Notification marked as read"));
    } else {
        http_response_code(503);
        echo json_encode(array("success" => false, "message" => "Unable to mark notification as read"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Notification ID is required"));
}
?>
