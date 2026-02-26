"use client";

import { useSessionContext } from "@/contexts/SessionContext";
import { UsernameModal } from "./UsernameModal";

export function UsernameGate({ children }: { children: React.ReactNode }) {
  const { player, loading, refreshPlayer, fetchWithSession } = useSessionContext();

  const showModal = !loading && player?.needsUsername === true;

  return (
    <>
      {children}
      {showModal && (
        <UsernameModal
          fetchWithSession={fetchWithSession}
          onComplete={refreshPlayer}
        />
      )}
    </>
  );
}
