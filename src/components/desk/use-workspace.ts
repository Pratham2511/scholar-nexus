"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { emptyWorkspace, type Workspace } from "@/lib/workspace/schema";
export function useWorkspace() {
  const [state, setState] = useState<Workspace>(emptyWorkspace);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const current = useRef({
    state: emptyWorkspace(),
    revision: 0,
    ready: false,
  });
  const queue = useRef(Promise.resolve());
  const reload = useCallback(async () => {
    try {
      const r = await fetch("/api/workspace", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      current.current = { ...d, ready: true };
      setState(d.state);
      setReady(true);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load saved research.",
      );
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  const mutate = useCallback(
    (change: (draft: Workspace) => void): Promise<boolean> => {
      const run = async () => {
        if (!current.current.ready) {
          setError(
            "Saved research is unavailable. Start the database and reload saved research.",
          );
          return false;
        }
        setSaving(true);
        try {
          const next = structuredClone(current.current.state);
          change(next);
          const r = await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              state: next,
              revision: current.current.revision,
            }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          current.current = { state: next, revision: d.revision, ready: true };
          setState(next);
          setError("");
          return true;
        } catch (e) {
          setError(e instanceof Error ? e.message : "Save failed.");
          return false;
        } finally {
          setSaving(false);
        }
      };
      const task = queue.current.then(run, run);
      queue.current = task.then(() => {});
      return task;
    },
    [],
  );
  return { state, error, setError, ready, saving, reload, mutate };
}
