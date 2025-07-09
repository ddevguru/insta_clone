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
$amount = $data->amount;
$user_id = $user_data->id;

if (!empty($amount) && $amount > 0) {
    try {
        $api = new Api('rzp_test_your_key_here', 'your_secret_key_here'); // Replace with your keys
        
        $order = $api->order->create([
            'amount' => $amount * 100, // Amount in paise
            'currency' => 'INR',
            'receipt' => 'order_' . time(),
            'payment_capture' => 1
        ]);
        
        // Store order in database
        $query = "INSERT INTO transactions (user_id, type, amount, razorpay_order_id, status) VALUES (:user_id, 'purchase', :amount, :order_id, 'pending')";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":amount", $amount);
        $stmt->bindParam(":order_id", $order['id']);
        $stmt->execute();
        
        http_response_code(200);
        echo json_encode(array("success" => true, "order" => $order));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Invalid amount"));
}
?>
