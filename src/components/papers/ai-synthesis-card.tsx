"use client";

import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Search,
  BookOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { EvidenceSynthesis } from "@/lib/academic/types";
import { runSearch } from "@/lib/actions";
import { toast } from "sonner";

export function AISynthesisCard() {
  const papers = useAppStore((s) => s.papers);
  const rawQuery = useAppStore((s) => s.rawQuery);
  const synthesis = useAppStore((s) => s.synthesis);
  const setSynthesis = useAppStore((s) => s.setSynthesis);
  const isSynthesizing = useAppStore((s) => s.isSynthesizing);
  const setIsSynthesizing = useAppStore((s) => s.setIsSynthesizing);
  const [expanded, setExpanded] = useState(false);

  // Fire-and-forget synthesis generation when results arrive
  useEffect(() => {
    if (papers.length === 0) {
      setSynthesis(null);
      return;
    }
    if (synthesis && synthesis.summary.includes(rawQuery.slice(0, 20))) return;

    let cancelled = false;
    setIsSynthesizing(true);
    setExpanded(false);
    fetch("/api/ai/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ papers, query: rawQuery }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Synthesis failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data.synthesis) {
          setSynthesis(data.synthesis as EvidenceSynthesis);
        }
      })
      .catch((e) => {
        console.error("[synthesis] error:", e);
        if (!cancelled) toast.error("Failed to generate AI synthesis");
      })
      .finally(() => {
        if (!cancelled) setIsSynthesizing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [papers, rawQuery]);

  if (papers.length === 0) return null;

  const handleSuggestedQuery = async (q: string) => {
    try {
      await runSearch(q);
    } catch {
      toast.error("Failed to run suggested search");
    }
  };

  return (
    <Card className="mb-4 overflow-hidden rounded-[3px] border border-border border-l-2 border-l-red bg-surface p-0 shadow-none hover:border-l-red">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-2 transition duration-150"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-wider text-red font-semibold">
              AI ANALYSIS
            </span>
            <span className="font-ui text-xs text-text-tertiary">·</span>
            <span className="font-ui font-medium text-xs text-text-secondary uppercase tracking-wider">
              Evidence Synthesis
            </span>
            {isSynthesizing && (
              <Badge variant="outline" className="text-[0.65rem] border-gold text-gold">
                Synthesizing…
              </Badge>
            )}
          </div>
          {synthesis && !isSynthesizing ? (
            <p className="font-ui text-sm text-text-primary line-clamp-1 font-light">
              {synthesis.summary}
            </p>
          ) : isSynthesizing ? (
            <p className="font-ui text-xs text-text-tertiary">
              Synthesizing {papers.length} academic papers…
            </p>
          ) : null}
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />
        )}
      </button>

      {expanded && synthesis && (
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          {/* Summary */}
          <div>
            <h3 className="font-display text-lg font-normal text-text-primary mb-1">
              Overview
            </h3>
            <p className="font-ui text-sm text-text-primary/90 font-light leading-relaxed">
              {synthesis.summary}
            </p>
          </div>

          {/* Consensus */}
          {synthesis.consensus && (
            <div>
              <h3 className="font-display text-base font-normal text-green-bright flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Research Consensus
              </h3>
              <p className="font-ui text-sm text-text-secondary font-light leading-relaxed">
                {synthesis.consensus}
              </p>
            </div>
          )}

          {/* Contradictions */}
          {synthesis.contradictions && (
            <div>
              <h3 className="font-display text-base font-normal text-red flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Where Papers Disagree
              </h3>
              <p className="font-ui text-sm text-text-secondary font-light leading-relaxed">
                {synthesis.contradictions}
              </p>
            </div>
          )}

          {/* Key Findings */}
          {synthesis.keyFindings.length > 0 && (
            <div>
              <h3 className="font-display text-base font-normal text-text-primary mb-2">
                Key Findings
              </h3>
              <ul className="space-y-1.5">
                {synthesis.keyFindings.map((finding, i) => (
                  <li
                    key={i}
                    className="font-ui text-sm text-text-secondary font-light flex items-start gap-2"
                  >
                    <span className="text-gold mt-0.5">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Methodologies */}
          {synthesis.methodologies.length > 0 && (
            <div>
              <h3 className="font-ui text-xs uppercase tracking-wider text-text-tertiary flex items-center gap-1.5 mb-2">
                <GitBranch className="h-3.5 w-3.5 text-teal" />
                Common Methodologies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {synthesis.methodologies.map((m, i) => (
                  <span
                    key={i}
                    className="rounded-[2px] border border-border-2 bg-transparent px-2 py-0.5 font-mono text-[0.65rem] text-text-secondary uppercase"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Research Gaps */}
          {synthesis.researchGaps.length > 0 && (
            <div>
              <h3 className="font-ui text-xs uppercase tracking-wider text-text-tertiary flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-gold" />
                Open Questions / Gaps
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {synthesis.researchGaps.map((g, i) => (
                  <span
                    key={i}
                    className="rounded-[2px] border border-gold/40 bg-surface-2 px-2 py-0.5 font-mono text-[0.65rem] text-gold"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Follow-up Searches */}
          {synthesis.suggestedQueries.length > 0 && (
            <div>
              <h3 className="font-ui text-xs uppercase tracking-wider text-text-tertiary flex items-center gap-1.5 mb-2">
                <Search className="h-3.5 w-3.5 text-teal" />
                Suggested Inquiries
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {synthesis.suggestedQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuery(q)}
                    className="rounded-[2px] border border-border-2 bg-transparent px-2.5 py-1 font-mono text-xs text-text-secondary hover:border-gold hover:text-gold transition duration-150"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
