"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SESSION_TOKEN_HEADER } from "@/types";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import type { PlayerResponse, ApiResponse } from "@/types";

const STORAGE_KEY = "polypuzzle_session";

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

  // Build auth headers for the current auth mode
  const buildAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (firebaseUser) {
      const idToken = await getIdToken();
      if (idToken) {
        return { Authorization: `Bearer ${idToken}` };
      }
    }

    // Fall back to anonymous session token
    const storedToken =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (storedToken) {
      return { [SESSION_TOKEN_HEADER]: storedToken };
    }

    return {};
  }, [firebaseUser, getIdToken]);

  // Initialize session from Firebase or localStorage
  const initSession = useCallback(async () => {
    // Detect whether the Firebase user changed (sign-in / sign-out)
    const currentUid = firebaseUser?.uid ?? null;
    const authChanged = lastFirebaseUid.current !== undefined && lastFirebaseUid.current !== currentUid;
    lastFirebaseUid.current = currentUid;

    // Skip re-initialization if session is already loaded and auth didn't change
    if (initialized.current && !authChanged) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

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
          // Clear anonymous token after successful auth (merged or fresh)
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
      if (Object.keys(headers).length === 0 && !state.token) return;

      // Use current token as fallback if buildAuthHeaders returned empty
      const finalHeaders =
        Object.keys(headers).length > 0
          ? headers
          : state.token
            ? { [SESSION_TOKEN_HEADER]: state.token }
            : {};

      const response = await fetch("/api/player", { headers: finalHeaders });
      const result: ApiResponse<PlayerResponse> = await response.json();

      if (result.success && result.data) {
        setState((prev) => ({ ...prev, player: result.data! }));
      }
    } catch {
      // Silently fail refresh
    }
  }, [buildAuthHeaders, state.token]);

  // Helper to make authenticated API calls
  const fetchWithSession = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const authHeaders = await buildAuthHeaders();

      // Fall back to current token if buildAuthHeaders returned empty
      const finalHeaders =
        Object.keys(authHeaders).length > 0
          ? authHeaders
          : state.token
            ? { [SESSION_TOKEN_HEADER]: state.token }
            : {};

      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...finalHeaders,
        },
      });
    },
    [buildAuthHeaders, state.token]
  );

  // Wait for Firebase auth to settle, then initialize session
  useEffect(() => {
    if (!firebaseLoading) {
      initSession();
    }
  }, [firebaseLoading, initSession]);

  return {
    ...state,
    refreshPlayer,
    fetchWithSession,
    initSession,
  };
}
