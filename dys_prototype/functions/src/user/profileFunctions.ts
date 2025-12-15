/**
 * User Profile & Analysis Functions
 * getAnalyses, getUserProfile, updateUserProfile
 * Reference: docs/dysapp_PRD.md - Section 8.1 (FR-004, FR-005)
 */

import * as functions from "firebase-functions/v2";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  FUNCTIONS_REGION,
  COLLECTIONS,
  TIMEOUTS,
  MEMORY,
} from "../constants";
import {
  GetAnalysesRequest,
  GetAnalysesResponse,
  GetUserProfileResponse,
  AnalysisDocument,
  UserDocument,
  AnalysisSummary,
} from "../types";

const db = getFirestore();

// ============================================================================
// getAnalyses - User's analysis history
// ============================================================================

export async function getAnalysesHandler(
  data: GetAnalysesRequest,
  context: functions.https.CallableContext
): Promise<GetAnalysesResponse> {
  // 1. Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;

  // 2. Parse pagination params
  const limit = Math.min(data.limit || 20, 100);
  const offset = data.offset || 0;

  try {
    console.log(`[getAnalyses] User ${userId}, Limit ${limit}, Offset ${offset}`);

    // 3. Build query
    let query = db
      .collection(COLLECTIONS.ANALYSES)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc");

    // Apply filters
    if (data.filterFormat) {
      query = query.where("formatPrediction", "==", data.filterFormat);
    }

    if (data.filterFixScope) {
      query = query.where("fixScope", "==", data.filterFixScope);
    }

    // Get total count first (for hasMore calculation)
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Apply pagination
    query = query.offset(offset).limit(limit + 1); // +1 to check hasMore

    // 4. Execute query
    const snapshot = await query.get();

    // 5. Process results
    const analyses: AnalysisSummary[] = [];
    let hasMore = false;

    snapshot.docs.forEach((doc, index) => {
      if (index >= limit) {
        hasMore = true;
        return;
      }

      const data = doc.data() as AnalysisDocument;
      analyses.push({
        id: doc.id,
        fileName: data.fileName,
        imageUrl: data.imageUrl,
        formatPrediction: data.formatPrediction,
        overallScore: data.overallScore,
        fixScope: data.fixScope,
        createdAt: data.createdAt as Timestamp,
      });
    });

    console.log(`[getAnalyses] Returning ${analyses.length} analyses, hasMore: ${hasMore}`);

    return {
      success: true,
      analyses,
      total,
      hasMore,
    };
  } catch (error) {
    console.error("[getAnalyses] Error:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      `Failed to get analyses: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export const getAnalyses = functions.https.onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: TIMEOUTS.GET_ANALYSES,
    memory: MEMORY.DEFAULT,
  },
  getAnalysesHandler
);

// ============================================================================
// getUserProfile - Get user profile data
// ============================================================================

export async function getUserProfileHandler(
  data: Record<string, unknown>,
  context: functions.https.CallableContext
): Promise<GetUserProfileResponse> {
  // 1. Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;

  try {
    console.log(`[getUserProfile] User ${userId}`);

    // 2. Get user document
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();

    if (!userDoc.exists) {
      // Create default profile if it doesn't exist
      const defaultProfile: UserDocument = {
        uid: userId,
        email: context.auth.token.email,
        displayName: context.auth.token.name || null,
        photoURL: context.auth.token.picture || null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        subscriptionTier: "free",
        analysisCount: 0,
      };

      await db.collection(COLLECTIONS.USERS).doc(userId).set(defaultProfile);

      return {
        success: true,
        profile: {
          ...defaultProfile,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      };
    }

    const profile = userDoc.data() as UserDocument;

    return {
      success: true,
      profile,
    };
  } catch (error) {
    console.error("[getUserProfile] Error:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      `Failed to get profile: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export const getUserProfile = functions.https.onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: TIMEOUTS.GET_USER_PROFILE,
    memory: MEMORY.DEFAULT,
  },
  getUserProfileHandler
);

// ============================================================================
// updateUserProfile - Update user profile data
// ============================================================================

interface UpdateUserProfileRequest {
  displayName?: string;
  preferences?: {
    preferredFormats?: string[];
    preferredColors?: string[];
    language?: string;
  };
}

export async function updateUserProfileHandler(
  data: UpdateUserProfileRequest,
  context: functions.https.CallableContext
): Promise<{ success: boolean }> {
  // 1. Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;

  try {
    console.log(`[updateUserProfile] User ${userId}`);

    // 2. Build update object
    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (data.displayName !== undefined) {
      updates.displayName = data.displayName;
    }

    if (data.preferences !== undefined) {
      updates.preferences = data.preferences;
    }

    // 3. Update user document
    await db.collection(COLLECTIONS.USERS).doc(userId).update(updates);

    console.log(`[updateUserProfile] Profile updated for user ${userId}`);

    return { success: true };
  } catch (error) {
    console.error("[updateUserProfile] Error:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      `Failed to update profile: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export const updateUserProfile = functions.https.onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: TIMEOUTS.GET_USER_PROFILE,
    memory: MEMORY.DEFAULT,
  },
  updateUserProfileHandler
);

// ============================================================================
// getAnalysis - Get single analysis by ID
// ============================================================================

interface GetAnalysisRequest {
  analysisId: string;
}

interface GetAnalysisResponse {
  success: boolean;
  analysis: AnalysisDocument | null;
}

export async function getAnalysisHandler(
  data: GetAnalysisRequest,
  context: functions.https.CallableContext
): Promise<GetAnalysisResponse> {
  // 1. Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  const { analysisId } = data;

  if (!analysisId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing analysisId"
    );
  }

  try {
    console.log(`[getAnalysis] User ${userId}, Analysis ${analysisId}`);

    // 2. Get analysis document
    const analysisDoc = await db
      .collection(COLLECTIONS.ANALYSES)
      .doc(analysisId)
      .get();

    if (!analysisDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Analysis not found");
    }

    const analysis = analysisDoc.data() as AnalysisDocument;

    // 3. Verify ownership
    if (analysis.userId !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Not your analysis"
      );
    }

    return {
      success: true,
      analysis,
    };
  } catch (error) {
    console.error("[getAnalysis] Error:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      `Failed to get analysis: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export const getAnalysis = functions.https.onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: TIMEOUTS.GET_ANALYSES,
    memory: MEMORY.DEFAULT,
  },
  getAnalysisHandler
);

// ============================================================================
// deleteAnalysis - Delete an analysis
// ============================================================================

interface DeleteAnalysisRequest {
  analysisId: string;
}

export async function deleteAnalysisHandler(
  data: DeleteAnalysisRequest,
  context: functions.https.CallableContext
): Promise<{ success: boolean }> {
  // 1. Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  const { analysisId } = data;

  if (!analysisId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing analysisId"
    );
  }

  try {
    console.log(`[deleteAnalysis] User ${userId}, Analysis ${analysisId}`);

    // 2. Get analysis document to verify ownership
    const analysisDoc = await db
      .collection(COLLECTIONS.ANALYSES)
      .doc(analysisId)
      .get();

    if (!analysisDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Analysis not found");
    }

    const analysis = analysisDoc.data() as AnalysisDocument;

    // 3. Verify ownership
    if (analysis.userId !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Not your analysis"
      );
    }

    // 4. Delete analysis
    await db.collection(COLLECTIONS.ANALYSES).doc(analysisId).delete();

    // 5. Update user analysis count
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
      analysisCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[deleteAnalysis] Analysis ${analysisId} deleted`);

    return { success: true };
  } catch (error) {
    console.error("[deleteAnalysis] Error:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      `Failed to delete analysis: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export const deleteAnalysis = functions.https.onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: TIMEOUTS.GET_ANALYSES,
    memory: MEMORY.DEFAULT,
  },
  deleteAnalysisHandler
);
