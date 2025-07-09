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

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->email) && !empty($data->password) && !empty($data->full_name)) {
    
    // Check if user already exists
    $check_query = "SELECT id FROM users WHERE username = :username OR email = :email";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":username", $data->username);
    $check_stmt->bindParam(":email", $data->email);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Username or email already exists"));
        exit();
    }
    
    $query = "INSERT INTO users (username, email, password, full_name) VALUES (:username, :email, :password, :full_name)";
    $stmt = $db->prepare($query);
    
    $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);
    
    $stmt->bindParam(":username", $data->username);
    $stmt->bindParam(":email", $data->email);
    $stmt->bindParam(":password", $hashed_password);
    $stmt->bindParam(":full_name", $data->full_name);
    
    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(array("success" => true, "message" => "User registered successfully"));
    } else {
        http_response_code(503);
        echo json_encode(array("success" => false, "message" => "Unable to register user"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Incomplete data"));
}
?>
