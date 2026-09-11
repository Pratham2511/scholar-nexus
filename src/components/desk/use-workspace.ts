"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { emptyWorkspace, type Workspace } from "@/lib/workspace/schema";
import { normalizeWorkspace } from "@/lib/workspace/repository";
import { localCache } from "@/lib/workspace/storage-engine";

export type StorageStatus =
  | "local"
  | "synced"
  | "memory";

export function useWorkspace() {
  // Synchronous initialization from localStorage for instantaneous rendering
  const [state, setState] = useState<Workspace>(() => {
    if (typeof window !== "undefined") {
      return localCache.loadSync();
    }
    return emptyWorkspace();
  });

  const [ready, setReady] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>("local");
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Hydrate from localStorage on client mount & check optional remote sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    const cached = localCache.loadSync();
    setState(cached);

    // Optional background sync with backend if available
    const tryRemoteSync = async () => {
      try {
        const response = await fetch("/api/workspace", { cache: "no-store" });
        if (response.ok) {
          const body = await response.json();
          if (body && body.state) {
            const remoteState = normalizeWorkspace(body.state);
            // Merge remote with local if local has newer papers
            if (remoteState.papers.length >= cached.papers.length) {
              setState(remoteState);
              localCache.saveSync(remoteState);
            }
            setStorageStatus("synced");
          }
        } else {
          setStorageStatus("local");
        }
      } catch {
        // Backend DB is offline - continue smoothly in pure local storage mode
        setStorageStatus("local");
      }
    };

    void tryRemoteSync();
  }, []);

  // Mutate function: synchronous local write + background sync
  const mutate = useCallback(
    async (change: (draft: Workspace) => void): Promise<boolean> => {
      setSaving(true);
      try {
        const current = structuredClone(stateRef.current);
        change(current);
        const next = normalizeWorkspace(current);

        // 1. Instant synchronous write to localStorage
        localCache.saveSync(next);

        // 2. Immediate UI state update
        setState(next);
        stateRef.current = next;

        // 3. Non-blocking background sync
        void fetch("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: next, revision: Date.now() }),
        })
          .then((res) => {
            if (res.ok) setStorageStatus("synced");
            else setStorageStatus("local");
          })
          .catch(() => {
            setStorageStatus("local");
          });

        return true;
      } catch (err) {
        console.error("Mutation failed", err);
        return false;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return {
    state,
    mutate,
    ready,
    saving,
    storageStatus,
    error: "",
    reload: async () => {},
  };
}
