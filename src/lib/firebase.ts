import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// import { getFirestore, type Firestore } from "firebase/firestore"; // We'll use this later

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
// let db: Firestore; // We'll use this later

// Initialize Firebase only on the client side and only once
if (typeof window !== 'undefined' && !getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // db = getFirestore(app); // We'll initialize Firestore later
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // Optionally, provide a more user-friendly error or fallback
  }
} else if (getApps().length > 0) {
  app = getApps()[0];
  auth = getAuth(app);
  // db = getFirestore(app); // We'll initialize Firestore later
}

// Export the Firebase services. Ensure auth is exported even if initialization fails,
// so app doesn't break, but auth-dependent features would need handling.
// @ts-ignore
export { app, auth }; // Add db here later
