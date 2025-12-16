# GCP 서비스 계정 설정 완료 보고서

**작업 일시**: 2025-12-16  
**프로젝트**: dysapp1210  
**상태**: ✅ 완료

---

## ✅ 완료된 작업

### Phase 1: 기본 서비스 계정 권한 설정

**서비스 계정**: `dysapp1210@appspot.gserviceaccount.com`  
**상태**: ✅ 모든 필수 권한 부여 완료

#### 부여된 IAM 역할

| 역할 | 용도 | 상태 |
|------|------|------|
| `roles/datastore.user` | Firestore 읽기/쓰기 | ✅ 부여 완료 |
| `roles/storage.objectAdmin` | Cloud Storage 파일 관리 | ✅ 부여 완료 |
| `roles/aiplatform.user` | Vertex AI 사용 | ✅ 부여 완료 |
| `roles/secretmanager.secretAccessor` | Secret Manager 접근 | ✅ 부여 완료 |
| `roles/logging.logWriter` | Cloud Logging 로그 작성 | ✅ 부여 완료 |
| `roles/monitoring.metricWriter` | Cloud Monitoring 메트릭 작성 | ✅ 부여 완료 |

**총 6개 역할 모두 부여 완료**

---

## 📋 서비스 계정 명세

### 1. Cloud Functions 기본 서비스 계정

**계정명**: `dysapp1210@appspot.gserviceaccount.com`  
**타입**: 기본 서비스 계정 (Firebase 프로젝트 생성 시 자동 생성)  
**용도**: Cloud Functions 실행 시 사용

**권한 상태**: ✅ 모든 필수 권한 부여 완료

**사용 위치**:
- `functions/src/analysis/analyzeDesign.ts` - Firestore, Storage 접근
- `functions/src/chat/chatWithMentor.ts` - Firestore 접근
- `functions/src/search/searchSimilar.ts` - Firestore 벡터 검색
- `functions/src/user/profileFunctions.ts` - Firestore 사용자 데이터 관리
- `functions/src/analysis/embedding.ts` - Vertex AI 임베딩 생성

---

## 🔍 권한 확인 방법

### gcloud CLI로 확인

```bash
# 기본 서비스 계정의 모든 역할 확인
gcloud projects get-iam-policy dysapp1210 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:dysapp1210@appspot.gserviceaccount.com" \
  --format="table(bindings.role)"
```

### GCP Console에서 확인

1. [IAM 및 관리자 → 서비스 계정](https://console.cloud.google.com/iam-admin/serviceaccounts?project=dysapp1210)
2. `dysapp1210@appspot.gserviceaccount.com` 선택
3. "권한" 탭에서 부여된 역할 확인

---

## 📝 참고사항

### Firestore 권한

- Firebase Admin SDK를 사용할 때는 `roles/datastore.user` 역할이 필요합니다.
- `roles/firestore.user`는 존재하지 않는 역할입니다.
- Firestore Native Mode에서는 `roles/datastore.user`를 사용합니다.

### Vertex AI 권한

- `roles/aiplatform.user` 역할로 Vertex AI API를 사용할 수 있습니다.
- Vertex AI는 `us-central1` 리전에서만 사용 가능합니다.
- 코드에서 `@google-cloud/vertexai` 패키지를 사용합니다.

### Secret Manager 권한

- `roles/secretmanager.secretAccessor` 역할로 Secret Manager의 Secret에 접근할 수 있습니다.
- `google-ai-api-key` Secret에 대한 접근 권한이 이미 부여되어 있습니다.

---

## 🚀 다음 단계

1. **Functions 배포 테스트**
   ```bash
   firebase deploy --only functions
   ```

2. **환경변수 확인**
   - Secret Manager에서 API 키가 제대로 접근되는지 확인
   - Functions 로그에서 환경변수 로드 확인

3. **기능 테스트**
   - `analyzeDesign` 함수 테스트 (Firestore, Storage, Vertex AI 사용)
   - `chatWithMentor` 함수 테스트 (Firestore, Gemini 사용)
   - `searchSimilar` 함수 테스트 (Firestore 벡터 검색)

---

## 📚 관련 문서

- [서비스 계정 명세서](docs/SERVICE_ACCOUNTS_SPEC.md)
- [GCP API 활성화 요구사항](GCP_API_REQUIREMENTS.md)
- [API 키 설정 완료 보고서](API_KEY_SETUP_COMPLETE.md)

---

## ✅ 검증 완료

- ✅ 기본 서비스 계정 존재 확인
- ✅ 모든 필수 IAM 역할 부여 완료
- ✅ Secret Manager 접근 권한 확인
- ✅ Vertex AI 사용 권한 확인
- ✅ Firestore 접근 권한 확인
- ✅ Cloud Storage 접근 권한 확인

**모든 서비스 계정 설정이 완료되었습니다.**

