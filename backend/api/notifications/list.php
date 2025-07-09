<?php
// Disable PHP error display to prevent HTML output
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

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

$user_id = $user_data->id;

try {
    $query = "SELECT n.*, u.username, u.profile_photo, p.image_url as post_image, g.name as gift_name
              FROM notifications n
              JOIN users u ON n.from_user_id = u.id
              LEFT JOIN posts p ON n.post_id = p.id
              LEFT JOIN gifts g ON n.gift_id = g.id
              WHERE n.to_user_id = :user_id
              ORDER BY n.created_at DESC
              LIMIT 50";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_id, PDO::PARAM_INT);
    $stmt->execute();

    $notifications = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Generate message based on type
        switch ($row['type']) {
            case 'like':
                $row['message'] = 'liked your post';
                break;
            case 'comment':
                $row['message'] = 'commented on your post';
                break;
            case 'follow':
                $row['message'] = 'started following you';
                break;
            case 'follow_request':
                $row['message'] = 'requested to follow you';
                break;
            case 'gift':
                $row['message'] = 'sent you a ' . $row['gift_name'];
                break;
            default:
                $row['message'] = 'interacted with your content';
        }
        
        // Prepend backend URL to profile_photo and post_image
        if (!empty($row['profile_photo']) && !str_starts_with($row['profile_photo'], 'http')) {
            $row['profile_photo'] = "https://devloperwala.in/uploads/profiles/" . basename($row['profile_photo']);
        }
        if (!empty($row['post_image']) && !str_starts_with($row['post_image'], 'http')) {
            $row['post_image'] = "https://devloperwala.in/uploads/posts/" . basename($row['post_image']);
        }

        $row['user_id'] = $row['from_user_id'];
        $notifications[] = $row;
    }

    http_response_code(200);
    echo json_encode(array("success" => true, "notifications" => $notifications));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Server error: " . $e->getMessage()));
}
?>