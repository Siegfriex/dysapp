/**
 * Upload Page Script (index.html)
 * Handles image upload and analysis initiation
 */

import {
  analyzeDesign,
  readFileAsBase64,
  validateImageFile,
  getAnalyses,
} from "../services/apiService.js";
import { adaptAnalysesResponse } from "../utils/dataAdapter.js";
import {
  showLoading,
  hideLoading,
  toast,
  navigateToAnalysis,
} from "./app.js";

// ============================================================================
// State
// ============================================================================

let selectedFile = null;

// ============================================================================
// DOM Elements
// ============================================================================

const uploadBox = document.querySelector(".uploadBox");
const uploadInput = document.querySelector(".upload_input");
const promptTextarea = document.querySelector(".prompt");
const sendButton = document.querySelector(".send_btn");
const promptModal = document.getElementById("promptModal");
const promptMoreBtn = document.querySelector(".promptMore");
const closeModalBtn = document.getElementById("closeModalBtn");

// ============================================================================
// File Upload Handling
// ============================================================================

/**
 * Handle file selection
 */
function handleFileSelect(file) {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    toast.error(validation.error);
    // Reset input on validation failure
    if (uploadInput) {
      uploadInput.value = "";
    }
    return;
  }

  selectedFile = file;

  // Update UI to show selected file
  updateUploadBoxUI(file);

  toast.success(`${file.name} 선택됨`);
}

/**
 * Update upload box UI to show selected file
 */
function updateUploadBoxUI(file) {
  const uboxWrap = uploadBox.querySelector(".UBox_wrap");
  if (!uboxWrap) return;

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    uboxWrap.innerHTML = `
      <img src="${e.target.result}" alt="Preview" class="upload_preview" style="max-width: 200px; max-height: 200px; object-fit: contain; border-radius: 8px;">
      <p class="U_message" style="margin-top: 12px;">${file.name}</p>
      <p class="U_message2">다른 파일을 선택하려면 클릭하세요</p>
    `;
  };
  reader.readAsDataURL(file);
}

/**
 * Reset upload box UI
 */
function resetUploadBoxUI() {
  const uboxWrap = uploadBox.querySelector(".UBox_wrap");
  if (!uboxWrap) return;

  uboxWrap.innerHTML = `
    <img src="./img/fileicon.svg" alt="" class="U_icon">
    <p class="U_message">이미지 및 파일을 업로드하세요.</p>
    <p class="U_message2">
      파일을 드래그하거나 클릭하여 파일을 선택하세요.<br />
      지원 파일 형식: jpg, png, pdf
    </p>
  `;

  selectedFile = null;
}

// ============================================================================
// Analysis Handling
// ============================================================================

/**
 * Start analysis
 */
async function startAnalysis() {
  if (!selectedFile) {
    toast.warning("이미지를 먼저 선택해주세요");
    return;
  }

  try {
    showLoading("디자인 분석 중...");

    // Read file as base64
    const fileData = await readFileAsBase64(selectedFile);

    // Get optional prompt
    const userPrompt = promptTextarea?.value?.trim() || undefined;

    // Call analyze API
    const result = await analyzeDesign({
      imageData: fileData.data,
      mimeType: fileData.mimeType,
      fileName: fileData.fileName,
      userPrompt,
    });

    hideLoading();

    if (result.success) {
      toast.success("분석 완료!");
      // Navigate to analysis page
      navigateToAnalysis(result.analysisId);
    } else {
      toast.error("분석에 실패했습니다");
    }
  } catch (error) {
    hideLoading();
    console.error("[Upload] Analysis failed:", error);
    toast.error(error.message || "분석 중 오류가 발생했습니다");
  }
}

// ============================================================================
// History Modal
// ============================================================================

/**
 * Load and display analysis history
 */
async function loadAnalysisHistory() {
  try {
    const response = await getAnalyses({ limit: 10 });
    const history = adaptAnalysesResponse(response);

    renderHistoryModal(history.items);
  } catch (error) {
    console.error("[Upload] Failed to load history:", error);
    toast.error("히스토리를 불러오지 못했습니다");
  }
}

/**
 * Render history items in modal
 */
function renderHistoryModal(items) {
  const modalContent = promptModal?.querySelector(".modal-content");
  if (!modalContent) return;

  // Remove existing items (except close button)
  const existingItems = modalContent.querySelectorAll(".promptLi");
  existingItems.forEach((item) => item.remove());

  if (items.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.className = "history-empty";
    emptyMsg.textContent = "분석 내역이 없습니다";
    emptyMsg.style.cssText = "text-align: center; color: #7C7895; padding: 20px;";
    modalContent.appendChild(emptyMsg);
    return;
  }

  items.forEach((item) => {
    const historyItem = document.createElement("div");
    historyItem.className = "promptLi";
    historyItem.innerHTML = `
      <div class="promptLiTextWrap">
        <p class="promptLiH1">이미지 분석 ('${item.fileName}')</p>
        <p class="promptLiDate">${item.createdAt}</p>
      </div>
      <button class="viewResultBtn" data-analysis-id="${item.id}">결과보기</button>
    `;

    // Add click handler
    const viewBtn = historyItem.querySelector(".viewResultBtn");
    viewBtn.addEventListener("click", () => {
      navigateToAnalysis(item.id);
    });

    modalContent.appendChild(historyItem);
  });
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
  let isProcessingFile = false;

  // Upload box click (but not if clicking directly on input)
  uploadBox?.addEventListener("click", (e) => {
    // Don't trigger if clicking directly on the input element or if processing
    if (e.target === uploadInput || e.target.closest('.upload_input') || isProcessingFile) {
      return;
    }
    uploadInput?.click();
  });

  // Prevent input click from bubbling to uploadBox
  uploadInput?.addEventListener("click", (e) => {
    e.stopPropagation();
    // Don't open dialog if already processing
    if (isProcessingFile) {
      e.preventDefault();
      return;
    }
  });

  // File input change
  uploadInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file && !isProcessingFile) {
      isProcessingFile = true;
      handleFileSelect(file);
      // Reset input immediately after processing to allow same file selection again
      // This must be done synchronously, not in setTimeout
      e.target.value = "";
      // Reset flag after a short delay to prevent rapid clicks
      setTimeout(() => {
        isProcessingFile = false;
      }, 300);
    }
  });

  // Drag and drop
  uploadBox?.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.classList.add("dragover");
  });

  uploadBox?.addEventListener("dragleave", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("dragover");
  });

  uploadBox?.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("dragover");
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFileSelect(file);
      // Reset input to allow same file selection again
      if (uploadInput) {
        uploadInput.value = "";
      }
    }
  });

  // Send button (analyze)
  sendButton?.addEventListener("click", (e) => {
    e.preventDefault();
    startAnalysis();
  });

  // Enter key in prompt
  promptTextarea?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      startAnalysis();
    }
  });

  // History modal
  promptMoreBtn?.addEventListener("click", () => {
    promptModal.style.display = "flex";
    loadAnalysisHistory();
  });

  closeModalBtn?.addEventListener("click", () => {
    promptModal.style.display = "none";
  });

  promptModal?.addEventListener("click", (e) => {
    if (e.target === promptModal) {
      promptModal.style.display = "none";
    }
  });

  // Recommendation buttons
  document.querySelectorAll(".reco").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.textContent.trim();
      if (promptTextarea) {
        promptTextarea.value = text + " 분위기의 디자인으로 분석해주세요.";
        promptTextarea.focus();
      }
    });
  });
}

// ============================================================================
// Drag & Drop Styles
// ============================================================================

const dragStyles = `
.uploadBox.dragover {
  border: 2px dashed #875CFF;
  background: rgba(135, 92, 255, 0.05);
}

.upload_preview {
  border: 1px solid #E7E2FF;
}
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = dragStyles;
document.head.appendChild(styleSheet);

// ============================================================================
// Initialize
// ============================================================================

function init() {
  console.log("[Upload] Initializing upload page...");
  setupEventListeners();
}

// Wait for app initialization
window.addEventListener("dysapp:ready", init);

// Also try immediate init if already ready
if (window.dysapp?.initialized) {
  init();
}
