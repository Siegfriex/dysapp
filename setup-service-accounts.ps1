# GCP 서비스 계정 생성 및 권한 부여 스크립트
# 프로젝트: dysapp1210
# 작성일: 2025-12-16

$PROJECT_ID = "dysapp1210"
$REGION = "asia-northeast3"
$VERTEX_AI_REGION = "us-central1"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "GCP 서비스 계정 설정 스크립트" -ForegroundColor Cyan
Write-Host "프로젝트: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Phase 1: 기본 서비스 계정 권한 설정
# ============================================================================

Write-Host "[Phase 1] Cloud Functions 기본 서비스 계정 권한 설정" -ForegroundColor Yellow
Write-Host ""

$DEFAULT_SERVICE_ACCOUNT = "$PROJECT_ID@appspot.gserviceaccount.com"

# 기본 서비스 계정 존재 확인
Write-Host "기본 서비스 계정 확인 중: $DEFAULT_SERVICE_ACCOUNT" -ForegroundColor Cyan
$accountExists = gcloud iam service-accounts describe $DEFAULT_SERVICE_ACCOUNT --project=$PROJECT_ID 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] 기본 서비스 계정을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "Firebase 프로젝트가 제대로 설정되었는지 확인해주세요." -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] 기본 서비스 계정 확인 완료" -ForegroundColor Green
Write-Host ""

# 필요한 IAM 역할 목록
$REQUIRED_ROLES = @(
    @{Role='roles/datastore.user'; Description='Firestore read/write'},
    @{Role='roles/storage.objectAdmin'; Description='Cloud Storage file management'},
    @{Role='roles/aiplatform.user'; Description='Vertex AI usage'},
    @{Role='roles/secretmanager.secretAccessor'; Description='Secret Manager access'},
    @{Role='roles/logging.logWriter'; Description='Cloud Logging log writing'},
    @{Role='roles/monitoring.metricWriter'; Description='Cloud Monitoring metric writing'}
)

Write-Host "IAM 역할 부여 중..." -ForegroundColor Yellow
$grantedCount = 0
$skippedCount = 0
$failedCount = 0

foreach ($roleInfo in $REQUIRED_ROLES) {
    $role = $roleInfo.Role
    $description = $roleInfo.Description
    
    Write-Host "  부여 중: $role ($description)" -ForegroundColor Cyan -NoNewline
    
    # 이미 권한이 있는지 확인
    $existingPolicy = gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --filter="bindings.members:serviceAccount:$DEFAULT_SERVICE_ACCOUNT AND bindings.role:$role" --format="value(bindings.role)" 2>&1
    
    if ($existingPolicy -match $role) {
        Write-Host " (이미 부여됨)" -ForegroundColor Yellow
        $skippedCount++
    } else {
        # 권한 부여
        gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$DEFAULT_SERVICE_ACCOUNT" --role=$role --condition=None 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " [OK]" -ForegroundColor Green
            $grantedCount++
        } else {
            Write-Host " [FAILED]" -ForegroundColor Red
            $failedCount++
        }
    }
}

Write-Host ""
Write-Host "Phase 1 완료 요약:" -ForegroundColor Cyan
Write-Host "  부여됨: $grantedCount" -ForegroundColor Green
Write-Host "  이미 부여됨: $skippedCount" -ForegroundColor Yellow
Write-Host "  실패: $failedCount" -ForegroundColor Red
Write-Host ""

# ============================================================================
# Phase 2: Vertex AI 전용 서비스 계정 생성 (선택적)
# ============================================================================

Write-Host "[Phase 2] Vertex AI 전용 서비스 계정 생성 (선택적)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Vertex AI 전용 서비스 계정을 생성하시겠습니까? (Y/N)" -ForegroundColor Cyan
$createVertexAccount = Read-Host

if ($createVertexAccount -eq "Y" -or $createVertexAccount -eq "y") {
    $VERTEX_ACCOUNT_NAME = "vertex-ai-service"
    $VERTEX_ACCOUNT_EMAIL = "$VERTEX_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    Write-Host "Vertex AI 서비스 계정 생성 중: $VERTEX_ACCOUNT_EMAIL" -ForegroundColor Cyan
    
    # 계정 존재 확인
    $vertexExists = gcloud iam service-accounts describe $VERTEX_ACCOUNT_EMAIL --project=$PROJECT_ID 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Vertex AI 서비스 계정이 이미 존재합니다." -ForegroundColor Yellow
    } else {
        # 계정 생성
        gcloud iam service-accounts create $VERTEX_ACCOUNT_NAME --display-name="Vertex AI Service Account" --description="Service account for Vertex AI operations" --project=$PROJECT_ID 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Vertex AI 서비스 계정 생성 완료" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Vertex AI 서비스 계정 생성 실패" -ForegroundColor Red
        }
    }
    
    # Vertex AI 계정에 권한 부여
    if ($LASTEXITCODE -eq 0 -or $vertexExists) {
        Write-Host "Vertex AI 서비스 계정에 권한 부여 중..." -ForegroundColor Cyan
        
        $vertexRoles = @(
            @{Role='roles/aiplatform.user'; Description='Vertex AI API usage'},
            @{Role='roles/serviceusage.serviceUsageConsumer'; Description='Vertex AI API consumption'}
        )
        
        foreach ($roleInfo in $vertexRoles) {
            $role = $roleInfo.Role
            $description = $roleInfo.Description
            
            Write-Host "  부여 중: $role ($description)" -ForegroundColor Cyan -NoNewline
            
            gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$VERTEX_ACCOUNT_EMAIL" --role=$role --condition=None 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host " [OK]" -ForegroundColor Green
            } else {
                Write-Host " [FAILED]" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
} else {
    Write-Host "Vertex AI 전용 서비스 계정 생성을 건너뜁니다." -ForegroundColor Yellow
    Write-Host "기본 서비스 계정으로 Vertex AI를 사용할 수 있습니다." -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# Phase 3: CI/CD 배포용 서비스 계정 생성 (선택적)
# ============================================================================

Write-Host "[Phase 3] CI/CD 배포용 서비스 계정 생성 (선택적)" -ForegroundColor Yellow
Write-Host ""
Write-Host "CI/CD 배포용 서비스 계정을 생성하시겠습니까? (Y/N)" -ForegroundColor Cyan
$createCICDAccount = Read-Host

if ($createCICDAccount -eq "Y" -or $createCICDAccount -eq "y") {
    $CICD_ACCOUNT_NAME = "cicd-deploy"
    $CICD_ACCOUNT_EMAIL = "$CICD_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    Write-Host "CI/CD 서비스 계정 생성 중: $CICD_ACCOUNT_EMAIL" -ForegroundColor Cyan
    
    # 계정 존재 확인
    $cicdExists = gcloud iam service-accounts describe $CICD_ACCOUNT_EMAIL --project=$PROJECT_ID 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] CI/CD 서비스 계정이 이미 존재합니다." -ForegroundColor Yellow
    } else {
        # 계정 생성
        gcloud iam service-accounts create $CICD_ACCOUNT_NAME --display-name="CI/CD Deploy Service Account" --description="Service account for CI/CD deployment pipeline" --project=$PROJECT_ID 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] CI/CD 서비스 계정 생성 완료" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] CI/CD 서비스 계정 생성 실패" -ForegroundColor Red
        }
    }
    
    # CI/CD 계정에 권한 부여
    if ($LASTEXITCODE -eq 0 -or $cicdExists) {
        Write-Host "CI/CD 서비스 계정에 권한 부여 중..." -ForegroundColor Cyan
        
        $cicdRoles = @(
            @{Role='roles/cloudfunctions.developer'; Description='Cloud Functions deployment'},
            @{Role='roles/firebase.rulesAdmin'; Description='Firestore/Storage rules deployment'},
            @{Role='roles/storage.admin'; Description='Storage administration'},
            @{Role='roles/iam.serviceAccountUser'; Description='Service account usage'},
            @{Role='roles/cloudbuild.builds.editor'; Description='Cloud Build job execution'},
            @{Role='roles/logging.logWriter'; Description='Deployment log writing'}
        )
        
        foreach ($roleInfo in $cicdRoles) {
            $role = $roleInfo.Role
            $description = $roleInfo.Description
            
            Write-Host "  부여 중: $role ($description)" -ForegroundColor Cyan -NoNewline
            
            gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$CICD_ACCOUNT_EMAIL" --role=$role --condition=None 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host " [OK]" -ForegroundColor Green
            } else {
                Write-Host " [FAILED]" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
} else {
    Write-Host "CI/CD 배포용 서비스 계정 생성을 건너뜁니다." -ForegroundColor Yellow
    Write-Host "로컬 배포 시에는 필요하지 않습니다." -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# 최종 요약
# ============================================================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "설정 완료 요약" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "기본 서비스 계정:" -ForegroundColor White
Write-Host "  $DEFAULT_SERVICE_ACCOUNT" -ForegroundColor Gray
Write-Host "  상태: [OK] 권한 부여 완료" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Cyan
Write-Host "1. 서비스 계정 권한 확인: gcloud projects get-iam-policy $PROJECT_ID" -ForegroundColor White
Write-Host "2. Functions 배포 테스트: firebase deploy --only functions" -ForegroundColor White
Write-Host "3. GCP Console 확인: https://console.cloud.google.com/iam-admin/serviceaccounts?project=$PROJECT_ID" -ForegroundColor White
Write-Host ""

