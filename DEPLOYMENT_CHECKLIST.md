# Dysapp 배포 체크리스트

**프로젝트:** dysapp - AI 디자인 분석 플랫폼  
**날짜:** 2026-01-17  
**담당자:** _____________  
**배포 타겟:** Production (Firebase)

---

## 🎯 배포 전 필수 확인사항

### ✅ **Phase 1: 환경 설정 (필수)**

#### 1.1 Firebase Console 설정

- [ ] **Anonymous Authentication 활성화**
  - Firebase Console > Authentication > Sign-in method
  - Anonymous > Enable 클릭
  - 저장 확인
  - **검증:** 새로고침 후 "Enabled" 상태 확인

- [ ] **Secret Manager Secrets 설정**
  ```bash
  # Gemini API Key 설정
  firebase functions:secrets:set GEMINI_API_KEY
  # 입력: [여기에 Gemini API 키 입력]
  
  # Google Custom Search API Key
  firebase functions:secrets:set GCP_SEARCH_API_KEY
  # 입력: [여기에 Google Search API 키 입력]
  
  # Google Custom Search Engine ID
  firebase functions:secrets:set GCP_SEARCH_ENGINE_ID
  # 입력: [여기에 Search Engine ID 입력]
  ```
  - **검증:**
  ```bash
  firebase functions:secrets:access GEMINI_API_KEY
  firebase functions:secrets:access GCP_SEARCH_API_KEY
  firebase functions:secrets:access GCP_SEARCH_ENGINE_ID
  ```

- [ ] **Functions 리전 확인**
  - Firebase Console > Functions
  - 리전: asia-northeast3 (Seoul) 확인
  - **예상:** 모든 Functions가 seoul 리전

#### 1.2 Firestore 설정

- [ ] **벡터 인덱스 생성 (searchSimilar용)**
  ```bash
  gcloud firestore indexes create \
    --project=dysapp1210 \
    --database=dysapp \
    --collection-group=analyses \
    --field-config=field-path=imageEmbedding,vector-config='{"dimension":1408,"flat":{}}'
  ```
  - **검증:**
  ```bash
  gcloud firestore indexes list --database=dysapp | grep imageEmbedding
  ```
  - **예상 결과:** 상태가 "READY"로 표시됨 (생성 후 10-30분 소요)

- [ ] **Firestore Security Rules 배포**
  ```bash
  firebase deploy --only firestore:rules --project dysapp1210
  ```
  - **검증:** Firebase Console > Firestore > Rules 탭에서 최신 버전 확인

- [ ] **Firestore 데이터베이스 확인**
  - Firebase Console > Firestore > Databases
  - 데이터베이스 ID: **dysapp** (nam5) 확인

---

### ✅ **Phase 2: 백엔드 배포**

#### 2.1 로컬 빌드 테스트

- [ ] **TypeScript 빌드**
  ```bash
  cd packages/backend/functions
  npm run build
  ```
  - **예상 결과:** 에러 없이 완료, `lib/` 디렉토리 생성됨

- [ ] **Linter 검증**
  ```bash
  npm run lint
  ```
  - **예상 결과:** 에러 없음 또는 minor warnings만

#### 2.2 Functions 배포

- [ ] **전체 Functions 배포**
  ```bash
  cd packages/backend
  firebase deploy --only functions --project dysapp1210
  ```
  - **예상 시간:** 5-10분
  - **예상 결과:** 15개 Functions 모두 배포 성공

**배포될 Functions:**
```
✓ analyzeDesign        (512MiB, 300s timeout)
✓ chatWithMentor       (256MiB, 120s timeout)
✓ searchSimilar        (512MiB, 60s timeout)
✓ searchText           (512MiB, 60s timeout)
✓ customSearch         (512MiB, 60s timeout)
✓ saveItem             (512MiB)
✓ getBookmarks         (512MiB)
✓ deleteBookmark       (512MiB)
✓ getAnalyses          (512MiB, 60s timeout)
✓ getUserProfile       (512MiB, 60s timeout)
✓ updateUserProfile    (512MiB)
✓ getAnalysis          (512MiB)
✓ deleteAnalysis       (512MiB)
✓ registerUser         (512MiB)
✓ healthCheck          (512MiB, 10s timeout)
```

#### 2.3 Functions 검증

- [ ] **Health Check 테스트**
  ```bash
  curl -X POST \
    https://asia-northeast3-dysapp1210.cloudfunctions.net/healthCheck \
    -H "Content-Type: application/json" \
    -d '{}'
  ```
  - **예상 응답:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-01-17T...",
    "version": "1.0.0",
    "region": "asia-northeast3"
  }
  ```

- [ ] **Functions 로그 확인**
  ```bash
  firebase functions:log --limit 10
  ```
  - **확인 사항:** 에러 로그 없음

---

### ✅ **Phase 3: 프론트엔드 배포**

#### 3.1 파일 검증

- [ ] **필수 파일 존재 확인**
  ```
  ✓ packages/frontend/index.html
  ✓ packages/frontend/analyze.html
  ✓ packages/frontend/searchTab.html
  ✓ packages/frontend/mypage.html
  ✓ packages/frontend/settings.html
  ✓ packages/frontend/subscribe.html
  ✓ packages/frontend/nav.html
  ✓ packages/frontend/common.css
  ✓ packages/frontend/includHTML.js
  ```

- [ ] **JavaScript 파일 확인**
  ```
  ✓ packages/frontend/scripts/*.js (9개)
  ✓ packages/frontend/services/*.js (5개)
  ✓ packages/frontend/utils/*.js (5개)
  ```

- [ ] **이미지 리소스 확인**
  ```
  ✓ packages/frontend/img/*.svg (32개)
  ✓ packages/frontend/img/*.png (21개)
  ```

#### 3.2 Firebase Hosting 설정

- [ ] **firebase.json 확인**
  - hosting.public: "packages/frontend"
  - rewrites 설정 확인
  - headers 설정 확인 (캐시)

- [ ] **Hosting 배포**
  ```bash
  firebase deploy --only hosting --project dysapp1210
  ```
  - **예상 시간:** 2-3분
  - **예상 결과:** 배포 성공, URL 출력됨

**배포 URL:**
```
✓ https://dysapp1210.web.app
✓ https://dysapp1210.firebaseapp.com
```

#### 3.3 Hosting 검증

- [ ] **메인 페이지 접속**
  - https://dysapp1210.web.app
  - **확인:** 로딩 완료, 에러 없음

- [ ] **브라우저 콘솔 확인**
  - F12 > Console 탭
  - **확인:** 에러 메시지 없음, "[App] Initialized" 로그 확인

- [ ] **네트워크 탭 확인**
  - F12 > Network 탭
  - **확인:** 모든 리소스 200 OK

---

## 🧪 통합 테스트 체크리스트

### Test 1: 업로드 → 분석 플로우

- [ ] **Step 1: 파일 업로드**
  - index.html 접속
  - 이미지 파일 선택 (< 10MB)
  - 미리보기 표시 확인

- [ ] **Step 2: 분석 시작**
  - "보내기" 버튼 클릭
  - 로딩 표시 확인
  - **예상 시간:** 30-60초

- [ ] **Step 3: 결과 표시**
  - analyze.html로 자동 이동
  - 분석 결과 표시 확인
  - 점수, 포맷, fixScope 표시

- [ ] **Step 4: LocalStorage 확인**
  - F12 > Application > Local Storage
  - `dysapp:lastAnalysisId` 존재 확인

### Test 2: AI 채팅

- [ ] **Step 1: 채팅 입력**
  - analyze.html 하단 채팅 입력
  - 메시지 입력 후 전송

- [ ] **Step 2: AI 응답 확인**
  - 응답 표시 확인
  - **예상 시간:** 5-10초

- [ ] **Step 3: 대화 연속성**
  - 추가 메시지 전송
  - sessionId 재사용 확인

### Test 3: 검색 기능

- [ ] **Step 1: 유사 이미지 검색**
  - searchTab.html 접속
  - "이미지로 검색" 선택
  - 이미지 선택

- [ ] **Step 2: 결과 확인**
  - 유사 디자인 목록 표시
  - **예상 시간:** 3-5초

- [ ] **Step 3: 텍스트 검색**
  - "텍스트로 검색" 선택
  - 검색어 입력
  - 결과 표시 확인

### Test 4: 마이페이지

- [ ] **Step 1: 프로필 조회**
  - mypage.html 접속
  - 프로필 카드 표시 확인

- [ ] **Step 2: 분석 히스토리**
  - Bento Grid 표시 확인
  - 갤러리 표시 확인

- [ ] **Step 3: 필터링**
  - 갤러리 탭 클릭 (전체/포스터/카드...)
  - 필터 적용 확인

- [ ] **Step 4: 페이지네이션**
  - "더 보기" 버튼 클릭
  - 추가 항목 로드 확인

### Test 5: 회원가입/로그인

- [ ] **Step 1: 익명 로그인 자동**
  - 새 시크릿 창에서 index.html 접속
  - 자동 익명 로그인 확인
  - Firebase Console > Authentication > Users 확인

- [ ] **Step 2: 회원가입 모달**
  - 회원가입 버튼 클릭
  - 모달 표시 확인

- [ ] **Step 3: 계정 생성**
  - 이메일, 비밀번호 입력
  - 개인정보 동의 체크
  - 가입 완료

- [ ] **Step 4: 로그아웃**
  - 로그아웃 버튼 클릭
  - 익명 상태로 복귀 확인

### Test 6: 북마크 기능

- [ ] **Step 1: 북마크 저장**
  - 분석 결과에서 별표 클릭
  - Toast "저장되었습니다" 표시

- [ ] **Step 2: 북마크 목록**
  - mypage.html > 북마크 탭
  - 저장된 항목 표시 확인

- [ ] **Step 3: 북마크 삭제**
  - 삭제 버튼 클릭
  - 목록에서 제거 확인

---

## ⚠️ 에러 시나리오 테스트

### Error Test 1: 네트워크 오류

- [ ] **Step 1: 네트워크 차단**
  - F12 > Network > Offline 체크

- [ ] **Step 2: API 호출**
  - 아무 기능 실행

- [ ] **Step 3: 에러 메시지 확인**
  - Toast: "네트워크 연결을 확인해주세요"
  - 콘솔: NetworkError 감지됨

### Error Test 2: 파일 크기 초과

- [ ] **Step 1: 대용량 파일 선택**
  - > 10MB 이미지 선택

- [ ] **Step 2: 에러 메시지 확인**
  - Toast: "File too large. Maximum size: 10MB"

### Error Test 3: 잘못된 파일 형식

- [ ] **Step 1: PDF 파일 선택**
  - .pdf 파일 선택 시도

- [ ] **Step 2: 에러 메시지 확인**
  - Toast: "Invalid file type. Supported: image/jpeg..."

### Error Test 4: 인증 만료

- [ ] **Step 1: 토큰 만료 시뮬레이션**
  - 장시간 페이지 열어두기 (> 1시간)

- [ ] **Step 2: API 호출**
  - 기능 실행

- [ ] **Step 3: 재인증 확인**
  - 자동 재인증 또는 로그인 요청

---

## 📊 성능 벤치마크

### Performance Metrics

- [ ] **페이지 로드 시간**
  - 첫 페이지 로드: < 3초
  - 측정 도구: Chrome DevTools > Lighthouse

- [ ] **이미지 업로드 속도**
  - 1MB 이미지: < 5초
  - 5MB 이미지: < 15초

- [ ] **AI 분석 시간**
  - analyzeDesign: < 60초
  - **정상 범위:** 30-60초

- [ ] **검색 응답 시간**
  - searchSimilar: < 5초
  - searchText: < 3초

- [ ] **채팅 응답 시간**
  - chatWithMentor: < 10초
  - **정상 범위:** 5-10초

---

## 🔐 보안 검증

### Security Checks

- [ ] **HTTPS 강제**
  - http:// 접속 시 https://로 리다이렉트 확인

- [ ] **Firebase API Key 노출**
  - 소스 코드에서 apiKey 확인 (정상 - 클라이언트 측 공개 OK)

- [ ] **CORS 설정**
  - 다른 도메인에서 API 호출 시 차단 확인

- [ ] **Firestore Rules**
  - 인증 없이 데이터 읽기 시도 → permission-denied 확인

- [ ] **Rate Limiting**
  - 동일 사용자가 1분 내 100회 이상 요청 시 차단 확인

---

## 📈 모니터링 설정

### Monitoring Setup

- [ ] **Cloud Functions 로그**
  ```bash
  firebase functions:log --limit 100
  ```
  - 에러 로그 확인

- [ ] **Firestore 사용량**
  - Firebase Console > Firestore > Usage
  - Reads, Writes, Deletes 확인

- [ ] **Hosting 트래픽**
  - Firebase Console > Hosting > Usage
  - Bandwidth, Requests 확인

- [ ] **Error Reporting**
  - Firebase Console > Crashlytics (선택사항)
  - 자동 에러 수집 설정

- [ ] **Performance Monitoring**
  - Firebase Console > Performance
  - 페이지 로드 시간 추적

---

## ✅ 최종 승인

### 배포 완료 확인

- [ ] **모든 Phase 완료**
  - Phase 1: 환경 설정 ✅
  - Phase 2: 백엔드 배포 ✅
  - Phase 3: 프론트엔드 배포 ✅

- [ ] **모든 테스트 통과**
  - 통합 테스트 6개 ✅
  - 에러 시나리오 4개 ✅
  - 성능 벤치마크 ✅
  - 보안 검증 ✅

- [ ] **모니터링 설정 완료**
  - Functions 로그 ✅
  - Firestore 사용량 ✅
  - Hosting 트래픽 ✅

---

## 🎯 배포 후 조치사항

### Post-Deployment

- [ ] **사용자 공지**
  - 서비스 오픈 공지
  - 사용 가이드 제공

- [ ] **첫 24시간 모니터링**
  - 에러 로그 주기적 확인 (매 2시간)
  - 사용량 추이 확인

- [ ] **백업 계획**
  - Firestore 데이터 백업 설정
  ```bash
  gcloud firestore export gs://dysapp1210-backups/$(date +%Y%m%d)
  ```

- [ ] **롤백 계획 준비**
  ```bash
  # 이전 버전으로 롤백 (필요 시)
  firebase hosting:rollback
  ```

---

## 📝 배포 기록

### Deployment Log

**배포일:** 2026-01-17  
**담당자:** _____________  
**서명:** _____________

**배포 환경:**
- Firebase Project: dysapp1210
- Functions Region: asia-northeast3
- Firestore Database: dysapp (nam5)
- Hosting URL: https://dysapp1210.web.app

**배포 버전:**
- Frontend: 1.0.0
- Backend Functions: 1.0.0
- Analysis Version: 1
- Embedding Version: 1

**배포 결과:**
- [ ] ✅ 성공
- [ ] ⚠️ 부분 성공 (이슈: _____________)
- [ ] ❌ 실패 (사유: _____________)

**특이사항:**
_____________________________________________
_____________________________________________
_____________________________________________

---

**체크리스트 완료:** ____/____/2026  
**최종 승인자:** _____________  
**서명:** _____________

---

## 📎 참고 문서

1. `ENDPOINT_VALIDATION_REPORT.md` - 엔드포인트 검증
2. `SECURITY_AND_DEPLOYMENT_REPORT.md` - 보안 분석
3. `FRONTEND_UPDATE_REVIEW_2026-01-17.md` - 프론트엔드 변경사항
4. `docs/dysapp_PRD.md` - 제품 요구사항 문서

**배포 지원:** Firebase CLI 문서 https://firebase.google.com/docs/cli
