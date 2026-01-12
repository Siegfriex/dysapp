# 배포 실행 명령어

## 1. 디버깅 및 리팩토링 완료 ✅

다음 버그가 수정되었습니다:
- rateLimiter 비동기 처리 오류 수정
- 타입 안정성 개선
- 인덱스 계산 최적화

## 2. 빌드 실행

### Windows PowerShell에서 실행:
```powershell
# functions 디렉토리로 이동
cd functions

# 의존성 설치 (필요시)
npm install

# TypeScript 컴파일
npm run build

# 빌드 결과 확인
ls lib/search
# searchText.js, saveItem.js 파일이 있어야 함
```

## 3. 배포 실행

### 전체 Functions 배포:
```powershell
# 프로젝트 루트에서
firebase deploy --only functions
```

### 특정 함수만 배포 (빠른 배포):
```powershell
firebase deploy --only functions:searchText,functions:saveItem
```

### 배포 상태 확인:
```powershell
firebase functions:list
```

## 4. 배포 후 검증

### 로그 확인:
```powershell
firebase functions:log --only searchText
firebase functions:log --only saveItem
```

### 함수 테스트:
브라우저 콘솔에서:
```javascript
// searchText 테스트
const testSearch = firebase.functions().httpsCallable('searchText');
testSearch({ query: '테스트', limit: 5 }).then(console.log);

// saveItem 테스트  
const testSave = firebase.functions().httpsCallable('saveItem');
testSave({ analysisId: 'your-analysis-id' }).then(console.log);
```

## 5. 문제 해결

### 빌드 오류 시:
```powershell
cd functions
rm -r lib  # 또는 Remove-Item -Recurse lib
rm -r node_modules  # 또는 Remove-Item -Recurse node_modules
npm install
npm run build
```

### 배포 오류 시:
```powershell
# Firebase 로그인 확인
firebase login

# 프로젝트 확인
firebase use

# 프로젝트 목록 확인
firebase projects:list
```


