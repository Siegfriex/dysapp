# 빌드 및 배포 가이드

## ⚠️ 문제 해결

### 파일 업로드 문제 해결됨
- **문제**: 파일을 두 번 선택해야 했음
- **해결**: 이벤트 중복 방지 및 input value 초기화 타이밍 개선
- **변경사항**: 
  - `uploadBox` 클릭 시 `uploadInput` 직접 클릭 방지
  - 파일 선택 후 100ms 지연 후 value 초기화
  - 검증 실패 시에도 input 초기화

## 빠른 시작

### 전체 배포 (Functions + Hosting)
```powershell
.\build-and-deploy.ps1
```

### Functions만 배포
```powershell
.\build-and-deploy.ps1 --FunctionsOnly
```

### Hosting만 배포
```powershell
.\build-and-deploy.ps1 --HostingOnly
```

## 수동 빌드 및 배포

### 1. Functions 빌드
```powershell
cd functions
npm install
npm run build
cd ..
```

### 2. 배포
```powershell
# 전체 배포
firebase deploy

# Functions만 배포
firebase deploy --only functions

# Hosting만 배포
firebase deploy --only hosting
```

## 문제 해결

### 빌드 실패 시
```powershell
# 1. Functions 디렉토리 정리
cd functions
Remove-Item -Recurse -Force lib -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# 2. 재설치 및 빌드
npm install
npm run build

# 3. 빌드 결과 확인
Test-Path lib/index.js  # True여야 함
```

### 배포 실패 시
```powershell
# 1. Firebase 로그인 확인
firebase login
firebase login:list

# 2. 프로젝트 확인
firebase use
firebase projects:list

# 3. Functions 로그 확인
firebase functions:log
```

### Firebase CLI 설치
```powershell
npm install -g firebase-tools
firebase login
```

### 프로젝트 확인
```powershell
firebase projects:list
firebase use <project-id>
```

### 파일 업로드 문제 해결됨 ✅
- **문제**: 파일을 두 번 선택해야 했음
- **원인**: 이벤트 중복 및 value 초기화 타이밍 문제
- **해결**: 
  - `uploadBox` 클릭 시 `uploadInput` 직접 클릭 방지
  - 파일 선택 후 100ms 지연 후 value 초기화
  - 검증 실패 시에도 input 초기화
  - 이벤트 버블링 방지
