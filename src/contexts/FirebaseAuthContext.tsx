"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Auth, User } from "firebase/auth";

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

// Cached module references — resolved once, reused on every call
let _authInstance: Auth | null = null;
let _authModule: typeof import("firebase/auth") | null = null;
const _authReady: Promise<void> = (typeof window !== "undefined")
  ? import("@/lib/firebase").then(async ({ getFirebaseAuth }) => {
      const mod = await import("firebase/auth");
      _authInstance = getFirebaseAuth();
      _authModule = mod;
    })
  : Promise.resolve();

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInError, setSignInError] = useState<string | null>(null);
  const userRef = useRef<User | null>(null);

  // Keep ref in sync so getIdToken always sees latest user without re-creating
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    _authReady.then(() => {
      if (!_authInstance || !_authModule) return;
      unsubscribe = _authModule.onAuthStateChanged(_authInstance, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
    });

    return () => unsubscribe?.();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setSignInError(null);
    try {
      await _authReady;
      const auth = _authInstance!;
      const { signInWithPopup, signInWithRedirect, GoogleAuthProvider } = _authModule!;
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (popupErr: unknown) {
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
    await _authReady;
    await _authModule!.signOut(_authInstance!);
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    const u = userRef.current;
    if (!u) return null;
    return u.getIdToken();
  }, []);

  return (
    <FirebaseAuthContext.Provider
      value={{ user, loading, signInError, signInWithGoogle, signOut, getIdToken }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export const useFirebaseAuth = () => useContext(FirebaseAuthContext);
