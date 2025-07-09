
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
    $query = "SELECT u.id, u.username, u.profile_photo
              FROM followers f
              JOIN users u ON f.followed_id = u.id
              WHERE f.follower_id = :user_id
              ORDER BY u.username ASC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_id, PDO::PARAM_INT);
    $stmt->execute();

    $followed_users = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if (!empty($row['profile_photo'])) {
            $row['profile_photo'] = "https://devloperwala.in/uploads/profiles/" .
                ltrim(str_replace('/uploads/profiles/', '', $row['profile_photo']), '/');
        } else {
            $row['profile_photo'] = null;
        }
        $followed_users[] = $row;
    }

    http_response_code(200);
    echo json_encode(array("success" => true, "followed_users" => $followed_users));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Server error: " . $e->getMessage()));
}
?>
