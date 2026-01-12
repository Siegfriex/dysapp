# 배포 준비 완료 보고서

**작성 일시**: 2025-01-27  
**프로젝트**: dysapp1210

---

## ✅ 완료된 작업

### 1. Storage 규칙 보안 강화 ✅

**파일**: `storage.rules`

**변경 내용**:
- 사용자별 접근 제어 구현
- `design-uploads/{userId}/` 경로에 대한 소유권 기반 접근 제어
- 파일 크기 제한 (10MB)
- 파일 타입 제한 (이미지 파일만)
- 인증된 사용자만 읽기 가능

**주요 규칙**:
```javascript
match /design-uploads/{userId}/{fileName} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated() 
               && request.resource.size < 10 * 1024 * 1024
               && request.resource.contentType.matches('image/.*');
}
```

---

### 2. 하드코딩된 API 키 환경 변수화 ✅

**파일**: `functions/src/search/customSearch.ts`

**변경 내용**:
- 하드코딩된 `GCP_SEARCH_API_KEY` 제거
- 하드코딩된 `GCP_SEARCH_ENGINE_ID` 제거
- `getSearchApiCredentials()` 함수 추가하여 환경 변수에서 읽기
- 환경 변수 미설정 시 명확한 에러 메시지 제공

**필요한 환경 변수**:
- `GCP_SEARCH_API_KEY`
- `GCP_SEARCH_ENGINE_ID`

---

### 3. 빌드 검증 ✅

**결과**: TypeScript 컴파일 성공
```bash
cd functions
npm run build
# ✅ 성공 (오류 없음)
```

---

## ⚠️ 배포 전 필수 작업

### 1. Firebase 인증

```bash
firebase login --reauth
```

### 2. 환경 변수 설정

Firebase Functions v2에서는 Secret Manager 또는 환경 변수를 사용합니다.

#### 방법 1: Firebase Console에서 설정
1. Firebase Console 접속: https://console.firebase.google.com/project/dysapp1210/functions
2. Functions > 설정 > 환경 변수
3. 다음 변수 추가:
   - `GCP_SEARCH_API_KEY`: `AIzaSyBJA2cZp9sn1DeaqWxMGMFecOprZHzqHcA`
   - `GCP_SEARCH_ENGINE_ID`: `665cb462ec68043bc`

#### 방법 2: Firebase CLI로 설정
```bash
# Secret Manager 사용 (권장)
firebase functions:secrets:set GCP_SEARCH_API_KEY
firebase functions:secrets:set GCP_SEARCH_ENGINE_ID

# 또는 환경 변수로 설정
firebase functions:config:set gcp.search.api_key="AIzaSyBJA2cZp9sn1DeaqWxMGMFecOprZHzqHcA"
firebase functions:config:set gcp.search.engine_id="665cb462ec68043bc"
```

**참고**: 기존에 설정된 환경 변수 확인:
- `GOOGLE_AI_API_KEY` 또는 `GEMINI_API_KEY` (이미 설정되어 있을 것으로 예상)
- `GOOGLE_CLOUD_PROJECT` (자동 설정됨)

---

## 📋 배포 순서

### 1. Storage 규칙 배포
```bash
firebase deploy --only storage
```

### 2. Firestore 인덱스 배포 (필요시)
```bash
firebase deploy --only firestore:indexes
```

### 3. Functions 배포
```bash
cd functions
npm install  # 의존성 확인
npm run build  # 빌드 확인
cd ..
firebase deploy --only functions
```

### 4. Hosting 배포 (필요시)
```bash
firebase deploy --only hosting
```

### 5. 전체 배포 (권장)
```bash
firebase deploy
```

---

## 🔍 배포 후 확인 사항

### 1. Functions 상태 확인
```bash
firebase functions:list
```

모든 함수가 `ACTIVE` 상태인지 확인:
- analyzeDesign
- chatWithMentor
- searchSimilar
- searchText
- customSearch
- saveItem
- getAnalyses
- getAnalysis
- getUserProfile
- updateUserProfile
- deleteAnalysis
- healthCheck

### 2. Functions 로그 확인
```bash
firebase functions:log
```

### 3. Storage 규칙 확인
- Firebase Console > Storage > Rules
- 규칙이 올바르게 배포되었는지 확인

### 4. 환경 변수 확인
- Firebase Console > Functions > 설정 > 환경 변수
- 다음 변수들이 설정되어 있는지 확인:
  - `GOOGLE_AI_API_KEY` 또는 `GEMINI_API_KEY`
  - `GCP_SEARCH_API_KEY` (새로 추가 필요)
  - `GCP_SEARCH_ENGINE_ID` (새로 추가 필요)

### 5. 실제 테스트
- 웹 애플리케이션 접속: https://dysapp1210.web.app
- 이미지 업로드 테스트
- `customSearch` 함수 호출 테스트 (환경 변수 설정 후)

---

## ⚠️ 주의사항

### 1. Storage 규칙 변경 영향
- 기존에 업로드된 파일들은 여전히 접근 가능 (인증된 사용자)
- 새로운 업로드는 사용자별 경로로 제한됨
- Cloud Functions에서 업로드하는 파일은 서비스 계정으로 업로드되므로 정상 작동

### 2. 환경 변수 미설정 시
- `customSearch` 함수 호출 시 에러 발생
- 에러 메시지: "GCP_SEARCH_API_KEY environment variable is not set"
- 배포 전 반드시 환경 변수 설정 필요

### 3. 빌드 권한 오류 가능성
- 이전에 빌드 권한 오류가 발생한 이력이 있음
- 배포 실패 시 Cloud Build 로그 확인 필요
- 필요시 Cloud Build 서비스 계정 권한 재확인

---

## 📝 변경 사항 요약

### 수정된 파일
1. `storage.rules` - 보안 규칙 강화
2. `functions/src/search/customSearch.ts` - 환경 변수 사용

### 새로 추가된 환경 변수 필요
- `GCP_SEARCH_API_KEY`
- `GCP_SEARCH_ENGINE_ID`

### 배포 전 체크리스트
- [x] Storage 규칙 보안 강화
- [x] 하드코딩된 API 키 제거
- [x] TypeScript 빌드 성공
- [ ] Firebase 인증 (`firebase login --reauth`)
- [ ] 환경 변수 설정 (`GCP_SEARCH_API_KEY`, `GCP_SEARCH_ENGINE_ID`)
- [ ] Storage 규칙 배포
- [ ] Functions 배포
- [ ] 배포 후 테스트

---

**다음 단계**: Firebase 인증 후 환경 변수 설정하고 배포 진행
