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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  getIdToken: async () => null,
});

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    const { getFirebaseAuth } = await import("@/lib/firebase");
    const { signInWithPopup, GoogleAuthProvider } = await import(
      "firebase/auth"
    );
    const provider = new GoogleAuthProvider();
    await signInWithPopup(getFirebaseAuth(), provider);
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
      value={{ user, loading, signInWithGoogle, signOut, getIdToken }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export const useFirebaseAuth = () => useContext(FirebaseAuthContext);
