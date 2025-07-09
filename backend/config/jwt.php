<?php
require_once '../../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTHandler {
    private $secret_key = "your_secret_key_here";
    private $issuer = "instagram_clone";
    private $audience = "instagram_clone_users";
    private $issuedAt;
    private $expire;

    public function __construct() {
        $this->issuedAt = time();
        $this->expire = $this->issuedAt + (24 * 60 * 60); // 24 hours
    }

    public function generateToken($user_id, $username) {
        $payload = array(
            "iss" => $this->issuer,
            "aud" => $this->audience,
            "iat" => $this->issuedAt,
            "exp" => $this->expire,
            "data" => array(
                "id" => $user_id,
                "username" => $username
            )
        );

        return JWT::encode($payload, $this->secret_key, 'HS256');
    }

    public function validateToken($token) {
        try {
            $decoded = JWT::decode($token, new Key($this->secret_key, 'HS256'));
            return $decoded->data;
        } catch (Exception $e) {
            return false;
        }
    }
}
?>
