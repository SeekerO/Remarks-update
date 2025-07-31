import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_CHAT,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_CHAT,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL_CHAT,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_CHAT,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_CHAT,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_CHAT,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_CHAT,
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, db, storage };
