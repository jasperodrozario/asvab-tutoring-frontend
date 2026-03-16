<?php
// Simple reverse proxy from Cloudways PHP (Nginx/Apache) -> Next.js on localhost:3000
$upstream = "http://127.0.0.1:3000";
$uri = $_SERVER['REQUEST_URI'] ?? "/";
$url = $upstream . $uri;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);

// Forward method + body
$method = $_SERVER['REQUEST_METHOD'] ?? "GET";
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

$body = file_get_contents("php://input");
if ($body !== false && strlen($body) > 0) {
  curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Forward headers (important for host/proto)
$headers = [];
foreach ($_SERVER as $k => $v) {
  if (strpos($k, 'HTTP_') === 0) {
    $name = str_replace('_', '-', substr($k, 5));
    if (in_array(strtolower($name), ['host', 'connection'])) continue;
    $headers[] = $name . ": " . $v;
  }
}
$headers[] = "X-Forwarded-Host: " . ($_SERVER['HTTP_HOST'] ?? "");
$headers[] = "X-Forwarded-Proto: " . (!empty($_SERVER['HTTPS']) ? "https" : "http");
$headers[] = "X-Forwarded-For: " . ($_SERVER['REMOTE_ADDR'] ?? "");
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);
if ($response === false) {
  http_response_code(502);
  echo "Upstream error: " . curl_error($ch);
  exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$respHeaders = substr($response, 0, $headerSize);
$respBody = substr($response, $headerSize);

http_response_code($status);

// Send headers back (skip hop-by-hop headers)
foreach (explode("\r\n", $respHeaders) as $line) {
  if (stripos($line, 'HTTP/') === 0) continue;
  if (trim($line) === '') continue;
  if (stripos($line, 'Transfer-Encoding:') === 0) continue;
  if (stripos($line, 'Connection:') === 0) continue;
  header($line, true);
}

echo $respBody;
