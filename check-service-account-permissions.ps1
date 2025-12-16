# 서비스 계정 권한 확인 스크립트
# 프로젝트: dysapp1210

$PROJECT_ID = "dysapp1210"
$SERVICE_ACCOUNT = "$PROJECT_ID@appspot.gserviceaccount.com"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "서비스 계정 권한 확인" -ForegroundColor Cyan
Write-Host "프로젝트: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "서비스 계정: $SERVICE_ACCOUNT" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 필수 권한 목록
$REQUIRED_ROLES = @(
    'roles/datastore.user',
    'roles/storage.objectAdmin',
    'roles/aiplatform.user',
    'roles/secretmanager.secretAccessor',
    'roles/logging.logWriter',
    'roles/monitoring.metricWriter'
)

Write-Host "[필수 권한 목록]" -ForegroundColor Yellow
foreach ($role in $REQUIRED_ROLES) {
    Write-Host "  - $role" -ForegroundColor Gray
}
Write-Host ""

# 현재 부여된 권한 확인
Write-Host "[현재 부여된 권한 확인 중...]" -ForegroundColor Yellow
$currentRoles = gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT" --format="value(bindings.role)" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] 권한 확인 실패" -ForegroundColor Red
    exit 1
}

$grantedRoles = $currentRoles | Where-Object { $_ -ne '' }

Write-Host ""
Write-Host "[권한 부여 상태]" -ForegroundColor Yellow
Write-Host ""

$allGranted = $true
$missingRoles = @()

foreach ($requiredRole in $REQUIRED_ROLES) {
    $isGranted = $grantedRoles -contains $requiredRole
    
    if ($isGranted) {
        Write-Host "  [OK] $requiredRole" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $requiredRole" -ForegroundColor Red
        $allGranted = $false
        $missingRoles += $requiredRole
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "요약" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "필수 권한 수: $($REQUIRED_ROLES.Count)" -ForegroundColor White
Write-Host "부여된 권한 수: $($grantedRoles.Count)" -ForegroundColor White
Write-Host ""

if ($allGranted) {
    Write-Host "[SUCCESS] 모든 필수 권한이 부여되었습니다!" -ForegroundColor Green
    Write-Host ""
    Write-Host "부여된 추가 권한:" -ForegroundColor Cyan
    $additionalRoles = $grantedRoles | Where-Object { $REQUIRED_ROLES -notcontains $_ }
    if ($additionalRoles.Count -gt 0) {
        foreach ($role in $additionalRoles) {
            Write-Host "  - $role" -ForegroundColor Gray
        }
    } else {
        Write-Host "  없음" -ForegroundColor Gray
    }
} else {
    Write-Host "[WARNING] 일부 권한이 누락되었습니다." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "누락된 권한:" -ForegroundColor Red
    foreach ($role in $missingRoles) {
        Write-Host "  - $role" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "누락된 권한을 부여하려면 다음 명령어를 실행하세요:" -ForegroundColor Yellow
    foreach ($role in $missingRoles) {
        Write-Host "  gcloud projects add-iam-policy-binding $PROJECT_ID --member=`"serviceAccount:$SERVICE_ACCOUNT`" --role=$role" -ForegroundColor White
    }
}

Write-Host ""


