<?php
function generateToken($user_id) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode(['user_id' => $user_id, 'exp' => time() + (24 * 60 * 60)]);
    
    $headerEncoded = base64url_encode($header);
    $payloadEncoded = base64url_encode($payload);
    
    $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, 'your-secret-key', true);
    $signatureEncoded = base64url_encode($signature);
    
    return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
}

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}

function verifyToken() {
    $headers = getallheaders();
    $authHeader = null;
    
    // Check for Authorization header (case-insensitive)
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            $authHeader = $value;
            break;
        }
    }
    
    if (!$authHeader) {
        return false;
    }
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return false;
    }
    
    $token = $matches[1];
    $parts = explode('.', $token);
    
    if (count($parts) !== 3) {
        return false;
    }
    
    $header = json_decode(base64url_decode($parts[0]), true);
    $payload = json_decode(base64url_decode($parts[1]), true);
    $signature = base64url_decode($parts[2]);
    
    if (!$header || !$payload) {
        return false;
    }
    
    $expectedSignature = hash_hmac('sha256', $parts[0] . "." . $parts[1], 'your-secret-key', true);
    
    if (!hash_equals($signature, $expectedSignature)) {
        return false;
    }
    
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false;
    }
    
    return $payload['user_id'] ?? false;
}
?>
