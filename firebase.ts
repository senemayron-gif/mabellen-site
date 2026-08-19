import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken as firebaseGetToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa o Firebase de forma segura para o Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Inicializa o messaging apenas no navegador (client-side)
let messaging: any = null;
if (typeof window !== "undefined") {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.error("Erro ao inicializar o Firebase Messaging:", err);
  }
}

export { messaging, firebaseGetToken as getToken };