<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../config/database.php';
require_once '../auth/me.php';

try {
    // Verify authentication
    $user_id = verifyToken();
    if (!$user_id) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized: Invalid or missing token']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['receiver_id']) || !isset($input['message'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Receiver ID and message are required']);
        exit;
    }

    $receiver_id = (int)$input['receiver_id'];
    $message = trim($input['message']);

    if (empty($message)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Message cannot be empty']);
        exit;
    }

    if ($receiver_id === $user_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Cannot send message to yourself']);
        exit;
    }

    $database = new Database();
    $db = $database->getConnection();

    // Check if receiver exists
    $check_user_query = "SELECT id FROM users WHERE id = :receiver_id";
    $check_user_stmt = $db->prepare($check_user_query);
    $check_user_stmt->bindParam(':receiver_id', $receiver_id);
    $check_user_stmt->execute();

    if ($check_user_stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Receiver not found']);
        exit;
    }

    // Insert the message
    $insert_query = "INSERT INTO messages (sender_id, receiver_id, message, created_at) 
                     VALUES (:sender_id, :receiver_id, :message, NOW())";
    $insert_stmt = $db->prepare($insert_query);
    $insert_stmt->bindParam(':sender_id', $user_id);
    $insert_stmt->bindParam(':receiver_id', $receiver_id);
    $insert_stmt->bindParam(':message', $message);
    
    if ($insert_stmt->execute()) {
        $message_id = $db->lastInsertId();
        
        // Return the created message
        $get_message_query = "SELECT id, sender_id, receiver_id, message, created_at,
                              CASE WHEN sender_id = :user_id THEN 1 ELSE 0 END as is_own_message
                              FROM messages WHERE id = :message_id";
        $get_message_stmt = $db->prepare($get_message_query);
        $get_message_stmt->bindParam(':user_id', $user_id);
        $get_message_stmt->bindParam(':message_id', $message_id);
        $get_message_stmt->execute();
        $created_message = $get_message_stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Message sent successfully',
            'data' => [
                'id' => (int)$created_message['id'],
                'sender_id' => (int)$created_message['sender_id'],
                'receiver_id' => (int)$created_message['receiver_id'],
                'message' => $created_message['message'],
                'created_at' => $created_message['created_at'],
                'is_own_message' => (bool)$created_message['is_own_message']
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to send message']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>