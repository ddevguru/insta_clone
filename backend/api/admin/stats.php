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
$admin_data = $jwt->validateToken($token);

if (!$admin_data) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Invalid token"));
    exit();
}

// Get stats
$stats = array();

// Total users
$user_query = "SELECT COUNT(*) as total_users FROM users";
$user_stmt = $db->prepare($user_query);
$user_stmt->execute();
$stats['total_users'] = $user_stmt->fetch(PDO::FETCH_ASSOC)['total_users'];

// Total posts
$post_query = "SELECT COUNT(*) as total_posts FROM posts";
$post_stmt = $db->prepare($post_query);
$post_stmt->execute();
$stats['total_posts'] = $post_stmt->fetch(PDO::FETCH_ASSOC)['total_posts'];

// Total messages
$message_query = "SELECT COUNT(*) as total_messages FROM messages";
$message_stmt = $db->prepare($message_query);
$message_stmt->execute();
$stats['total_messages'] = $message_stmt->fetch(PDO::FETCH_ASSOC)['total_messages'];

// Total revenue
$revenue_query = "SELECT SUM(amount) as total_revenue FROM transactions WHERE status = 'completed' AND type = 'purchase'";
$revenue_stmt = $db->prepare($revenue_query);
$revenue_stmt->execute();
$revenue_result = $revenue_stmt->fetch(PDO::FETCH_ASSOC);
$stats['total_revenue'] = $revenue_result['total_revenue'] ?? 0;

http_response_code(200);
echo json_encode(array("success" => true, "stats" => $stats));
?>
