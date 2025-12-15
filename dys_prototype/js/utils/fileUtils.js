// 파일 유틸리티 함수
// 참조: dysapp_FRD.md Section 3.4.1

/**
 * 파일을 base64로 변환
 * @param {File} file - 파일 객체
 * @returns {Promise<string>} base64 문자열 (data:image/jpeg;base64, 제거)
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // data:image/jpeg;base64, 부분 제거
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 파일 검증
 * @param {File} file - 파일 객체
 * @returns {Object} { valid: boolean, error?: string }
 * 참조: dysapp_FRD.md Section 3.5.4
 */
export function validateFile(file) {
  // 파일 형식 검증
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '지원하는 파일 형식: JPEG, PNG'
    };
  }
  
  // 파일 크기 검증 (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '파일 크기는 5MB 이하여야 합니다.'
    };
  }
  
  return { valid: true };
}

/**
 * 파일명에서 확장자 추출
 * @param {string} fileName - 파일명
 * @returns {string} 확장자 (예: 'jpg', 'png')
 */
export function getFileExtension(fileName) {
  return fileName.split('.').pop().toLowerCase();
}

