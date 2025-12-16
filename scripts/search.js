/**
 * Search Page Script (searchTab.html)
 * Handles image-based and filter-based search
 */

import {
  searchSimilar,
  searchText,
  customSearch,
  saveItem,
  analyzeDesign,
  getAnalysis,
  readFileAsBase64,
  validateImageFile,
  getLastAnalysisId,
} from "../services/apiService.js";
import { adaptSearchResponse, adaptTextSearchResponse, FORMAT_LABELS, FIX_SCOPE_LABELS } from "../utils/dataAdapter.js";
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
let customSearchResults = [];
let currentFilters = {
  format: null,
  fixScope: null,
  minScore: null,
};

// Custom Search state
let currentSearchQuery = null;
let currentSearchStart = 1;
let isLoadingMore = false;
let hasMoreResults = true;
let lastAnalysisData = null;

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
// Query Generation Functions
// ============================================================================

/**
 * Generate search query from analysis data
 * Priority: ragSearchQueries > detectedKeywords > formatPrediction
 */
function generateSearchQuery(analysis) {
  if (!analysis) return null;

  // Priority 1: ragSearchQueries
  if (analysis.ragSearchQueries && Array.isArray(analysis.ragSearchQueries) && analysis.ragSearchQueries.length > 0) {
    return analysis.ragSearchQueries[0];
  }

  // Priority 2: detectedKeywords
  if (analysis.detectedKeywords && Array.isArray(analysis.detectedKeywords) && analysis.detectedKeywords.length > 0) {
    return analysis.detectedKeywords.join(" ");
  }

  // Priority 3: formatPrediction
  if (analysis.formatPrediction && analysis.formatPrediction !== "Unknown") {
    return `${analysis.formatPrediction} 디자인`;
  }

  return null;
}

/**
 * Get last analysis data from localStorage and API
 */
async function getLastAnalysisData() {
  const lastAnalysisId = getLastAnalysisId();
  if (!lastAnalysisId) {
    return null;
  }

  try {
    const response = await getAnalysis(lastAnalysisId);
    if (response.success && response.analysis) {
      return response.analysis;
    }
  } catch (error) {
    console.error("[Search] Failed to get last analysis:", error);
  }

  return null;
}

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

/**
 * Perform Custom Search using GCP Custom Search API
 */
async function performCustomSearch(query, start = 1) {
  if (!query || query.trim().length < 2) {
    toast.error("검색어를 2자 이상 입력해주세요");
    return;
  }

  try {
    if (start === 1) {
      showLoading("관련 이미지 검색 중...");
    }

    const searchResult = await customSearch({
      query: query.trim(),
      start,
      num: 10,
    });

    if (start === 1) {
      hideLoading();
    }

    if (searchResult.success) {
      if (start === 1) {
        // Replace results for first page
        customSearchResults = searchResult.items || [];
        currentSearchQuery = query.trim();
        currentSearchStart = 1;
        hasMoreResults = searchResult.items.length >= 10;
      } else {
        // Append results for subsequent pages
        customSearchResults = [...customSearchResults, ...(searchResult.items || [])];
        hasMoreResults = searchResult.items.length >= 10;
      }

      renderCustomSearchResults();
      
      if (start === 1 && customSearchResults.length > 0) {
        toast.success(`${customSearchResults.length}개의 관련 이미지를 찾았습니다`);
      }
    } else {
      if (start === 1) {
        hideLoading();
        toast.error("검색 중 오류가 발생했습니다");
      }
    }
  } catch (error) {
    if (start === 1) {
      hideLoading();
    }
    console.error("[Search] Custom search failed:", error);
    toast.error("검색 중 오류가 발생했습니다");
  } finally {
    isLoadingMore = false;
  }
}

/**
 * Load more search results (infinite scroll)
 */
async function loadMoreSearchResults() {
  if (isLoadingMore || !hasMoreResults || !currentSearchQuery) {
    return;
  }

  isLoadingMore = true;
  currentSearchStart += 10;
  
  await performCustomSearch(currentSearchQuery, currentSearchStart);
}

/**
 * Auto search on page load based on last analysis
 */
async function autoSearchOnPageLoad() {
  // Show initial loading state
  if (resultsGrid) {
    resultsGrid.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1;">
        <p>검색 중...</p>
        <p class="no-results-hint">관련 이미지를 찾고 있습니다</p>
      </div>
    `;
  }

  const analysisData = await getLastAnalysisData();
  
  if (analysisData) {
    lastAnalysisData = analysisData;
    const query = generateSearchQuery(analysisData);
    
    if (query) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        performCustomSearch(query, 1);
      }, 300);
    } else {
      // No query available, show empty state
      if (resultsGrid) {
        resultsGrid.innerHTML = `
          <div class="no-results" style="grid-column: 1 / -1;">
            <p>검색할 키워드를 찾지 못했습니다</p>
            <p class="no-results-hint">이미지를 업로드하거나 검색어를 입력해주세요</p>
          </div>
        `;
      }
    }
  } else {
    // No analysis data, show empty state
    if (resultsGrid) {
      resultsGrid.innerHTML = `
        <div class="no-results" style="grid-column: 1 / -1;">
          <p>검색 결과가 없습니다</p>
          <p class="no-results-hint">이미지를 업로드하거나 검색어를 입력해주세요</p>
        </div>
      `;
    }
  }
}

/**
 * Perform text-based search
 */
async function performTextSearch(query) {
  if (!query || query.trim().length < 2) {
    toast.error("검색어를 2자 이상 입력해주세요");
    return;
  }

  try {
    showLoading("텍스트 검색 중...");

    const searchResult = await searchText({
      query: query.trim(),
      limit: 20,
      ...currentFilters,
    });

    hideLoading();

    if (searchResult.success) {
      // Adapt text search results to match searchSimilar format
      const adapted = adaptTextSearchResponse(searchResult);
      searchResults = adapted.items;
      renderSearchResults();
      if (adapted.count > 0) {
        toast.success(`${adapted.count}개의 검색 결과를 찾았습니다`);
      } else {
        toast.info("검색 결과가 없습니다. 다른 검색어를 시도해보세요");
      }
    } else {
      toast.error("검색 중 오류가 발생했습니다");
    }
  } catch (error) {
    hideLoading();
    console.error("[Search] Text search failed:", error);
    toast.error("검색 중 오류가 발생했습니다");
  }
}

// ============================================================================
// Render Functions
// ============================================================================

/**
 * Render Custom Search results
 */
function renderCustomSearchResults() {
  if (!resultsGrid) {
    console.warn("[Search] Results grid not found");
    return;
  }

  // Keep the page-dim element
  const pageDim = resultsGrid.querySelector(".page-dim");

  if (customSearchResults.length === 0) {
    resultsGrid.innerHTML = `
      <div class="no-results">
        <p>관련 이미지를 찾지 못했습니다</p>
        <p class="no-results-hint">다른 키워드로 검색해보세요</p>
      </div>
    `;
    if (pageDim) resultsGrid.appendChild(pageDim);
    // Setup observer even for empty state (in case results load later)
    setupInfiniteScrollObserver();
    return;
  }

  // Clear existing images but keep structure
  resultsGrid.innerHTML = customSearchResults
    .map((result, index) => createCustomSearchImage(result, index))
    .join("");

  // Add loading indicator at the bottom if more results available
  if (hasMoreResults) {
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "custom-search-loading";
    loadingIndicator.id = "customSearchLoadingIndicator";
    loadingIndicator.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #7C7895;">
        <p>더 많은 이미지 불러오는 중...</p>
      </div>
    `;
    resultsGrid.appendChild(loadingIndicator);
  }

  if (pageDim) resultsGrid.appendChild(pageDim);

  // Setup infinite scroll observer (always call, even if no more results)
  setupInfiniteScrollObserver();
}

/**
 * Create Custom Search result image HTML
 */
function createCustomSearchImage(result, index) {
  return `
    <div class="searchImgCard" data-id="${result.id}" data-index="${index}" data-source="custom" data-search-query="${currentSearchQuery || ''}">
      <img src="${result.imageUrl || result.thumbnailUrl || ''}" alt="${result.title || '이미지'}" class="searchImg" loading="lazy" title="${result.title || ''}">
      <div class="imgOverlay">
        <button class="img-btn shareBtn" data-action="share" aria-label="공유">
          <img src="./img/share.svg" alt="" class="shareIcon">
        </button>
        <button class="img-btn downBtn" data-action="download" aria-label="다운로드">
          <img src="./img/download.svg" alt="" class="downIcon">
        </button>
      </div>
    </div>
  `;
}

/**
 * Render search results grid (for Firestore results)
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
    .map((result, index) => createResultImage(result, index))
    .join("");

  if (pageDim) resultsGrid.appendChild(pageDim);

  // Note: Click handlers are now handled via event delegation in setupEventListeners
}

/**
 * Create result image HTML (for searchImgBox grid)
 */
function createResultImage(result, index) {
  const similarityText = result.similarityLabel || `${result.score || 0}점`;
  return `
    <div class="searchImgCard" data-id="${result.id}" data-index="${index}">
      <img src="${result.imageUrl}" alt="${result.fileName}" class="searchImg" loading="lazy" title="${similarityText}">
      <div class="imgOverlay">
        <button class="img-btn shareBtn" data-action="share" aria-label="공유">
          <img src="./img/share.svg" alt="" class="shareIcon">
        </button>
        <button class="img-btn downBtn" data-action="download" aria-label="다운로드">
          <img src="./img/download.svg" alt="" class="downIcon">
        </button>
      </div>
    </div>
  `;
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
      const filters = JSON.parse(storedFilters);
      sessionStorage.removeItem("appliedFilters");

      // Convert filter format to match currentFilters structure
      // Note: currentFilters uses format/fixScope/minScore, but filter page uses colors/keywords
      // For now, we'll store the raw filter data and use it when available
      currentFilters = {
        ...currentFilters,
        rawFilters: filters, // Store raw filter data
      };

      // If there's a search query, re-run search
      const searchInput = document.querySelector(".search");
      const query = searchInput?.value?.trim();
      
      if (query && query.length >= 2) {
        performTextSearch(query);
      } else {
        // Otherwise, try image-based search
        const lastAnalysisId = getLastAnalysisId();
        if (lastAnalysisId) {
          searchFromAnalysis(lastAnalysisId);
        } else {
          toast.info("필터가 적용되었습니다. 검색을 실행해주세요");
        }
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

  // Initialize first tab as active
  const firstNothing = categoryTabs[0]?.querySelector(".nothing");
  if (firstNothing) firstNothing.style.opacity = "1";
  if (categoryTabs[0]) categoryTabs[0].classList.add("active");

  categoryTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      // Remove active from all tabs and hide nothing elements
      categoryTabs.forEach((t) => {
        const n = t.querySelector(".nothing");
        if (n) n.style.opacity = "0";
        t.classList.remove("active");
      });

      // Add active to clicked tab
      const targetNothing = tab.querySelector(".nothing");
      if (targetNothing) targetNothing.style.opacity = "1";
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
      const query = searchInput.value.trim();
      if (query.length >= 2) {
        performTextSearch(query);
      } else {
        toast.info("검색어를 2자 이상 입력해주세요");
      }
    }
  });

  // Search button also triggers text search
  searchBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    const query = searchInput?.value.trim();
    if (query && query.length >= 2) {
      performTextSearch(query);
    } else {
      // Fallback to image-based search if no text
      quickSearchFromLastAnalysis();
    }
  });

  // Event delegation for dynamically created search result cards
  if (resultsGrid) {
    resultsGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".searchImgCard");
      if (!card) return;

      const action = e.target.closest("[data-action]")?.dataset.action;
      const cardId = card.dataset.id;
      const cardIndex = parseInt(card.dataset.index, 10);
      const source = card.dataset.source;

      if (action === "share") {
        e.stopPropagation();
        handleShare(cardId);
      } else if (action === "download") {
        e.stopPropagation();
        handleDownload(cardId);
      } else {
        // Card click - open modal
        if (source === "custom") {
          // Custom Search result
          if (cardIndex >= 0 && cardIndex < customSearchResults.length) {
            const result = customSearchResults[cardIndex];
            if (result) {
              openResultModal(result);
            }
          }
        } else {
          // Firestore result
          if (cardIndex >= 0 && cardIndex < searchResults.length) {
            const result = searchResults[cardIndex];
            if (result) {
              openResultModal(result);
            }
          }
        }
      }
    });

    // Hover effects via CSS (handled by .searchImgCard:hover)
    // Icon hover effects
    resultsGrid.addEventListener("mouseenter", (e) => {
      const btn = e.target.closest(".img-btn");
      if (btn) {
        const icon = btn.querySelector("img");
        if (icon && btn.classList.contains("shareBtn")) {
          icon.src = "./img/shareHover.svg";
        } else if (icon && btn.classList.contains("downBtn")) {
          icon.src = "./img/downHover.svg";
        }
      }
    }, true);

    resultsGrid.addEventListener("mouseleave", (e) => {
      const btn = e.target.closest(".img-btn");
      if (btn) {
        const icon = btn.querySelector("img");
        if (icon && btn.classList.contains("shareBtn")) {
          icon.src = "./img/share.svg";
        } else if (icon && btn.classList.contains("downBtn")) {
          icon.src = "./img/download.svg";
        }
      }
    }, true);
  }

  // Setup category tabs
  setupCategoryTabs();

  // Modal action buttons (event delegation)
  const modalBox = document.getElementById("searchResultModalBox");
  if (modalBox) {
    modalBox.addEventListener("click", (e) => {
      const action = e.target.closest("[id^='searchModal']")?.id;
      const resultId = modalBox.dataset.resultId;
      const resultIndex = parseInt(modalBox.dataset.resultIndex, 10);
      const result = searchResults[resultIndex];

      if (!result) return;

      if (action === "searchModalSaveBtn") {
        e.stopPropagation();
        handleSave(resultId);
      } else if (action === "searchModalShareBtn") {
        e.stopPropagation();
        handleShare(resultId);
      } else if (action === "searchModalDownloadBtn") {
        e.stopPropagation();
        handleDownload(resultId);
      }
    });
  }
}

/**
 * Handle save action
 */
async function handleSave(resultId) {
  try {
    showLoading("저장 중...");
    const result = await saveItem({ analysisId: resultId });
    hideLoading();
    
    if (result.success) {
      toast.success(result.message || "저장되었습니다");
    } else {
      toast.error("저장에 실패했습니다");
    }
  } catch (error) {
    hideLoading();
    console.error("[Search] Save failed:", error);
    toast.error("저장 중 오류가 발생했습니다");
  }
}

/**
 * Handle share action - copy link to clipboard
 */
async function handleShare(resultId) {
  try {
    // Create share URL
    const shareUrl = `${window.location.origin}/analyze.html?id=${resultId}`;
    
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("링크가 클립보드에 복사되었습니다");
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success("링크가 클립보드에 복사되었습니다");
      } catch (err) {
        toast.error("링크 복사에 실패했습니다");
      }
      document.body.removeChild(textArea);
    }
  } catch (error) {
    console.error("[Search] Share failed:", error);
    toast.error("공유 중 오류가 발생했습니다");
  }
}

/**
 * Handle download action
 */
async function handleDownload(resultId) {
  try {
    // Check if it's a custom search result
    const modalBox = document.getElementById("searchResultModalBox");
    const source = modalBox?.dataset.resultSource;
    
    let result;
    let imageUrl;
    let fileName;
    
    if (source === "custom") {
      result = customSearchResults.find((r) => r.id === resultId);
      imageUrl = result?.imageUrl || result?.thumbnailUrl;
      fileName = result?.title || `image_${resultId}.jpg`;
    } else {
      result = searchResults.find((r) => r.id === resultId);
      imageUrl = result?.imageUrl;
      fileName = result?.fileName || `design_${resultId}.png`;
    }
    
    if (!result || !imageUrl) {
      toast.error("이미지 URL을 찾을 수 없습니다");
      return;
    }

    showLoading("다운로드 준비 중...");

    // Fetch image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch image");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    hideLoading();
    toast.success("다운로드가 시작되었습니다");
  } catch (error) {
    hideLoading();
    console.error("[Search] Download failed:", error);
    toast.error("다운로드 중 오류가 발생했습니다");
  }
}

/**
 * Generate recommendation reason for Custom Search result
 */
function generateRecommendationReason(searchResult, query, analysis) {
  if (!query || !analysis) {
    return "이미지는 검색 결과입니다.";
  }

  const reasons = [];
  
  // Search query reason
  reasons.push(`이 이미지는 '${query}' 검색어로 찾았습니다.`);

  // Keyword matching
  if (analysis.detectedKeywords && Array.isArray(analysis.detectedKeywords)) {
    const matchedKeywords = analysis.detectedKeywords.filter(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase()) || 
      keyword.toLowerCase().includes(query.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      reasons.push(`분석 결과의 키워드 '${matchedKeywords.join(", ")}'와 관련이 있습니다.`);
    }
  }

  // Format prediction
  if (analysis.formatPrediction && analysis.formatPrediction !== "Unknown") {
    reasons.push(`분석된 디자인의 ${analysis.formatPrediction} 형식과 유사한 스타일입니다.`);
  }

  return reasons.join(" ");
}

// Store observer instance to avoid duplicates
let infiniteScrollObserver = null;

/**
 * Setup infinite scroll observer
 */
function setupInfiniteScrollObserver() {
  // Disconnect existing observer if any
  if (infiniteScrollObserver) {
    infiniteScrollObserver.disconnect();
    infiniteScrollObserver = null;
  }

  // Find loading indicator or use last card as trigger
  const loadingIndicator = document.getElementById("customSearchLoadingIndicator");
  const lastCard = resultsGrid?.querySelector(".searchImgCard:last-child");
  
  // Use loading indicator if available, otherwise use last card
  const targetElement = loadingIndicator || lastCard;
  
  if (!targetElement || !resultsGrid) {
    // If no target element, try again after a short delay (for initial render)
    setTimeout(() => {
      setupInfiniteScrollObserver();
    }, 100);
    return;
  }

  // Create new observer
  infiniteScrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && hasMoreResults && !isLoadingMore && currentSearchQuery) {
        loadMoreSearchResults();
      }
    });
  }, {
    rootMargin: "200px", // Start loading 200px before reaching the element
    threshold: 0.1,
  });

  infiniteScrollObserver.observe(targetElement);
}

/**
 * Open result modal
 */
function openResultModal(result) {
  const modalBg = document.getElementById("searchResultModalBg");
  const modalBox = document.getElementById("searchResultModalBox");
  const closeBtn = document.getElementById("searchModalCloseBtn");
  
  if (!modalBg || !modalBox) {
    console.warn("[Search] Modal elements not found");
    return;
  }

  // Check if this is a Custom Search result
  const isCustomSearch = result.link || result.contextLink || result.displayLink;
  
  if (isCustomSearch) {
    // Custom Search result
    const imageEl = document.getElementById("searchModalImage");
    const titleEl = document.getElementById("searchModalTitle");
    const similarityEl = document.getElementById("searchModalSimilarity");
    const scoreEl = document.getElementById("searchModalScore");
    const ocrTextEl = document.getElementById("searchModalOcrText");
    const ocrSection = document.getElementById("searchModalOcr");

    if (imageEl) imageEl.src = result.imageUrl || result.thumbnailUrl || "";
    if (imageEl) imageEl.alt = result.title || "이미지";
    if (titleEl) titleEl.textContent = result.title || "이미지";
    
    // Generate recommendation reason
    const reasonText = generateRecommendationReason(result, currentSearchQuery, lastAnalysisData);
    
    if (similarityEl) {
      similarityEl.textContent = "추천 이미지";
      similarityEl.title = reasonText;
    }
    
    if (scoreEl) {
      scoreEl.textContent = result.displayLink || "";
    }
    
    // Show snippet as OCR text
    if (ocrTextEl && result.snippet) {
      ocrTextEl.textContent = result.snippet;
      if (ocrSection) ocrSection.style.display = "block";
    } else if (ocrSection) {
      ocrSection.style.display = "none";
    }

    // Show recommendation reason
    const recommendationSection = document.getElementById("searchModalRecommendation");
    const recommendationTextEl = document.getElementById("searchModalRecommendationText");
    if (recommendationTextEl) {
      recommendationTextEl.textContent = reasonText;
    }
    if (recommendationSection) {
      recommendationSection.style.display = "block";
    }

    // Store recommendation reason
    modalBox.dataset.recommendationReason = reasonText;
    modalBox.dataset.resultId = result.id;
    modalBox.dataset.resultIndex = customSearchResults.indexOf(result).toString();
    modalBox.dataset.resultSource = "custom";
  } else {
    // Firestore result (existing logic)
    const imageEl = document.getElementById("searchModalImage");
    const titleEl = document.getElementById("searchModalTitle");
    const similarityEl = document.getElementById("searchModalSimilarity");
    const scoreEl = document.getElementById("searchModalScore");
    const ocrTextEl = document.getElementById("searchModalOcrText");
    const ocrSection = document.getElementById("searchModalOcr");

    if (imageEl) imageEl.src = result.imageUrl || "";
    if (imageEl) imageEl.alt = result.fileName || "";
    if (titleEl) titleEl.textContent = result.fileName || "이미지";
    if (similarityEl) similarityEl.textContent = result.similarityLabel || "유사도";
    if (scoreEl) scoreEl.textContent = `${result.score || 0}점`;
    
    // OCR text (if available)
    if (ocrTextEl && result.ocrText) {
      ocrTextEl.textContent = result.ocrText;
      if (ocrSection) ocrSection.style.display = "block";
    } else if (ocrSection) {
      ocrSection.style.display = "none";
    }

    // Hide recommendation section for Firestore results
    const recommendationSection = document.getElementById("searchModalRecommendation");
    if (recommendationSection) {
      recommendationSection.style.display = "none";
    }

    // Store current result for action buttons
    modalBox.dataset.resultId = result.id;
    modalBox.dataset.resultIndex = searchResults.indexOf(result).toString();
    modalBox.dataset.resultSource = "firestore";
  }

  // Show modal
  modalBg.classList.add("show");
  document.body.style.overflow = "hidden";

  // Close handlers
  const closeModal = () => {
    modalBg.classList.remove("show");
    document.body.style.overflow = "";
  };

  if (closeBtn) {
    closeBtn.onclick = closeModal;
  }

  modalBg.onclick = (e) => {
    if (e.target === modalBg) {
      closeModal();
    }
  };

  // ESC key
  const escHandler = (e) => {
    if (e.key === "Escape" && modalBg.classList.contains("show")) {
      closeModal();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);
}

/**
 * Close search result modal
 */
function closeSearchResultModal() {
  const modalBg = document.getElementById("searchResultModalBg");
  if (modalBg) {
    modalBg.classList.remove("show");
    document.body.style.overflow = "";
  }
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
  // Auto search on page load
  autoSearchOnPageLoad();
}

// Wait for app initialization
window.addEventListener("dysapp:ready", init);

// Also try immediate init if already ready
if (window.dysapp?.initialized) {
  init();
}
