// ============================================================================
// Settings Page Logic
// ============================================================================

import { getUserProfile } from '../services/apiService.js';
import { signOut } from '../services/firebaseService.js';

// State
let userSettings = {
  defaultFormat: 'all',
  theme: 'light',
  notifications: true,
  language: 'ko'
};

// ============================================================================
// Initialization
// ============================================================================

function init() {
  console.log('[Settings] Initializing settings page...');
  
  // Set active navigation
  setActiveNavigation();
  
  // Initialize page
  initializeSettingsPage();
}

async function initializeSettingsPage() {
  try {
    console.log('[Settings] 환경설정 페이지 초기화 시작');
    
    // Load user settings (don't block rendering if it fails)
    loadUserSettings().catch(err => {
      console.warn('[Settings] 설정 로드 실패, 기본값 사용:', err);
    });
    
    // Render settings sections immediately
    renderSettings();
    
    // Setup event listeners after rendering
    setTimeout(() => {
      setupEventListeners();
    }, 100);
    
    console.log('[Settings] 환경설정 페이지 초기화 완료');
  } catch (error) {
    console.error('[Settings] 설정 페이지 초기화 오류:', error);
    // Even if there's an error, try to render basic content
    renderSettings();
  }
}

/**
 * Set active navigation state for current page
 */
function setActiveNavigation() {
  // Wait for nav.html to be loaded by includHTML.js
  setTimeout(() => {
    const navLinks = document.querySelectorAll('.nav_tab a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.includes('settings.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }, 200);
}

// Wait for app initialization
window.addEventListener('dysapp:ready', init);

// Also try immediate init if already ready
if (window.dysapp?.initialized) {
  init();
}

// Fallback: if dysapp:ready never fires, initialize after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (!window.dysapp?.initialized) {
      console.warn('[Settings] dysapp:ready 이벤트를 기다리지 않고 초기화합니다');
      init();
    }
  }, 500);
});

// ============================================================================
// Load User Settings
// ============================================================================

async function loadUserSettings() {
  try {
    const profile = await getUserProfile();
    if (profile?.preferences) {
      userSettings = {
        ...userSettings,
        ...profile.preferences
      };
    }
    
    // Load from localStorage as fallback
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      userSettings = { ...userSettings, ...JSON.parse(savedSettings) };
    }
  } catch (error) {
    console.error('설정 로드 오류:', error);
  }
}

// ============================================================================
// Render Settings
// ============================================================================

function renderSettings() {
  const settingsContent = document.querySelector('.settings-content');
  if (!settingsContent) {
    console.error('[Settings] settings-content 요소를 찾을 수 없습니다. DOM 상태:', {
      body: document.body ? '존재' : '없음',
      settingsMain: document.querySelector('.settings_main') ? '존재' : '없음',
      settingsHeader: document.querySelector('.settings-header') ? '존재' : '없음'
    });
    
    // Retry after a short delay
    setTimeout(() => {
      const retryContent = document.querySelector('.settings-content');
      if (retryContent) {
        console.log('[Settings] 재시도: 설정 섹션 렌더링');
        renderSettings();
      } else {
        console.error('[Settings] 재시도 실패: settings-content 요소를 찾을 수 없습니다');
      }
    }, 200);
    return;
  }

  console.log('[Settings] 설정 섹션 렌더링 시작');
  settingsContent.innerHTML = `
    <!-- Analysis Settings -->
    <section class="settings-section">
      <h2 class="settings-section-title">분석 설정</h2>
      <div class="settings-group">
        <label class="settings-label">기본 분석 포맷</label>
        <select id="defaultFormat" class="settings-select">
          <option value="all" ${userSettings.defaultFormat === 'all' ? 'selected' : ''}>모든 포맷</option>
          <option value="UX_UI" ${userSettings.defaultFormat === 'UX_UI' ? 'selected' : ''}>UX/UI</option>
          <option value="Editorial" ${userSettings.defaultFormat === 'Editorial' ? 'selected' : ''}>Editorial</option>
          <option value="Poster" ${userSettings.defaultFormat === 'Poster' ? 'selected' : ''}>Poster</option>
        </select>
      </div>
    </section>

    <!-- Appearance Settings -->
    <section class="settings-section">
      <h2 class="settings-section-title">표시 설정</h2>
      <div class="settings-group">
        <label class="settings-label">테마</label>
        <select id="themeSetting" class="settings-select">
          <option value="light" ${userSettings.theme === 'light' ? 'selected' : ''}>라이트 모드</option>
          <option value="dark" ${userSettings.theme === 'dark' ? 'selected' : ''}>다크 모드</option>
        </select>
      </div>
      <div class="settings-group">
        <label class="settings-label">언어</label>
        <select id="languageSetting" class="settings-select">
          <option value="ko" ${userSettings.language === 'ko' ? 'selected' : ''}>한국어</option>
          <option value="en" ${userSettings.language === 'en' ? 'selected' : ''}>English</option>
        </select>
      </div>
    </section>

    <!-- Notification Settings -->
    <section class="settings-section">
      <h2 class="settings-section-title">알림 설정</h2>
      <div class="settings-group">
        <label class="settings-toggle-label">
          <input type="checkbox" id="notificationsSetting" class="settings-toggle" ${userSettings.notifications ? 'checked' : ''}>
          <span class="settings-toggle-text">알림 받기</span>
        </label>
      </div>
    </section>

    <!-- Account Actions -->
    <section class="settings-section">
      <h2 class="settings-section-title">계정</h2>
      <div class="settings-actions">
        <a href="./mypage.html" class="settings-action-link">프로필 관리</a>
        <button class="settings-action-btn" id="logoutBtn">로그아웃</button>
      </div>
    </section>
  `;
  
  console.log('[Settings] 설정 섹션 렌더링 완료, innerHTML 길이:', settingsContent.innerHTML.length);
}

// ============================================================================
// Event Handlers
// ============================================================================

function setupEventListeners() {
  // Default format change
  const defaultFormatSelect = document.getElementById('defaultFormat');
  if (defaultFormatSelect) {
    defaultFormatSelect.addEventListener('change', (e) => {
      userSettings.defaultFormat = e.target.value;
      saveSettings();
    });
  }

  // Theme change
  const themeSelect = document.getElementById('themeSetting');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      userSettings.theme = e.target.value;
      applyTheme(e.target.value);
      saveSettings();
    });
  }

  // Language change
  const languageSelect = document.getElementById('languageSetting');
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      userSettings.language = e.target.value;
      saveSettings();
    });
  }

  // Notifications toggle
  const notificationsToggle = document.getElementById('notificationsSetting');
  if (notificationsToggle) {
    notificationsToggle.addEventListener('change', (e) => {
      userSettings.notifications = e.target.checked;
      saveSettings();
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

async function saveSettings() {
  try {
    // Save to localStorage
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
    
    // TODO: Save to backend via API
    // await apiService.updateUserPreferences(userSettings);
    
    console.log('설정 저장됨:', userSettings);
  } catch (error) {
    console.error('설정 저장 오류:', error);
  }
}

async function handleLogout() {
  if (!confirm('로그아웃하시겠습니까?')) {
    return;
  }
  
  try {
    await signOut();
    window.location.href = './index.html';
  } catch (error) {
    console.error('로그아웃 오류:', error);
    alert('로그아웃 중 오류가 발생했습니다.');
  }
}

// ============================================================================
// Styles
// ============================================================================

const settingsStyles = `
/* ============================================================================
   Settings Page Layout - Exact Match to 71.svg, 72.svg (1920x1080 기준)
   ============================================================================ */

.settings_main {
  width: calc(100% - 4vw);
  min-height: 100vh;
  padding: 7.84vw 7.84vw 0 7.84vw;
  background: var(--background);
  margin-left: 4vw;
  box-sizing: border-box;
  font-family: 'SUITE', 'Rubik', sans-serif;
}

.settings-header {
  margin-bottom: 3vw;
}

.settings-title {
  font-size: var(--text-large);
  font-weight: 700;
  color: var(--navy);
  margin: 0;
  letter-spacing: -0.02em;
  line-height: var(--line-height-tight);
}

.settings-content {
  max-width: 60vw;
  display: flex;
  flex-direction: column;
  gap: 3vw;
}

/* Settings Section */
.settings-section {
  background: white;
  border-radius: 1vw;
  padding: 2.5vw;
  border: 1px solid var(--purpleGy);
}

.settings-section-title {
  font-size: var(--text-medium);
  font-weight: 700;
  color: var(--navy);
  margin: 0 0 2vw 0;
  letter-spacing: -0.02em;
  line-height: var(--line-height-tight);
}

.settings-group {
  margin-bottom: 2vw;
}

.settings-group:last-child {
  margin-bottom: 0;
}

.settings-label {
  display: block;
  font-size: var(--text-small);
  font-weight: 600;
  color: var(--navy);
  margin-bottom: 0.8vw;
}

.settings-select {
  width: 100%;
  padding: 1vw 1.2vw;
  border-radius: 0.5vw;
  background: white;
  border: 1px solid var(--purpleGy);
  font-size: var(--text-small);
  color: var(--navy);
  cursor: pointer;
  transition: all var(--ease-smooth) 0.2s;
  font-family: 'SUITE', 'Rubik', sans-serif;
}

.settings-select:hover {
  border-color: var(--purpleF);
}

.settings-select:focus {
  outline: none;
  border-color: var(--purpleMain);
  box-shadow: 0 0 0 0.2vw rgba(135, 92, 255, 0.1);
}

/* Toggle Switch */
.settings-toggle-label {
  display: flex;
  align-items: center;
  gap: 1vw;
  cursor: pointer;
}

.settings-toggle {
  width: 3.5vw;
  height: 1.8vw;
  appearance: none;
  background: var(--purpleGy);
  border-radius: 1vw;
  position: relative;
  cursor: pointer;
  transition: all var(--ease-smooth) 0.2s;
}

.settings-toggle::before {
  content: '';
  position: absolute;
  width: 1.4vw;
  height: 1.4vw;
  border-radius: 50%;
  background: white;
  top: 0.2vw;
  left: 0.2vw;
  transition: all var(--ease-smooth) 0.2s;
  box-shadow: 0 0.1vw 0.3vw rgba(0,0,0,0.2);
}

.settings-toggle:checked {
  background: var(--purpleMain);
}

.settings-toggle:checked::before {
  left: 1.9vw;
}

.settings-toggle-text {
  font-size: var(--text-small);
  color: var(--navy);
  font-weight: 500;
}

/* Settings Actions */
.settings-actions {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.settings-action-link,
.settings-action-btn {
  width: 100%;
  padding: 1.2vw 0;
  background: white;
  border: none;
  border-bottom: 1px solid #EEE;
  font-size: var(--text-small);
  font-weight: 500;
  color: var(--purpleMain);
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  transition: all var(--ease-smooth) 0.2s;
  font-family: 'SUITE', 'Rubik', sans-serif;
}

.settings-action-link:last-child,
.settings-action-btn:last-child {
  border-bottom: none;
}

.settings-action-link:hover,
.settings-action-btn:hover {
  background: #F9F9F9;
  padding-left: 0.5vw;
}

.settings-action-btn {
  color: #EF4444;
}

.settings-action-btn:hover {
  background: #FEE2E2;
}

/* ============================================================================
   Responsive Design
   ============================================================================ */
@media (max-width: 1024px) {
  .settings-content {
    max-width: 80vw;
  }
}

@media (max-width: 768px) {
  .settings_main {
    width: 100%;
    margin-left: 0;
    padding: 5vw;
  }
  
  .settings-title {
    font-size: 5vw;
  }
  
  .settings-content {
    max-width: 100%;
    gap: 5vw;
  }
  
  .settings-section {
    padding: 5vw;
  }
  
  .settings-section-title {
    font-size: 4vw;
    margin-bottom: 4vw;
  }
  
  .settings-label {
    font-size: 3.5vw;
    margin-bottom: 2vw;
  }
  
  .settings-select {
    padding: 3vw 4vw;
    font-size: 3.5vw;
  }
  
  .settings-toggle {
    width: 12vw;
    height: 6vw;
  }
  
  .settings-toggle::before {
    width: 4.5vw;
    height: 4.5vw;
    top: 0.75vw;
    left: 0.75vw;
  }
  
  .settings-toggle:checked::before {
    left: 7vw;
  }
  
  .settings-toggle-text {
    font-size: 3.5vw;
  }
  
  .settings-action-link,
  .settings-action-btn {
    padding: 4vw 0;
    font-size: 3.5vw;
  }
}
`;

// Inject styles immediately
(function() {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = settingsStyles;
  document.head.appendChild(styleSheet);
})();
