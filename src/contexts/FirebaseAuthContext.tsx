"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Auth, User } from "firebase/auth";

interface FirebaseAuthContextType {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  signInError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType>({
  user: null,
  loading: true,
  signingIn: false,
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
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

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
    setSigningIn(true);
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
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await _authReady;
    await _authModule!.signOut(_authInstance!);
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  return (
    <FirebaseAuthContext.Provider
      value={{ user, loading, signingIn, signInError, signInWithGoogle, signOut, getIdToken }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export const useFirebaseAuth = () => useContext(FirebaseAuthContext);
