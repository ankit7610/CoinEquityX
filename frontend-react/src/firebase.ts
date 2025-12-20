import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDjusbe810AzufaLf0cnatY-Mk2vdb23y0",
  authDomain: "cryptox-f55b0.firebaseapp.com",
  projectId: "cryptox-f55b0",
  storageBucket: "cryptox-f55b0.firebasestorage.app",
  messagingSenderId: "935668500484",
  appId: "1:935668500484:web:b3c6564ad729f5f3258d51",
  measurementId: "G-2MV3QG0QM4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
