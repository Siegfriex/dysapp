/**
 * dysapp Constants
 * Central configuration for all AI models, versions, and system settings
 * Reference: docs/dysapp_PRD.md - Section 1.4, 15.2
 */

// ============================================================================
// AI Model Configuration (from baseline_spec.md)
// ============================================================================

/** Vision model for design analysis */
export const VISION_MODEL = "gemini-3-pro-preview";

/** Chat model for AI mentor */
export const CHAT_MODEL = "gemini-3-pro-preview";

/** Embedding model for vector search */
export const EMBEDDING_MODEL = "multimodalembedding@001";

/** Embedding vector dimension */
export const EMBEDDING_DIM = 512;

// ============================================================================
// Version Management
// ============================================================================

/** Analysis prompt/metric version - increment when changing prompts */
export const ANALYSIS_VERSION = 1;

/** Embedding model version - increment when changing embedding model */
export const EMBEDDING_VERSION = 1;

// ============================================================================
// Generation Configs
// ============================================================================

/** Vision analysis config (low temperature = consistency) */
export const VISION_CONFIG = {
  temperature: 0.2,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

/** Chat config (higher temperature = natural conversation) */
export const CHAT_CONFIG = {
  temperature: 0.7,
  topP: 0.9,
  maxOutputTokens: 2048,
};

// ============================================================================
// Firebase Configuration
// ============================================================================

/** Firestore database ID */
export const FIRESTORE_DATABASE_ID = "dysapp";

/** Cloud Functions region */
export const FUNCTIONS_REGION = "asia-northeast3";

/** Storage bucket */
export const STORAGE_BUCKET = "dysapp1210.firebasestorage.app";

// ============================================================================
// BigQuery Configuration (Optional - for v2+)
// ============================================================================

/** BigQuery dataset name */
export const BQ_DATASET = "dysapp";

/** BigQuery tables */
export const BQ_TABLE_WORK = "design_work";
export const BQ_TABLE_METRICS = "design_metrics";

// ============================================================================
// Firestore Collections
// ============================================================================

export const COLLECTIONS = {
  ANALYSES: "analyses",
  CHAT_SESSIONS: "chatSessions",
  USERS: "users",
  BOOKMARKS: "bookmarks",
  COLLECTIONS: "collections",
  REFERENCE_DESIGNS: "referenceDesigns",
} as const;

// ============================================================================
// Format Prediction Values
// ============================================================================

export const FORMAT_PREDICTIONS = [
  "UX_UI",
  "Editorial",
  "Poster",
  "Thumbnail",
  "Card",
  "BI_CI",
  "Unknown",
] as const;

// ============================================================================
// Fix Scope Values
// ============================================================================

export const FIX_SCOPES = ["StructureRebuild", "DetailTuning"] as const;

// ============================================================================
// Trust/Engagement Values
// ============================================================================

export const TRUST_LEVELS = ["High", "Medium", "Low"] as const;
export const ENGAGEMENT_LEVELS = ["High", "Medium", "Low"] as const;
export const EMOTIONAL_TONES = ["Calm", "Energetic", "Serious", "Playful", "Minimal"] as const;

// ============================================================================
// Function Timeouts (in seconds)
// ============================================================================

export const TIMEOUTS = {
  ANALYZE_DESIGN: 300,
  CHAT_WITH_MENTOR: 120,
  SEARCH_SIMILAR: 60,
  GET_ANALYSES: 60,
  GET_USER_PROFILE: 60,
} as const;

// ============================================================================
// Memory Allocation (in MB)
// ============================================================================

export const MEMORY = {
  ANALYZE_DESIGN: "512MiB",
  CHAT_WITH_MENTOR: "256MiB",
  SEARCH_SIMILAR: "256MiB",
  DEFAULT: "256MiB",
} as const;

// ============================================================================
// Validation Limits
// ============================================================================

export const LIMITS = {
  MAX_IMAGE_SIZE_MB: 10,
  MAX_COLOR_PALETTE: 5,
  MAX_KEYWORDS: 20,
  MAX_NEXT_ACTIONS: 5,
  MAX_RAG_QUERIES: 5,
  MAX_SIMILAR_RESULTS: 20,
  DEFAULT_SIMILAR_LIMIT: 10,
  MAX_CHAT_HISTORY: 50,
} as const;

// ============================================================================
// Score Thresholds
// ============================================================================

export const THRESHOLDS = {
  /** Hierarchy score below this triggers StructureRebuild */
  HIERARCHY_CRITICAL: 50,
  /** Goal clarity score below this triggers StructureRebuild */
  GOAL_CLARITY_CRITICAL: 50,
  /** Scanability score below this triggers StructureRebuild */
  SCANABILITY_CRITICAL: 50,
  /** Hierarchy score ambiguous range lower bound */
  HIERARCHY_AMBIGUOUS_LOW: 50,
  /** Hierarchy score ambiguous range upper bound */
  HIERARCHY_AMBIGUOUS_HIGH: 60,
  /** Grid consistency threshold for DetailTuning */
  GRID_CONSISTENCY_LOW: 80,
  /** Minimum overall score for reference examples */
  MIN_REFERENCE_SCORE: 70,
} as const;
