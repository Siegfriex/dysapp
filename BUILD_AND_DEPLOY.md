# 빌드 및 배포 가이드

## 디버깅 및 리팩토링 완료 사항

### 수정된 버그
1. **rateLimiter 비동기 처리 오류 수정**
   - `searchText.ts`, `saveItem.ts`에서 `await checkRateLimit()` 사용 → `if (!checkRateLimit())` 수정
   - `RATE_LIMITS`에 `SEARCH_TEXT`, `SAVE_ITEM` 추가

2. **타입 안정성 개선**
   - `searchText.ts`에서 중복 인터페이스 정의 제거
   - 변수명 개선 (`data` → `docData`)

3. **인덱스 계산 최적화**
   - `createResultImage()` 함수에서 `searchResults.indexOf()` 제거
   - 인덱스를 직접 전달하도록 수정

### 리팩토링 사항
- 에러 처리 일관성 개선
- 코드 가독성 향상
- 불필요한 코드 제거

## 빌드 방법

### 1. Functions 빌드
```bash
cd functions
npm install  # 의존성이 없다면
npm run build
```

빌드 후 `functions/lib/` 폴더에 컴파일된 파일이 생성됩니다.

### 2. 빌드 검증
다음 파일들이 생성되었는지 확인:
- `functions/lib/search/searchText.js`
- `functions/lib/search/saveItem.js`
- `functions/lib/index.js`에 `searchText`, `saveItem` export 확인

## 배포 방법

### Firebase Functions 배포
```bash
# 전체 Functions 배포
firebase deploy --only functions

# 특정 함수만 배포
firebase deploy --only functions:searchText
firebase deploy --only functions:saveItem
```

### 배포 전 확인사항
1. ✅ TypeScript 컴파일 오류 없음
2. ✅ 모든 새 함수가 `functions/src/index.ts`에 export됨
3. ✅ 환경 변수 설정 확인 (GEMINI_API_KEY 등)
4. ✅ Firestore Rules 업데이트 (필요시)

## 배포 후 검증

### 1. Functions 로그 확인
```bash
firebase functions:log
```

### 2. 함수 테스트
- `searchText`: 텍스트 검색 기능 테스트
- `saveItem`: 저장 기능 테스트

### 3. 프론트엔드 연동 확인
- 서칭 페이지에서 텍스트 검색 동작 확인
- 모달에서 저장/공유/다운로드 버튼 동작 확인

## 문제 해결

### 빌드 오류 발생 시
1. `functions/node_modules` 삭제 후 `npm install` 재실행
2. `functions/lib` 폴더 삭제 후 재빌드
3. TypeScript 버전 확인: `npm list typescript`

### 배포 오류 발생 시
1. Firebase CLI 로그인 확인: `firebase login`
2. 프로젝트 설정 확인: `firebase use`
3. Functions 메모리/타임아웃 설정 확인

