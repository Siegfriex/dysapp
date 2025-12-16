/**
 * Firebase Service
 * Firebase SDK initialization and core utilities
 * Reference: docs/dysapp_PRD.md - Section 7.2
 */

// Firebase SDK imports (using CDN/ES Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-functions.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

// ============================================================================
// Firebase Configuration
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBIAU8_4IxFVO4XpeHHggn8nIIbzWLBiRw",
  authDomain: "dysapp1210.firebaseapp.com",
  projectId: "dysapp1210",
  storageBucket: "dysapp1210.firebasestorage.app",
  messagingSenderId: "702244172468",
  appId: "1:702244172468:web:795097d671c2b7944a9de1",
  measurementId: "G-H9VK5Q2LXN"
};

// ============================================================================
// Initialize Firebase
// ============================================================================

let app;
let auth;
let db;
let functions;
let storage;

/**
 * Initialize Firebase services
 */
export function initializeFirebase() {
  if (app) {
    return { app, auth, db, functions, storage };
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app, "asia-northeast3");
  storage = getStorage(app);

  // Connect to emulators in development
  if (window.location.hostname === "localhost") {
    console.log("[Firebase] Connecting to emulators...");
    connectFunctionsEmulator(functions, "localhost", 5001);
    // Note: Add other emulator connections if needed
  }

  console.log("[Firebase] Initialized successfully");
  return { app, auth, db, functions, storage };
}

// ============================================================================
// Authentication
// ============================================================================

let currentUser = null;

/**
 * Get current authenticated user
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback) {
  if (!auth) initializeFirebase();

  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    callback(user);
  });
}

/**
 * Sign in anonymously with retry logic
 */
export async function signInAnonymouslyUser(retries = 3, delay = 1000) {
  if (!auth) initializeFirebase();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await signInAnonymously(auth);
      currentUser = result.user;
      console.log("[Auth] Signed in anonymously:", result.user.uid);
      return result.user;
    } catch (error) {
      const errorCode = error.code || error.message;
      
      // configuration-not-found 에러는 재시도해도 의미 없음
      if (errorCode.includes("configuration-not-found")) {
        console.error("[Auth] Anonymous authentication not enabled in Firebase Console");
        throw new Error(
          "익명 인증이 활성화되지 않았습니다. Firebase Console에서 Anonymous Authentication을 활성화해주세요."
        );
      }

      // 마지막 시도가 아니면 재시도
      if (attempt < retries) {
        console.warn(`[Auth] Anonymous sign-in failed (attempt ${attempt}/${retries}), retrying...`);
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        continue;
      }

      // 모든 시도 실패
      console.error("[Auth] Anonymous sign-in failed after all retries:", error);
      throw error;
    }
  }
}

/**
 * Ensure user is authenticated (sign in anonymously if not)
 * Includes timeout and better error handling
 */
export async function ensureAuth(timeout = 10000) {
  if (!auth) initializeFirebase();

  // Already authenticated
  if (currentUser) {
    return currentUser;
  }

  return new Promise((resolve, reject) => {
    let resolved = false;
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error("인증 시간 초과. 네트워크 연결을 확인해주세요."));
      }
    }, timeout);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (resolved) return;
      
      unsubscribe();
      clearTimeout(timeoutId);
      
      if (user) {
        currentUser = user;
        resolved = true;
        resolve(user);
      } else {
        try {
          const newUser = await signInAnonymouslyUser();
          if (!resolved) {
            resolved = true;
            resolve(newUser);
          }
        } catch (error) {
          if (!resolved) {
            resolved = true;
            reject(error);
          }
        }
      }
    });
  });
}

/**
 * Sign out
 */
export async function signOut() {
  if (!auth) initializeFirebase();

  try {
    await firebaseSignOut(auth);
    currentUser = null;
    console.log("[Auth] Signed out");
  } catch (error) {
    console.error("[Auth] Sign-out failed:", error);
    throw error;
  }
}

// ============================================================================
// Cloud Functions Callable
// ============================================================================

/**
 * Get callable function reference
 */
export function getCallable(functionName) {
  if (!functions) initializeFirebase();
  return httpsCallable(functions, functionName);
}

/**
 * Call a Cloud Function
 */
export async function callFunction(functionName, data = {}) {
  const callable = getCallable(functionName);

  try {
    const result = await callable(data);
    return result.data;
  } catch (error) {
    console.error(`[Functions] ${functionName} failed:`, error);
    throw error;
  }
}

// ============================================================================
// Firestore Utilities
// ============================================================================

/**
 * Get Firestore instance
 */
export function getFirestoreInstance() {
  if (!db) initializeFirebase();
  return db;
}

/**
 * Get document by ID
 */
export async function getDocument(collectionName, docId) {
  if (!db) initializeFirebase();

  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`[Firestore] Get document failed:`, error);
    throw error;
  }
}

/**
 * Query documents
 */
export async function queryDocuments(collectionName, constraints = []) {
  if (!db) initializeFirebase();

  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(`[Firestore] Query failed:`, error);
    throw error;
  }
}

// ============================================================================
// Storage Utilities
// ============================================================================

/**
 * Get Storage instance
 */
export function getStorageInstance() {
  if (!storage) initializeFirebase();
  return storage;
}

/**
 * Upload file to Storage
 */
export async function uploadFile(path, file) {
  if (!storage) initializeFirebase();

  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.error("[Storage] Upload failed:", error);
    throw error;
  }
}

// ============================================================================
// Export Firestore query helpers
// ============================================================================

export { collection, doc, query, where, orderBy, limit, startAfter };

// ============================================================================
// Auto-initialize on module load
// ============================================================================

initializeFirebase();
