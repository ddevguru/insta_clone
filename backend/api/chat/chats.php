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

$query = "SELECT DISTINCT 
          CASE 
            WHEN m.sender_id = :user_id THEN m.receiver_id 
            ELSE m.sender_id 
          END as user_id,
          u.username, u.profile_photo,
          (SELECT message FROM messages m2 
           WHERE (m2.sender_id = :user_id AND m2.receiver_id = user_id) 
           OR (m2.sender_id = user_id AND m2.receiver_id = :user_id)
           ORDER BY m2.created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages m2 
           WHERE (m2.sender_id = :user_id AND m2.receiver_id = user_id) 
           OR (m2.sender_id = user_id AND m2.receiver_id = :user_id)
           ORDER BY m2.created_at DESC LIMIT 1) as last_message_time
          FROM messages m
          JOIN users u ON u.id = CASE 
            WHEN m.sender_id = :user_id THEN m.receiver_id 
            ELSE m.sender_id 
          END
          WHERE m.sender_id = :user_id OR m.receiver_id = :user_id
          ORDER BY last_message_time DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(":user_id", $user_id);
$stmt->execute();

$chats = array();
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $chats[] = $row;
}

http_response_code(200);
echo json_encode(array("success" => true, "chats" => $chats));
?>
