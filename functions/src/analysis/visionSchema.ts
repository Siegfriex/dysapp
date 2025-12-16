/**
 * Gemini Vision Schema & System Instruction
 * Reference: docs/dysapp_PRD.md - Section 15.10
 */

import { SchemaType } from "@google/generative-ai";

/**
 * JSON Schema for Gemini Vision structured output
 * Enforces snake_case for LLM output
 */
export const DESIGN_ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    format_prediction: {
      type: SchemaType.STRING,
      enum: ["UX_UI", "Editorial", "Poster", "Thumbnail", "Card", "BI_CI", "Unknown"],
      description: "Predicted design format category",
    },
    layer1_performance: {
      type: SchemaType.OBJECT,
      properties: {
        hierarchy_score: {
          type: SchemaType.INTEGER,
          description: "Visual hierarchy clarity score (0-100)",
        },
        scanability_score: {
          type: SchemaType.INTEGER,
          description: "Information grouping and scan speed score (0-100)",
        },
        goal_clarity_score: {
          type: SchemaType.INTEGER,
          description: "Topic/action recognition clarity score (0-100)",
        },
        accessibility: {
          type: SchemaType.OBJECT,
          properties: {
            low_contrast: {
              type: SchemaType.BOOLEAN,
              description: "Whether design has WCAG AA contrast issues",
            },
            tiny_text: {
              type: SchemaType.BOOLEAN,
              description: "Whether design has text smaller than 12px",
            },
            cluttered: {
              type: SchemaType.BOOLEAN,
              description: "Whether design has information overload",
            },
          },
          required: ["low_contrast", "tiny_text", "cluttered"],
        },
        diagnosis_summary: {
          type: SchemaType.STRING,
          description: "One sentence structural diagnosis in Korean",
        },
      },
      required: ["hierarchy_score", "scanability_score", "goal_clarity_score", "accessibility", "diagnosis_summary"],
    },
    layer2_form: {
      type: SchemaType.OBJECT,
      properties: {
        grid_consistency: {
          type: SchemaType.INTEGER,
          description: "Grid alignment accuracy score (0-100)",
        },
        visual_balance: {
          type: SchemaType.INTEGER,
          description: "Geometric equilibrium score (0-100)",
        },
        color_harmony: {
          type: SchemaType.INTEGER,
          description: "Color theory adherence score (0-100)",
        },
        typography_quality: {
          type: SchemaType.INTEGER,
          description: "Font choice and spacing quality score (0-100)",
        },
      },
      required: ["grid_consistency", "visual_balance", "color_harmony", "typography_quality"],
    },
    layer3_communicative: {
      type: SchemaType.OBJECT,
      properties: {
        trust_vibe: {
          type: SchemaType.STRING,
          enum: ["High", "Medium", "Low"],
          description: "Professionalism and trust impression",
        },
        engagement_potential: {
          type: SchemaType.STRING,
          enum: ["High", "Medium", "Low"],
          description: "Call-to-action effectiveness potential",
        },
        emotional_tone: {
          type: SchemaType.STRING,
          enum: ["Calm", "Energetic", "Serious", "Playful", "Minimal"],
          description: "Overall emotional atmosphere",
        },
      },
      required: ["trust_vibe", "engagement_potential", "emotional_tone"],
    },
    overall_score: {
      type: SchemaType.INTEGER,
      description: "Weighted overall design score (0-100). Layer1: 50%, Layer2: 30%, Layer3: 20%",
    },
    fix_scope: {
      type: SchemaType.STRING,
      enum: ["StructureRebuild", "DetailTuning"],
      description: "Recommended fix approach. StructureRebuild if Layer1 avg < 60",
    },
    color_palette: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          hex: {
            type: SchemaType.STRING,
            description: "Hex color code (e.g., #FF5733)",
          },
          approx_name: {
            type: SchemaType.STRING,
            description: "Approximate color name (e.g., Coral Red)",
          },
          usage_ratio: {
            type: SchemaType.NUMBER,
            description: "Estimated usage ratio (0.0-1.0)",
          },
        },
        required: ["hex", "approx_name", "usage_ratio"],
      },
      description: "Top 5 dominant colors in the design",
    },
    detected_keywords: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Key visual/textual elements detected (max 20)",
    },
    next_actions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Top 3 specific, actionable improvement suggestions in Korean",
    },
    rag_search_queries: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Suggested search queries for finding relevant design guidelines",
    },
  },
  required: [
    "format_prediction",
    "layer1_performance",
    "layer2_form",
    "layer3_communicative",
    "overall_score",
    "fix_scope",
    "color_palette",
    "detected_keywords",
    "next_actions",
    "rag_search_queries",
  ],
};

/**
 * System instruction for Vision analysis
 * Guides Gemini to perform 3-Layer design evaluation
 */
export const VISION_SYSTEM_INSTRUCTION = `
**Role:**
You are the "dysapp Design Tutor," an expert AI utilizing Modernist Design Theory (Bauhaus, Swiss Style) and Information Design principles to critique visual works.

**Task:**
Analyze the provided image based on the "3-Layer Design Evaluation Framework" and return the result strictly as a JSON object matching the provided schema.

**Evaluation Framework:**

**Layer 1: Performance & Information (Weight: 50%)**
Evaluates functional effectiveness:
- hierarchy_score: Visual hierarchy clarity - Is there a clear focal point? Are headline/body/CTA properly contrasted? (0-100)
- scanability_score: Information grouping and scan speed - Can users quickly find what they need? (0-100)
- goal_clarity_score: Topic/action recognition - Is the purpose immediately clear? (0-100)
- accessibility: Check for low_contrast (WCAG AA failure), tiny_text (<12px), cluttered (information overload)
- diagnosis_summary: One sentence diagnosis of structural issues (Korean if applicable)

**Layer 2: Aesthetic & Form (Weight: 30%)**
Evaluates visual quality:
- grid_consistency: Alignment accuracy - Are elements properly aligned to a grid system? (0-100)
- visual_balance: Geometric equilibrium - Is weight distributed properly? (0-100)
- color_harmony: Color theory adherence - Do colors work well together? (0-100)
- typography_quality: Font choice, pairing, spacing quality (0-100)

**Layer 3: Communicative Impact (Weight: 20%)**
Evaluates impression and engagement:
- trust_vibe: Does it look professional? (High/Medium/Low)
- engagement_potential: Will users take action? (High/Medium/Low)
- emotional_tone: Overall mood (Calm/Energetic/Serious/Playful/Minimal)

**Scoring Guidelines:**
1. Average good professional work should score around 70-75
2. Don't give 90+ scores easily - reserve for exceptional work
3. Be specific in diagnosis_summary - point to exact issues
4. next_actions must be concrete and actionable (e.g., "헤드라인 크기를 30% 키우고 본문과의 대비를 강화하세요")

**fix_scope Decision Rules:**
- "StructureRebuild" if:
  - hierarchy_score < 50
  - goal_clarity_score < 50
  - scanability_score < 50
  - hierarchy_score is between 50-60 (ambiguous range)
- "DetailTuning" if:
  - hierarchy_score >= 60 AND structure is sound
  - Only aesthetic refinements needed

**Output Rules:**
1. Return ONLY valid JSON - no markdown, no explanatory text
2. All scores must be integers 0-100
3. color_palette: Extract 3-5 dominant colors
4. next_actions: Provide exactly 3 specific improvement suggestions in Korean
5. rag_search_queries: Suggest 3-5 design principle search terms
6. Korean context: diagnosis_summary and next_actions should be in Korean

**Special Cases:**
- If no text is present, evaluate typography_quality based on potential text placement
- For abstract art without clear hierarchy, evaluate based on compositional principles
- For incomplete/draft designs, score based on current state, not potential
`;

/**
 * Function declaration schema for Gemini API
 * (Alternative approach using function calling)
 */
export const ANALYSIS_FUNCTION_DECLARATION = {
  name: "analyze_design",
  description: "Analyze a design image and return structured evaluation results",
  parameters: DESIGN_ANALYSIS_SCHEMA as any,
};
