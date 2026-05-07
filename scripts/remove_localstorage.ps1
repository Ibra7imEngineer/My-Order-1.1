$path = "D:\My-Order\script.js"
$text = Get-Content -Path $path -Raw
$text = $text -replace 'JSON\.parse\(localStorage\.getItem\("[^"]+"\)\) \|\| \[\];', '[];'
$text = $text -replace 'JSON\.parse\(localStorage\.getItem\("[^"]+"\)\) \|\| \{\};', '{};'
$text = $text -replace 'localStorage\.getItem\("[^"]+"\)', 'null'
$text = $text -replace '(?m)^\s*.*localStorage\.setItem\([^\r\n]*$', ''
$text = $text -replace '(?m)^\s*.*localStorage\.removeItem\([^\r\n]*$', ''
$text = $text -replace '(?m)^\s*.*localStorage\.clear\([^\r\n]*$', ''
$text = $text -replace 'API_BASE \+ "/api/order\.php"', 'API_URL + "/api/order.php"'
Set-Content -Path $path -Value $text -Encoding utf8
Write-Output "remove_localstorage complete"