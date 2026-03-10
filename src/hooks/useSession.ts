"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SESSION_TOKEN_HEADER } from "@/types";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import type { PlayerResponse, ApiResponse } from "@/types";

const STORAGE_KEY = "glickglick_session";

interface SessionState {
  token: string | null;
  player: PlayerResponse | null;
  loading: boolean;
  error: string | null;
}

export function useSession() {
  const { user: firebaseUser, loading: firebaseLoading, getIdToken } = useFirebaseAuth();
  const [state, setState] = useState<SessionState>({
    token: null,
    player: null,
    loading: true,
    error: null,
  });
  // Track whether session has been initialized to prevent redundant re-runs
  const initialized = useRef(false);
  // Track the current Firebase user identity to detect auth changes
  const lastFirebaseUid = useRef<string | null | undefined>(undefined);
  // Refs for stable callbacks (avoids re-creating buildAuthHeaders/fetchWithSession)
  const firebaseUserRef = useRef(firebaseUser);
  const tokenRef = useRef(state.token);

  useEffect(() => { firebaseUserRef.current = firebaseUser; }, [firebaseUser]);
  useEffect(() => { tokenRef.current = state.token; }, [state.token]);

  // Build auth headers — stable callback, reads refs
  const buildAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (firebaseUserRef.current) {
      const idToken = await getIdToken();
      if (idToken) {
        return { Authorization: `Bearer ${idToken}` };
      }
    }

    const storedToken =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (storedToken) {
      return { [SESSION_TOKEN_HEADER]: storedToken };
    }

    return {};
  }, [getIdToken]);

  // Initialize session from Firebase or localStorage
  const initSession = useCallback(async () => {
    const currentUid = firebaseUser?.uid ?? null;
    const authChanged = lastFirebaseUid.current !== undefined && lastFirebaseUid.current !== currentUid;
    lastFirebaseUid.current = currentUid;

    if (initialized.current && !authChanged) {
      return;
    }

    // On auth change, keep existing player data visible while re-fetching
    setState((prev) => ({
      ...prev,
      loading: !initialized.current,
      error: null,
    }));

    try {
      const headers = await buildAuthHeaders();

      // If Firebase user exists and we have an anonymous session token,
      // send both headers so the server can attempt account merge
      if (firebaseUser && typeof window !== "undefined") {
        const storedToken = localStorage.getItem(STORAGE_KEY);
        if (storedToken) {
          headers[SESSION_TOKEN_HEADER] = storedToken;
        }
      }

      const response = await fetch("/api/player", { headers });
      const result: ApiResponse<PlayerResponse> = await response.json();

      if (result.success && result.data) {
        if (firebaseUser && typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEY);
        } else if (!firebaseUser && typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, result.data.sessionToken);
        }

        initialized.current = true;
        setState({
          token: result.data.sessionToken,
          player: result.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          token: null,
          player: null,
          loading: false,
          error: result.error || "Failed to initialize session",
        });
      }
    } catch {
      setState({
        token: null,
        player: null,
        loading: false,
        error: "Network error",
      });
    }
  }, [firebaseUser, buildAuthHeaders]);

  // Refresh player data
  const refreshPlayer = useCallback(async () => {
    try {
      const headers = await buildAuthHeaders();
      if (Object.keys(headers).length === 0 && !tokenRef.current) return;

      const finalHeaders =
        Object.keys(headers).length > 0
          ? headers
          : tokenRef.current
            ? { [SESSION_TOKEN_HEADER]: tokenRef.current }
            : {};

      const response = await fetch("/api/player", { headers: finalHeaders });
      const result: ApiResponse<PlayerResponse> = await response.json();

      if (result.success && result.data) {
        setState((prev) => ({ ...prev, player: result.data! }));
      }
    } catch {
      // Silently fail refresh
    }
  }, [buildAuthHeaders]);

  // Helper to make authenticated API calls
  const fetchWithSession = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const authHeaders = await buildAuthHeaders();

      const finalHeaders =
        Object.keys(authHeaders).length > 0
          ? authHeaders
          : tokenRef.current
            ? { [SESSION_TOKEN_HEADER]: tokenRef.current }
            : {};

      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...finalHeaders,
        },
      });
    },
    [buildAuthHeaders]
  );

  // Eager init for returning anonymous users — don't wait for Firebase SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem(STORAGE_KEY);
    if (!storedToken) return;

    fetch("/api/player", {
      headers: { [SESSION_TOKEN_HEADER]: storedToken },
    })
      .then((res) => res.json())
      .then((result: ApiResponse<PlayerResponse>) => {
        if (result.success && result.data && !initialized.current) {
          initialized.current = true;
          lastFirebaseUid.current = null;
          localStorage.setItem(STORAGE_KEY, result.data.sessionToken);
          setState({
            token: result.data.sessionToken,
            player: result.data,
            loading: false,
            error: null,
          });
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wait for Firebase auth to settle, then initialize session
  useEffect(() => {
    if (!firebaseLoading) {
      if (initialized.current && !firebaseUser) return;
      initSession();
    }
  }, [firebaseLoading, firebaseUser, initSession]);

  return {
    ...state,
    refreshPlayer,
    fetchWithSession,
    initSession,
  };
}
