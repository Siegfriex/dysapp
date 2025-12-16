/**
 * dysapp Cloud Functions - Main Entry Point
 * Firebase Cloud Functions v2 for AI Design Analysis Platform
 *
 * Reference: docs/dysapp_PRD.md
 * Project ID: dysapp1210
 * Region: asia-northeast3
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
initializeApp();

// Configure Firestore settings
const db = getFirestore();
db.settings({
  ignoreUndefinedProperties: true,
});

// ============================================================================
// Export Cloud Functions
// ============================================================================

// Analysis Functions
export { analyzeDesign } from "./analysis/analyzeDesign";

// Chat Functions
export { chatWithMentor } from "./chat/chatWithMentor";

// Search Functions
export { searchSimilar } from "./search/searchSimilar";
export { searchText } from "./search/searchText";
export { saveItem } from "./search/saveItem";

// User/Profile Functions
export {
  getAnalyses,
  getUserProfile,
  updateUserProfile,
  getAnalysis,
  deleteAnalysis,
} from "./user/profileFunctions";

// ============================================================================
// Health Check Function
// ============================================================================

import * as functions from "firebase-functions/v2";
import { FUNCTIONS_REGION } from "./constants";

export const healthCheck = functions.https.onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 10,
    memory: "128MiB",
  },
  async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      region: FUNCTIONS_REGION,
    };
  }
);
