<?php
// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
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

    // Fetch logged-in user's story status
    $query = "SELECT u.id, u.username, u.profile_photo,
              (SELECT COUNT(*) FROM stories s WHERE s.user_id = u.id AND s.expires_at > NOW()) as has_story
              FROM users u 
              WHERE u.id = :user_id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_id, PDO::PARAM_INT);
    $stmt->execute();
    $current_user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($current_user) {
        $current_user['has_story'] = (int)$current_user['has_story'] > 0;
        if (!empty($current_user['profile_photo'])) {
            $current_user['profile_photo'] = "https://devloperwala.in/uploads/profiles/" . 
                ltrim(str_replace('/uploads/profiles/', '', $current_user['profile_photo']), '/');
        } else {
            $current_user['profile_photo'] = null;
        }
    }

    // Fetch other users' stories (only those with active stories)
    $query = "SELECT DISTINCT u.id, u.username, u.profile_photo,
              (SELECT COUNT(*) FROM stories s WHERE s.user_id = u.id AND s.expires_at > NOW()) as has_story
              FROM users u 
              WHERE u.id IN (
                  SELECT following_id FROM follows WHERE follower_id = :user_id AND status = 'accepted'
              ) AND u.id != :user_id
              HAVING has_story > 0
              ORDER BY u.username";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_id, PDO::PARAM_INT);
    $stmt->execute();

    $stories = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if (!empty($row['profile_photo'])) {
            $row['profile_photo'] = "https://devloperwala.in/uploads/profiles/" . 
                ltrim(str_replace('/uploads/profiles/', '', $row['profile_photo']), '/');
        } else {
            $row['profile_photo'] = null;
        }
        $row['has_story'] = (int)$row['has_story'] > 0;
        $stories[] = $row;
    }

    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "current_user" => $current_user ?: null,
        "stories" => $stories
    ));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Server error: " . $e->getMessage()));
}
?>