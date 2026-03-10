"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";

interface FirebaseAuthContextType {
  user: User | null;
  loading: boolean;
  signInError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType>({
  user: null,
  loading: true,
  signInError: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  getIdToken: async () => null,
});

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      const { getFirebaseAuth } = await import("@/lib/firebase");
      const { onAuthStateChanged } = await import("firebase/auth");
      const firebaseAuth = getFirebaseAuth();
      unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
    }

    init();
    return () => unsubscribe?.();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setSignInError(null);
    try {
      const { getFirebaseAuth } = await import("@/lib/firebase");
      const { signInWithPopup, signInWithRedirect, GoogleAuthProvider } =
        await import("firebase/auth");
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (popupErr: unknown) {
        // Popup blocked or failed — fall back to redirect
        const code = (popupErr as { code?: string })?.code;
        if (
          code === "auth/popup-blocked" ||
          code === "auth/popup-closed-by-user" ||
          code === "auth/cancelled-popup-request"
        ) {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupErr;
        }
      }
    } catch (err: unknown) {
      console.error("Google sign-in failed:", err);
      const code = (err as { code?: string })?.code;
      const msg = (err as { message?: string })?.message;
      setSignInError(code || msg || "Sign-in failed. Please try again.");
    }
  }, []);

  const signOut = useCallback(async () => {
    const { getFirebaseAuth } = await import("@/lib/firebase");
    const { signOut: firebaseSignOut } = await import("firebase/auth");
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  return (
    <FirebaseAuthContext.Provider
      value={{ user, loading, signInError, signInWithGoogle, signOut, getIdToken }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export const useFirebaseAuth = () => useContext(FirebaseAuthContext);
