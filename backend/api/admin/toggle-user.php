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
$admin_data = $jwt->validateToken($token);

if (!$admin_data) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Invalid token"));
    exit();
}

$data = json_decode(file_get_contents("php://input"));
$user_id = $data->user_id;
$is_active = $data->is_active ? 1 : 0;

if (!empty($user_id)) {
    $query = "UPDATE users SET is_active = :is_active WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":is_active", $is_active);
    $stmt->bindParam(":user_id", $user_id);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array("success" => true, "message" => "User status updated successfully"));
    } else {
        http_response_code(503);
        echo json_encode(array("success" => false, "message" => "Unable to update user status"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "User ID is required"));
}
?>
