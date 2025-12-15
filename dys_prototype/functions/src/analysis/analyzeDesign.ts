/**
 * analyzeDesign Cloud Function
 * Main entry point for design analysis
 * Reference: docs/dysapp_PRD.md - Section 8.1 (FR-001), 15.8.1
 */

import * as functions from "firebase-functions/v2";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  VISION_MODEL,
  VISION_CONFIG,
  FUNCTIONS_REGION,
  STORAGE_BUCKET,
  COLLECTIONS,
  TIMEOUTS,
  MEMORY,
  LIMITS,
} from "../constants";
import {
  AnalyzeDesignRequest,
  AnalyzeDesignResponse,
  DesignAnalysisResultLLM,
} from "../types";
import { VISION_SYSTEM_INSTRUCTION, DESIGN_ANALYSIS_SCHEMA } from "./visionSchema";
import { llmToFirestore, validateLLMResponse, sanitizeLLMResponse } from "./converter";
import { validateFixScope, generateDiagnosisDetails } from "./diagnose";
import { generateImageEmbedding } from "./embedding";

const db = getFirestore();
const storage = getStorage();

/**
 * Upload image to Cloud Storage
 */
async function uploadToStorage(
  imageData: string,
  mimeType: string,
  fileName: string,
  userId: string
): Promise<string> {
  const bucket = storage.bucket(STORAGE_BUCKET);
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `design-uploads/${userId}/${timestamp}_${sanitizedFileName}`;

  const buffer = Buffer.from(imageData, "base64");

  // Check file size
  if (buffer.length > LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Image size exceeds ${LIMITS.MAX_IMAGE_SIZE_MB}MB limit`
    );
  }

  const file = bucket.file(filePath);
  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      metadata: {
        uploadedBy: userId,
        originalName: fileName,
      },
    },
  });

  // Make file publicly accessible (or use signed URLs for private access)
  await file.makePublic();

  return `https://storage.googleapis.com/${STORAGE_BUCKET}/${filePath}`;
}

/**
 * Analyze image using Gemini Vision
 */
async function analyzeWithVision(
  imageData: string,
  mimeType: string
): Promise<DesignAnalysisResultLLM> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Gemini API key not configured"
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: VISION_MODEL,
    systemInstruction: VISION_SYSTEM_INSTRUCTION,
    generationConfig: {
      ...VISION_CONFIG,
      responseMimeType: "application/json",
      responseSchema: DESIGN_ANALYSIS_SCHEMA,
    },
  });

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: imageData,
        },
      },
      "Analyze this design image and return the evaluation results.",
    ]);

    const response = result.response;
    const text = response.text();

    // Parse JSON response
    let analysisResult: DesignAnalysisResultLLM;
    try {
      analysisResult = JSON.parse(text);
    } catch {
      console.error("Failed to parse LLM response:", text);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to parse analysis result"
      );
    }

    // Validate response structure
    if (!validateLLMResponse(analysisResult)) {
      throw new functions.https.HttpsError(
        "internal",
        "Invalid analysis result structure"
      );
    }

    // Sanitize and normalize
    return sanitizeLLMResponse(analysisResult);
  } catch (error) {
    console.error("Vision analysis error:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      `Vision analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Main analyzeDesign function handler
 */
export async function analyzeDesignHandler(
  data: AnalyzeDesignRequest,
  context: functions.https.CallableContext
): Promise<AnalyzeDesignResponse> {
  // 1. Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;

  // 2. Validate input
  const { imageData, mimeType, fileName } = data;

  if (!imageData || !mimeType || !fileName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: imageData, mimeType, fileName"
    );
  }

  // Validate mime type
  const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validMimeTypes.includes(mimeType)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid image type. Supported: ${validMimeTypes.join(", ")}`
    );
  }

  try {
    console.log(`[analyzeDesign] Starting analysis for user ${userId}, file: ${fileName}`);

    // 3. Upload to Storage
    const imageUrl = await uploadToStorage(imageData, mimeType, fileName, userId);
    console.log(`[analyzeDesign] Uploaded to: ${imageUrl}`);

    // 4. Run Vision analysis
    const llmResult = await analyzeWithVision(imageData, mimeType);
    console.log(`[analyzeDesign] Vision analysis complete. Format: ${llmResult.format_prediction}, Score: ${llmResult.overall_score}`);

    // 5. Validate and potentially override fixScope
    const fixScopeValidation = validateFixScope(
      llmResult.fix_scope,
      {
        hierarchyScore: llmResult.layer1_performance.hierarchy_score,
        scanabilityScore: llmResult.layer1_performance.scanability_score,
        goalClarityScore: llmResult.layer1_performance.goal_clarity_score,
        accessibility: {
          lowContrast: llmResult.layer1_performance.accessibility.low_contrast,
          tinyText: llmResult.layer1_performance.accessibility.tiny_text,
          cluttered: llmResult.layer1_performance.accessibility.cluttered,
        },
        diagnosisSummary: llmResult.layer1_performance.diagnosis_summary,
      },
      {
        gridConsistency: llmResult.layer2_form.grid_consistency,
        visualBalance: llmResult.layer2_form.visual_balance,
        colorHarmony: llmResult.layer2_form.color_harmony,
        typographyQuality: llmResult.layer2_form.typography_quality,
      }
    );

    // Apply validated fixScope
    const finalLLMResult: DesignAnalysisResultLLM = {
      ...llmResult,
      fix_scope: fixScopeValidation.fixScope,
    };

    if (fixScopeValidation.overridden) {
      console.log(`[analyzeDesign] FixScope overridden: ${fixScopeValidation.reason}`);
    }

    // 6. Generate image embedding (optional - may fail gracefully)
    let embedding: number[] | undefined;
    try {
      embedding = await generateImageEmbedding(imageData, mimeType);
      console.log(`[analyzeDesign] Embedding generated: ${embedding?.length || 0} dimensions`);
    } catch (embeddingError) {
      console.warn("[analyzeDesign] Embedding generation failed, continuing without embedding:", embeddingError);
    }

    // 7. Convert and save to Firestore
    const firestoreDoc = llmToFirestore(
      finalLLMResult,
      userId,
      fileName,
      imageUrl,
      embedding
    );

    const docRef = await db.collection(COLLECTIONS.ANALYSES).add(firestoreDoc);
    const analysisId = docRef.id;
    console.log(`[analyzeDesign] Saved to Firestore: ${analysisId}`);

    // 8. Update user analysis count
    await db.collection(COLLECTIONS.USERS).doc(userId).set(
      {
        analysisCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 9. Generate diagnosis details for logging
    const diagnosisDetails = generateDiagnosisDetails(
      {
        hierarchyScore: finalLLMResult.layer1_performance.hierarchy_score,
        scanabilityScore: finalLLMResult.layer1_performance.scanability_score,
        goalClarityScore: finalLLMResult.layer1_performance.goal_clarity_score,
        accessibility: {
          lowContrast: finalLLMResult.layer1_performance.accessibility.low_contrast,
          tinyText: finalLLMResult.layer1_performance.accessibility.tiny_text,
          cluttered: finalLLMResult.layer1_performance.accessibility.cluttered,
        },
        diagnosisSummary: finalLLMResult.layer1_performance.diagnosis_summary,
      },
      {
        gridConsistency: finalLLMResult.layer2_form.grid_consistency,
        visualBalance: finalLLMResult.layer2_form.visual_balance,
        colorHarmony: finalLLMResult.layer2_form.color_harmony,
        typographyQuality: finalLLMResult.layer2_form.typography_quality,
      },
      fixScopeValidation.fixScope
    );
    console.log(`[analyzeDesign] Diagnosis: L1Avg=${diagnosisDetails.l1Average}, L2Avg=${diagnosisDetails.l2Average}`);

    // 10. Return response
    return {
      success: true,
      analysisId,
      imageUrl,
      formatPrediction: finalLLMResult.format_prediction,
      overallScore: finalLLMResult.overall_score,
      fixScope: fixScopeValidation.fixScope,
      layer1Metrics: {
        hierarchyScore: finalLLMResult.layer1_performance.hierarchy_score,
        scanabilityScore: finalLLMResult.layer1_performance.scanability_score,
        goalClarityScore: finalLLMResult.layer1_performance.goal_clarity_score,
        accessibility: {
          lowContrast: finalLLMResult.layer1_performance.accessibility.low_contrast,
          tinyText: finalLLMResult.layer1_performance.accessibility.tiny_text,
          cluttered: finalLLMResult.layer1_performance.accessibility.cluttered,
        },
        diagnosisSummary: finalLLMResult.layer1_performance.diagnosis_summary,
      },
      layer2Metrics: {
        gridConsistency: finalLLMResult.layer2_form.grid_consistency,
        visualBalance: finalLLMResult.layer2_form.visual_balance,
        colorHarmony: finalLLMResult.layer2_form.color_harmony,
        typographyQuality: finalLLMResult.layer2_form.typography_quality,
      },
      layer3Metrics: {
        trustVibe: finalLLMResult.layer3_communicative.trust_vibe,
        engagementPotential: finalLLMResult.layer3_communicative.engagement_potential,
        emotionalTone: finalLLMResult.layer3_communicative.emotional_tone,
      },
      colorPalette: finalLLMResult.color_palette.map((c) => ({
        hex: c.hex,
        approxName: c.approx_name,
        usageRatio: c.usage_ratio,
      })),
      detectedKeywords: finalLLMResult.detected_keywords,
      nextActions: finalLLMResult.next_actions,
    };
  } catch (error) {
    console.error("[analyzeDesign] Error:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Export the Cloud Function
 */
export const analyzeDesign = functions.https.onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: TIMEOUTS.ANALYZE_DESIGN,
    memory: MEMORY.ANALYZE_DESIGN,
  },
  analyzeDesignHandler
);
