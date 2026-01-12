/**
 * customSearch Cloud Function
 * GCP Programmatic Search API (Custom Search) integration for image search
 * Reference: Plan - GCP Custom Search API 통합
 */

import * as functions from "firebase-functions/v2";
import { CallableRequest } from "firebase-functions/v2/https";
import {
  FUNCTIONS_REGION,
  TIMEOUTS,
  MEMORY,
  LIMITS,
} from "../constants";
import {
  CustomSearchRequest,
  CustomSearchResponse,
  CustomSearchItem,
} from "../types";
import { checkRateLimit } from "../utils/rateLimiter";
import { handleError } from "../utils/errorHandler";

// GCP Custom Search API Configuration
const SEARCH_API_BASE_URL = "https://www.googleapis.com/customsearch/v1";

/**
 * Get GCP Custom Search API credentials from environment variables
 * Firebase Functions v2에서 Secret은 자동으로 환경 변수로 매핑됩니다.
 */
function getSearchApiCredentials(): { apiKey: string; engineId: string } {
  // Firebase Functions v2에서 Secret Manager의 Secret은
  // 함수 정의에 secrets 옵션으로 명시하면 자동으로 환경 변수로 매핑됨
  // 값에 포함될 수 있는 줄바꿈 문자 제거를 위해 trim() 사용
  const apiKey = process.env.GCP_SEARCH_API_KEY?.trim();
  const engineId = process.env.GCP_SEARCH_ENGINE_ID?.trim();

  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "GCP_SEARCH_API_KEY is not configured. " +
      "Please ensure the secret is set in Firebase Console > Functions > Configuration > Secrets " +
      "and the function has 'secrets: [\"GCP_SEARCH_API_KEY\"]' in its configuration."
    );
  }

  if (!engineId) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "GCP_SEARCH_ENGINE_ID is not configured. " +
      "Please ensure the secret is set in Firebase Console > Functions > Configuration > Secrets " +
      "and the function has 'secrets: [\"GCP_SEARCH_ENGINE_ID\"]' in its configuration."
    );
  }

  return { apiKey, engineId };
}

/**
 * Call GCP Custom Search API
 */
async function callCustomSearchAPI(
  query: string,
  start: number = 1,
  num: number = 10
): Promise<any> {
  const { apiKey, engineId } = getSearchApiCredentials();
  
  const params = new URLSearchParams({
    key: apiKey,
    cx: engineId,
    q: query,
    searchType: "image",
    safe: "active",
    start: start.toString(),
    num: num.toString(),
  });

  const url = `${SEARCH_API_BASE_URL}?${params.toString()}`;
  
  console.log(`[customSearch] Calling API: ${url.replace(apiKey, "***")}`);

  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[customSearch] API error: ${response.status} - ${errorText}`);
    throw new Error(`Custom Search API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Adapt Google Custom Search API response to our format
 */
function adaptSearchResponse(apiResponse: any): CustomSearchResponse {
  const items: CustomSearchItem[] = [];
  
  if (apiResponse.items && Array.isArray(apiResponse.items)) {
    apiResponse.items.forEach((item: any, index: number) => {
      items.push({
        id: `custom_${index}_${Date.now()}`,
        imageUrl: item.link || item.image?.thumbnailLink || "",
        title: item.title || "",
        snippet: item.snippet || "",
        displayLink: item.displayLink || "",
        contextLink: item.image?.contextLink || item.link || "",
        thumbnailUrl: item.image?.thumbnailLink || item.link || "",
      });
    });
  }

  return {
    success: true,
    items,
    totalResults: parseInt(apiResponse.searchInformation?.totalResults || "0", 10),
    searchTime: parseFloat(apiResponse.searchInformation?.searchTime || "0"),
  };
}

/**
 * Custom Search handler
 */
async function customSearchHandler(
  request: CallableRequest<CustomSearchRequest>
): Promise<CustomSearchResponse> {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const data = request.data;

  // Validate query
  const query = data.query?.trim();
  if (!query || query.length < 2) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Query must be at least 2 characters"
    );
  }

  if (query.length > LIMITS.MAX_SEARCH_QUERY_LENGTH) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Query exceeds maximum length of ${LIMITS.MAX_SEARCH_QUERY_LENGTH} characters`
    );
  }

  // Check rate limit
  if (!checkRateLimit(userId, "CUSTOM_SEARCH")) {
    throw new functions.https.HttpsError(
      "resource-exhausted",
      "Rate limit exceeded. Please try again later."
    );
  }

  const start = Math.max(1, data.start || 1);
  const num = Math.min(Math.max(1, data.num || 10), 10); // Google API max is 10 per request

  try {
    console.log(`[customSearch] Searching for: "${query}" (start: ${start}, num: ${num}) by user ${userId}`);

    const apiResponse = await callCustomSearchAPI(query, start, num);
    const adaptedResponse = adaptSearchResponse(apiResponse);

    console.log(`[customSearch] Found ${adaptedResponse.items.length} results`);

    return adaptedResponse;
  } catch (error) {
    throw handleError(error, "customSearch", userId);
  }
}

/**
 * Export the Cloud Function
 */
export const customSearch = functions.https.onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: TIMEOUTS.SEARCH_SIMILAR || 60,
    memory: MEMORY.SEARCH_SIMILAR || "256MiB",
    secrets: ["GCP_SEARCH_API_KEY", "GCP_SEARCH_ENGINE_ID"],
  },
  customSearchHandler
);


