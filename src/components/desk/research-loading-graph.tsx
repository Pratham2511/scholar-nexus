import type { CSSProperties } from "react";

const stages = ["Sources", "Records", "Evidence", "Index"];

/** Contextual loading marker used for live retrieval rather than a generic spinner. */
export function ResearchLoadingGraph({ label = "Tracing knowledge pathways" }: { label?: string }) {
  return (
    <div className="research-loading" role="status" aria-live="polite">
      <div className="research-loading__graph" aria-hidden="true">
        {stages.map((stage, index) => (
          <span className="research-loading__node" key={stage} style={{ "--node": index } as CSSProperties}>
            <i />
          </span>
        ))}
      </div>
      <div>
        <span className="eyebrow">Live research traversal</span>
        <strong>{label}</strong>
        <p>Querying sources, resolving records, and preparing a bounded evidence map.</p>
      </div>
    </div>
  );
}
