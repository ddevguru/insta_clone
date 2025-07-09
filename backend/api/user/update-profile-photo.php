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

$user_id = $user_data->id;

try {
    if (isset($_FILES['profile_photo']) && $_FILES['profile_photo']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['profile_photo'];
        $filename = uniqid() . '.' . pathinfo($file['name'], PATHINFO_EXTENSION);
        $upload_dir = __DIR__ . '/../../../uploads/profiles/';
        $destination = $upload_dir . $filename;

        // Ensure upload directory exists and is writable
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        if (move_uploaded_file($file['tmp_name'], $destination)) {
            $relative_path = "/uploads/profiles/" . $filename;
            $query = "UPDATE users SET profile_photo = :profile_photo WHERE id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":profile_photo", $relative_path);
            $stmt->bindParam(":user_id", $user_id, PDO::PARAM_INT);

            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(array("success" => true, "message" => "Profile photo updated"));
            } else {
                http_response_code(500);
                echo json_encode(array("success" => false, "message" => "Failed to update database"));
            }
        } else {
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Failed to upload file"));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "No file uploaded or upload error"));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Server error: " . $e->getMessage()));
}
?>