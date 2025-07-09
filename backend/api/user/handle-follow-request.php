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
$follower_id = $data->user_id;
$following_id = $user_data->id;
$action = $data->action; // 'accept' or 'decline'

if (!empty($follower_id) && !empty($action)) {
    $db->beginTransaction();
    
    try {
        if ($action === 'accept') {
            // Update follow status to accepted
            $query = "UPDATE follows SET status = 'accepted' WHERE follower_id = :follower_id AND following_id = :following_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":follower_id", $follower_id);
            $stmt->bindParam(":following_id", $following_id);
            $stmt->execute();
            
            // Create follow notification for the requester
            $notification_query = "INSERT INTO notifications (to_user_id, from_user_id, type) VALUES (:to_user_id, :from_user_id, 'follow')";
            $notification_stmt = $db->prepare($notification_query);
            $notification_stmt->bindParam(":to_user_id", $follower_id);
            $notification_stmt->bindParam(":from_user_id", $following_id);
            $notification_stmt->execute();
            
            $message = "Follow request accepted";
        } else {
            // Delete follow request
            $query = "DELETE FROM follows WHERE follower_id = :follower_id AND following_id = :following_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":follower_id", $follower_id);
            $stmt->bindParam(":following_id", $following_id);
            $stmt->execute();
            
            $message = "Follow request declined";
        }
        
        // Mark the follow request notification as read
        $mark_read_query = "UPDATE notifications SET is_read = 1 WHERE to_user_id = :to_user_id AND from_user_id = :from_user_id AND type = 'follow_request'";
        $mark_read_stmt = $db->prepare($mark_read_query);
        $mark_read_stmt->bindParam(":to_user_id", $following_id);
        $mark_read_stmt->bindParam(":from_user_id", $follower_id);
        $mark_read_stmt->execute();
        
        $db->commit();
        
        http_response_code(200);
        echo json_encode(array("success" => true, "message" => $message));
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(503);
        echo json_encode(array("success" => false, "message" => "Unable to process request"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Incomplete data"));
}
?>
