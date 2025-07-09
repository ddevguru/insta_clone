<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';
include_once '../../config/jwt.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->password)) {
    $query = "SELECT id, username, password FROM admins WHERE username = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":username", $data->username);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (password_verify($data->password, $row['password'])) {
            $jwt = new JWTHandler();
            $token = $jwt->generateToken($row['id'], $row['username']);
            
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Admin login successful",
                "token" => $token
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("success" => false, "message" => "Invalid password"));
        }
    } else {
        http_response_code(401);
        echo json_encode(array("success" => false, "message" => "Admin not found"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Incomplete data"));
}
?>
