<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT * FROM gifts ORDER BY price ASC";
$stmt = $db->prepare($query);
$stmt->execute();

$gifts = array();
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $gifts[] = $row;
}

http_response_code(200);
echo json_encode(array("success" => true, "gifts" => $gifts));
?>
