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
$sender_id = $user_data->id;
$receiver_id = $data->receiver_id;
$gift_id = $data->gift_id;

if (!empty($receiver_id) && !empty($gift_id)) {
    $db->beginTransaction();
    
    try {
        // Get gift price
        $gift_query = "SELECT price FROM gifts WHERE id = :gift_id";
        $gift_stmt = $db->prepare($gift_query);
        $gift_stmt->bindParam(":gift_id", $gift_id);
        $gift_stmt->execute();
        $gift_row = $gift_stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$gift_row) {
            throw new Exception("Gift not found");
        }
        
        $gift_price = $gift_row['price'];
        
        // Check user coins
        $user_query = "SELECT coins FROM users WHERE id = :user_id";
        $user_stmt = $db->prepare($user_query);
        $user_stmt->bindParam(":user_id", $sender_id);
        $user_stmt->execute();
        $user_row = $user_stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user_row['coins'] < $gift_price) {
            throw new Exception("Insufficient coins");
        }
        
        // Deduct coins
        $update_query = "UPDATE users SET coins = coins - :price WHERE id = :user_id";
        $update_stmt = $db->prepare($update_query);
        $update_stmt->bindParam(":price", $gift_price);
        $update_stmt->bindParam(":user_id", $sender_id);
        $update_stmt->execute();
        
        // Send gift message
        $message_query = "INSERT INTO messages (sender_id, receiver_id, gift_id) VALUES (:sender_id, :receiver_id, :gift_id)";
        $message_stmt = $db->prepare($message_query);
        $message_stmt->bindParam(":sender_id", $sender_id);
        $message_stmt->bindParam(":receiver_id", $receiver_id);
        $message_stmt->bindParam(":gift_id", $gift_id);
        $message_stmt->execute();
        
        // Record transaction
        $transaction_query = "INSERT INTO transactions (user_id, type, amount) VALUES (:user_id, 'gift_sent', :amount)";
        $transaction_stmt = $db->prepare($transaction_query);
        $transaction_stmt->bindParam(":user_id", $sender_id);
        $transaction_stmt->bindParam(":amount", $gift_price);
        $transaction_stmt->execute();
        
        $db->commit();
        
        http_response_code(201);
        echo json_encode(array("success" => true, "message" => "Gift sent successfully"));
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Incomplete data"));
}
?>
