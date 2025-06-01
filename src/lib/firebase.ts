
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

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let storage: FirebaseStorage | undefined = undefined;
let db: Firestore | undefined = undefined;

// Initialize Firebase only on the client side and only once
if (typeof window !== 'undefined') {
  if (!getApps().length) {
    try {
      // Basic validation of essential config keys
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error("Firebase config is missing apiKey or projectId. Aborting initialization.");
      } else {
        app = initializeApp(firebaseConfig);
        // Only initialize other services if app was initialized successfully
        if (app) {
          auth = getAuth(app);
          storage = getStorage(app);
          db = getFirestore(app);
          // console.log("Firebase initialized successfully with Auth, Storage, and Firestore.");
        } else {
          console.error("Firebase app initialization failed, services not initialized.");
        }
      }
    } catch (error) {
      console.error("Firebase initialization error:", error);
      // app, auth, storage, db will remain undefined
    }
  } else {
    app = getApps()[0]; // If apps exist, app is already initialized
    // Ensure auth, storage, db are also assigned if app exists from previous init
    if (app) {
        auth = getAuth(app);
        storage = getStorage(app);
        db = getFirestore(app);
    }
  }
}

// Export the Firebase services. They might be undefined if initialization failed.
export { app, auth, storage, db };
