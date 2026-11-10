import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_firebase_api_key' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your-project-id'
);

let app = null;
let auth = null;
let db = null;
let functions = null;
let appCheck = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    const region = import.meta.env?.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1';
    functions = getFunctions(app, region);

    // Initialize Firebase App Check if reCAPTCHA v3 key is configured
    const recaptchaSiteKey = import.meta.env?.VITE_RECAPTCHA_V3_SITE_KEY;
    if (typeof window !== 'undefined' && recaptchaSiteKey && recaptchaSiteKey !== 'your_recaptcha_v3_site_key') {
      if (import.meta.env?.VITE_APPCHECK_DEBUG_TOKEN === 'true') {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });
    }

    // Connect to Firebase Emulator Suite when enabled in development
    if (import.meta.env?.VITE_USE_FIREBASE_EMULATORS === 'true' && typeof window !== 'undefined' && !window.__EMULATORS_CONNECTED__) {
      const firestoreHost = (import.meta.env?.VITE_FIRESTORE_EMULATOR_HOST || 'localhost:8080').split(':');
      const authUrl = import.meta.env?.VITE_AUTH_EMULATOR_HOST || 'http://localhost:9099';
      const functionsHost = (import.meta.env?.VITE_FUNCTIONS_EMULATOR_HOST || 'localhost:5001').split(':');

      connectFirestoreEmulator(db, firestoreHost[0], Number(firestoreHost[1] || 8080));
      connectAuthEmulator(auth, authUrl, { disableWarnings: true });
      connectFunctionsEmulator(functions, functionsHost[0], Number(functionsHost[1] || 5001));
      window.__EMULATORS_CONNECTED__ = true;
    }
  } catch (err) {
    console.error('Error initializing Firebase SDK:', err);
  }
}

export { app, auth, db, functions, appCheck, firebaseConfig };
