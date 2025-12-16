// API 서비스 레이어
// 참조: dysapp_TSD.md Section 5, dysapp_APISPEC.md Section 1, dysapp_FRD.md Section 3.4
import { functions, auth } from './firebaseService.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-functions.js';

/**
 * 이미지 분석 API 호출
 * @param {string} imageData - base64 인코딩된 이미지 데이터
 * @param {string} mimeType - 이미지 MIME 타입 (image/jpeg, image/png)
 * @param {string} fileName - 파일명
 * @returns {Promise<Object>} 분석 결과
 * 참조: dysapp_APISPEC.md Section 1.1
 */
export async function callAnalyzeDesign(imageData, mimeType, fileName) {
  const analyzeDesign = httpsCallable(functions, 'analyzeDesign', { timeout: 300000 });
  try {
    const result = await analyzeDesign({ imageData, mimeType, fileName });
    return result.data;
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}

/**
 * AI 멘토 채팅 API 호출
 * @param {string} message - 사용자 메시지
 * @param {string|null} sessionId - 세션 ID (선택사항)
 * @param {string} analysisId - 분석 컨텍스트 (analysisId)
 * @returns {Promise<Object>} 채팅 응답
 * 참조: dysapp_APISPEC.md Section 1.2
 */
export async function callChatWithMentor(message, sessionId, analysisId) {
  const chatWithMentor = httpsCallable(functions, 'chatWithMentor');
  try {
    const result = await chatWithMentor({
      message,
      sessionId: sessionId || null,
      analysisId: analysisId || null
    });
    return result.data;
  } catch (error) {
    console.error('Chat failed:', error);
    throw error;
  }
}

/**
 * 유사 디자인 검색 API 호출
 * @param {string} analysisId - 분석 ID
 * @param {number} limit - 결과 개수 (기본값: 10)
 * @param {string|null} filterFormat - 포맷 필터 (선택사항)
 * @param {string|null} filterFixScope - fixScope 필터 (선택사항)
 * @returns {Promise<Object>} 유사 디자인 리스트
 * 참조: dysapp_APISPEC.md Section 1.3
 */
export async function callSearchSimilar(analysisId, limit = 10, filterFormat = null, filterFixScope = null) {
  const searchSimilar = httpsCallable(functions, 'searchSimilar');
  try {
    const result = await searchSimilar({
      analysisId,
      limit,
      filterFormat,
      filterFixScope
    });
    return result.data;
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}

/**
 * 분석 결과 조회 API 호출
 * @param {string} analysisId - 분석 ID
 * @returns {Promise<Object>} 분석 결과
 * 참조: dysapp_APISPEC.md Section 1.4
 */
export async function callGetAnalysis(analysisId) {
  const getAnalysis = httpsCallable(functions, 'getAnalysis');
  try {
    const result = await getAnalysis({ analysisId });
    return result.data;
  } catch (error) {
    console.error('Get analysis failed:', error);
    throw error;
  }
}

/**
 * 사용자 분석 목록 조회 API 호출
 * @param {number} limit - 결과 개수 (기본값: 20)
 * @param {number} offset - 오프셋 (기본값: 0)
 * @param {string|null} filterFormat - 포맷 필터 (선택사항)
 * @param {string|null} filterFixScope - fixScope 필터 (선택사항)
 * @returns {Promise<Object>} 분석 목록
 * 참조: dysapp_APISPEC.md Section 1.5
 */
export async function callGetAnalyses(limit = 20, offset = 0, filterFormat = null, filterFixScope = null) {
  const getAnalyses = httpsCallable(functions, 'getAnalyses');
  try {
    const result = await getAnalyses({ limit, offset, filterFormat, filterFixScope });
    return result.data;
  } catch (error) {
    console.error('Get analyses failed:', error);
    throw error;
  }
}

/**
 * 사용자 프로필 조회 API 호출
 * @returns {Promise<Object>} 사용자 프로필
 * 참조: dysapp_APISPEC.md Section 1.6
 */
export async function callGetUserProfile() {
  const getUserProfile = httpsCallable(functions, 'getUserProfile');
  try {
    const result = await getUserProfile({});
    return result.data;
  } catch (error) {
    console.error('Get user profile failed:', error);
    throw error;
  }
}

/**
 * 텍스트 기반 이미지 검색 API 호출
 * @param {string} query - 검색어
 * @param {number} limit - 결과 개수 (기본값: 10)
 * @returns {Promise<Object>} 검색 결과 리스트
 * 참조: dysapp_APISPEC.md Section 1.7
 */
export async function callSearchImages(query, limit = 10) {
  const searchImages = httpsCallable(functions, 'searchImages');
  try {
    const result = await searchImages({ query, limit });
    return result.data;
  } catch (error) {
    console.error('Search images failed:', error);
    throw error;
  }
}

