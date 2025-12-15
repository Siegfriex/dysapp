/**
 * dysapp Main Application Script
 * Initializes Firebase and provides global utilities
 */

import { initializeFirebase, ensureAuth, onAuthChange } from "../services/firebaseService.js";

// ============================================================================
// Global App State
// ============================================================================

window.dysapp = {
  initialized: false,
  user: null,
  loading: false,
};

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the application
 */
export async function initApp() {
  if (window.dysapp.initialized) {
    return;
  }

  console.log("[App] Initializing dysapp...");

  // Initialize Firebase
  initializeFirebase();

  // Listen for auth state changes
  onAuthChange((user) => {
    window.dysapp.user = user;
    if (user) {
      console.log("[App] User authenticated:", user.uid);
    } else {
      console.log("[App] User not authenticated");
    }
  });

  // Ensure user is authenticated
  try {
    await ensureAuth();
  } catch (error) {
    console.error("[App] Auth failed:", error);
  }

  window.dysapp.initialized = true;
  console.log("[App] Initialization complete");

  // Dispatch ready event
  window.dispatchEvent(new CustomEvent("dysapp:ready"));
}

// ============================================================================
// Loading State Management
// ============================================================================

/**
 * Show loading overlay
 */
export function showLoading(message = "처리 중...") {
  window.dysapp.loading = true;

  // Create or update loading overlay
  let overlay = document.getElementById("dysapp-loading");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "dysapp-loading";
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-message">${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.querySelector(".loading-message").textContent = message;
    overlay.style.display = "flex";
  }
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
  window.dysapp.loading = false;
  const overlay = document.getElementById("dysapp-loading");
  if (overlay) {
    overlay.style.display = "none";
  }
}

// ============================================================================
// Toast Notifications
// ============================================================================

/**
 * Show toast notification
 */
export function showToast(message, type = "info", duration = 3000) {
  // Create toast container if not exists
  let container = document.getElementById("dysapp-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "dysapp-toast-container";
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.className = `dysapp-toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

/**
 * Shorthand toast methods
 */
export const toast = {
  success: (msg, duration) => showToast(msg, "success", duration),
  error: (msg, duration) => showToast(msg, "error", duration),
  warning: (msg, duration) => showToast(msg, "warning", duration),
  info: (msg, duration) => showToast(msg, "info", duration),
};

// ============================================================================
// Navigation Helpers
// ============================================================================

/**
 * Navigate to analysis page with ID
 */
export function navigateToAnalysis(analysisId) {
  localStorage.setItem("lastAnalysisId", analysisId);
  window.location.href = `analyze.html?id=${analysisId}`;
}

/**
 * Navigate to search page
 */
export function navigateToSearch() {
  window.location.href = "searchTab.html";
}

/**
 * Navigate to upload page
 */
export function navigateToUpload() {
  window.location.href = "index.html";
}

/**
 * Get URL parameter
 */
export function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// ============================================================================
// CSS Injection for Loading & Toast
// ============================================================================

const styles = `
#dysapp-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #E0D5FF;
  border-top-color: #875CFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-message {
  color: #1B1233;
  font-size: 14px;
}

#dysapp-toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dysapp-toast {
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.3s ease;
  max-width: 300px;
}

.dysapp-toast.show {
  opacity: 1;
  transform: translateX(0);
}

.toast-success { background: #22c55e; }
.toast-error { background: #ef4444; }
.toast-warning { background: #f97316; }
.toast-info { background: #875CFF; }
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// ============================================================================
// Auto-initialize on DOM ready
// ============================================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
