<?php
$conn = new mysqli('localhost', 'root', '', 'restaurant_orders');
if ($conn->connect_error) die('Connection failed: ' . $conn->connect_error);

$conn->query("UPDATE menu SET category = CASE 
WHEN category = 'sweets' THEN 'حلويات'
WHEN category = 'food' THEN 'أطعمة'
WHEN category = 'drinks' THEN 'مشروبات'
WHEN category = '0' THEN 'أطعمة'
ELSE category END");

echo 'Categories updated successfully';
$conn->close();
?>