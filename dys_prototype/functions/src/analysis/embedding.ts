/**
 * Image Embedding Generation
 * Using Vertex AI multimodalembedding@001
 * Reference: docs/dysapp_PRD.md - Section 15.9
 */

import { VertexAI } from "@google-cloud/vertexai";
import { EMBEDDING_MODEL, EMBEDDING_DIM } from "../constants";

// Initialize Vertex AI client
let vertexAI: VertexAI | null = null;

function getVertexAI(): VertexAI {
  if (!vertexAI) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
    if (!project) {
      throw new Error("GOOGLE_CLOUD_PROJECT environment variable not set");
    }

    vertexAI = new VertexAI({
      project,
      location: "us-central1", // multimodalembedding is only available in us-central1
    });
  }
  return vertexAI;
}

/**
 * Generate image embedding using Vertex AI multimodalembedding
 * Returns 512-dimensional vector
 */
export async function generateImageEmbedding(
  imageData: string,
  mimeType: string
): Promise<number[]> {
  try {
    const client = getVertexAI();

    // Get the embedding model
    const model = client.preview.getGenerativeModel({
      model: EMBEDDING_MODEL,
    });

    // Generate embedding
    const result = await model.embedContent({
      content: {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: imageData,
            },
          },
        ],
      },
    });

    // Extract embedding values
    if (!result.embedding?.values) {
      throw new Error("No embedding values returned");
    }

    const embedding = result.embedding.values;

    // Validate dimension
    if (embedding.length !== EMBEDDING_DIM) {
      console.warn(
        `[Embedding] Unexpected dimension: ${embedding.length}, expected: ${EMBEDDING_DIM}`
      );
    }

    return embedding;
  } catch (error) {
    console.error("[Embedding] Generation failed:", error);
    throw error;
  }
}

/**
 * Generate embedding from image URL (fetch and encode)
 */
export async function generateEmbeddingFromUrl(
  imageUrl: string
): Promise<number[]> {
  try {
    // Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // Determine mime type from content-type header
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return generateImageEmbedding(base64Data, contentType);
  } catch (error) {
    console.error("[Embedding] URL fetch failed:", error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Calculate cosine distance (1 - similarity)
 * Lower distance = more similar
 */
export function cosineDistance(a: number[], b: number[]): number {
  return 1 - cosineSimilarity(a, b);
}

/**
 * Normalize vector to unit length
 */
export function normalizeVector(vector: number[]): number[] {
  let norm = 0;
  for (const val of vector) {
    norm += val * val;
  }
  norm = Math.sqrt(norm);

  if (norm === 0) {
    return vector;
  }

  return vector.map((val) => val / norm);
}
