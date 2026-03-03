import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration - same project as Nutriminerals (coste cero)
const firebaseConfig = {
    apiKey: "AIzaSyDtTsAXwmT2EXTHjmORbH98F4L6fVBQrs8",
    authDomain: "nutri-minerals.firebaseapp.com",
    projectId: "nutri-minerals",
    storageBucket: "nutri-minerals.firebasestorage.app",
    messagingSenderId: "716797015356",
    appId: "1:716797015356:web:7ed40fd95500327953da39"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// App constants
export const APP_ID = 'vivo_app';
export const SHARED_USER_ID = 'lFxF03U8OjgJo8teUltrcKjAGPJ2';
export const ATHLETE_ID = 'i10474';

// API keys — loaded from .env (NEVER hardcode here)
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
export const INTERVALS_API_KEY = import.meta.env.VITE_INTERVALS_API_KEY || '';
