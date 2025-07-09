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
$follower_id = $user_data->id;
$following_id = $data->user_id;

// Check if already following
$check_query = "SELECT id, status FROM follows WHERE follower_id = :follower_id AND following_id = :following_id";
$check_stmt = $db->prepare($check_query);
$check_stmt->bindParam(":follower_id", $follower_id);
$check_stmt->bindParam(":following_id", $following_id);
$check_stmt->execute();

if ($check_stmt->rowCount() > 0) {
    // Unfollow or cancel request
    $delete_query = "DELETE FROM follows WHERE follower_id = :follower_id AND following_id = :following_id";
    $delete_stmt = $db->prepare($delete_query);
    $delete_stmt->bindParam(":follower_id", $follower_id);
    $delete_stmt->bindParam(":following_id", $following_id);
    $delete_stmt->execute();
    
    $message = "Unfollowed successfully";
} else {
    // Check if target user is private
    $user_query = "SELECT is_private FROM users WHERE id = :user_id";
    $user_stmt = $db->prepare($user_query);
    $user_stmt->bindParam(":user_id", $following_id);
    $user_stmt->execute();
    $user_row = $user_stmt->fetch(PDO::FETCH_ASSOC);
    
    $status = $user_row['is_private'] ? 'pending' : 'accepted';
    
    $db->beginTransaction();
    
    try {
        // Follow
        $insert_query = "INSERT INTO follows (follower_id, following_id, status) VALUES (:follower_id, :following_id, :status)";
        $insert_stmt = $db->prepare($insert_query);
        $insert_stmt->bindParam(":follower_id", $follower_id);
        $insert_stmt->bindParam(":following_id", $following_id);
        $insert_stmt->bindParam(":status", $status);
        $insert_stmt->execute();
        
        // Create notification
        $notification_type = $status == 'pending' ? 'follow_request' : 'follow';
        $notification_query = "INSERT INTO notifications (to_user_id, from_user_id, type) VALUES (:to_user_id, :from_user_id, :type)";
        $notification_stmt = $db->prepare($notification_query);
        $notification_stmt->bindParam(":to_user_id", $following_id);
        $notification_stmt->bindParam(":from_user_id", $follower_id);
        $notification_stmt->bindParam(":type", $notification_type);
        $notification_stmt->execute();
        
        $db->commit();
        
        $message = $status == 'pending' ? "Follow request sent" : "Followed successfully";
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(503);
        echo json_encode(array("success" => false, "message" => "Unable to process follow request"));
        exit();
    }
}

http_response_code(200);
echo json_encode(array("success" => true, "message" => $message));
?>
