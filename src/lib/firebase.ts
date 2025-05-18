
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore"; // Import Firestore

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;
let db: Firestore; // Declare Firestore db

// Initialize Firebase only on the client side and only once
if (typeof window !== 'undefined' && !getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    storage = getStorage(app);
    db = getFirestore(app); // Initialize Firestore
    console.log("Firebase initialized successfully with Auth, Storage, and Firestore.");
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else if (getApps().length > 0) {
  app = getApps()[0];
  auth = getAuth(app);
  storage = getStorage(app);
  db = getFirestore(app); // Get existing Firestore instance
}

// Export the Firebase services.
// @ts-ignore
export { app, auth, storage, db }; // Export db
