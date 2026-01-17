# dysapp 에이전트 테스트 실행 플랜

**프로젝트:** dysapp - AI 디자인 분석 플랫폼  
**대상 에이전트:** Claude Code / Cursor AI Agent  
**실행 방식:** CLI 터미널 기반  
**코드베이스:** C:\dys_prototype  
**최종 목표:** 프로덕션 배포 준비 완료 및 무결성 100% 검증

---

## 🎯 전체 실행 개요

이 플랜은 **8개 Phase**로 구성되며, 각 Phase는 **순차적으로 실행**됩니다.  
에이전트는 각 Phase를 완료한 후 **결과 보고서를 생성**하고, **문제 발견 시 즉시 수정**합니다.

### 실행 구조

```
Phase 1: 환경 설정 검증
   ↓ (문제 발견 시 수정)
Phase 2: 백엔드 빌드 및 배포
   ↓ (문제 발견 시 수정)
Phase 3: 프론트엔드 배포
   ↓ (문제 발견 시 수정)
Phase 4: Mock Mode 통합 테스트
   ↓ (문제 발견 시 수정)
Phase 5: 실제 백엔드 연동 테스트
   ↓ (문제 발견 시 수정)
Phase 6: 에러 시나리오 테스트
   ↓ (문제 발견 시 수정)
Phase 7: 성능 벤치마크
   ↓
Phase 8: 최종 검증 및 보고서 생성
```

---

## 📋 Phase 1: 환경 설정 검증

### 목표
현재 코드베이스의 환경 설정이 배포 준비가 되어있는지 검증

### 에이전트 실행 프롬프트

```
[TASK] dysapp 프로젝트 환경 설정 검증

[CONTEXT]
- 작업 디렉토리: C:\dys_prototype
- 현재 브랜치: 0113frontend
- 최근 커밋: feat: Improve mypage UI layout and add edit/pin icons

[ACTIONS]
1. 프로젝트 구조 확인
   - packages/frontend 존재 확인
   - packages/backend 존재 확인
   - 필수 설정 파일 확인 (firebase.json, package.json)

2. Git 상태 확인
   ```bash
   git status
   git log --oneline -5
   ```
   - Uncommitted changes 확인
   - 현재 브랜치 확인

3. Node.js 환경 확인
   ```bash
   node --version  # 예상: v20.x
   npm --version
   ```

4. Firebase CLI 설치 확인
   ```bash
   firebase --version
   firebase projects:list
   ```
   - dysapp1210 프로젝트 존재 확인

5. 백엔드 의존성 확인
   ```bash
   cd packages/backend/functions
   npm list --depth=0
   ```
   - firebase-admin, firebase-functions, typescript 등 확인

6. Firebase 프로젝트 설정 확인
   ```bash
   cd packages/backend
   cat firebase.json
   ```
   - functions.source = "functions" 확인
   - firestore.database = "dysapp" 확인

7. 환경 변수 확인 (중요!)
   ```bash
   firebase functions:secrets:list --project dysapp1210
   ```
   - 필수 확인: GEMINI_API_KEY, GCP_SEARCH_API_KEY, GCP_SEARCH_ENGINE_ID
   - 없으면 ⚠️ 경고 표시

8. Firestore 인덱스 확인
   ```bash
   gcloud firestore indexes list --database=dysapp --project=dysapp1210
   ```
   - analyses.imageEmbedding 인덱스 존재 확인 (1408차원)

[OUTPUT FORMAT]
다음 형식으로 결과를 보고:

## Phase 1 검증 결과

### ✅ 통과 항목
- [항목명]: [상태]

### ⚠️ 경고 항목
- [항목명]: [문제 설명]
- [해결 방법]

### ❌ 실패 항목
- [항목명]: [에러 메시지]
- [즉시 수정 필요 여부]

### 다음 단계
- [Phase 2 진행 가능 여부]
- [수정 필요 항목 목록]

[ERROR HANDLING]
- 명령어 실행 실패 시: 에러 메시지 기록 후 계속 진행
- 치명적 오류 (Git repo 없음 등): 즉시 중단 및 보고
- 경고 수준 오류: 기록 후 Phase 2 진행

[SUCCESS CRITERIA]
- Git 상태 정상
- Node.js 20.x 설치됨
- Firebase CLI 설치됨
- 프로젝트 구조 올바름
- (선택) 환경 변수 설정됨
```

---

## 📋 Phase 2: 백엔드 빌드 및 배포 검증

### 목표
TypeScript 백엔드를 빌드하고 Functions 배포 준비 상태 확인

### 에이전트 실행 프롬프트

```
[TASK] dysapp 백엔드 빌드 및 배포 검증

[CONTEXT]
- Phase 1 완료됨
- 작업 디렉토리: C:\dys_prototype\packages\backend\functions

[ACTIONS]
1. 백엔드 디렉토리 이동 및 의존성 설치
   ```bash
   cd C:\dys_prototype\packages\backend\functions
   npm install
   ```
   - 에러 발생 시 기록 및 해결

2. TypeScript 빌드
   ```bash
   npm run build
   ```
   - 예상 결과: lib/ 디렉토리 생성
   - 컴파일 에러 확인
   - 경고(warnings) 기록

3. Linter 실행
   ```bash
   npm run lint
   ```
   - ESLint 에러 확인
   - 자동 수정 가능한 항목은 수정:
   ```bash
   npm run lint:fix
   ```

4. 빌드 산출물 검증
   ```bash
   ls -la lib/
   ```
   - index.js 존재 확인
   - analysis/, chat/, search/, user/ 디렉토리 확인
   - .map 파일 확인

5. Functions 설정 확인
   ```bash
   cd ..
   cat firebase.json | grep -A 10 "functions"
   ```
   - source: "functions" 확인
   - runtime: "nodejs20" 확인

6. 로컬 에뮬레이터 테스트 (선택사항)
   ```bash
   npm run serve
   ```
   - Ctrl+C로 종료
   - 에뮬레이터 시작 성공 여부만 확인

7. 배포 준비 확인 (실제 배포 안함)
   ```bash
   firebase deploy --only functions --project dysapp1210 --dry-run
   ```
   - 배포 예정 Functions 목록 확인
   - 예상: 15개 Functions

[OUTPUT FORMAT]
## Phase 2 검증 결과

### 빌드 결과
- TypeScript 컴파일: [성공/실패]
- 에러 개수: [N개]
- 경고 개수: [N개]

### 코드 품질
- ESLint 에러: [N개]
- 자동 수정 완료: [N개]
- 수동 수정 필요: [N개]

### 배포 준비 상태
- Functions 개수: [15개 예상]
- 리전: [asia-northeast3]
- 메모리 할당: [512MiB default]

### 발견된 이슈
1. [이슈 설명]
   - 심각도: [Critical/High/Medium/Low]
   - 해결 방법: [...]

### 수정 완료 항목
1. [수정 내용]
   - 파일: [...]
   - 변경: [...]

[ERROR HANDLING]
- TypeScript 컴파일 에러: 즉시 수정 시도
- ESLint 에러: 자동 수정 후 재빌드
- npm install 실패: package-lock.json 삭제 후 재시도

[SUCCESS CRITERIA]
- TypeScript 빌드 성공 (0 errors)
- lib/ 디렉토리 생성됨
- 15개 Functions 식별됨
- (선택) ESLint 에러 없음
```

---

## 📋 Phase 3: 프론트엔드 파일 검증

### 목표
프론트엔드 파일 구조와 의존성 확인

### 에이전트 실행 프롬프트

```
[TASK] dysapp 프론트엔드 파일 구조 검증

[CONTEXT]
- Phase 2 완료됨
- 작업 디렉토리: C:\dys_prototype\packages\frontend

[ACTIONS]
1. 프론트엔드 디렉토리 구조 검증
   ```bash
   cd C:\dys_prototype\packages\frontend
   ls -la
   ```
   - 필수 HTML 파일 확인 (9개)
   - scripts/ 디렉토리 확인
   - services/ 디렉토리 확인
   - utils/ 디렉토리 확인
   - img/ 디렉토리 확인

2. HTML 파일 검증 (9개)
   ```bash
   ls -1 *.html
   ```
   예상 파일:
   - index.html
   - analyze.html
   - searchTab.html
   - search_detail_tab.html
   - mypage.html
   - settings.html
   - subscribe.html
   - filter.html
   - nav.html

3. JavaScript 파일 검증
   ```bash
   find scripts services utils -name "*.js" | wc -l
   ```
   예상: 19개 JavaScript 파일

4. 새로 추가된 이미지 확인
   ```bash
   ls -la img/edit.svg
   ls -la img/pin.svg
   ```
   - 존재 확인

5. 주요 파일 문법 검증 (간단한 체크)
   ```bash
   # JavaScript 문법 오류 체크
   node --check scripts/app.js
   node --check scripts/mypage.js
   node --check services/apiService.js
   ```

6. HTML 파일 기본 검증
   ```bash
   # HTML 파일에 기본 태그 존재 확인
   grep -l "<!DOCTYPE html>" *.html | wc -l
   ```
   예상: 9개 파일

7. Import 경로 검증
   ```bash
   # apiService.js import 확인
   grep "import.*apiService" scripts/*.js
   ```
   - 상대 경로 정확성 확인

8. Firebase 설정 확인
   ```bash
   grep -A 10 "firebaseConfig" services/firebaseService.js
   ```
   - projectId: dysapp1210 확인
   - apiKey 존재 확인

[OUTPUT FORMAT]
## Phase 3 검증 결과

### 파일 구조
- HTML 파일: [N/9개]
- JavaScript 파일: [N/19개]
- 이미지 파일: [N개]

### 파일 무결성
- ✅ 모든 필수 파일 존재
- ⚠️ 누락된 파일: [...]

### 코드 검증
- JavaScript 문법 오류: [N개]
- Import 경로 오류: [N개]

### Firebase 설정
- Project ID: [dysapp1210]
- Functions Region: [asia-northeast3]
- Database: [dysapp]

### 발견된 이슈
1. [이슈 설명]
   - 파일: [...]
   - 해결: [...]

[ERROR HANDLING]
- 파일 누락: 경고 표시 후 계속
- 문법 오류: 파일 위치 기록
- Import 경로 오류: 수정 제안

[SUCCESS CRITERIA]
- 9개 HTML 파일 모두 존재
- 19개 JavaScript 파일 모두 존재
- edit.svg, pin.svg 존재
- 주요 파일 문법 오류 없음
```

---

## 📋 Phase 4: Mock Mode 통합 테스트

### 목표
Mock Mode에서 전체 애플리케이션 플로우 테스트

### 에이전트 실행 프롬프트

```
[TASK] dysapp Mock Mode 통합 테스트

[CONTEXT]
- Phase 3 완료됨
- 테스트 방식: 브라우저 자동화 (Playwright 또는 수동 검증)
- 백엔드 미배포 상태에서 프론트엔드만 테스트

[PREREQUISITE]
로컬 웹 서버 시작 필요:
```bash
# 방법 1: VS Code Live Server (권장)
# 방법 2: Python HTTP Server
cd C:\dys_prototype\packages\frontend
python -m http.server 5500
# 방법 3: Node.js http-server
npx http-server -p 5500
```

[ACTIONS]
1. Mock Mode 활성화 검증
   - 브라우저에서 http://localhost:5500/settings.html 접속
   - 콘솔에서 실행:
   ```javascript
   localStorage.setItem('dysapp:mockMode', 'true');
   location.reload();
   ```
   - localStorage 확인:
   ```javascript
   localStorage.getItem('dysapp:mockMode'); // 'true' 반환 확인
   ```

2. 업로드 페이지 테스트 (index.html)
   - http://localhost:5500/index.html 접속
   - 콘솔 에러 확인 (없어야 함)
   - "[App] Initialized" 로그 확인
   - Mock user 생성 확인:
   ```javascript
   window.dysapp.user; // {uid: 'mock-user-123', ...}
   ```

3. Mock 분석 테스트
   - 콘솔에서 테스트:
   ```javascript
   import { analyzeDesign } from './services/apiService.js';
   const result = await analyzeDesign({
     imageData: 'base64...',
     mimeType: 'image/jpeg',
     fileName: 'test.jpg'
   });
   console.log(result);
   ```
   - 예상 결과: `{success: true, _isMockData: true, analysisId: ...}`

4. Mock 채팅 테스트
   ```javascript
   import { chatWithMentor } from './services/apiService.js';
   const result = await chatWithMentor({
     analysisId: 'mock-analysis-123',
     message: '테스트 메시지'
   });
   console.log(result);
   ```
   - 예상: AI 응답 반환, `_isMockData: true`

5. Mock 검색 테스트
   ```javascript
   import { searchText } from './services/apiService.js';
   const result = await searchText({
     query: '로그인'
   });
   console.log(result);
   ```
   - 예상: 검색 결과 목록 반환

6. Mock 히스토리 테스트
   ```javascript
   import { getAnalyses } from './services/apiService.js';
   const result = await getAnalyses({ limit: 10 });
   console.log(result);
   ```
   - 예상: 5개 Mock 분석 데이터 반환

7. 모든 API Mock 데이터 확인
   - 15개 API 모두 Mock 데이터 반환 확인
   - `_isMockData: true` 플래그 확인
   - 에러 없이 실행 확인

8. UI 인터랙션 테스트 (수동)
   - 파일 업로드 UI 동작
   - 버튼 클릭 동작
   - 페이지 네비게이션
   - 모달 표시/숨김

[OUTPUT FORMAT]
## Phase 4 검증 결과

### Mock Mode 설정
- localStorage 설정: [✅/❌]
- Mock User 생성: [✅/❌]

### API 테스트 결과
| API 함수 | 상태 | _isMockData | 에러 |
|---------|------|-------------|------|
| analyzeDesign | ✅ | true | - |
| chatWithMentor | ✅ | true | - |
| searchSimilar | ✅ | true | - |
| searchText | ✅ | true | - |
| ... | ... | ... | ... |

### UI 테스트 결과
- 페이지 로드: [✅/❌]
- 네비게이션: [✅/❌]
- 모달/버튼: [✅/❌]
- 콘솔 에러: [N개]

### 발견된 이슈
1. [이슈 설명]
   - API: [...]
   - 에러: [...]
   - 해결: [...]

[ERROR HANDLING]
- API 호출 실패: 에러 메시지 기록
- Mock 데이터 없음: mockData.js 확인
- UI 에러: 콘솔 로그 캡처

[SUCCESS CRITERIA]
- 15개 API 모두 Mock 데이터 반환
- 모든 API에 _isMockData: true
- 콘솔 에러 없음
- UI 정상 동작
```

---

## 📋 Phase 5: 실제 백엔드 연동 테스트 (선택사항)

### 목표
실제 Firebase Functions와 통신하여 엔드투엔드 테스트

### 에이전트 실행 프롬프트

```
[TASK] dysapp 실제 백엔드 연동 테스트

[CONTEXT]
- Phase 4 완료됨
- ⚠️ 주의: 실제 API 호출로 비용 발생 가능
- Firebase Functions 배포 상태 확인 필요

[PREREQUISITE]
1. Firebase Functions 배포
   ```bash
   cd C:\dys_prototype\packages\backend
   firebase deploy --only functions --project dysapp1210
   ```
   - 15개 Functions 배포 완료 확인

2. Mock Mode 비활성화
   ```javascript
   localStorage.removeItem('dysapp:mockMode');
   location.reload();
   ```

[ACTIONS]
1. Health Check API 테스트
   ```bash
   curl -X POST \
     "https://asia-northeast3-dysapp1210.cloudfunctions.net/healthCheck" \
     -H "Content-Type: application/json" \
     -d "{}"
   ```
   예상 응답:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "version": "1.0.0",
     "region": "asia-northeast3"
   }
   ```

2. 익명 인증 테스트
   - 브라우저 콘솔:
   ```javascript
   import { ensureAuth } from './services/firebaseService.js';
   const user = await ensureAuth();
   console.log(user); // Firebase User 객체
   ```
   - Firebase Console > Authentication 확인
   - Anonymous 사용자 생성 확인

3. 실제 이미지 분석 테스트 (⚠️ 비용 발생)
   ```javascript
   import { analyzeDesign, readFileAsBase64 } from './services/apiService.js';
   
   // 테스트 이미지 파일 필요
   const file = document.querySelector('input[type="file"]').files[0];
   const { data, mimeType, fileName } = await readFileAsBase64(file);
   
   console.time('analyzeDesign');
   const result = await analyzeDesign({
     imageData: data,
     mimeType: mimeType,
     fileName: fileName
   });
   console.timeEnd('analyzeDesign');
   console.log(result);
   ```
   - 예상 시간: 30-60초
   - `_isMockData` 플래그 없어야 함
   - analysisId 반환 확인

4. Firestore 데이터 확인
   ```bash
   # Firebase Console에서 확인하거나
   # gcloud CLI 사용
   gcloud firestore documents list --database=dysapp \
     --collection=analyses --limit=1 --project=dysapp1210
   ```
   - 방금 생성된 분석 데이터 확인
   - imageUrl, overallScore 등 필드 확인

5. 실제 AI 채팅 테스트 (⚠️ 비용 발생)
   ```javascript
   import { chatWithMentor } from './services/apiService.js';
   
   const result = await chatWithMentor({
     analysisId: '[위에서 받은 analysisId]',
     message: '이 디자인의 색상 팔레트에 대해 설명해주세요'
   });
   console.log(result.response);
   ```
   - Gemini AI 실제 응답 확인
   - 5-10초 내 응답 확인

6. 검색 기능 테스트
   a) 벡터 유사 검색 (⚠️ 벡터 인덱스 필요)
   ```javascript
   import { searchSimilar } from './services/apiService.js';
   
   const result = await searchSimilar({
     analysisId: '[분석 ID]',
     limit: 5
   });
   console.log(result.data.results);
   ```
   - 에러 발생 시: FAILED_PRECONDITION → 벡터 인덱스 없음
   
   b) 텍스트 검색
   ```javascript
   import { searchText } from './services/apiService.js';
   
   const result = await searchText({
     query: '로그인',
     limit: 10
   });
   console.log(result.data.results);
   ```

7. 에러 로깅 확인
   ```bash
   firebase functions:log --only analyzeDesign,chatWithMentor \
     --limit 10 --project dysapp1210
   ```
   - 에러 로그 없는지 확인
   - 실행 시간 확인

[OUTPUT FORMAT]
## Phase 5 검증 결과

### API 실행 결과
| API | 상태 | 응답시간 | 비용 | 에러 |
|-----|------|---------|------|------|
| healthCheck | ✅ | 0.5s | $0 | - |
| analyzeDesign | ✅ | 45s | ~$0.05 | - |
| chatWithMentor | ✅ | 8s | ~$0.01 | - |
| searchSimilar | ⚠️ | - | - | 인덱스 없음 |
| searchText | ✅ | 2s | $0 | - |

### Firestore 데이터 검증
- 분석 데이터 저장: [✅/❌]
- 필드 완전성: [✅/❌]
- 임베딩 벡터 저장: [✅/❌]

### 인증 테스트
- 익명 인증: [✅/❌]
- User UID: [...]
- Firebase Console 확인: [✅/❌]

### 발견된 이슈
1. [이슈]
   - API: [...]
   - 에러 코드: [...]
   - 해결 방법: [...]

### 비용 추정
- 총 API 호출: [N회]
- 예상 비용: [$X.XX]

[ERROR HANDLING]
- API 타임아웃: 재시도 1회
- FAILED_PRECONDITION: 인덱스 생성 안내
- 인증 실패: ensureAuth() 재실행
- 비용 초과 우려: 즉시 중단

[SUCCESS CRITERIA]
- healthCheck 성공
- analyzeDesign 성공 (1회)
- chatWithMentor 성공 (1회)
- Firestore 데이터 저장 확인
- (선택) searchText 성공
```

---

## 📋 Phase 6: 에러 핸들링 검증

### 목표
다양한 에러 시나리오에서 올바른 에러 처리 확인

### 에이전트 실행 프롬프트

```
[TASK] dysapp 에러 핸들링 검증

[CONTEXT]
- Phase 5 완료됨
- 에러 처리 로직 테스트

[ACTIONS]
1. 네트워크 오류 시뮬레이션
   - 브라우저 DevTools > Network > Offline 체크
   - 콘솔에서 API 호출:
   ```javascript
   import { healthCheck } from './services/apiService.js';
   try {
     await healthCheck();
   } catch (error) {
     console.log('Caught:', error.message);
   }
   ```
   - 예상: "네트워크 연결을 확인해주세요" Toast 표시
   - 콘솔: NetworkError 감지 확인

2. 잘못된 파라미터 테스트
   ```javascript
   import { analyzeDesign } from './services/apiService.js';
   try {
     await analyzeDesign({
       imageData: null, // 잘못된 입력
       mimeType: null,
       fileName: null
     });
   } catch (error) {
     console.log('Caught:', error.message);
   }
   ```
   - 예상: "Missing required fields" 에러

3. 파일 크기 검증 테스트
   ```javascript
   import { validateImageFile } from './services/apiService.js';
   
   // 10MB 초과 파일 시뮬레이션
   const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
     type: 'image/jpeg'
   });
   
   const validation = validateImageFile(largeFile);
   console.log(validation);
   ```
   - 예상: `{valid: false, error: "File too large..."}`

4. 잘못된 파일 형식 테스트
   ```javascript
   const pdfFile = new File(['...'], 'doc.pdf', { type: 'application/pdf' });
   const validation = validateImageFile(pdfFile);
   console.log(validation);
   ```
   - 예상: `{valid: false, error: "Invalid file type..."}`

5. API 에러 코드 테스트
   - functions/unauthenticated 시뮬레이션
   - functions/not-found 시뮬레이션
   - functions/permission-denied 시뮬레이션
   
   각 에러에 대해 사용자 친화적 메시지 확인

6. Toast 알림 확인
   - 성공 Toast: toast.success() 호출
   - 에러 Toast: toast.error() 호출
   - 경고 Toast: toast.warning() 호출
   - UI에 제대로 표시되는지 확인

7. LocalStorage 에러 처리
   ```javascript
   // LocalStorage quota 초과 시뮬레이션
   try {
     for (let i = 0; i < 10000; i++) {
       localStorage.setItem(`test_${i}`, 'x'.repeat(1000000));
     }
   } catch (e) {
     console.log('Quota exceeded:', e);
   }
   ```

8. 에러 핸들러 코드 검증
   ```bash
   cd C:\dys_prototype\packages\frontend\services
   grep -A 5 "handleApiError" errorHandler.js
   grep -A 5 "parseError" errorHandler.js
   ```
   - 8가지 네트워크 에러 패턴 확인
   - 14가지 Firebase 에러 코드 매핑 확인

[OUTPUT FORMAT]
## Phase 6 검증 결과

### 에러 시나리오 테스트
| 시나리오 | 에러 감지 | Toast 표시 | 메시지 | 상태 |
|---------|----------|-----------|--------|------|
| 네트워크 오프라인 | ✅ | ✅ | "네트워크..." | ✅ |
| 파일 크기 초과 | ✅ | ✅ | "File too large" | ✅ |
| 잘못된 파일 형식 | ✅ | ✅ | "Invalid type" | ✅ |
| Missing params | ✅ | ✅ | "Missing..." | ✅ |

### 에러 핸들러 검증
- 네트워크 에러 패턴: [8/8개]
- Firebase 에러 매핑: [14/14개]
- Toast 시스템: [작동/미작동]

### 사용자 경험
- 에러 메시지 친화성: [우수/양호/개선필요]
- Toast 가독성: [우수/양호/개선필요]
- 복구 가능성: [가능/불가능]

### 발견된 이슈
1. [이슈]
   - 시나리오: [...]
   - 문제: [...]
   - 수정: [...]

[ERROR HANDLING]
- 에러가 잡히지 않음: 에러 핸들러 코드 검토
- Toast 미표시: DOM 확인
- 메시지 미친화적: errorHandler.js 수정

[SUCCESS CRITERIA]
- 모든 에러 시나리오 올바르게 처리
- 사용자 친화적 메시지 표시
- 앱 크래시 없음
- 에러 후 복구 가능
```

---

## 📋 Phase 7: 성능 벤치마크

### 목표
페이지 로드 시간, API 응답 시간 등 성능 메트릭 측정

### 에이전트 실행 프롬프트

```
[TASK] dysapp 성능 벤치마크

[CONTEXT]
- Phase 6 완료됨
- 성능 메트릭 측정 및 기준 비교

[ACTIONS]
1. Lighthouse 성능 측정
   ```bash
   # Chrome Lighthouse CLI 사용
   npx lighthouse http://localhost:5500/index.html \
     --output html --output-path ./lighthouse-report.html \
     --only-categories=performance
   ```
   - Performance Score 확인 (목표: >90)
   - FCP (First Contentful Paint) < 1.8초
   - LCP (Largest Contentful Paint) < 2.5초
   - TBT (Total Blocking Time) < 200ms

2. 페이지 로드 시간 측정
   - 브라우저 Performance 탭에서 측정
   - 또는 콘솔:
   ```javascript
   performance.timing.loadEventEnd - performance.timing.navigationStart
   ```
   - index.html, analyze.html, mypage.html 각각 측정

3. API 응답 시간 측정 (Mock Mode)
   ```javascript
   import { analyzeDesign, chatWithMentor, searchText } from './services/apiService.js';
   
   // Mock Mode 활성화
   localStorage.setItem('dysapp:mockMode', 'true');
   
   // 측정
   const apis = [
     { name: 'analyzeDesign', fn: analyzeDesign, params: {...} },
     { name: 'chatWithMentor', fn: chatWithMentor, params: {...} },
     { name: 'searchText', fn: searchText, params: {...} }
   ];
   
   for (const api of apis) {
     const start = performance.now();
     await api.fn(api.params);
     const end = performance.now();
     console.log(`${api.name}: ${end - start}ms`);
   }
   ```

4. 번들 크기 분석
   ```bash
   cd C:\dys_prototype\packages\frontend
   
   # JavaScript 파일 크기
   du -sh scripts/*.js services/*.js utils/*.js
   
   # 총 크기
   du -sh .
   ```

5. 네트워크 요청 분석
   - DevTools > Network 탭
   - 페이지 로드 시 요청 수 확인
   - 총 전송 데이터 크기 확인
   - 캐시 가능한 리소스 확인

6. 메모리 프로파일링
   - DevTools > Memory > Heap Snapshot
   - 페이지 로드 직후 메모리 사용량
   - 5분 사용 후 메모리 사용량
   - 메모리 누수 확인

7. Cloud Functions 성능 (실제 배포 시)
   ```bash
   # Functions 메트릭 확인
   gcloud functions describe analyzeDesign \
     --region=asia-northeast3 --project=dysapp1210 \
     --format="value(executionCount, executionTime)"
   ```

8. Firestore 쿼리 성능
   - 복합 인덱스 사용 여부
   - 쿼리 응답 시간
   - Read 수 최적화

[OUTPUT FORMAT]
## Phase 7 성능 벤치마크 결과

### Lighthouse 점수
| 메트릭 | 측정값 | 목표 | 상태 |
|-------|--------|------|------|
| Performance Score | 92 | >90 | ✅ |
| FCP | 1.2s | <1.8s | ✅ |
| LCP | 2.1s | <2.5s | ✅ |
| TBT | 150ms | <200ms | ✅ |
| CLS | 0.05 | <0.1 | ✅ |

### 페이지 로드 시간
| 페이지 | 로드 시간 | 목표 | 상태 |
|--------|----------|------|------|
| index.html | 1.8s | <3s | ✅ |
| analyze.html | 2.1s | <3s | ✅ |
| mypage.html | 2.3s | <3s | ✅ |

### API 응답 시간 (Mock Mode)
| API | 응답 시간 | 상태 |
|-----|----------|------|
| analyzeDesign | <10ms | ✅ |
| chatWithMentor | <5ms | ✅ |
| searchText | <3ms | ✅ |

### 번들 크기
- JavaScript 총 크기: [XXX KB]
- 최대 파일: [파일명] ([XXX KB])
- CSS 크기: [XXX KB]
- 이미지 총 크기: [XXX KB]

### 메모리 사용
- 초기 힙 크기: [XX MB]
- 5분 후 힙 크기: [XX MB]
- 증가량: [XX MB] ([X%])
- 메모리 누수: [있음/없음]

### 개선 권장사항
1. [항목]
   - 현재: [...]
   - 개선: [...]
   - 예상 효과: [...]

[ERROR HANDLING]
- Lighthouse 실행 실패: 수동 측정
- 메모리 프로파일링 실패: 생략

[SUCCESS CRITERIA]
- Performance Score > 80
- 모든 페이지 < 3초 로드
- 메모리 누수 없음
```

---

## 📋 Phase 8: 최종 검증 및 보고서 생성

### 목표
전체 테스트 결과 종합 및 배포 승인 여부 결정

### 에이전트 실행 프롬프트

```
[TASK] dysapp 최종 검증 및 종합 보고서 생성

[CONTEXT]
- Phase 1-7 모두 완료됨
- 발견된 모든 이슈 기록됨
- 수정 완료 항목 기록됨

[ACTIONS]
1. 전체 Phase 결과 집계
   - Phase 1-7 각각의 성공/실패 여부
   - 발견된 이슈 총 개수
   - 수정 완료 이슈 개수
   - 미해결 이슈 개수

2. Critical 이슈 확인
   - 배포 차단 수준 이슈 식별
   - 즉시 수정 필요 항목
   - 배포 후 수정 가능 항목

3. 성능 메트릭 요약
   - Lighthouse 점수
   - API 평균 응답 시간
   - 페이지 로드 시간

4. 보안 검증 요약
   - 환경 변수 설정 여부
   - Firestore Rules 확인
   - API 키 노출 여부

5. 배포 준비 상태 평가
   점수 시스템 (총 100점):
   - 환경 설정: 20점
   - 백엔드 빌드: 20점
   - 프론트엔드 파일: 15점
   - 기능 테스트: 25점
   - 성능: 10점
   - 보안: 10점

6. 배포 승인 결정
   - ✅ 승인 (90점 이상, Critical 이슈 없음)
   - ⚠️ 조건부 승인 (70-89점, 특정 이슈 수정 후)
   - ❌ 거부 (70점 미만 또는 Critical 이슈 존재)

7. 다음 단계 계획
   - 즉시 수정 항목 목록
   - 배포 후 모니터링 항목
   - 향후 개선 사항

8. 보고서 파일 생성
   파일명: TEST_VALIDATION_REPORT_{날짜}.md
   위치: C:\dys_prototype\

[OUTPUT FORMAT - 파일로 저장]
# dysapp 최종 검증 보고서

**날짜:** [YYYY-MM-DD]
**검증자:** AI Agent
**코드베이스:** C:\dys_prototype
**브랜치:** 0113frontend

---

## 🎯 실행 요약

**전체 테스트:** [N개]
**성공:** [N개]
**실패:** [N개]
**성공률:** [XX%]

**최종 평가:** [승인/조건부 승인/거부]
**배포 준비 점수:** [XX/100점]

---

## 📊 Phase별 결과

### Phase 1: 환경 설정 검증
- 상태: [✅ 성공 / ⚠️ 경고 / ❌ 실패]
- 발견 이슈: [N개]
- 수정 완료: [N개]
- 주요 발견사항: [...]

### Phase 2: 백엔드 빌드
- 상태: [✅ 성공 / ⚠️ 경고 / ❌ 실패]
- TypeScript 에러: [N개]
- ESLint 에러: [N개]
- 수정 완료: [N개]

... (Phase 3-7 동일 형식)

---

## 🔴 Critical 이슈

### 1. [이슈 제목]
- **심각도:** Critical
- **위치:** [파일명:라인]
- **설명:** [...]
- **영향:** [...]
- **해결 방법:** [...]
- **상태:** [수정완료/미해결]

---

## 🟡 High 우선순위 이슈

... (동일 형식)

---

## 📈 성능 메트릭

| 메트릭 | 측정값 | 목표 | 상태 |
|-------|--------|------|------|
| Lighthouse Score | [XX] | >90 | [✅/⚠️/❌] |
| 페이지 로드 시간 | [X.Xs] | <3s | [✅/⚠️/❌] |
| API 응답 시간 | [X.Xs] | <5s | [✅/⚠️/❌] |

---

## 🔐 보안 검증

- ✅ 환경 변수 설정됨
- ✅ Firestore Rules 적용됨
- ✅ API 키 보호됨
- ⚠️ [경고 사항]

---

## 📋 배포 체크리스트

### 필수 조치 (배포 전)
- [ ] Critical 이슈 모두 수정
- [ ] 환경 변수 설정 확인
- [ ] Anonymous Auth 활성화
- [ ] Functions 배포
- [ ] Hosting 배포

### 권장 조치
- [ ] Firestore 벡터 인덱스 생성
- [ ] 성능 최적화
- [ ] 에러 모니터링 설정

---

## 🎯 최종 권장사항

### ✅ 승인 조건
[승인인 경우 여기에 내용]

### ⚠️ 조건부 승인 조건
[조건부 승인인 경우 여기에 내용]
- 수정 필요 항목: [...]
- 예상 소요 시간: [...]

### ❌ 거부 사유
[거부인 경우 여기에 내용]

---

## 🔄 다음 단계

### 즉시 조치
1. [항목]
   - 담당: [...]
   - 기한: [...]

### 배포 후 모니터링
1. [항목]
   - 메트릭: [...]
   - 임계값: [...]

### 향후 개선
1. [항목]
   - 우선순위: [...]
   - 예상 효과: [...]

---

**보고서 작성:** [YYYY-MM-DD HH:MM]
**검증자:** AI Agent
**서명:** _____________

[ERROR HANDLING]
- 보고서 생성 실패: 콘솔 출력으로 대체
- 파일 저장 실패: 경로 확인 후 재시도

[SUCCESS CRITERIA]
- 보고서 파일 생성 완료
- 모든 Phase 결과 포함
- 배포 승인 여부 명확
- 다음 단계 구체적
```

---

## 🔄 반복 개선 프로세스

### 목표
이슈 발견 → 수정 → 재테스트 사이클을 자동화

### 에이전트 실행 프롬프트

```
[TASK] dysapp 이슈 수정 및 재검증 사이클

[CONTEXT]
- Phase 8 완료됨
- 미해결 이슈가 있는 경우 실행

[ITERATION PROCESS]
각 이슈에 대해 다음 프로세스 반복:

1. 이슈 선택
   - Critical > High > Medium > Low 순서
   - 하나씩 처리

2. 이슈 분석
   - 근본 원인 파악
   - 영향 범위 확인
   - 수정 방법 결정

3. 코드 수정
   ```bash
   # 파일 편집
   code [파일명]
   
   # 변경사항 확인
   git diff [파일명]
   ```

4. 로컬 테스트
   - 수정된 부분만 재테스트
   - 회귀 테스트 (다른 기능에 영향 없는지)

5. 빌드 검증
   ```bash
   # 백엔드 수정 시
   cd packages/backend/functions
   npm run build
   npm run lint
   
   # 프론트엔드 수정 시
   # (문법 체크만)
   node --check [파일명]
   ```

6. 재테스트
   - 해당 Phase 재실행
   - 이슈 해결 확인

7. 결과 기록
   - 수정 내용 문서화
   - Git 커밋 (필요시)
   ```bash
   git add [파일명]
   git commit -m "fix: [이슈 설명]"
   ```

8. 다음 이슈로 이동
   - 모든 Critical/High 이슈 해결까지 반복

[STOPPING CRITERIA]
다음 조건 중 하나 만족 시 종료:
- 모든 Critical 이슈 해결
- 배포 준비 점수 90점 이상
- 3회 반복 후에도 진전 없음 (사용자에게 보고)

[OUTPUT FORMAT]
## 반복 개선 결과

### Iteration 1
- 수정 이슈: [N개]
- 해결 이슈: [N개]
- 남은 이슈: [N개]
- 점수 변화: [XX점 → XX점]

### Iteration 2
...

### 최종 상태
- 총 수정 이슈: [N개]
- 최종 점수: [XX/100점]
- 배포 승인: [✅/⚠️/❌]

[ERROR HANDLING]
- 수정 실패: 이슈를 "미해결"로 표시하고 다음으로
- 무한 루프: 3회 반복 후 중단
- Git 충돌: 사용자 개입 요청
```

---

## 📊 최종 산출물

### 생성될 파일 목록

1. **TEST_VALIDATION_REPORT_{날짜}.md**
   - Phase 1-8 전체 결과
   - 이슈 목록 및 상태
   - 성능 메트릭
   - 배포 승인 여부

2. **lighthouse-report.html**
   - Lighthouse 성능 측정 결과

3. **ISSUES_TRACKING.md** (선택사항)
   - 발견된 이슈 추적
   - 수정 이력
   - 담당자 및 기한

4. **GIT_COMMITS**
   - 이슈 수정 커밋들
   - fix: [이슈 설명] 형식

---

## 🎯 성공 기준 (전체)

### 필수 조건 (모두 만족 필요)
- ✅ Phase 1-8 모두 완료
- ✅ Critical 이슈 0개
- ✅ 백엔드 빌드 성공 (0 errors)
- ✅ 프론트엔드 파일 무결성 100%
- ✅ Mock Mode 15개 API 모두 작동

### 권장 조건
- ⭐ High 이슈 0개
- ⭐ Lighthouse Score > 90
- ⭐ 모든 페이지 < 3초 로드
- ⭐ 배포 준비 점수 > 90점

### 배포 승인 기준
- **즉시 배포:** 필수 조건 + 점수 90점 이상
- **조건부 배포:** 필수 조건 + 점수 70-89점 + High 이슈 수정 계획
- **배포 보류:** 필수 조건 미충족 또는 점수 70점 미만

---

## 💡 에이전트 실행 팁

### 순차 실행 (권장)
```
Phase 1 → 문제 있으면 수정 → Phase 2 → ...
```

### 병렬 실행 (고급)
```
Phase 1, 2, 3 동시 시작 → 결과 대기 → Phase 4-8
```

### 선택적 실행
```
Phase 1-4 (필수) → Phase 8 (보고서)
Phase 5-7은 시간/비용 여유 시 추가
```

---

## 🚨 에러 발생 시 대응

### Level 1: 자동 복구 가능
- npm install 실패 → package-lock.json 삭제 후 재시도
- TypeScript 빌드 실패 → 에러 로그 분석 후 수정
- ESLint 에러 → `npm run lint:fix` 실행

### Level 2: 수동 개입 필요
- Git 충돌 → 사용자에게 보고
- 환경 변수 미설정 → 설정 방법 안내
- Firebase 권한 없음 → 로그인 확인 요청

### Level 3: 치명적 오류
- 프로젝트 구조 손상 → 즉시 중단
- Git repository 없음 → 즉시 중단
- 디스크 공간 부족 → 즉시 중단

---

**문서 버전:** 1.0  
**작성일:** 2026-01-17  
**대상 에이전트:** Claude Code / Cursor AI Agent  
**예상 실행 시간:** 1-3시간 (Phase 선택에 따라)
