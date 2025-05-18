
"use client";

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Assuming auth is correctly exported from firebase.ts
import type { AuthCredentials, SignUpCredentials } from '@/types/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  signUp: (credentials: SignUpCredentials) => Promise<User | null>;
  login: (credentials: AuthCredentials) => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth not initialized. Skipping onAuthStateChanged listener.");
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      setError(null); // Clear previous errors on auth state change
    }, (err) => {
      console.error("Auth state change error:", err);
      setError(err.message || "An error occurred during authentication state change.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async ({ email, password, displayName }: SignUpCredentials): Promise<User | null> => {
    if (!auth) {
      setError("Firebase Auth is not initialized. Cannot sign up.");
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user && displayName) {
        await updateProfile(userCredential.user, { displayName });
        // Refresh user to get updated profile
        setCurrentUser({ ...userCredential.user, displayName }); 
      }
      setLoading(false);
      return userCredential.user;
    } catch (err: any) {
      setError(err.message || "Failed to sign up.");
      setLoading(false);
      return null;
    }
  };

  const login = async ({ email, password }: AuthCredentials): Promise<User | null> => {
    if (!auth) {
      setError("Firebase Auth is not initialized. Cannot log in.");
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      return userCredential.user;
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
      setLoading(false);
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    if (!auth) {
      setError("Firebase Auth is not initialized. Cannot log out.");
      return;
    }
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      setError(err.message || "Failed to log out.");
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    setError,
    signUp,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
