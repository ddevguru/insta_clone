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

$data = json_decode(file_get_contents("php://input"));
$user_id = $user_data->id;
$post_id = $data->post_id;

// Get post owner
$post_query = "SELECT user_id FROM posts WHERE id = :post_id";
$post_stmt = $db->prepare($post_query);
$post_stmt->bindParam(":post_id", $post_id);
$post_stmt->execute();
$post_row = $post_stmt->fetch(PDO::FETCH_ASSOC);

if (!$post_row) {
    http_response_code(404);
    echo json_encode(array("success" => false, "message" => "Post not found"));
    exit();
}

$post_owner_id = $post_row['user_id'];

// Check if already liked
$check_query = "SELECT id FROM likes WHERE user_id = :user_id AND post_id = :post_id";
$check_stmt = $db->prepare($check_query);
$check_stmt->bindParam(":user_id", $user_id);
$check_stmt->bindParam(":post_id", $post_id);
$check_stmt->execute();

$db->beginTransaction();

try {
    if ($check_stmt->rowCount() > 0) {
        // Unlike
        $delete_query = "DELETE FROM likes WHERE user_id = :user_id AND post_id = :post_id";
        $delete_stmt = $db->prepare($delete_query);
        $delete_stmt->bindParam(":user_id", $user_id);
        $delete_stmt->bindParam(":post_id", $post_id);
        $delete_stmt->execute();
        
        // Remove like notification
        $delete_notification_query = "DELETE FROM notifications WHERE to_user_id = :to_user_id AND from_user_id = :from_user_id AND post_id = :post_id AND type = 'like'";
        $delete_notification_stmt = $db->prepare($delete_notification_query);
        $delete_notification_stmt->bindParam(":to_user_id", $post_owner_id);
        $delete_notification_stmt->bindParam(":from_user_id", $user_id);
        $delete_notification_stmt->bindParam(":post_id", $post_id);
        $delete_notification_stmt->execute();
        
        $message = "Post unliked";
    } else {
        // Like
        $insert_query = "INSERT INTO likes (user_id, post_id) VALUES (:user_id, :post_id)";
        $insert_stmt = $db->prepare($insert_query);
        $insert_stmt->bindParam(":user_id", $user_id);
        $insert_stmt->bindParam(":post_id", $post_id);
        $insert_stmt->execute();
        
        // Create like notification (only if not liking own post)
        if ($post_owner_id != $user_id) {
            $notification_query = "INSERT INTO notifications (to_user_id, from_user_id, type, post_id) VALUES (:to_user_id, :from_user_id, 'like', :post_id)";
            $notification_stmt = $db->prepare($notification_query);
            $notification_stmt->bindParam(":to_user_id", $post_owner_id);
            $notification_stmt->bindParam(":from_user_id", $user_id);
            $notification_stmt->bindParam(":post_id", $post_id);
            $notification_stmt->execute();
        }
        
        $message = "Post liked";
    }
    
    $db->commit();
    
    http_response_code(200);
    echo json_encode(array("success" => true, "message" => $message));
} catch (Exception $e) {
    $db->rollback();
    http_response_code(503);
    echo json_encode(array("success" => false, "message" => "Unable to process like"));
}
?>
