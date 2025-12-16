/**
 * Analyze Page Script (analyze.html)
 * Displays analysis results and handles AI mentor chat
 */

import {
  getAnalysis,
  chatWithMentor,
  getStoredSessionId,
} from "../services/apiService.js";
import { adaptAnalysisResponse } from "../utils/dataAdapter.js";
import {
  showLoading,
  hideLoading,
  toast,
  getUrlParam,
  navigateToUpload,
} from "./app.js";

// ============================================================================
// State
// ============================================================================

let currentAnalysis = null;
let chatSessionId = null;

// ============================================================================
// DOM Elements
// ============================================================================

const mainDescription = document.getElementById("mainDescription");
const mainTags = document.getElementById("mainTags");
const dataBoxContainer = document.getElementById("dataBoxContainer");
const aiSuggestionBox = document.getElementById("aiSuggestionBox");
const aiRecommendation = document.getElementById("aiRecommendation");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");
const chatContainer = document.getElementById("chatContainer");
const suggestionBox = document.getElementById("suggestionBox");

// ============================================================================
// Load Analysis
// ============================================================================

/**
 * Load analysis data and render
 */
async function loadAnalysis() {
  // Get analysis ID from URL or localStorage
  const analysisId = getUrlParam("id") || localStorage.getItem("lastAnalysisId");

  if (!analysisId) {
    toast.error("분석 ID가 없습니다");
    setTimeout(() => navigateToUpload(), 1500);
    return;
  }

  try {
    showLoading("분석 결과 불러오는 중...");

    const response = await getAnalysis(analysisId);
    if (!response.success || !response.analysis) {
      throw new Error("Analysis not found");
    }

    // Adapt response for UI
    currentAnalysis = adaptAnalysisResponse({
      success: true,
      analysisId: analysisId,
      ...response.analysis,
    });

    // Get stored session ID for continuing chat
    chatSessionId = getStoredSessionId(analysisId);

    hideLoading();

    // Render results
    renderAnalysisResults();
  } catch (error) {
    hideLoading();
    console.error("[Analyze] Failed to load:", error);
    toast.error("분석 결과를 불러오지 못했습니다");
  }
}

// ============================================================================
// Render Analysis Results
// ============================================================================

/**
 * Render all analysis results
 */
function renderAnalysisResults() {
  if (!currentAnalysis) return;

  // Main title/summary
  renderHeader();

  // Keywords/tags
  renderKeywords();

  // Data boxes
  renderDataBoxes();

  // AI Suggestion
  renderAISuggestion();

  // Chat suggestions
  renderChatSuggestions();

  console.log("[Analyze] Results rendered");
}

/**
 * Render header section
 */
function renderHeader() {
  if (mainDescription) {
    // Generate summary based on analysis
    const summary = generateSummary(currentAnalysis);
    mainDescription.textContent = summary;
  }
}

/**
 * Generate summary text based on analysis
 */
function generateSummary(analysis) {
  const { format, score, layer3 } = analysis;
  const tone = layer3?.tone?.label || "심플한";

  if (score.value >= 80) {
    return `${tone} 무드의 완성도 높은 ${format.label} 작업물입니다.`;
  } else if (score.value >= 60) {
    return `${tone} 분위기의 ${format.label} 디자인입니다. 일부 개선이 필요합니다.`;
  } else {
    return `${format.label} 디자인입니다. 구조적 개선이 필요합니다.`;
  }
}

/**
 * Render keywords section
 */
function renderKeywords() {
  if (!mainTags) return;

  const keywords = currentAnalysis.keywords.slice(0, 4);

  // Clear existing tags and create new ones
  mainTags.innerHTML = "";
  keywords.forEach((keyword, index) => {
    const span = document.createElement("span");
    span.className = `per${index > 0 ? index + 1 : ""}`;
    span.textContent = keyword;
    mainTags.appendChild(span);
  });
}

/**
 * Render data boxes
 */
function renderDataBoxes() {
  // Color palette box
  renderColorPalette();

  // Detected objects
  renderDetectedObjects();

  // Usage suggestions
  renderUsageSuggestions();

  // Layout/metrics box
  renderLayoutMetrics();

  // Typography box
  renderTypographyMetrics();

  // Language/text data
  renderLanguageData();
}

/**
 * Render color palette
 */
function renderColorPalette() {
  const colorContent = document.getElementById("colorPaletteContent");
  const colorDesc = document.getElementById("colorPaletteDesc");

  if (!colorContent || !currentAnalysis.colors?.length) return;

  const colors = currentAnalysis.colors;

  // Build color palette HTML
  const primaryColor = colors[0];
  const secondaryColors = colors.slice(1, 4);

  colorContent.innerHTML = `
    <span class="color1" style="background-color: ${primaryColor.hex}; color: ${getContrastColor(primaryColor.hex)}">
      ${primaryColor.hex}
    </span>
    <div class="colorlayout">
      ${secondaryColors
        .map(
          (color, i) =>
            `<span class="color${i + 2}" style="background-color: ${color.hex}; color: ${getContrastColor(color.hex)}">${color.hex}</span>`
        )
        .join("")}
    </div>
  `;

  // Description
  if (colorDesc) {
    colorDesc.textContent = generateColorDescription(colors);
  }
}

/**
 * Generate color description
 */
function generateColorDescription(colors) {
  if (colors.length === 0) return "색상 정보가 없습니다.";

  const primaryColor = colors[0];
  const harmony = currentAnalysis.layer2?.color?.value || 70;

  if (harmony >= 80) {
    return `${primaryColor.name}을(를) 주 색상으로 사용한 조화로운 색상 팔레트입니다. 색채 이론에 부합하는 안정적인 구성입니다.`;
  } else if (harmony >= 60) {
    return `${primaryColor.name}을(를) 기반으로 한 색상 구성입니다. 색상 간 조화를 약간 개선하면 더 나은 결과를 얻을 수 있습니다.`;
  } else {
    return `색상 조합에 개선이 필요합니다. 보색 또는 유사색 원칙을 적용해 보세요.`;
  }
}

/**
 * Render layout metrics
 */
function renderLayoutMetrics() {
  const layoutContent = document.getElementById("layoutContent");
  const layoutDesc = document.getElementById("layoutDesc");

  if (!layoutContent) return;

  const layer1 = currentAnalysis.layer1;
  const layer2 = currentAnalysis.layer2;

  const metrics = [
    { label: "계층성", value: layer1?.hierarchy?.value || 0 },
    { label: "스캔성", value: layer1?.scanability?.value || 0 },
    { label: "그리드", value: layer2?.grid?.value || 0 },
    { label: "균형", value: layer2?.balance?.value || 0 },
  ];

  layoutContent.innerHTML = metrics
    .map(
      (metric) => `
      <div class="oneEle">
        <p class="item">${metric.label}</p>
        <div class="value">${metric.value}%</div>
      </div>
    `
    )
    .join("");

  // Description
  if (layoutDesc) {
    layoutDesc.textContent = layer1?.diagnosis || "레이아웃 분석 결과입니다.";
  }
}

/**
 * Render typography metrics
 */
function renderTypographyMetrics() {
  const typoContent = document.getElementById("typographyContent");
  const typoDesc = document.getElementById("typographyDesc");

  if (!typoContent) return;

  const typoQuality = currentAnalysis.layer2?.typography?.value || 0;

  typoContent.innerHTML = `
    <div class="textwrap">
      <p class="eng">Aa</p>
      <p class="font">Typography<br />${typoQuality}%</p>
    </div>
    <span class="percent">
      <span class="perInside" style="width: ${typoQuality}%"></span>
    </span>
  `;

  // Description
  if (typoDesc) {
    if (typoQuality >= 80) {
      typoDesc.textContent = "타이포그래피가 잘 구성되어 있습니다. 가독성과 계층 구조가 명확합니다.";
    } else if (typoQuality >= 60) {
      typoDesc.textContent = "타이포그래피 구성이 양호합니다. 행간이나 자간 조정으로 개선할 수 있습니다.";
    } else {
      typoDesc.textContent = "타이포그래피 개선이 필요합니다. 폰트 선택과 크기 대비를 검토해 보세요.";
    }
  }
}

/**
 * Render usage suggestions
 */
function renderUsageSuggestions() {
  const usageContent = document.getElementById("usageSuggestionsContent");
  const usageDesc = document.getElementById("usageSuggestionsDesc");

  if (!usageContent) return;

  const format = currentAnalysis.format?.value || "Unknown";
  const suggestions = getUsageSuggestions(format);

  usageContent.innerHTML = suggestions
    .map((suggestion) => `<li class="utilize">${suggestion}</li>`)
    .join("");

  if (usageDesc) {
    usageDesc.textContent = `${currentAnalysis.format?.label || "디자인"} 형식에 적합한 활용 방안입니다.`;
  }
}

/**
 * Render detected objects
 */
function renderDetectedObjects() {
  const objectsContent = document.getElementById("detectedObjectsContent");
  const objectsDesc = document.getElementById("detectedObjectsDesc");

  if (!objectsContent) return;

  // Use keywords as detected objects for now
  const objects = currentAnalysis.keywords?.slice(0, 3) || [];

  objectsContent.innerHTML = objects
    .map((obj) => `<div class="eleText">${obj}</div>`)
    .join("");

  if (objectsDesc) {
    objectsDesc.textContent = "이미지에서 감지된 주요 객체 요소들입니다.";
  }
}

/**
 * Render language/text data
 */
function renderLanguageData() {
  const langContent = document.getElementById("languageContent");
  const langDesc = document.getElementById("languageDesc");

  if (!langContent) return;

  // Placeholder for language data
  langContent.innerHTML = `
    <span class="lang">분석 중</span>
    <span class="text">텍스트 인식 결과가 여기에 표시됩니다.</span>
  `;

  if (langDesc) {
    langDesc.textContent = "이미지 내 텍스트 정보가 분석됩니다.";
  }
}

/**
 * Get usage suggestions based on format
 */
function getUsageSuggestions(format) {
  const suggestions = {
    UX_UI: ["앱/웹 인터페이스", "대시보드 디자인", "디지털 프로덕트"],
    Editorial: ["매거진/북 디자인", "브로셔/카탈로그", "보고서 레이아웃"],
    Poster: ["이벤트/공연 홍보", "광고 캠페인", "전시 포스터"],
    Thumbnail: ["유튜브 썸네일", "SNS 콘텐츠", "블로그 커버"],
    Card: ["명함 디자인", "초대장/카드", "패키지 디자인"],
    BI_CI: ["브랜드 아이덴티티", "로고 디자인", "브랜드 가이드"],
    Unknown: ["다양한 용도로 활용 가능", "맞춤 디자인", "특수 목적"],
  };

  return suggestions[format] || suggestions.Unknown;
}

/**
 * Render AI suggestion section
 */
function renderAISuggestion() {
  if (!aiRecommendation) return;

  const actions = currentAnalysis.nextActions;
  if (actions && actions.length > 0) {
    aiRecommendation.innerHTML = `
      <strong>개선 제안:</strong><br/>
      ${actions.map((action, i) => `${i + 1}. ${action}`).join("<br/>")}
    `;
  } else {
    aiRecommendation.textContent = "분석 결과를 바탕으로 AI가 개선 방안을 제안합니다.";
  }
}

/**
 * Render chat suggestions
 */
function renderChatSuggestions() {
  if (!suggestionBox) return;

  const suggestions = [
    "이 디자인의 색상 조합에 대해 더 자세히 알려줘.",
    "레이아웃을 어떻게 개선할 수 있을까?",
    "타이포그래피 계층 구조를 개선하는 방법은?",
  ];

  suggestionBox.innerHTML = suggestions
    .map(
      (text) => `
      <ul class="sug_ul">
        <li class="sug_li">
          <img src="./img/s_icon.svg" alt="" class="sug_icon">
          <p class="sug_li_p">${text}</p>
        </li>
      </ul>
    `
    )
    .join("");

  // Add click handlers
  suggestionBox.querySelectorAll(".sug_li").forEach((item) => {
    item.addEventListener("click", () => {
      const text = item.querySelector(".sug_li_p")?.textContent;
      if (text && chatInput) {
        chatInput.value = text;
        chatInput.focus();
      }
    });
  });
}

// ============================================================================
// Chat Functionality
// ============================================================================

/**
 * Send chat message
 */
async function sendChatMessage() {
  const message = chatInput?.value?.trim();
  if (!message || !currentAnalysis) return;

  // Clear input
  chatInput.value = "";

  // Add user message to chat
  addChatMessage("user", message);

  try {
    // Show typing indicator
    const typingIndicator = addTypingIndicator();

    const response = await chatWithMentor({
      analysisId: currentAnalysis.id,
      message,
      sessionId: chatSessionId,
    });

    // Remove typing indicator
    typingIndicator?.remove();

    if (response.success) {
      chatSessionId = response.sessionId;
      addChatMessage("assistant", response.response);
    } else {
      toast.error("답변을 받지 못했습니다");
    }
  } catch (error) {
    console.error("[Analyze] Chat failed:", error);
    toast.error("채팅 중 오류가 발생했습니다");
  }
}

/**
 * Add chat message to container
 */
function addChatMessage(role, content) {
  if (!chatContainer) return;

  const messageClass = role === "user" ? "bubble_user" : "bubble_ai";
  const bubbleClass = role === "user" ? "bubbleBox1" : "bubbleBox2";
  const textClass = role === "user" ? "promptB_user" : "promptB_ai";

  const messageDiv = document.createElement("div");
  messageDiv.className = messageClass;
  messageDiv.innerHTML = `
    <div class="${bubbleClass}">
      <p class="${textClass}">${formatChatContent(content)}</p>
    </div>
  `;

  // Add to chat container
  chatContainer.appendChild(messageDiv);

  // Scroll to bottom
  messageDiv.scrollIntoView({ behavior: "smooth" });
}

/**
 * Format chat content (convert markdown-like to HTML)
 */
function formatChatContent(content) {
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>")
    .replace(/###\s*(.*?)(?:<br\/>|$)/g, "<strong>$1</strong><br/>");
}

/**
 * Add typing indicator
 */
function addTypingIndicator() {
  if (!chatContainer) return null;

  const indicator = document.createElement("div");
  indicator.className = "bubble_ai typing-indicator";
  indicator.innerHTML = `
    <div class="bubbleBox2">
      <p class="promptB_ai">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </p>
    </div>
  `;

  chatContainer.appendChild(indicator);
  indicator.scrollIntoView({ behavior: "smooth" });

  return indicator;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get contrast color for text on colored background
 */
function getContrastColor(hexColor) {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#ffffff";
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
  // Chat send button
  chatSendBtn?.addEventListener("click", sendChatMessage);

  // Chat input enter key
  chatInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
}

// ============================================================================
// Typing Indicator Styles
// ============================================================================

const typingStyles = `
.typing-indicator .promptB_ai {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-indicator .dot {
  width: 8px;
  height: 8px;
  background: #875CFF;
  border-radius: 50%;
  animation: typing-bounce 1.4s ease-in-out infinite;
}

.typing-indicator .dot:nth-child(1) { animation-delay: 0s; }
.typing-indicator .dot:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = typingStyles;
document.head.appendChild(styleSheet);

// ============================================================================
// Initialize
// ============================================================================

function init() {
  console.log("[Analyze] Initializing analyze page...");
  setupEventListeners();
  loadAnalysis();
}

// Wait for app initialization
window.addEventListener("dysapp:ready", init);

// Also try immediate init if already ready
if (window.dysapp?.initialized) {
  init();
}
