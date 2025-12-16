# 간단한 HTTP 서버 스크립트
$port = 8000
$url = "http://localhost:$port/"

Write-Host "프론트엔드 서버를 시작합니다..." -ForegroundColor Green
Write-Host "브라우저에서 다음 주소로 접속하세요: $url" -ForegroundColor Yellow
Write-Host "서버를 중지하려면 Ctrl+C를 누르세요." -ForegroundColor Gray
Write-Host ""

# HTTP 리스너 생성
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()

Write-Host "서버가 시작되었습니다: $url" -ForegroundColor Green
Write-Host ""

# 기본 브라우저 열기
Start-Process $url

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") {
            $localPath = "/index.html"
        }
        
        $filePath = Join-Path $PSScriptRoot $localPath.TrimStart('/')
        
        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            
            # MIME 타입 설정
            $contentType = switch ($extension) {
                ".html" { "text/html; charset=utf-8" }
                ".js" { "application/javascript; charset=utf-8" }
                ".css" { "text/css; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png" { "image/png" }
                ".jpg" { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".svg" { "image/svg+xml" }
                ".gif" { "image/gif" }
                ".pdf" { "application/pdf" }
                default { "application/octet-stream" }
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $notFound.Length
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }
        
        $response.Close()
    }
} finally {
    $listener.Stop()
    Write-Host "`n서버가 중지되었습니다." -ForegroundColor Yellow
}


