<?php
$conn = new mysqli('localhost', 'root', '', 'restaurant_orders');
if ($conn->connect_error) die('Connection failed: ' . $conn->connect_error);

$result = $conn->query("SELECT id, item_name, category FROM menu WHERE category = '0'");
echo "Items with category '0':\n";
while ($row = $result->fetch_assoc()) {
    echo 'ID: ' . $row['id'] . ' - Name: ' . $row['item_name'] . ' - Category: ' . $row['category'] . "\n";
}

$result2 = $conn->query("SELECT id, item_name, category FROM menu WHERE category NOT IN ('أطعمة', 'مشروبات', 'حلويات')");
echo "\nItems with non-Arabic categories:\n";
while ($row = $result2->fetch_assoc()) {
    echo 'ID: ' . $row['id'] . ' - Name: ' . $row['item_name'] . ' - Category: ' . $row['category'] . "\n";
}
$conn->close();
?>