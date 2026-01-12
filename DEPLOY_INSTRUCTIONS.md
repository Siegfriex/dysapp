# 배포 실행 가이드

## ⚠️ 중요: npm 명령어 실행 위치

**프로젝트 루트(`C:\dys_prototype`)에는 `package.json`이 없습니다!**

`package.json`은 `functions/` 디렉토리에만 있습니다.

## ✅ 올바른 배포 방법

### 방법 1: Firebase Deploy 사용 (권장) ⭐

Firebase CLI가 자동으로 빌드를 실행합니다:

```powershell
# 프로젝트 루트에서 실행
firebase deploy --only functions
```

`firebase.json`의 `predeploy` 설정이 자동으로 `functions` 디렉토리에서 빌드를 실행합니다.

### 방법 2: 수동 빌드 후 배포

```powershell
# 1. functions 디렉토리로 이동
cd functions

# 2. 빌드 실행
npm run build

# 3. 프로젝트 루트로 돌아가기
cd ..

# 4. 배포 실행
firebase deploy --only functions
```

### 방법 3: 빌드 스크립트 사용

```powershell
# 프로젝트 루트에서 실행
.\build-and-deploy.ps1 --FunctionsOnly
```

## ❌ 잘못된 실행 방법

다음과 같이 실행하면 안 됩니다:

```powershell
# 프로젝트 루트에서 npm 실행 (에러 발생!)
npm run build  # ❌ package.json이 없어서 실패
```

## 🔍 현재 상태 확인

### 빌드 파일 확인
```powershell
# 빌드 파일이 이미 존재하는지 확인
Test-Path functions\lib\index.js
```

### Firebase 설정 확인
```powershell
# Firebase 로그인 확인
firebase login:list

# 프로젝트 확인
firebase use
```

## 📝 배포 실행 순서

1. **Firebase 로그인 확인**
   ```powershell
   firebase login:list
   ```

2. **프로젝트 선택 확인**
   ```powershell
   firebase use
   ```

3. **배포 실행** (자동 빌드 포함)
   ```powershell
   firebase deploy --only functions
   ```

4. **배포 확인**
   ```powershell
   firebase functions:list
   ```

## 💡 참고사항

- `firebase deploy` 명령어는 `firebase.json`의 `predeploy` 설정을 자동으로 실행합니다
- `predeploy`는 `functions` 디렉토리에서 `npm run build`를 실행합니다
- 따라서 프로젝트 루트에서 직접 npm을 실행할 필요가 없습니다


