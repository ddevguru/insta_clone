<?php
require_once '../../config/cors.php';

header('Content-Type: application/json');

require_once '../../config/database.php';
require_once '../auth/me.php';

try {
    // Verify authentication
    $user_id = verifyToken();
    if (!$user_id) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }

    $database = new Database();
    $db = $database->getConnection();

    // Get chat list with latest messages
    $query = "
        SELECT DISTINCT
            CASE 
                WHEN m.sender_id = :user_id THEN m.receiver_id 
                ELSE m.sender_id 
            END as other_user_id,
            u.username,
            u.full_name,
            u.profile_photo,
            CASE 
                WHEN u.last_active > DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 1 
                ELSE 0 
            END as is_online,
            latest.message as last_message,
            latest.created_at as last_message_time,
            latest.sender_id as last_sender_id,
            COALESCE(unread.unread_count, 0) as unread_count
        FROM messages m
        INNER JOIN (
            SELECT 
                CASE 
                    WHEN sender_id = :user_id2 THEN receiver_id 
                    ELSE sender_id 
                END as other_user_id,
                MAX(created_at) as max_time
            FROM messages 
            WHERE sender_id = :user_id3 OR receiver_id = :user_id4
            GROUP BY other_user_id
        ) latest_times ON (
            CASE 
                WHEN m.sender_id = :user_id5 THEN m.receiver_id 
                ELSE m.sender_id 
            END = latest_times.other_user_id 
            AND m.created_at = latest_times.max_time
        )
        INNER JOIN messages latest ON latest.id = (
            SELECT id FROM messages 
            WHERE (
                (sender_id = :user_id6 AND receiver_id = latest_times.other_user_id) OR 
                (sender_id = latest_times.other_user_id AND receiver_id = :user_id7)
            )
            ORDER BY created_at DESC 
            LIMIT 1
        )
        INNER JOIN users u ON u.id = latest_times.other_user_id
        LEFT JOIN (
            SELECT 
                sender_id,
                COUNT(*) as unread_count
            FROM messages 
            WHERE receiver_id = :user_id8 AND is_read = 0
            GROUP BY sender_id
        ) unread ON unread.sender_id = latest_times.other_user_id
        WHERE (m.sender_id = :user_id9 OR m.receiver_id = :user_id10)
        ORDER BY latest.created_at DESC
    ";

    $stmt = $db->prepare($query);
    for ($i = 1; $i <= 10; $i++) {
        $stmt->bindParam(':user_id' . ($i > 1 ? $i : ''), $user_id);
    }
    $stmt->execute();

    $chats = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $chats[] = [
            'user' => [
                'id' => (int)$row['other_user_id'],
                'username' => $row['username'],
                'full_name' => $row['full_name'],
                'profile_photo' => $row['profile_photo'],
                'is_online' => (bool)$row['is_online']
            ],
            'last_message' => $row['last_message'],
            'last_message_time' => $row['last_message_time'],
            'is_own_message' => (int)$row['last_sender_id'] === $user_id,
            'unread_count' => (int)$row['unread_count']
        ];
    }

    echo json_encode([
        'success' => true,
        'chats' => $chats
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
