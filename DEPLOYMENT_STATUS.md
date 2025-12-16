# 배포 상태 보고서

**작업 일시**: 2025-12-16  
**프로젝트**: dysapp1210  
**상태**: ⚠️ 빌드 권한 오류 발생

---

## ✅ 완료된 작업

### 1. 환경변수 설정
- ✅ `.env` 파일에서 예약된 키(`GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT`) 제거
- ✅ API 키만 유지 (`GOOGLE_AI_API_KEY`, `GEMINI_API_KEY`)

### 2. 코드 수정
- ✅ `functions/src/utils/envValidation.ts` - Firebase Functions v2 자동 프로젝트 ID 지원
- ✅ Firebase Admin fallback 추가

### 3. Cloud Build 서비스 계정 권한 부여
- ✅ `roles/cloudbuild.builds.builder` - Cloud Build 빌드 실행
- ✅ `roles/artifactregistry.writer` - Artifact Registry에 이미지 푸시
- ✅ `roles/storage.objectAdmin` - Storage에서 소스 코드 읽기
- ✅ `roles/iam.serviceAccountUser` - Compute Engine 서비스 계정 사용
- ✅ `roles/iam.serviceAccountTokenCreator` - 서비스 계정 토큰 생성
- ✅ `roles/run.admin` - Cloud Run 관리

### 4. API 활성화 확인
- ✅ Cloud Build API 활성화됨
- ✅ Artifact Registry API 활성화됨
- ✅ Cloud Functions API 활성화됨
- ✅ Cloud Run API 활성화됨

---

## ⚠️ 현재 문제

### 빌드 권한 오류
**오류 메시지**:
```
Build failed with status: FAILURE. Could not build the function due to a missing permission on the build service account. 
If you didn't revoke that permission explicitly, this could be caused by a change in the organization policies.
```

**영향받는 함수**:
- analyzeDesign
- chatWithMentor
- deleteAnalysis
- getAnalyses
- getAnalysis
- getUserProfile
- healthCheck
- searchSimilar
- updateUserProfile

**가능한 원인**:
1. 조직 정책(Organization Policy)이 Cloud Build를 제한하고 있을 수 있음
2. Cloud Build 서비스 계정에 추가 권한이 필요할 수 있음
3. 프로젝트 레벨의 제약사항이 있을 수 있음

---

## 🔍 다음 단계

### 1. 빌드 로그 확인
다음 명령어로 실제 빌드 로그를 확인하세요:
```bash
gcloud builds log --region=asia-northeast3 <BUILD_ID> --project=dysapp1210
```

또는 Firebase Console에서 확인:
https://console.cloud.google.com/cloud-build/builds?project=dysapp1210

### 2. 조직 정책 확인
GCP Console에서 조직 정책을 확인하세요:
- IAM & Admin > Organization Policies
- `constraints/cloudbuild.allowedWorkerPools` 확인
- `constraints/iam.allowedServiceAccountDomains` 확인

### 3. 수동 빌드 테스트
Cloud Build에서 직접 빌드를 실행해보세요:
```bash
gcloud builds submit --region=asia-northeast3 functions/ --project=dysapp1210
```

### 4. Firebase Console에서 배포
Firebase Console에서 직접 배포를 시도해보세요:
https://console.firebase.google.com/project/dysapp1210/functions

---

## 📋 참고 문서

- [Firebase Functions v2 배포 가이드](https://firebase.google.com/docs/functions/manage-functions)
- [Cloud Build 서비스 계정 문제 해결](https://cloud.google.com/functions/docs/troubleshooting#build-service-account)
- [GCP IAM 역할 참조](https://cloud.google.com/iam/docs/understanding-roles)

---

## 💡 권장 사항

1. **빌드 로그 확인**: 실제 빌드 로그에서 정확한 오류 메시지를 확인하세요.
2. **조직 정책 확인**: 조직 정책이 Cloud Build를 제한하고 있는지 확인하세요.
3. **Firebase Console 사용**: CLI 대신 Firebase Console에서 배포를 시도해보세요.
4. **지원팀 문의**: 문제가 지속되면 Firebase/GCP 지원팀에 문의하세요.

