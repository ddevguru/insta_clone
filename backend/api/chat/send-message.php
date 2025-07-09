
<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';
include_once '../../config/jwt.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Database connection failed"));
    exit();
}

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
$receiver_id = $data->receiver_id ?? null;
$message = $data->message ?? null;

if (empty($message) || empty($receiver_id)) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Incomplete data"));
    exit();
}

// Check if sender follows receiver
$query = "SELECT COUNT(*) as is_following
          FROM followers
          WHERE follower_id = :sender_id AND followed_id = :receiver_id";
$stmt = $db->prepare($query);
$stmt->bindParam(":sender_id", $sender_id, PDO::PARAM_INT);
$stmt->bindParam(":receiver_id", $receiver_id, PDO::PARAM_INT);
$stmt->execute();
$is_following = $stmt->fetch(PDO::FETCH_ASSOC)['is_following'] > 0;

if (!$is_following) {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "You must follow this user to send a message"));
    exit();
}

try {
    $query = "INSERT INTO messages (sender_id, receiver_id, message, created_at)
              VALUES (:sender_id, :receiver_id, :message, NOW())";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":sender_id", $sender_id, PDO::PARAM_INT);
    $stmt->bindParam(":receiver_id", $receiver_id, PDO::PARAM_INT);
    $stmt->bindParam(":message", $message, PDO::PARAM_STR);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(array("success" => true, "message" => "Message sent successfully"));
    } else {
        http_response_code(503);
        echo json_encode(array("success" => false, "message" => "Unable to send message"));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Server error: " . $e->getMessage()));
}
?>
