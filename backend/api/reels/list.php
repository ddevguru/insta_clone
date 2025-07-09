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

$user_id = $user_data->id;

try {
    $query = "SELECT r.*, u.username, u.profile_photo,
              (SELECT COUNT(*) FROM reel_likes rl WHERE rl.reel_id = r.id) as likes_count,
              (SELECT COUNT(*) FROM reel_comments rc WHERE rc.reel_id = r.id) as comments_count,
              (SELECT COUNT(*) FROM reel_likes rl WHERE rl.reel_id = r.id AND rl.user_id = :user_id) as is_liked
              FROM reels r 
              JOIN users u ON r.user_id = u.id 
              ORDER BY RAND() 
              LIMIT 20";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_id, PDO::PARAM_INT);
    $stmt->execute();

    $reels = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Normalize profile_photo
        if (!empty($row['profile_photo'])) {
            $row['profile_photo'] = "https://devloperwala.in/uploads/profiles/" . 
                ltrim(str_replace('/uploads/profiles/', '', $row['profile_photo']), '/');
        } else {
            $row['profile_photo'] = null;
        }
        // Normalize video_url
        if (!empty($row['video_url'])) {
            $row['video_url'] = "https://devloperwala.in/backend/uploads/reels/" . 
                ltrim(str_replace('/uploads/reels/', '', $row['video_url']), '/');
        } else {
            $row['video_url'] = null;
        }
        $row['is_liked'] = $row['is_liked'] > 0;
        $row['content'] = $row['caption'] ?? ''; // Map caption to content for consistency
        $reels[] = $row;
    }

    http_response_code(200);
    echo json_encode(array("success" => true, "reels" => $reels));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Server error: " . $e->getMessage()));
}
?>