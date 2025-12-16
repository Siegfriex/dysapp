/**
 * My Page Script (mypage.html)
 * User profile, analysis history, and settings
 */

import {
  getUserProfile,
  updateUserProfile,
  getAnalyses,
  deleteAnalysis,
} from "../services/apiService.js";
import {
  adaptUserProfile,
  adaptAnalysesResponse,
  FORMAT_LABELS,
} from "../utils/dataAdapter.js";
import { signOut, getCurrentUser } from "../services/firebaseService.js";
import {
  showLoading,
  hideLoading,
  toast,
  navigateToAnalysis,
  navigateToUpload,
} from "./app.js";

// ============================================================================
// State
// ============================================================================

let userProfile = null;
let analysisHistory = [];
let currentPage = 0;
const pageSize = 12;
let hasMore = false;

// ============================================================================
// DOM Elements
// ============================================================================

const profileSection = document.querySelector(".profile-section");
const historySection = document.querySelector(".history-section");
const historyGrid = document.querySelector(".history-grid");
const loadMoreBtn = document.querySelector(".load-more-btn");

// ============================================================================
// Load Data
// ============================================================================

/**
 * Load user profile
 */
async function loadUserProfile() {
  try {
    const response = await getUserProfile();
    if (response.success) {
      userProfile = adaptUserProfile(response);
      renderProfile();
    }
  } catch (error) {
    console.error("[MyPage] Failed to load profile:", error);
    toast.error("프로필을 불러오지 못했습니다");
  }
}

/**
 * Load analysis history
 */
async function loadAnalysisHistory(append = false) {
  try {
    if (!append) {
      showLoading("히스토리 불러오는 중...");
    }

    const response = await getAnalyses({
      limit: pageSize,
      offset: currentPage * pageSize,
    });

    if (!append) {
      hideLoading();
    }

    if (response.success) {
      const adapted = adaptAnalysesResponse(response);

      if (append) {
        analysisHistory = [...analysisHistory, ...adapted.items];
      } else {
        analysisHistory = adapted.items;
      }

      hasMore = adapted.hasMore;
      renderHistory();
      updateLoadMoreButton();
    }
  } catch (error) {
    hideLoading();
    console.error("[MyPage] Failed to load history:", error);
    toast.error("히스토리를 불러오지 못했습니다");
  }
}

/**
 * Load more history
 */
async function loadMore() {
  if (!hasMore) return;

  currentPage++;
  loadMoreBtn?.classList.add("loading");
  await loadAnalysisHistory(true);
  loadMoreBtn?.classList.remove("loading");
}

// ============================================================================
// Render Functions
// ============================================================================

/**
 * Render user profile section
 */
function renderProfile() {
  if (!profileSection) {
    createProfileSection();
    return;
  }

  const profile = userProfile;
  if (!profile) return;

  profileSection.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">
        ${
          profile.photoURL
            ? `<img src="${profile.photoURL}" alt="Profile">`
            : `<div class="avatar-placeholder">${getInitials(profile.displayName)}</div>`
        }
      </div>
      <div class="profile-info">
        <h2 class="profile-name">${profile.displayName}</h2>
        <p class="profile-email">${profile.email || "익명 사용자"}</p>
        <div class="profile-stats">
          <span class="stat">
            <strong>${profile.analysisCount}</strong>
            분석
          </span>
          <span class="stat">
            <strong>${profile.subscriptionLabel}</strong>
            플랜
          </span>
        </div>
      </div>
    </div>
    <div class="profile-actions">
      <button class="btn-edit-profile">프로필 수정</button>
      <button class="btn-signout">로그아웃</button>
    </div>
  `;

  // Add event listeners
  profileSection.querySelector(".btn-edit-profile")?.addEventListener("click", openProfileEditor);
  profileSection.querySelector(".btn-signout")?.addEventListener("click", handleSignOut);
}

/**
 * Create profile section if not exists
 */
function createProfileSection() {
  const main = document.querySelector("main") || document.body;

  const section = document.createElement("section");
  section.className = "profile-section";
  main.prepend(section);

  // Re-render
  renderProfile();
}

/**
 * Render analysis history grid
 */
function renderHistory() {
  if (!historyGrid) {
    createHistorySection();
    return;
  }

  if (analysisHistory.length === 0) {
    historyGrid.innerHTML = `
      <div class="empty-history">
        <p>분석 내역이 없습니다</p>
        <button class="btn-start-analysis">첫 분석 시작하기</button>
      </div>
    `;

    historyGrid.querySelector(".btn-start-analysis")?.addEventListener("click", navigateToUpload);
    return;
  }

  historyGrid.innerHTML = analysisHistory
    .map((item) => createHistoryCard(item))
    .join("");

  // Add event listeners
  historyGrid.querySelectorAll(".history-card").forEach((card, index) => {
    const item = analysisHistory[index];

    card.addEventListener("click", (e) => {
      if (!e.target.closest(".card-delete")) {
        navigateToAnalysis(item.id);
      }
    });

    card.querySelector(".card-delete")?.addEventListener("click", (e) => {
      e.stopPropagation();
      confirmDelete(item.id, item.fileName);
    });
  });
}

/**
 * Create history section if not exists
 */
function createHistorySection() {
  const main = document.querySelector("main") || document.body;

  const section = document.createElement("section");
  section.className = "history-section";
  section.innerHTML = `
    <h3 class="section-title">분석 히스토리</h3>
    <div class="history-grid"></div>
    <button class="load-more-btn" style="display: none;">더 보기</button>
  `;

  main.append(section);

  // Get new references
  const newGrid = section.querySelector(".history-grid");
  const newBtn = section.querySelector(".load-more-btn");

  if (newGrid) {
    window.historyGrid = newGrid;
  }

  newBtn?.addEventListener("click", loadMore);

  // Re-render
  renderHistory();
}

/**
 * Create history card HTML
 */
function createHistoryCard(item) {
  return `
    <div class="history-card" data-id="${item.id}">
      <div class="card-image">
        <img src="${item.imageUrl}" alt="${item.fileName}" loading="lazy">
        <button class="card-delete" title="삭제">
          <img src="./img/delete_white.svg" alt="Delete">
        </button>
      </div>
      <div class="card-content">
        <p class="card-filename">${truncateFileName(item.fileName)}</p>
        <div class="card-meta">
          <span class="card-format">${item.format.label}</span>
          <span class="card-score" style="background: ${getScoreColor(item.score)}">${item.score}</span>
        </div>
        <p class="card-date">${item.createdAt}</p>
        <div class="card-fixscope ${item.fixScope.value.toLowerCase()}">
          ${item.fixScope.label}
        </div>
      </div>
    </div>
  `;
}

/**
 * Update load more button visibility
 */
function updateLoadMoreButton() {
  if (loadMoreBtn) {
    loadMoreBtn.style.display = hasMore ? "block" : "none";
  }
}

// ============================================================================
// Profile Editor
// ============================================================================

/**
 * Open profile editor modal
 */
function openProfileEditor() {
  // Create modal
  const modal = document.createElement("div");
  modal.className = "profile-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>프로필 수정</h3>
      <form class="profile-form">
        <div class="form-group">
          <label for="displayName">이름</label>
          <input type="text" id="displayName" value="${userProfile?.displayName || ""}">
        </div>
        <div class="form-actions">
          <button type="button" class="btn-cancel">취소</button>
          <button type="submit" class="btn-save">저장</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Event handlers
  modal.querySelector(".btn-cancel")?.addEventListener("click", () => {
    modal.remove();
  });

  modal.querySelector(".profile-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const displayName = modal.querySelector("#displayName")?.value?.trim();

    try {
      await updateUserProfile({ displayName });
      toast.success("프로필이 수정되었습니다");
      modal.remove();
      loadUserProfile();
    } catch (error) {
      toast.error("프로필 수정에 실패했습니다");
    }
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// ============================================================================
// Delete Handling
// ============================================================================

/**
 * Confirm and delete analysis
 */
function confirmDelete(analysisId, fileName) {
  if (!confirm(`"${fileName}" 분석을 삭제하시겠습니까?`)) {
    return;
  }

  handleDelete(analysisId);
}

/**
 * Handle delete
 */
async function handleDelete(analysisId) {
  try {
    showLoading("삭제 중...");
    await deleteAnalysis(analysisId);
    hideLoading();

    // Remove from local state
    analysisHistory = analysisHistory.filter((item) => item.id !== analysisId);
    renderHistory();

    // Update profile count
    if (userProfile) {
      userProfile.analysisCount = Math.max(0, userProfile.analysisCount - 1);
      renderProfile();
    }

    toast.success("삭제되었습니다");
  } catch (error) {
    hideLoading();
    console.error("[MyPage] Delete failed:", error);
    toast.error("삭제에 실패했습니다");
  }
}

// ============================================================================
// Sign Out
// ============================================================================

/**
 * Handle sign out
 */
async function handleSignOut() {
  if (!confirm("로그아웃 하시겠습니까?")) {
    return;
  }

  try {
    await signOut();
    toast.success("로그아웃되었습니다");
    navigateToUpload();
  } catch (error) {
    toast.error("로그아웃에 실패했습니다");
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get initials from name
 */
function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate file name
 */
function truncateFileName(name, maxLength = 18) {
  if (!name || name.length <= maxLength) return name || "";
  return name.slice(0, maxLength - 3) + "...";
}

/**
 * Get color based on score
 */
function getScoreColor(score) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

// ============================================================================
// Styles
// ============================================================================

const mypageStyles = `
.mypage_main {
  width: calc(100% - 4vw);
  min-height: 100vh;
  padding: 2vw 3vw;
  background: #FAFAFF;
  margin-left: 4vw;
  box-sizing: border-box;
}

.mypage-header {
  margin-bottom: 2vw;
  padding-bottom: 1.5vw;
  border-bottom: 1px solid #E7E2FF;
}

.mypage-title {
  font-size: 3vw;
  font-weight: 600;
  color: #1B1233;
  margin-bottom: 0.5vw;
  line-height: 1.35;
}

.mypage-subtitle {
  font-size: 1.1vw;
  color: #7C7895;
  line-height: 1.35;
}

.profile-section {
  padding: 1.5vw;
  background: white;
  border-radius: 1vw;
  margin-bottom: 1.5vw;
  box-shadow: 0 0.2vw 0.8vw rgba(135, 92, 255, 0.08);
  transition: box-shadow 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

.profile-section:hover {
  box-shadow: 0 4px 12px rgba(135, 92, 255, 0.12);
}

.profile-header {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #875CFF, #A483FF);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
}

.profile-name {
  font-size: 24px;
  font-weight: 600;
  color: #1B1233;
  margin-bottom: 4px;
}

.profile-email {
  font-size: 14px;
  color: #7C7895;
  margin-bottom: 12px;
}

.profile-stats {
  display: flex;
  gap: 20px;
}

.profile-stats .stat {
  font-size: 14px;
  color: #7C7895;
}

.profile-stats .stat strong {
  color: #875CFF;
  margin-right: 4px;
}

.profile-actions {
  display: flex;
  gap: 12px;
}

.profile-actions button {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit-profile {
  background: #875CFF;
  color: white;
  border: none;
}

.btn-edit-profile:hover {
  background: #7B4FE0;
}

.btn-signout {
  background: white;
  color: #7C7895;
  border: 1px solid #E7E2FF;
}

.btn-signout:hover {
  background: #F6F5F9;
}

.history-section {
  padding: 1.5vw;
  background: transparent;
  width: 100%;
  box-sizing: border-box;
}

.section-title {
  font-size: 1.8vw;
  font-weight: 600;
  color: #1B1233;
  margin-bottom: 1.5vw;
  line-height: 1.35;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18vw, 1fr));
  gap: 1.5vw;
  margin-bottom: 1.5vw;
  width: 100%;
  padding: 0;
}

.history-card {
  background: white;
  border-radius: 0.8vw;
  overflow: hidden;
  box-shadow: 0 0.2vw 0.8vw rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-card:hover {
  transform: translateY(-0.4vw);
  box-shadow: 0 0.6vw 1.6vw rgba(135, 92, 255, 0.15);
}

.card-image {
  position: relative;
  aspect-ratio: 16/10;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.history-card:hover .card-image img {
  transform: scale(1.05);
}

.card-delete {
  position: absolute;
  top: 0.5vw;
  right: 0.5vw;
  width: 2vw;
  height: 2vw;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 2;
}

.history-card:hover .card-delete {
  opacity: 1;
}

.card-delete:hover {
  background: #ef4444;
  transform: scale(1.1);
}

.card-delete img {
  width: 1vw;
  height: 1vw;
}

.card-content {
  padding: 1vw;
}

.card-filename {
  font-size: 1.1vw;
  font-weight: 500;
  color: #1B1233;
  margin-bottom: 0.6vw;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6vw;
}

.card-format {
  font-size: 0.9vw;
  color: #7C7895;
  line-height: 1.35;
}

.card-score {
  font-size: 0.9vw;
  color: white;
  padding: 0.2vw 0.6vw;
  border-radius: 0.8vw;
  font-weight: 600;
  line-height: 1.35;
}

.card-date {
  font-size: 0.8vw;
  color: #A8A8BF;
  margin-bottom: 0.6vw;
  line-height: 1.35;
}

.card-fixscope {
  font-size: 0.8vw;
  padding: 0.3vw 0.6vw;
  border-radius: 0.3vw;
  display: inline-block;
  font-weight: 500;
  line-height: 1.35;
}

.card-fixscope.structurerebuild {
  background: #FEE2E2;
  color: #DC2626;
}

.card-fixscope.detailtuning {
  background: #E0D5FF;
  color: #875CFF;
}

.empty-history {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4vw 2vw;
  color: #7C7895;
  background: white;
  border-radius: 0.8vw;
}

.empty-history p {
  font-size: 1.1vw;
  margin-bottom: 1vw;
  line-height: 1.35;
}

.btn-start-analysis {
  margin-top: 1vw;
  padding: 0.8vw 2vw;
  background: #875CFF;
  color: white;
  border: none;
  border-radius: 0.5vw;
  font-size: 1.1vw;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  line-height: 1.35;
}

.btn-start-analysis:hover {
  background: #7B4FE0;
  transform: translateY(-0.1vw);
}

.load-more-btn {
  display: block;
  margin: 2vw auto;
  padding: 0.8vw 2.5vw;
  background: white;
  color: #875CFF;
  border: 1px solid #E0D5FF;
  border-radius: 0.5vw;
  font-size: 1.1vw;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  line-height: 1.35;
}

.load-more-btn:hover {
  background: #E0D5FF;
  border-color: #875CFF;
}

.load-more-btn.loading {
  opacity: 0.7;
  pointer-events: none;
}

.profile-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(27, 18, 51, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(0.3vw);
}

.profile-modal .modal-content {
  background: white;
  padding: 2vw;
  border-radius: 1vw;
  width: 90%;
  max-width: 30vw;
  box-shadow: 0 1vw 3vw rgba(0, 0, 0, 0.2);
}

.profile-modal h3 {
  margin-bottom: 1.5vw;
  color: #1B1233;
  font-size: 1.8vw;
  font-weight: 600;
  line-height: 1.35;
}

.form-group {
  margin-bottom: 1.2vw;
}

.form-group label {
  display: block;
  margin-bottom: 0.5vw;
  font-size: 1.1vw;
  color: #7C7895;
  font-weight: 500;
  line-height: 1.35;
}

.form-group input {
  width: 100%;
  padding: 0.8vw;
  border: 1px solid #E7E2FF;
  border-radius: 0.5vw;
  font-size: 1.1vw;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  line-height: 1.35;
}

.form-group input:focus {
  outline: none;
  border-color: #875CFF;
}

.form-actions {
  display: flex;
  gap: 0.8vw;
  justify-content: flex-end;
  margin-top: 1.5vw;
}

.form-actions button {
  padding: 0.7vw 1.5vw;
  border-radius: 0.5vw;
  font-size: 1.1vw;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  line-height: 1.35;
}

.btn-cancel {
  background: white;
  border: 1px solid #E7E2FF;
  color: #7C7895;
}

.btn-cancel:hover {
  background: #F6F5F9;
}

.btn-save {
  background: #875CFF;
  border: none;
  color: white;
}

.btn-save:hover {
  background: #7B4FE0;
}
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = mypageStyles;
document.head.appendChild(styleSheet);

// ============================================================================
// Initialize
// ============================================================================

function init() {
  console.log("[MyPage] Initializing my page...");

  // Load data
  loadUserProfile();
  loadAnalysisHistory();

  // Setup load more button
  loadMoreBtn?.addEventListener("click", loadMore);
}

// Wait for app initialization
window.addEventListener("dysapp:ready", init);

// Also try immediate init if already ready
if (window.dysapp?.initialized) {
  init();
}
