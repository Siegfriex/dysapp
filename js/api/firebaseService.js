// Firebase SDK 초기화 및 서비스 설정
// 참조: dysapp_TSD.md Section 4, dysapp_APISPEC.md
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-functions.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js';
import { firebaseConfig } from './firebaseConfig.js';

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const functions = getFunctions(app, 'asia-northeast3');
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 익명 인증 자동 실행
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    try {
      await signInAnonymously(auth);
      console.log('익명 인증 완료:', auth.currentUser?.uid);
    } catch (error) {
      console.error('익명 인증 실패:', error);
    }
  }
});

// 현재 사용자 ID 가져오기 (Promise 기반)
export function getCurrentUserId() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // 첫 이벤트 후 구독 해제
      resolve(user ? user.uid : null);
    });
  });
}

