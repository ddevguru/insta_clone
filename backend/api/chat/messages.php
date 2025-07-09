<?php
// Enable error logging, suppress output of errors to the client
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '../../logs/php_errors.log'); // Adjust path as needed

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    include_once '../../config/database.php';
    include_once '../../config/jwt.php';

    $database = new Database();
    $db = $database->getConnection();

    // Get JWT token from header
    $headers = apache_request_headers();
    $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';

    if (empty($token)) {
        http_response_code(401);
        echo json_encode(array("success" => false, "message" => "Access denied: No token provided"));
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
    $other_user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

    if ($other_user_id <= 0 || $other_user_id == $current_user_id) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Invalid user ID"));
        exit();
    }

    // Fetch user details
    $user_query = "SELECT id, username, full_name, profile_photo, is_online 
                   FROM users 
                   WHERE id = :user_id AND is_active = 1";
    $user_stmt = $db->prepare($user_query);
    $user_stmt->bindParam(":user_id", $other_user_id);
    $user_stmt->execute();
    $user = $user_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "User not found"));
        exit();
    }

    // Fetch messages between the two users
    $messages_query = "SELECT id, sender_id, receiver_id, message, created_at,
                       CASE WHEN sender_id = :current_user_id THEN 1 ELSE 0 END as is_own_message
                       FROM messages 
                       WHERE (sender_id = :current_user_id AND receiver_id = :other_user_id)
                       OR (sender_id = :other_user_id AND receiver_id = :current_user_id)
                       ORDER BY created_at ASC";
    $messages_stmt = $db->prepare($messages_query);
    $messages_stmt->bindParam(":current_user_id", $current_user_id);
    $messages_stmt->bindParam(":other_user_id", $other_user_id);
    $messages_stmt->execute();

    $messages = array();
    while ($row = $messages_stmt->fetch(PDO::FETCH_ASSOC)) {
        $messages[] = $row;
    }

    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "user" => $user,
        "messages" => $messages
    ));
} catch (Exception $e) {
    // Log the error and return a JSON response
    error_log("Error in messages.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Internal server error"));
    exit();
}
?>