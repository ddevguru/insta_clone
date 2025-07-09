<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../vendor/autoload.php';
include_once '../../config/database.php';
include_once '../../config/jwt.php';

use Razorpay\Api\Api;

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
$razorpay_order_id = $data->razorpay_order_id;
$razorpay_payment_id = $data->razorpay_payment_id;
$razorpay_signature = $data->razorpay_signature;
$user_id = $user_data->id;

try {
    $api = new Api('rzp_test_your_key_here', 'your_secret_key_here'); // Replace with your keys
    
    $attributes = array(
        'razorpay_order_id' => $razorpay_order_id,
        'razorpay_payment_id' => $razorpay_payment_id,
        'razorpay_signature' => $razorpay_signature
    );
    
    $api->utility->verifyPaymentSignature($attributes);
    
    $db->beginTransaction();
    
    // Get transaction amount
    $transaction_query = "SELECT amount FROM transactions WHERE razorpay_order_id = :order_id AND user_id = :user_id";
    $transaction_stmt = $db->prepare($transaction_query);
    $transaction_stmt->bindParam(":order_id", $razorpay_order_id);
    $transaction_stmt->bindParam(":user_id", $user_id);
    $transaction_stmt->execute();
    $transaction_row = $transaction_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$transaction_row) {
        throw new Exception("Transaction not found");
    }
    
    $amount = $transaction_row['amount'];
    $coins = $amount * 10; // 1 rupee = 10 coins
    
    // Update user coins
    $update_query = "UPDATE users SET coins = coins + :coins WHERE id = :user_id";
    $update_stmt = $db->prepare($update_query);
    $update_stmt->bindParam(":coins", $coins);
    $update_stmt->bindParam(":user_id", $user_id);
    $update_stmt->execute();
    
    // Update transaction status
    $update_transaction_query = "UPDATE transactions SET status = 'completed', razorpay_payment_id = :payment_id WHERE razorpay_order_id = :order_id";
    $update_transaction_stmt = $db->prepare($update_transaction_query);
    $update_transaction_stmt->bindParam(":payment_id", $razorpay_payment_id);
    $update_transaction_stmt->bindParam(":order_id", $razorpay_order_id);
    $update_transaction_stmt->execute();
    
    $db->commit();
    
    http_response_code(200);
    echo json_encode(array("success" => true, "message" => "Payment verified successfully"));
} catch (Exception $e) {
    $db->rollback();
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Payment verification failed"));
}
?>
