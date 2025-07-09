<?php
header("Access-Control-Allow-Origin: http://localhost:3000"); // Specify frontend origin
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

$user_id = $user_data->id;

try {
    $query = "SELECT u.*,
              (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) as posts_count,
              (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id AND f.status = 'accepted') as followers_count,
              (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id AND f.status = 'accepted') as following_count
              FROM users u 
              WHERE u.id = :user_id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        unset($user['password']);
        
        // Prepend backend base URL to profile_photo
        if (!empty($user['profile_photo']) && !str_starts_with($user['profile_photo'], 'http')) {
            $user['profile_photo'] = "https://devloperwala.in/uploads/profiles/" . basename($user['profile_photo']);
        }
        
        http_response_code(200);
        echo json_encode(array("success" => true, "user" => $user));
    } else {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "User not found"));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Server error: " . $e->getMessage()));
}
?>