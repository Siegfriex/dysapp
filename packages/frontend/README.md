# Dysapp Frontend

Dysapp 프론트엔드 - AI 디자인 분석 플랫폼

## 빠른 시작

### 필수 요구사항

- VS Code
- VS Code Live Server 확장 프로그램

### 설치 및 실행

1. **VS Code Live Server 확장 프로그램 설치**
   - VS Code에서 Extensions 탭 열기 (Ctrl+Shift+X)
   - "Live Server" 검색
   - Ritwick Dey의 "Live Server" 설치

2. **프로젝트 열기**
   - VS Code에서 `packages/frontend` 폴더 열기
   - 또는 루트에서 `dysapp.code-workspace` 파일 열기

3. **Live Server 실행**
   - `index.html` 파일을 우클릭
   - "Open with Live Server" 선택
   - 또는 VS Code 하단 상태바의 "Go Live" 버튼 클릭

4. **브라우저에서 확인**
   - 기본 포트: `http://localhost:5500`
   - 자동 새로고침이 활성화되어 있습니다

## 목업 모드

백엔드 없이 개발할 수 있는 목업 모드가 제공됩니다.

### 활성화 방법

1. 설정 페이지(`settings.html`)로 이동
2. "개발자 모드" 섹션에서 "목업 모드 활성화" 체크박스 선택
3. 페이지 새로고침

### 목업 모드 기능

- 모든 API 호출이 가짜 데이터를 반환합니다
- Firebase 초기화가 스킵됩니다
- 가짜 사용자 객체가 자동으로 생성됩니다
- `_isMockData: true` 플래그가 모든 응답에 포함됩니다

### 비활성화 방법

1. 설정 페이지에서 "목업 모드 활성화" 체크박스 해제
2. 페이지 새로고침

## 파일 구조

```
packages/frontend/
├── index.html              # 메인 업로드 페이지
├── analyze.html            # 분석 결과 페이지
├── searchTab.html          # 검색 페이지
├── mypage.html             # 마이페이지
├── settings.html           # 설정 페이지
├── subscribe.html          # 구독 페이지
├── nav.html                # 네비게이션 컴포넌트
├── filter.html             # 필터 페이지
├── search_detail_tab.html  # 검색 상세 페이지
├── scripts/                # 페이지별 JavaScript
│   ├── app.js              # 앱 초기화
│   ├── upload.js           # 업로드 로직
│   ├── analyze.js          # 분석 결과 로직
│   ├── search.js           # 검색 로직
│   ├── mypage.js           # 마이페이지 로직
│   ├── settings.js         # 설정 로직
│   ├── subscribe.js        # 구독 로직
│   └── auth.js             # 인증 UI
├── services/               # 서비스 레이어
│   ├── apiService.js       # API 호출 래퍼
│   ├── firebaseService.js  # Firebase 초기화 및 인증
│   ├── errorHandler.js     # 에러 처리
│   ├── userStorageService.js # 사용자 스토리지
│   └── mockData.js         # 목업 데이터
├── utils/                  # 유틸리티 함수
│   ├── dataAdapter.js      # 데이터 변환
│   ├── domHelper.js        # DOM 조작
│   ├── eventManager.js     # 이벤트 관리
│   ├── performance.js      # 성능 최적화
│   └── stateManager.js     # 상태 관리
├── img/                    # 이미지 리소스
├── common.css              # 전역 스타일시트
└── includHTML.js           # HTML Include 유틸리티
```

## 개발 가이드

### HTML Include 시스템

`includHTML.js`를 사용하여 HTML 파일을 동적으로 포함할 수 있습니다.

```html
<nav data-include-path="nav.html"></nav>
```

### 모듈 시스템

ES6 모듈을 사용합니다. 모든 JavaScript 파일은 `type="module"`로 로드됩니다.

```javascript
import { analyzeDesign } from '../services/apiService.js';
```

### 상대 경로

모든 경로는 상대 경로를 사용합니다:
- HTML: `./scripts/app.js`, `./common.css`
- JS 모듈: `../services/apiService.js`

## 문제 해결

### Live Server가 작동하지 않음

1. VS Code Live Server 확장 프로그램이 설치되어 있는지 확인
2. 포트 5500이 사용 중인지 확인
3. `.vscode/settings.json`에서 포트 설정 확인

### 목업 모드가 작동하지 않음

1. 브라우저 콘솔에서 `localStorage.getItem('dysapp:mockMode')` 확인
2. 설정 페이지에서 목업 모드가 활성화되어 있는지 확인
3. 페이지를 완전히 새로고침 (Ctrl+Shift+R)

### 네비게이션이 로드되지 않음

1. `includHTML.js`가 로드되었는지 확인
2. 브라우저 콘솔에서 에러 확인
3. `nav.html` 파일 경로 확인

## 추가 리소스

- [QUICKSTART.md](./QUICKSTART.md) - 단계별 시작 가이드
- [루트 README.md](../../README.md) - 모노레포 전체 가이드
