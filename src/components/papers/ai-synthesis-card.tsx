"use client";

import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Search,
  Quote,
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
    // Skip if we already have synthesis for the current query
    if (synthesis && synthesis.summary.includes(rawQuery.slice(0, 20))) return;

    let cancelled = false;
    setIsSynthesizing(true);
    setExpanded(false); // collapse by default when regenerating
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
    <Card className="mb-4 overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-emerald-500/5 transition"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-sm">What The Research Says</span>
            <Badge variant="outline" className="text-xs bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              AI Synthesis
            </Badge>
            {isSynthesizing && (
              <Badge variant="outline" className="text-xs gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Analyzing…
              </Badge>
            )}
          </div>
          {synthesis && !isSynthesizing ? (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {synthesis.summary}
            </p>
          ) : isSynthesizing ? (
            <p className="text-xs text-muted-foreground">
              Synthesizing {papers.length} papers…
            </p>
          ) : null}
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && synthesis && (
        <div className="px-4 pb-4 space-y-4 border-t border-emerald-500/10 pt-4">
          {/* Summary */}
          <div>
            <h3 className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Overview
            </h3>
            <p className="text-sm text-foreground/90 leading-relaxed">{synthesis.summary}</p>
          </div>

          {/* Consensus */}
          {synthesis.consensus && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Research Consensus
              </h3>
              <p className="text-sm text-foreground/90 leading-relaxed">{synthesis.consensus}</p>
            </div>
          )}

          {/* Contradictions */}
          {synthesis.contradictions && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Where Papers Disagree
              </h3>
              <p className="text-sm text-foreground/90 leading-relaxed">{synthesis.contradictions}</p>
            </div>
          )}

          {/* Key Findings */}
          {synthesis.keyFindings.length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                <Lightbulb className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Key Findings
              </h3>
              <ul className="space-y-1.5">
                {synthesis.keyFindings.map((finding, i) => (
                  <li key={i} className="text-sm text-foreground/90 flex items-start gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Methodologies */}
          {synthesis.methodologies.length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                <GitBranch className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Common Methodologies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {synthesis.methodologies.map((m, i) => (
                  <span key={i} className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Research Gaps */}
          {synthesis.researchGaps.length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Open Questions / Gaps
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {synthesis.researchGaps.map((g, i) => (
                  <span key={i} className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Follow-up Searches */}
          {synthesis.suggestedQueries.length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                <Search className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Suggested Follow-up Searches
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {synthesis.suggestedQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuery(q)}
                    className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition"
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
