# Firebase Functions 배포 스크립트
# PowerShell 실행 스크립트

Write-Host "=== Firebase Functions 빌드 및 배포 ===" -ForegroundColor Cyan

# 1. Functions 디렉토리로 이동
Write-Host "`n[1/4] Functions 디렉토리로 이동..." -ForegroundColor Yellow
Set-Location functions

# 2. 의존성 확인 및 설치
Write-Host "[2/4] 의존성 확인..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules가 없습니다. npm install 실행 중..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install 실패!" -ForegroundColor Red
        exit 1
    }
}

# 3. TypeScript 빌드
Write-Host "[3/4] TypeScript 컴파일 중..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "빌드 실패! 오류를 확인하세요." -ForegroundColor Red
    exit 1
}

# 빌드 결과 확인
Write-Host "`n빌드 결과 확인:" -ForegroundColor Green
if (Test-Path "lib/search/searchText.js") {
    Write-Host "  ✓ searchText.js" -ForegroundColor Green
} else {
    Write-Host "  ✗ searchText.js 없음" -ForegroundColor Red
}

if (Test-Path "lib/search/saveItem.js") {
    Write-Host "  ✓ saveItem.js" -ForegroundColor Green
} else {
    Write-Host "  ✗ saveItem.js 없음" -ForegroundColor Red
}

# 4. 프로젝트 루트로 복귀
Set-Location ..

# 5. 배포 확인
Write-Host "`n[4/4] 배포 준비 완료" -ForegroundColor Green
Write-Host "`n배포를 실행하려면 다음 명령어를 실행하세요:" -ForegroundColor Cyan
Write-Host "  firebase deploy --only functions" -ForegroundColor White
Write-Host "`n또는 특정 함수만 배포:" -ForegroundColor Cyan
Write-Host "  firebase deploy --only functions:searchText,functions:saveItem" -ForegroundColor White

# 배포 실행 여부 확인
$deploy = Read-Host "`n지금 배포하시겠습니까? (Y/N)"
if ($deploy -eq "Y" -or $deploy -eq "y") {
    Write-Host "`n배포 시작..." -ForegroundColor Yellow
    firebase deploy --only functions
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ 배포 완료!" -ForegroundColor Green
    } else {
        Write-Host "`n✗ 배포 실패!" -ForegroundColor Red
    }
} else {
    Write-Host "`n배포를 건너뜁니다. 나중에 'firebase deploy --only functions' 명령어로 배포하세요." -ForegroundColor Yellow
}


