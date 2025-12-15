// 전역 에러 핸들러
// 참조: dysapp_FRD.md Section 8.3

/**
 * 전역 에러 처리 함수
 * @param {Error} error - 에러 객체
 * 참조: dysapp_FRD.md Section 8.3
 */
export function handleError(error) {
  console.error('Error:', error);
  
  // Firebase 에러 코드 매핑
  const errorMap = {
    'unauthenticated': {
      message: '로그인이 필요합니다. 잠시 후 다시 시도해주세요.',
      action: 'auto-retry',
      handler: handleAuthError
    },
    'not-found': {
      message: '요청한 정보를 찾을 수 없습니다.',
      action: 'redirect',
      redirectTo: 'index.html'
    },
    'permission-denied': {
      message: '권한이 없습니다.',
      action: 'redirect',
      redirectTo: 'index.html'
    },
    'resource-exhausted': {
      message: '서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
      action: 'retry',
      retryDelay: 60000
    },
    'internal': {
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      action: 'retry',
      handler: handleAnalysisError
    },
    'invalid-argument': {
      message: '입력 정보를 확인해주세요.',
      action: 'show-form'
    },
    'failed-precondition': {
      message: '분석을 먼저 수행해주세요.',
      action: 'redirect',
      redirectTo: 'index.html'
    }
  };
  
  // 네트워크 에러 확인
  if (!navigator.onLine || error.message?.includes('Failed to fetch')) {
    showErrorMessage('네트워크 연결을 확인해주세요.');
    return;
  }
  
  // Firebase 에러 코드 확인
  const errorInfo = errorMap[error.code] || {
    message: '알 수 없는 오류가 발생했습니다.',
    action: 'none'
  };
  
  // 에러 메시지 표시
  showErrorMessage(errorInfo.message);
  
  // 액션 실행
  switch (errorInfo.action) {
    case 'auto-retry':
      if (errorInfo.handler) {
        errorInfo.handler(error);
      }
      break;
    case 'redirect':
      setTimeout(() => {
        window.location.href = errorInfo.redirectTo;
      }, 2000);
      break;
    case 'retry':
      if (errorInfo.handler) {
        errorInfo.handler(error);
      }
      break;
    default:
      break;
  }
}

/**
 * 인증 에러 처리
 * @param {Error} error - 에러 객체
 */
async function handleAuthError(error) {
  // 익명 인증 재시도는 firebaseService.js에서 자동 처리됨
  console.log('인증 에러 처리 중...');
}

/**
 * 분석 에러 처리
 * @param {Error} error - 에러 객체
 */
async function handleAnalysisError(error) {
  // 재시도 옵션 제공 (사용자에게 확인)
  const shouldRetry = confirm('분석 중 오류가 발생했습니다. 다시 시도하시겠습니까?');
  if (shouldRetry) {
    // 마지막 업로드 파일로 재시도
    const lastFile = getLastUploadedFile();
    if (lastFile) {
      // 재시도 로직은 각 페이지에서 구현
      console.log('재시도:', lastFile);
    }
  }
}

/**
 * 에러 메시지 UI 표시
 * @param {string} message - 에러 메시지
 */
function showErrorMessage(message) {
  // 기존 에러 메시지 제거
  const existingError = document.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // 에러 메시지 UI 생성
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: 'SUITE', sans-serif;
    font-size: 14px;
    max-width: 300px;
  `;
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  
  // 3초 후 자동 제거
  setTimeout(() => {
    errorDiv.style.opacity = '0';
    errorDiv.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      errorDiv.remove();
    }, 300);
  }, 3000);
}

/**
 * 마지막 업로드 파일 가져오기 (localStorage에서)
 * @returns {File|null} 마지막 업로드 파일
 */
function getLastUploadedFile() {
  const lastFileData = localStorage.getItem('lastUploadedFile');
  if (!lastFileData) return null;
  
  try {
    const fileInfo = JSON.parse(lastFileData);
    // File 객체는 직접 저장할 수 없으므로, 파일 정보만 반환
    return fileInfo;
  } catch (error) {
    return null;
  }
}

