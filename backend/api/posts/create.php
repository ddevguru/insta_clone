<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
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

$user_id = $user_data->id;
$content = $_POST['content'] ?? '';

// Handle file upload
$image_url = '';
if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
    $upload_dir = '../../uploads/posts/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    $file_extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '.' . $file_extension;
    $upload_path = $upload_dir . $filename;
    
    if (move_uploaded_file($_FILES['image']['tmp_name'], $upload_path)) {
        $image_url = '/uploads/posts/' . $filename;
    }
}

if (!empty($image_url)) {
    $db->beginTransaction();
    
    try {
        // Insert post
        $query = "INSERT INTO posts (user_id, content, image_url) VALUES (:user_id, :content, :image_url)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":content", $content);
        $stmt->bindParam(":image_url", $image_url);
        $stmt->execute();
        
        // Update user streak
        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        
        $user_query = "SELECT last_post_date, streak_count FROM users WHERE id = :user_id";
        $user_stmt = $db->prepare($user_query);
        $user_stmt->bindParam(":user_id", $user_id);
        $user_stmt->execute();
        $user_row = $user_stmt->fetch(PDO::FETCH_ASSOC);
        
        $new_streak = 1;
        if ($user_row['last_post_date'] == $yesterday) {
            $new_streak = $user_row['streak_count'] + 1;
        } elseif ($user_row['last_post_date'] == $today) {
            $new_streak = $user_row['streak_count'];
        }
        
        $update_query = "UPDATE users SET last_post_date = :today, streak_count = :streak WHERE id = :user_id";
        $update_stmt = $db->prepare($update_query);
        $update_stmt->bindParam(":today", $today);
        $update_stmt->bindParam(":streak", $new_streak);
        $update_stmt->bindParam(":user_id", $user_id);
        $update_stmt->execute();
        
        $db->commit();
        
        http_response_code(201);
        echo json_encode(array("success" => true, "message" => "Post created successfully"));
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(503);
        echo json_encode(array("success" => false, "message" => "Unable to create post"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Image is required"));
}
?>
