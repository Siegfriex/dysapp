# Firebase 배포 단계별 실행 스크립트
# 프로젝트: dysapp1210

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Firebase 배포 프로세스" -ForegroundColor Cyan
Write-Host "프로젝트: dysapp1210" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Step 1: 의존성 설치
Write-Host "[1/5] Functions 의존성 설치 중..." -ForegroundColor Yellow
Set-Location functions
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] npm install 실패" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] 의존성 설치 완료" -ForegroundColor Green
Write-Host ""

# Step 2: TypeScript 빌드
Write-Host "[2/5] TypeScript 빌드 중..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] 빌드 실패" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] 빌드 완료" -ForegroundColor Green
Write-Host ""

# lib 디렉토리 확인
if (Test-Path "lib") {
    Write-Host "[OK] lib/ 디렉토리 생성 확인" -ForegroundColor Green
} else {
    Write-Host "[WARNING] lib/ 디렉토리가 생성되지 않았습니다" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: 린트 검사 (선택적)
Write-Host "[3/5] 린트 검사 중..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] 린트 오류 발견 (계속 진행 가능)" -ForegroundColor Yellow
} else {
    Write-Host "[OK] 린트 검사 통과" -ForegroundColor Green
}
Write-Host ""

# Step 4: 상위 디렉토리로 이동
Set-Location ..

# Step 5: 최종 점검
Write-Host "[4/5] 배포 전 최종 점검 중..." -ForegroundColor Yellow

# GCP API 확인
Write-Host "  GCP API 확인 중..." -ForegroundColor Cyan
$apis = @('firestore.googleapis.com', 'storage-api.googleapis.com', 'cloudfunctions.googleapis.com', 'aiplatform.googleapis.com', 'generativelanguage.googleapis.com', 'secretmanager.googleapis.com')
$allApisEnabled = $true
foreach ($api in $apis) {
    $enabled = gcloud services list --enabled --project=dysapp1210 --filter="name:$api" --format="value(name)" 2>&1
    if ($LASTEXITCODE -ne 0 -or -not $enabled) {
        Write-Host "    [MISSING] $api" -ForegroundColor Red
        $allApisEnabled = $false
    }
}
if ($allApisEnabled) {
    Write-Host "  [OK] 모든 필수 API 활성화됨" -ForegroundColor Green
}

# Secret Manager 확인
Write-Host "  Secret Manager 확인 중..." -ForegroundColor Cyan
gcloud secrets describe google-ai-api-key --project=dysapp1210 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Secret Manager 설정 완료" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Secret Manager 설정 누락" -ForegroundColor Red
}

# 서비스 계정 권한 확인
Write-Host "  서비스 계정 권한 확인 중..." -ForegroundColor Cyan
$roles = gcloud projects get-iam-policy dysapp1210 --flatten="bindings[].members" --filter="bindings.members:serviceAccount:dysapp1210@appspot.gserviceaccount.com" --format="value(bindings.role)" 2>&1
$requiredRoles = @('roles/datastore.user', 'roles/storage.objectAdmin', 'roles/aiplatform.user', 'roles/secretmanager.secretAccessor', 'roles/logging.logWriter', 'roles/monitoring.metricWriter')
$allRolesGranted = $true
foreach ($role in $requiredRoles) {
    if ($roles -notcontains $role) {
        Write-Host "    [MISSING] $role" -ForegroundColor Red
        $allRolesGranted = $false
    }
}
if ($allRolesGranted) {
    Write-Host "  [OK] 모든 필수 권한 부여됨" -ForegroundColor Green
}

Write-Host ""
Write-Host "[OK] 최종 점검 완료" -ForegroundColor Green
Write-Host ""

# Step 6: 배포 확인
Write-Host "[5/5] Firebase 배포 준비 완료" -ForegroundColor Yellow
Write-Host ""
Write-Host "다음 명령어로 배포를 진행하세요:" -ForegroundColor Cyan
Write-Host "  firebase deploy --only functions" -ForegroundColor White
Write-Host ""
Write-Host "또는 전체 배포:" -ForegroundColor Cyan
Write-Host "  firebase deploy" -ForegroundColor White
Write-Host ""

