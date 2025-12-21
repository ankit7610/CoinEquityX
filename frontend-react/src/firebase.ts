import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

export const firebaseReady = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (import.meta.env.MODE === 'development') {
  const key = firebaseConfig.apiKey;
  const maskedKey = key ? `${key.slice(0, 4)}...${key.slice(-4)}` : 'missing';
  console.info('[firebase] config', {
    apiKey: maskedKey,
    authDomain: firebaseConfig.authDomain || 'missing',
    projectId: firebaseConfig.projectId || 'missing'
  });
}

if (firebaseReady) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  console.warn('[firebase] Missing config. Firebase auth is disabled.');
}

export { app, auth };
export default app;
