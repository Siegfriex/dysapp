/**
 * API Service
 * Cloud Functions API wrapper for dysapp
 * Reference: docs/dysapp_PRD.md - Section 8.1, 15.8
 */

import { callFunction, ensureAuth } from "./firebaseService.js";

// ============================================================================
// Constants
// ============================================================================

const FUNCTION_NAMES = {
  ANALYZE_DESIGN: "analyzeDesign",
  CHAT_WITH_MENTOR: "chatWithMentor",
  SEARCH_SIMILAR: "searchSimilar",
  SEARCH_TEXT: "searchText",
  SAVE_ITEM: "saveItem",
  GET_ANALYSES: "getAnalyses",
  GET_ANALYSIS: "getAnalysis",
  GET_USER_PROFILE: "getUserProfile",
  UPDATE_USER_PROFILE: "updateUserProfile",
  DELETE_ANALYSIS: "deleteAnalysis",
  HEALTH_CHECK: "healthCheck",
};

// ============================================================================
// Analysis APIs
// ============================================================================

/**
 * Analyze a design image
 * @param {Object} params
 * @param {string} params.imageData - Base64 encoded image data
 * @param {string} params.mimeType - Image MIME type (image/jpeg, image/png, etc.)
 * @param {string} params.fileName - Original file name
 * @param {string} [params.userPrompt] - Optional user prompt
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzeDesign({ imageData, mimeType, fileName, userPrompt }) {
  try {
    await ensureAuth();
  } catch (error) {
    // 인증 실패 시 더 명확한 에러 메시지
    if (error.message?.includes("익명 인증이 활성화되지 않았습니다")) {
      throw new Error("Firebase 설정 오류: 관리자에게 문의하세요");
    }
    throw new Error("인증에 실패했습니다. 페이지를 새로고침해주세요");
  }

  if (!imageData || !mimeType || !fileName) {
    throw new Error("Missing required fields: imageData, mimeType, fileName");
  }

  const result = await callFunction(FUNCTION_NAMES.ANALYZE_DESIGN, {
    imageData,
    mimeType,
    fileName,
    userPrompt,
  });

  // Store analysisId in localStorage for navigation
  if (result.success && result.analysisId) {
    localStorage.setItem("lastAnalysisId", result.analysisId);
  }

  return result;
}

/**
 * Get a single analysis by ID
 * @param {string} analysisId
 * @returns {Promise<Object>} Analysis document
 */
export async function getAnalysis(analysisId) {
  await ensureAuth();

  if (!analysisId) {
    throw new Error("Missing analysisId");
  }

  return callFunction(FUNCTION_NAMES.GET_ANALYSIS, { analysisId });
}

/**
 * Get user's analysis history
 * @param {Object} [params]
 * @param {number} [params.limit=20]
 * @param {number} [params.offset=0]
 * @param {string} [params.filterFormat]
 * @param {string} [params.filterFixScope]
 * @returns {Promise<Object>} List of analyses
 */
export async function getAnalyses(params = {}) {
  await ensureAuth();

  return callFunction(FUNCTION_NAMES.GET_ANALYSES, {
    limit: params.limit || 20,
    offset: params.offset || 0,
    filterFormat: params.filterFormat,
    filterFixScope: params.filterFixScope,
  });
}

/**
 * Delete an analysis
 * @param {string} analysisId
 * @returns {Promise<Object>}
 */
export async function deleteAnalysis(analysisId) {
  await ensureAuth();

  if (!analysisId) {
    throw new Error("Missing analysisId");
  }

  return callFunction(FUNCTION_NAMES.DELETE_ANALYSIS, { analysisId });
}

// ============================================================================
// Chat APIs
// ============================================================================

/**
 * Send message to AI mentor
 * @param {Object} params
 * @param {string} params.analysisId - Analysis ID for context
 * @param {string} params.message - User message
 * @param {string} [params.sessionId] - Existing session ID (optional)
 * @returns {Promise<Object>} Chat response
 */
export async function chatWithMentor({ analysisId, message, sessionId }) {
  await ensureAuth();

  if (!analysisId || !message) {
    throw new Error("Missing required fields: analysisId, message");
  }

  const result = await callFunction(FUNCTION_NAMES.CHAT_WITH_MENTOR, {
    analysisId,
    message,
    sessionId,
  });

  // Store sessionId for continuing conversation
  if (result.success && result.sessionId) {
    const sessionKey = `chatSession_${analysisId}`;
    localStorage.setItem(sessionKey, result.sessionId);
  }

  return result;
}

/**
 * Get stored session ID for an analysis
 * @param {string} analysisId
 * @returns {string|null}
 */
export function getStoredSessionId(analysisId) {
  const sessionKey = `chatSession_${analysisId}`;
  return localStorage.getItem(sessionKey);
}

// ============================================================================
// Search APIs
// ============================================================================

/**
 * Search for similar designs
 * @param {Object} params
 * @param {string} params.analysisId - Source analysis ID
 * @param {number} [params.limit=10]
 * @param {string} [params.filterFormat]
 * @param {string} [params.filterFixScope]
 * @param {number} [params.minScore]
 * @returns {Promise<Object>} Search results
 */
export async function searchSimilar(params) {
  await ensureAuth();

  const { analysisId } = params;

  if (!analysisId) {
    throw new Error("Missing analysisId");
  }

  return callFunction(FUNCTION_NAMES.SEARCH_SIMILAR, {
    analysisId,
    limit: params.limit || 10,
    filterFormat: params.filterFormat,
    filterFixScope: params.filterFixScope,
    minScore: params.minScore,
  });
}

/**
 * Search designs by OCR text content
 * @param {Object} params
 * @param {string} params.query - Text query to search for
 * @param {number} [params.limit=20]
 * @param {string} [params.filterFormat]
 * @param {string} [params.filterFixScope]
 * @param {number} [params.minScore]
 * @returns {Promise<Object>} Search results
 */
export async function searchText(params) {
  await ensureAuth();

  const { query } = params;

  if (!query || query.trim().length < 2) {
    throw new Error("Query must be at least 2 characters");
  }

  return callFunction(FUNCTION_NAMES.SEARCH_TEXT, {
    query: query.trim(),
    limit: params.limit || 20,
    filterFormat: params.filterFormat,
    filterFixScope: params.filterFixScope,
    minScore: params.minScore,
  });
}

/**
 * Save an analysis to user's bookmarks
 * @param {Object} params
 * @param {string} params.analysisId - Analysis ID to save
 * @returns {Promise<Object>} Save result
 */
export async function saveItem(params) {
  await ensureAuth();

  const { analysisId } = params;

  if (!analysisId) {
    throw new Error("Missing analysisId");
  }

  return callFunction(FUNCTION_NAMES.SAVE_ITEM, { analysisId });
}

// ============================================================================
// User Profile APIs
// ============================================================================

/**
 * Get user profile
 * @returns {Promise<Object>} User profile
 */
export async function getUserProfile() {
  await ensureAuth();
  return callFunction(FUNCTION_NAMES.GET_USER_PROFILE, {});
}

/**
 * Update user profile
 * @param {Object} params
 * @param {string} [params.displayName]
 * @param {Object} [params.preferences]
 * @returns {Promise<Object>}
 */
export async function updateUserProfile(params) {
  await ensureAuth();
  return callFunction(FUNCTION_NAMES.UPDATE_USER_PROFILE, params);
}

// ============================================================================
// Utility APIs
// ============================================================================

/**
 * Health check
 * @returns {Promise<Object>}
 */
export async function healthCheck() {
  return callFunction(FUNCTION_NAMES.HEALTH_CHECK, {});
}

// ============================================================================
// File Utilities
// ============================================================================

/**
 * Read file as base64
 * @param {File} file
 * @returns {Promise<{data: string, mimeType: string, fileName: string}>}
 */
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      // Remove data URL prefix to get pure base64
      const base64 = reader.result.split(",")[1];
      resolve({
        data: base64,
        mimeType: file.type,
        fileName: file.name,
      });
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file
 * @param {File} file
 * @returns {{valid: boolean, error?: string}}
 */
export function validateImageFile(file) {
  const MAX_SIZE_MB = 10;
  const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (!VALID_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Supported: ${VALID_TYPES.join(", ")}`,
    };
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_SIZE_MB}MB`,
    };
  }

  return { valid: true };
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Parse Firebase function error
 * @param {Error} error
 * @returns {{code: string, message: string}}
 */
export function parseError(error) {
  if (error.code) {
    // Firebase error
    const codeMap = {
      "functions/unauthenticated": "Please sign in to continue",
      "functions/invalid-argument": "Invalid input provided",
      "functions/not-found": "Resource not found",
      "functions/permission-denied": "You don't have permission",
      "functions/resource-exhausted": "Too many requests. Please try again later",
      "functions/internal": "Server error. Please try again",
      "functions/failed-precondition": "Operation cannot be performed",
    };

    return {
      code: error.code,
      message: codeMap[error.code] || error.message,
    };
  }

  return {
    code: "unknown",
    message: error.message || "An unexpected error occurred",
  };
}

// ============================================================================
// LocalStorage Helpers
// ============================================================================

/**
 * Get last analysis ID from localStorage
 * @returns {string|null}
 */
export function getLastAnalysisId() {
  return localStorage.getItem("lastAnalysisId");
}

/**
 * Clear analysis data from localStorage
 */
export function clearAnalysisData() {
  localStorage.removeItem("lastAnalysisId");
  // Clear all chat sessions
  Object.keys(localStorage)
    .filter((key) => key.startsWith("chatSession_"))
    .forEach((key) => localStorage.removeItem(key));
}
