
<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

$post_id = isset($_GET['post_id']) ? (int)$_GET['post_id'] : 0;

if ($post_id <= 0) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Invalid post ID"));
    exit();
}

try {
    $query = "SELECT pc.id, pc.user_id, u.username, pc.comment, pc.created_at 
              FROM post_comments pc 
              JOIN users u ON pc.user_id = u.id 
              WHERE pc.post_id = :post_id 
              ORDER BY pc.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":post_id", $post_id, PDO::PARAM_INT);
    $stmt->execute();

    $comments = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $comments[] = [
            'id' => $row['id'],
            'user_id' => $row['user_id'],
            'username' => $row['username'],
            'comment' => $row['comment'],
            'created_at' => $row['created_at'],
        ];
    }

    http_response_code(200);
    echo json_encode(array("success" => true, "comments" => $comments));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Server error: " . $e->getMessage()));
}
?>