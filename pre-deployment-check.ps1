# Firebase 배포 전 최종 점검 스크립트
# 프로젝트: dysapp1210

$PROJECT_ID = "dysapp1210"
$SERVICE_ACCOUNT = "$PROJECT_ID@appspot.gserviceaccount.com"
$ERRORS = @()
$WARNINGS = @()

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Firebase 배포 전 최종 점검" -ForegroundColor Cyan
Write-Host "프로젝트: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. GCP API 활성화 상태 확인
# ============================================================================

Write-Host "[1/7] GCP API 활성화 상태 확인" -ForegroundColor Yellow

$REQUIRED_APIS = @(
    'firestore.googleapis.com',
    'storage-api.googleapis.com',
    'cloudfunctions.googleapis.com',
    'aiplatform.googleapis.com',
    'generativelanguage.googleapis.com',
    'secretmanager.googleapis.com'
)

$apiStatus = @{}
foreach ($api in $REQUIRED_APIS) {
    $enabled = gcloud services list --enabled --project=$PROJECT_ID --filter="name:$api" --format="value(name)" 2>&1
    $apiStatus[$api] = ($LASTEXITCODE -eq 0 -and $enabled -match $api)
    
    if ($apiStatus[$api]) {
        Write-Host "  [OK] $api" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $api" -ForegroundColor Red
        $ERRORS += "API not enabled: $api"
    }
}

Write-Host ""

# ============================================================================
# 2. Secret Manager 확인
# ============================================================================

Write-Host "[2/7] Secret Manager 확인" -ForegroundColor Yellow

$secretExists = gcloud secrets describe google-ai-api-key --project=$PROJECT_ID 2>&1
if ($LASTEXITCODE -eq 0) {
    $secretVersion = gcloud secrets versions list google-ai-api-key --project=$PROJECT_ID --limit=1 --format="value(name)" 2>&1
    if ($LASTEXITCODE -eq 0 -and $secretVersion) {
        Write-Host "  [OK] Secret 'google-ai-api-key' exists (version: $secretVersion)" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] Secret exists but no versions found" -ForegroundColor Yellow
        $WARNINGS += "Secret 'google-ai-api-key' has no versions"
    }
} else {
    Write-Host "  [ERROR] Secret 'google-ai-api-key' not found" -ForegroundColor Red
    $ERRORS += "Secret 'google-ai-api-key' not found"
}

Write-Host ""

# ============================================================================
# 3. 서비스 계정 권한 확인
# ============================================================================

Write-Host "[3/7] 서비스 계정 권한 확인" -ForegroundColor Yellow

$REQUIRED_ROLES = @(
    'roles/datastore.user',
    'roles/storage.objectAdmin',
    'roles/aiplatform.user',
    'roles/secretmanager.secretAccessor',
    'roles/logging.logWriter',
    'roles/monitoring.metricWriter'
)

$currentRoles = gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT" --format="value(bindings.role)" 2>&1
$grantedRoles = $currentRoles | Where-Object { $_ -ne '' }

$missingRoles = @()
foreach ($role in $REQUIRED_ROLES) {
    if ($grantedRoles -contains $role) {
        Write-Host "  [OK] $role" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $role" -ForegroundColor Red
        $missingRoles += $role
        $ERRORS += "Missing role: $role"
    }
}

Write-Host ""

# ============================================================================
# 4. Firebase 설정 파일 확인
# ============================================================================

Write-Host "[4/7] Firebase 설정 파일 확인" -ForegroundColor Yellow

$firebaseJsonExists = Test-Path "firebase.json"
$firestoreRulesExists = Test-Path "firestore.rules"
$storageRulesExists = Test-Path "storage.rules"
$firestoreIndexesExists = Test-Path "firestore.indexes.json"

if ($firebaseJsonExists) {
    Write-Host "  [OK] firebase.json" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] firebase.json not found" -ForegroundColor Red
    $ERRORS += "firebase.json not found"
}

if ($firestoreRulesExists) {
    Write-Host "  [OK] firestore.rules" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] firestore.rules not found" -ForegroundColor Yellow
    $WARNINGS += "firestore.rules not found"
}

if ($storageRulesExists) {
    Write-Host "  [OK] storage.rules" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] storage.rules not found" -ForegroundColor Yellow
    $WARNINGS += "storage.rules not found"
}

if ($firestoreIndexesExists) {
    Write-Host "  [OK] firestore.indexes.json" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] firestore.indexes.json not found" -ForegroundColor Yellow
    $WARNINGS += "firestore.indexes.json not found"
}

Write-Host ""

# ============================================================================
# 5. Functions 디렉토리 확인
# ============================================================================

Write-Host "[5/7] Functions 디렉토리 확인" -ForegroundColor Yellow

$functionsDirExists = Test-Path "functions"
$packageJsonExists = Test-Path "functions/package.json"
$tsconfigExists = Test-Path "functions/tsconfig.json"
$srcDirExists = Test-Path "functions/src"

if ($functionsDirExists) {
    Write-Host "  [OK] functions/ directory" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] functions/ directory not found" -ForegroundColor Red
    $ERRORS += "functions/ directory not found"
}

if ($packageJsonExists) {
    Write-Host "  [OK] functions/package.json" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] functions/package.json not found" -ForegroundColor Red
    $ERRORS += "functions/package.json not found"
}

if ($tsconfigExists) {
    Write-Host "  [OK] functions/tsconfig.json" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] functions/tsconfig.json not found" -ForegroundColor Red
    $ERRORS += "functions/tsconfig.json not found"
}

if ($srcDirExists) {
    Write-Host "  [OK] functions/src/ directory" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] functions/src/ directory not found" -ForegroundColor Red
    $ERRORS += "functions/src/ directory not found"
}

# node_modules 확인
$nodeModulesExists = Test-Path "functions/node_modules"
if ($nodeModulesExists) {
    Write-Host "  [OK] functions/node_modules (dependencies installed)" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] functions/node_modules not found - run 'npm install' in functions/ directory" -ForegroundColor Yellow
    $WARNINGS += "functions/node_modules not found - need npm install"
}

Write-Host ""

# ============================================================================
# 6. 환경변수 설정 확인 (Firebase Functions v2)
# ============================================================================

Write-Host "[6/7] 환경변수 설정 확인" -ForegroundColor Yellow

Write-Host "  [INFO] Firebase Functions v2는 Secret Manager를 사용합니다." -ForegroundColor Cyan
Write-Host "  [INFO] 환경변수는 배포 시 Secret Manager에서 자동으로 주입됩니다." -ForegroundColor Cyan
Write-Host "  [INFO] 로컬 개발용 .env 파일은 gitignore에 포함되어 있습니다." -ForegroundColor Cyan

# Firebase Functions config 확인 (v1 방식, 호환성)
$firebaseConfig = firebase functions:config:get --project=$PROJECT_ID 2>&1
if ($LASTEXITCODE -eq 0 -and $firebaseConfig) {
    Write-Host "  [OK] Firebase Functions config exists" -ForegroundColor Green
} else {
    Write-Host "  [INFO] Firebase Functions config not set (v2 uses Secret Manager)" -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# 7. 코드 빌드 테스트 (선택적)
# ============================================================================

Write-Host "[7/7] 코드 빌드 테스트" -ForegroundColor Yellow

if ($nodeModulesExists) {
    Push-Location functions
    Write-Host "  TypeScript 컴파일 테스트 중..." -ForegroundColor Cyan
    
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] TypeScript 컴파일 성공" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] TypeScript 컴파일 실패" -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
        $ERRORS += "TypeScript compilation failed"
    }
    Pop-Location
} else {
    Write-Host "  [SKIP] node_modules가 없어 빌드 테스트를 건너뜁니다." -ForegroundColor Yellow
    Write-Host "  [INFO] 빌드 테스트를 하려면: cd functions; npm install; npm run build" -ForegroundColor Cyan
}

Write-Host ""

# ============================================================================
# 최종 요약
# ============================================================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "점검 완료 요약" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

if ($ERRORS.Count -eq 0 -and $WARNINGS.Count -eq 0) {
    Write-Host "[SUCCESS] 모든 점검 항목이 통과되었습니다!" -ForegroundColor Green
    Write-Host ""
    Write-Host "다음 단계:" -ForegroundColor Cyan
    Write-Host "1. Functions 빌드: cd functions; npm install; npm run build" -ForegroundColor White
    Write-Host "2. 배포 테스트: firebase deploy --only functions" -ForegroundColor White
} else {
    if ($ERRORS.Count -gt 0) {
        $errorCount = $ERRORS.Count
        Write-Host "[ERROR] Found errors ($errorCount):" -ForegroundColor Red
        foreach ($error in $ERRORS) {
            Write-Host "  - $error" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($WARNINGS.Count -gt 0) {
        $warningCount = $WARNINGS.Count
        Write-Host "[WARNING] Found warnings ($warningCount):" -ForegroundColor Yellow
        foreach ($warning in $WARNINGS) {
            Write-Host "  - $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    Write-Host "Please fix the errors above before deployment." -ForegroundColor Red
}

Write-Host ""

