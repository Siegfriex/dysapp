/**
 * Search Page Script (searchTab.html)
 * Handles image-based and filter-based search
 */

import {
  searchSimilar,
  analyzeDesign,
  readFileAsBase64,
  validateImageFile,
  getLastAnalysisId,
} from "../services/apiService.js";
import { adaptSearchResponse, FORMAT_LABELS, FIX_SCOPE_LABELS } from "../utils/dataAdapter.js";
import {
  showLoading,
  hideLoading,
  toast,
  navigateToAnalysis,
} from "./app.js";

// ============================================================================
// State
// ============================================================================

let searchResults = [];
let currentFilters = {
  format: null,
  fixScope: null,
  minScore: null,
};

// ============================================================================
// DOM Elements
// ============================================================================

const searchInput = document.querySelector(".search");
const searchBtn = document.querySelector(".searchIcon");
const uploadBtn = document.querySelector(".uploadIcon");
const filterBtn = document.querySelector(".filter");
const resultsGrid = document.querySelector(".searchImgBox");
const categoryTabs = document.querySelectorAll(".filenameBox");

// Create hidden file input for upload
const uploadInput = document.createElement("input");
uploadInput.type = "file";
uploadInput.accept = "image/png, image/jpeg";
uploadInput.style.display = "none";
document.body.appendChild(uploadInput);

// ============================================================================
// Search Functions
// ============================================================================

/**
 * Search by image upload
 */
async function searchByImage(file) {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    toast.error(validation.error);
    return;
  }

  try {
    showLoading("이미지 분석 중...");

    // Read file as base64
    const fileData = await readFileAsBase64(file);

    // First analyze the uploaded image
    const analysisResult = await analyzeDesign({
      imageData: fileData.data,
      mimeType: fileData.mimeType,
      fileName: fileData.fileName,
    });

    if (!analysisResult.success) {
      throw new Error("Analysis failed");
    }

    showLoading("유사한 디자인 검색 중...");

    // Search for similar designs
    const searchResult = await searchSimilar({
      analysisId: analysisResult.analysisId,
      limit: 20,
      ...currentFilters,
    });

    hideLoading();

    if (searchResult.success) {
      const adapted = adaptSearchResponse(searchResult);
      searchResults = adapted.items;
      renderSearchResults();
      toast.success(`${adapted.count}개의 유사한 디자인을 찾았습니다`);
    }
  } catch (error) {
    hideLoading();
    console.error("[Search] Image search failed:", error);
    toast.error("검색 중 오류가 발생했습니다");
  }
}

/**
 * Search from existing analysis
 */
async function searchFromAnalysis(analysisId) {
  try {
    showLoading("유사한 디자인 검색 중...");

    const searchResult = await searchSimilar({
      analysisId,
      limit: 20,
      ...currentFilters,
    });

    hideLoading();

    if (searchResult.success) {
      const adapted = adaptSearchResponse(searchResult);
      searchResults = adapted.items;
      renderSearchResults();
      toast.success(`${adapted.count}개의 유사한 디자인을 찾았습니다`);
    }
  } catch (error) {
    hideLoading();
    console.error("[Search] Search failed:", error);
    toast.error("검색 중 오류가 발생했습니다");
  }
}

/**
 * Quick search from last analysis
 */
async function quickSearchFromLastAnalysis() {
  const lastAnalysisId = getLastAnalysisId();
  if (!lastAnalysisId) {
    toast.info("먼저 이미지를 분석해주세요");
    return;
  }

  await searchFromAnalysis(lastAnalysisId);
}

// ============================================================================
// Render Functions
// ============================================================================

/**
 * Render search results grid
 */
function renderSearchResults() {
  if (!resultsGrid) {
    console.warn("[Search] Results grid not found");
    return;
  }

  // Keep the page-dim element
  const pageDim = resultsGrid.querySelector(".page-dim");

  if (searchResults.length === 0) {
    resultsGrid.innerHTML = `
      <div class="no-results">
        <p>검색 결과가 없습니다</p>
        <p class="no-results-hint">이미지를 업로드하거나 필터를 조정해 보세요</p>
      </div>
    `;
    if (pageDim) resultsGrid.appendChild(pageDim);
    return;
  }

  // Clear existing images but keep structure
  resultsGrid.innerHTML = searchResults
    .map((result) => createResultImage(result))
    .join("");

  if (pageDim) resultsGrid.appendChild(pageDim);

  // Add click handlers to images
  resultsGrid.querySelectorAll(".searchImg").forEach((img, index) => {
    img.addEventListener("click", () => {
      const result = searchResults[index];
      navigateToAnalysis(result.id);
    });
  });
}

/**
 * Create result image HTML (for searchImgBox grid)
 */
function createResultImage(result) {
  return `<img src="${result.imageUrl}" alt="${result.fileName}" class="searchImg" data-id="${result.id}" loading="lazy" title="${result.similarityLabel} - ${result.score}점">`;
}

/**
 * Create result card HTML (for detailed view)
 */
function createResultCard(result) {
  return `
    <div class="result-card" data-id="${result.id}">
      <div class="result-image">
        <img src="${result.imageUrl}" alt="${result.fileName}" loading="lazy">
        <div class="result-similarity">${result.similarityLabel}</div>
      </div>
      <div class="result-info">
        <p class="result-filename">${truncateFileName(result.fileName)}</p>
        <div class="result-meta">
          <span class="result-format">${result.format.label}</span>
          <span class="result-score">${result.score}점</span>
        </div>
        <div class="result-fixscope ${result.fixScope.value.toLowerCase()}">
          ${result.fixScope.label}
        </div>
      </div>
    </div>
  `;
}

/**
 * Truncate long file names
 */
function truncateFileName(name, maxLength = 20) {
  if (name.length <= maxLength) return name;
  const ext = name.split(".").pop();
  const baseName = name.slice(0, -(ext.length + 1));
  return baseName.slice(0, maxLength - ext.length - 4) + "..." + ext;
}

// ============================================================================
// Filter Functions
// ============================================================================

/**
 * Open filter page/modal
 */
function openFilterPage() {
  // Store current search state
  sessionStorage.setItem("searchFilters", JSON.stringify(currentFilters));
  window.location.href = "filter.html";
}

/**
 * Apply filters from filter page
 */
function applyFiltersFromStorage() {
  const storedFilters = sessionStorage.getItem("appliedFilters");
  if (storedFilters) {
    try {
      currentFilters = JSON.parse(storedFilters);
      sessionStorage.removeItem("appliedFilters");

      // Re-run search with filters
      const lastAnalysisId = getLastAnalysisId();
      if (lastAnalysisId) {
        searchFromAnalysis(lastAnalysisId);
      }
    } catch (e) {
      console.error("[Search] Failed to parse stored filters:", e);
    }
  }
}

// ============================================================================
// Category Tabs
// ============================================================================

/**
 * Setup category filter tabs
 */
function setupCategoryTabs() {
  if (!categoryTabs || categoryTabs.length === 0) return;

  // Categories mapped to filenameBox buttons (나의 스타일, 나의 레퍼런스, 추가 인사이트)
  const categories = ["my-style", "my-reference", "insights"];

  categoryTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      // Remove active from all (handled by existing inline script, but add class too)
      categoryTabs.forEach((t) => t.classList.remove("active"));

      // Add active to clicked
      tab.classList.add("active");

      // Update filter based on tab position
      const category = categories[index] || "all";
      handleCategoryChange(category);
    });
  });
}

/**
 * Handle category tab change
 */
function handleCategoryChange(category) {
  switch (category) {
    case "my-style":
      // Filter to show similar to user's preferred style
      toast.info("나의 스타일 필터 적용");
      break;
    case "my-reference":
      // Show user's saved references
      toast.info("나의 레퍼런스 필터 적용");
      break;
    case "insights":
      // Show high-scoring examples
      currentFilters.minScore = 80;
      quickSearchFromLastAnalysis();
      break;
    default:
      currentFilters = { format: null, fixScope: null, minScore: null };
  }
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
  // Search button (searchIcon)
  searchBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    quickSearchFromLastAnalysis();
  });

  // Image upload button (uploadIcon)
  uploadBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    uploadInput?.click();
  });

  // File input change
  uploadInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) {
      searchByImage(file);
      // Reset input to allow same file selection
      uploadInput.value = "";
    }
  });

  // Filter button
  filterBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openFilterPage();
  });

  // Text search input (Enter key or Ctrl+Enter)
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Text-based search would require different implementation
      // For now, prompt to upload image
      toast.info("이미지를 업로드하여 검색하세요");
    }
  });

  // Setup category tabs
  setupCategoryTabs();
}

// ============================================================================
// Styles
// ============================================================================

const searchStyles = `
.search_results_grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
}

.result-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.result-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.result-image {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.result-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-similarity {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(135, 92, 255, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.result-info {
  padding: 12px;
}

.result-filename {
  font-size: 14px;
  font-weight: 500;
  color: #1B1233;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.result-format {
  font-size: 12px;
  color: #7C7895;
}

.result-score {
  font-size: 12px;
  color: #875CFF;
  font-weight: 500;
}

.result-fixscope {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.result-fixscope.structurerebuild {
  background: #FEE2E2;
  color: #DC2626;
}

.result-fixscope.detailtuning {
  background: #E0D5FF;
  color: #875CFF;
}

.no-results {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #7C7895;
}

.no-results-hint {
  font-size: 14px;
  margin-top: 8px;
  color: #A8A8BF;
}

.category_tab {
  cursor: pointer;
  transition: all 0.2s;
}

.category_tab.active {
  background: #875CFF;
  color: white;
}
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = searchStyles;
document.head.appendChild(styleSheet);

// ============================================================================
// Initialize
// ============================================================================

function init() {
  console.log("[Search] Initializing search page...");
  setupEventListeners();
  applyFiltersFromStorage();
}

// Wait for app initialization
window.addEventListener("dysapp:ready", init);

// Also try immediate init if already ready
if (window.dysapp?.initialized) {
  init();
}
