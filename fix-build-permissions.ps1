# Fix Cloud Build Service Account Permissions
# This script grants necessary permissions to the Cloud Build service account

$projectId = "dysapp1210"
$region = "asia-northeast3"

Write-Host "=== Cloud Build 서비스 계정 권한 수정 ===" -ForegroundColor Cyan

# Get project number
Write-Host "`n[1/5] 프로젝트 번호 확인 중..." -ForegroundColor Yellow
$projectNumber = gcloud projects describe $projectId --format="value(projectNumber)" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] 프로젝트 번호를 가져올 수 없습니다: $projectNumber" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] 프로젝트 번호: $projectNumber" -ForegroundColor Green

$cloudBuildSA = "$projectNumber@cloudbuild.gserviceaccount.com"
Write-Host "[OK] Cloud Build 서비스 계정: $cloudBuildSA" -ForegroundColor Green

# Required roles for Cloud Build
$roles = @(
    "roles/cloudbuild.builds.builder",
    "roles/artifactregistry.writer",
    "roles/serviceusage.serviceUsageConsumer",
    "roles/storage.objectAdmin"
)

Write-Host "`n[2/5] Cloud Build 서비스 계정에 권한 부여 중..." -ForegroundColor Yellow
foreach ($role in $roles) {
    Write-Host "  - $role 부여 중..." -ForegroundColor Gray
    $result = gcloud projects add-iam-policy-binding $projectId `
        --member="serviceAccount:$cloudBuildSA" `
        --role=$role `
        --condition=None 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    [OK] $role 부여 완료" -ForegroundColor Green
    } else {
        Write-Host "    [WARN] $role 부여 실패 (이미 부여되었을 수 있음): $result" -ForegroundColor Yellow
    }
}

# Grant Service Account User role to Cloud Build SA for Compute Engine default SA
Write-Host "`n[3/5] Compute Engine 기본 서비스 계정 사용 권한 부여 중..." -ForegroundColor Yellow
$computeSA = "$projectNumber-compute@developer.gserviceaccount.com"
$result = gcloud iam service-accounts add-iam-policy-binding $computeSA `
    --member="serviceAccount:$cloudBuildSA" `
    --role="roles/iam.serviceAccountUser" `
    --project=$projectId 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Service Account User 권한 부여 완료" -ForegroundColor Green
} else {
    Write-Host "[WARN] Service Account User 권한 부여 실패 (이미 부여되었을 수 있음): $result" -ForegroundColor Yellow
}

# Enable Cloud Build API if not enabled
Write-Host "`n[4/5] Cloud Build API 활성화 확인 중..." -ForegroundColor Yellow
$result = gcloud services enable cloudbuild.googleapis.com --project=$projectId 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Cloud Build API 활성화 완료" -ForegroundColor Green
} else {
    Write-Host "[INFO] Cloud Build API 상태: $result" -ForegroundColor Gray
}

# Enable Artifact Registry API if not enabled
Write-Host "`n[5/5] Artifact Registry API 활성화 확인 중..." -ForegroundColor Yellow
$result = gcloud services enable artifactregistry.googleapis.com --project=$projectId 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Artifact Registry API 활성화 완료" -ForegroundColor Green
} else {
    Write-Host "[INFO] Artifact Registry API 상태: $result" -ForegroundColor Gray
}

Write-Host "`n=== 권한 수정 완료 ===" -ForegroundColor Cyan
Write-Host "이제 다시 배포를 시도하세요:" -ForegroundColor Yellow
Write-Host "  firebase deploy --only functions" -ForegroundColor White



