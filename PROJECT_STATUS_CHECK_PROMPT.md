# 프로젝트 전체 상태 점검 프롬프트

**생성 일시**: 2025-01-27  
**프로젝트**: dysapp1210  
**용도**: 프로젝트 재개 전 전체 상태 점검

---

## 사용 방법

이 프롬프트를 AI 어시스턴트에게 제공하여 프로젝트의 현재 상태를 체계적으로 점검받을 수 있습니다.

---

## 📋 점검 항목

### 1. 프로젝트 기본 정보
- [ ] 프로젝트명 및 프로젝트 ID 확인
- [ ] 마지막 배포 버전 및 배포 일시 확인
- [ ] 현재 Git 브랜치 및 커밋 상태 확인
- [ ] package.json 버전 정보 확인 (functions/package.json)
- [ ] .firebaserc 파일 확인

### 2. Firebase 배포 상태
- [ ] Firebase Functions 배포 상태 확인
  - 배포된 함수 목록 (함수명, 상태, URL)
  - 각 함수의 상태 (ACTIVE/INACTIVE/ERROR)
  - 함수별 메모리 및 타임아웃 설정
- [ ] Firebase Hosting 배포 상태 확인
  - 배포 URL 확인
  - 배포 버전 확인
  - 배포된 파일 목록
- [ ] Firebase Storage 규칙 배포 상태 확인
- [ ] Firestore 규칙 및 인덱스 배포 상태 확인
- [ ] Firebase 프로젝트 설정 확인 (프로젝트 ID, 리전)

### 3. API 연결 상태
- [ ] 프론트엔드에서 호출하는 모든 API 엔드포인트 목록 작성
  - `services/apiService.js`에서 호출하는 API
  - `js/api/apiService.js`에서 호출하는 API
  - 각 HTML 페이지에서 직접 호출하는 API
- [ ] 각 API의 실제 연결 상태 확인
  - 함수 존재 여부 확인 (functions/src/index.ts)
  - 배포 여부 확인
  - 함수 URL 접근 가능 여부
- [ ] API 호출 코드와 실제 배포된 함수의 매칭 여부 확인
- [ ] 누락된 API 또는 미배포 함수 식별
- [ ] API 호출 실패 시 에러 처리 로직 확인

### 4. 프론트엔드-백엔드 연동 상태
- [ ] `services/apiService.js`와 `functions/src/index.ts`의 함수 매칭 확인
- [ ] `js/api/apiService.js`와 `functions/src/index.ts`의 함수 매칭 확인
- [ ] 각 HTML 페이지에서 실제로 호출하는 API 확인
  - `index.html` → `analyzeDesign` 호출 여부
  - `analyze.html` → `getAnalysis`, `chatWithMentor` 호출 여부
  - `searchTab.html` → `searchText`, `searchSimilar` 호출 여부
  - `mypage.html` → `getUserProfile`, `getAnalyses` 호출 여부
- [ ] API 호출 시 인증 토큰 전달 여부 확인
- [ ] API 응답 데이터 형식 일치 여부 확인

### 5. Firebase Functions 상세 점검
- [ ] `functions/src/index.ts`에서 export된 모든 함수 확인
- [ ] 각 함수의 배포 상태 확인
  - `analyzeDesign` - 이미지 분석
  - `chatWithMentor` - AI 멘토링 챗봇
  - `searchSimilar` - 유사 이미지 검색
  - `searchText` - 텍스트 검색
  - `customSearch` - 커스텀 검색
  - `saveItem` - 아이템 저장
  - `getAnalyses` - 분석 목록 조회
  - `getAnalysis` - 분석 상세 조회
  - `getUserProfile` - 사용자 프로필 조회
  - `updateUserProfile` - 사용자 프로필 업데이트
  - `deleteAnalysis` - 분석 삭제
  - `healthCheck` - 헬스 체크
- [ ] 함수별 메모리 설정 확인
- [ ] 함수별 타임아웃 설정 확인
- [ ] 함수별 환경 변수 설정 확인
- [ ] 함수별 의존성 패키지 확인
- [ ] 함수별 에러 처리 로직 확인

### 6. Firebase Storage 및 Firestore
- [ ] Storage 규칙 파일(`storage.rules`) 내용 확인
- [ ] Firestore 규칙 파일(`firestore.rules`) 내용 확인
- [ ] Firestore 인덱스 설정(`firestore.indexes.json`) 확인
- [ ] Storage 버킷 존재 여부 및 접근 권한 확인
- [ ] Firestore 컬렉션 구조 확인
- [ ] Storage 파일 업로드/다운로드 기능 확인

### 7. 환경 변수 및 설정
- [ ] `.env` 파일 존재 여부 및 주요 환경 변수 확인
- [ ] Firebase Functions 환경 변수 설정 확인
  - `GOOGLE_AI_API_KEY` 설정 여부
  - `GEMINI_API_KEY` 설정 여부
  - `GOOGLE_CLOUD_PROJECT` 자동 감지 여부
- [ ] GCP 서비스 계정 설정 확인
- [ ] API 키 보안 설정 확인 (환경 변수 노출 위험)

### 8. 빌드 및 배포 설정
- [ ] `firebase.json` 설정 확인
  - Hosting 설정
  - Functions 설정
  - Firestore 설정
  - Storage 설정
  - Emulators 설정
- [ ] `functions/package.json` 빌드 스크립트 확인
- [ ] 배포 스크립트 확인
  - `deploy-functions.ps1`
  - `build-and-deploy.ps1`
  - `deploy-steps.ps1`
- [ ] 빌드 오류 또는 경고 확인
- [ ] TypeScript 컴파일 오류 확인

### 9. 코드베이스 일관성 검증
- [ ] 중복된 API 서비스 파일 확인
  - `services/apiService.js` vs `js/api/apiService.js`
  - 사용되는 파일과 미사용 파일 식별
- [ ] 사용되지 않는 함수 또는 파일 식별
- [ ] import 경로 일관성 확인
- [ ] 코드 스타일 및 구조 일관성 확인
- [ ] Firebase 초기화 코드 일관성 확인
  - `services/firebaseService.js` vs `js/api/firebaseService.js`

### 10. 문서화 상태
- [ ] `README.md` 최신 상태 확인
- [ ] 배포 관련 문서 최신성 확인
  - `DEPLOYMENT_STATUS.md`
  - `FINAL_DEPLOYMENT_REPORT.md`
  - `DEPLOYMENT_SUMMARY.md`
- [ ] API 문서화 상태 확인
  - `API_MODEL_SPECIFICATION.md`
  - `docs/dysapp_APISPEC.md`
- [ ] 아키텍처 문서 일치 여부 확인
  - `SYSTEM_FLOWCHARTS.md`
  - `docs/dysapp_PRD.md`
  - `docs/dysapp_FRD.md`
  - `docs/dysapp_TSD.md`

### 11. 보안 점검
- [ ] Firebase 인증 설정 확인
  - 익명 인증 활성화 여부
  - 인증 토큰 검증 로직
- [ ] API 호출 시 인증 토큰 검증 로직 확인
- [ ] CORS 설정 확인
- [ ] 환경 변수 노출 위험 확인
- [ ] Firestore 보안 규칙 강도 확인
- [ ] Storage 보안 규칙 강도 확인

### 12. 성능 및 최적화
- [ ] 함수 Cold Start 최소화 설정 확인
- [ ] 불필요한 의존성 패키지 확인
- [ ] 코드 번들 크기 확인
- [ ] 캐싱 전략 확인
- [ ] API 호출 최적화 확인 (중복 호출 방지)

### 13. 테스트 및 검증
- [ ] 로컬 테스트 환경 설정 확인
- [ ] 에뮬레이터 설정 확인 (`firebase.json` emulators 섹션)
- [ ] 테스트 스크립트 존재 여부
- [ ] 실제 배포 환경에서의 동작 확인 방법 제시

---

## 📊 보고서 형식

각 항목별로 다음 형식으로 작성:

### 상태 표시
- ✅ **정상 상태**: 문제 없음, 정상 작동
- ⚠️ **주의 필요**: 작동하지만 개선 필요
- ❌ **문제 발견**: 즉시 수정 필요
- 📋 **확인 필요**: 추가 확인 또는 정보 필요

### 문제 발견 시 포함할 내용
1. **문제 설명**: 무엇이 문제인지 명확히 기술
2. **영향 범위**: 어떤 기능/파일에 영향을 미치는지
3. **해결 방안**: 구체적인 수정 방법 제시
4. **우선순위**: Critical / High / Medium / Low
5. **관련 파일**: 문제가 있는 파일 경로 및 라인 번호

---

## 📝 최종 보고서 구조

### 1. 실행 요약 (Executive Summary)
- 전체 상태 요약 (정상/주의/문제)
- 주요 발견 사항 (Top 5)
- 전체 일치율/완성도

### 2. 항목별 상세 검증 결과
각 항목(1-13)별로:
- 검증 방법
- 발견 사항
- 상태 표시
- 문제 상세 (있는 경우)

### 3. 위험요인 우선순위 분류
- **Critical**: 즉시 수정 필요 (배포 불가, 보안 취약점)
- **High**: 빠른 시일 내 수정 권장 (기능 장애 가능성)
- **Medium**: 개선 권장 (성능, 유지보수성)
- **Low**: 선택적 개선 (코드 품질, 문서화)

### 4. 보완 제안 및 권장 사항
- 즉시 수정 필요 항목
- 단기 개선 항목 (1주 이내)
- 중장기 개선 항목 (1개월 이내)

### 5. 다음 단계
- 개발 재개 전 필수 작업 목록
- 테스트 계획
- 배포 전 확인 사항

---

## 🔍 검증 방법론

### 파일 시스템 직접 검증
- `glob_file_search`로 파일 존재 여부 확인
- `list_dir`로 디렉토리 구조 확인
- `read_file`로 파일 내용 확인

### 코드베이스 검색
- `codebase_search`로 API 호출 패턴 확인
- `grep`으로 특정 함수/변수 사용처 확인

### 문서-코드 일치성 검증
- 문서의 명세와 실제 구현 비교
- 배포 문서와 실제 배포 상태 비교

### 실제 상태 우선 원칙
- 문서의 "완료" 표시도 실제 코드로 재검증
- 가정하지 말고 도구로 확인

---

## 📌 사용 예시

```
위의 "프로젝트 전체 상태 점검 프롬프트"를 사용하여 dysapp1210 프로젝트의 현재 상태를 체계적으로 점검하고 보고서를 작성해주세요.

특히 다음 사항에 중점을 두어주세요:
1. API 연결 상태 (프론트엔드-백엔드 연동)
2. Firebase Functions 배포 상태
3. 환경 변수 설정 상태
4. 코드베이스 일관성 (중복 파일, 사용되지 않는 코드)

보고서는 마크다운 형식으로 작성하고, 각 문제에 대해 구체적인 해결 방안을 제시해주세요.
```

---

## 📚 참고 문서

프로젝트 내 관련 문서:
- `DEPLOYMENT_STATUS.md` - 배포 상태 보고서
- `FINAL_DEPLOYMENT_REPORT.md` - 최종 배포 보고서
- `API_MODEL_SPECIFICATION.md` - API 모델 명세
- `SYSTEM_FLOWCHARTS.md` - 시스템 플로우차트
- `docs/dysapp_APISPEC.md` - API 명세서
- `docs/dysapp_PRD.md` - 제품 요구사항 문서

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-27  
**작성 목적**: 프로젝트 재개 전 전체 상태 점검
