"use client";

import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Skeleton,
} from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Quote,
  Sparkles,
  Loader2,
  FileText,
  Calendar,
  Users,
  Award,
  Database,
  CheckCircle2,
  XCircle,
  Target,
  TrendingUp,
  AlertTriangle,
  Rocket,
  Tags,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toggleSavePaper, fetchPaperInsights } from "@/lib/actions";
import { toast } from "sonner";
import type { PaperInsights } from "@/lib/academic/types";
import { exportCitation, type CitationFormat } from "@/lib/citation";

export function DetailsView() {
  const selectedPaper = useAppStore((s) => s.selectedPaper);
  const setView = useAppStore((s) => s.setView);
  const savedIds = useAppStore((s) => s.savedIds);
  const rawQuery = useAppStore((s) => s.rawQuery);
  const [insights, setInsights] = useState<PaperInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [saving, setSaving] = useState(false);
  const [citationFormat, setCitationFormat] = useState<CitationFormat>("APA");
  const [showCitation, setShowCitation] = useState(false);

  useEffect(() => {
    setInsights(selectedPaper?.aiInsights || null);
  }, [selectedPaper]);

  // Auto-generate insights when paper is opened (if not already cached)
  useEffect(() => {
    if (!selectedPaper || selectedPaper.aiInsights || loadingInsights) return;
    let cancelled = false;
    setLoadingInsights(true);
    fetchPaperInsights(selectedPaper, rawQuery)
      .then((res) => {
        if (!cancelled && res) {
          setInsights(res);
          // Cache into the selected paper
          useAppStore.getState().setSelectedPaper({ ...selectedPaper, aiInsights: res });
        }
      })
      .catch((e) => {
        console.error("[details] insights failed:", e);
        toast.error("Failed to generate AI insights");
      })
      .finally(() => {
        if (!cancelled) setLoadingInsights(false);
      });
    return () => { cancelled = true; };
  }, [selectedPaper?.id]);

  if (!selectedPaper) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-muted-foreground">No paper selected.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setView("results")}>
          Back to results
        </Button>
      </div>
    );
  }

  const p = selectedPaper;
  const isSaved = savedIds.has(p.id);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await toggleSavePaper({ ...p, aiInsights: insights || undefined });
      toast.success(saved ? "Paper saved to library" : "Paper removed from library");
    } catch {
      toast.error("Failed to save paper");
    } finally {
      setSaving(false);
    }
  };

  const citation = showCitation ? exportCitation(p, citationFormat) : "";

  const recordExport = (format: CitationFormat) => {
    // Fire-and-forget: record the export for the history tab
    void fetch("/api/citation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper: p, format }),
    }).catch(() => { /* ignore */ });
  };

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(citation);
    toast.success("Citation copied to clipboard");
    recordExport(citationFormat);
  };

  const handleOpenCitation = () => {
    setShowCitation(!showCitation);
    if (!showCitation) {
      recordExport(citationFormat);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
      {/* Back nav */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("results")}
        className="mb-4 gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to results
      </Button>

      {/* Header */}
      <Card className="p-6 mb-4">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {p.sources.map((src) => (
            <Badge key={src} variant="outline" className="text-xs">
              {src}
            </Badge>
          ))}
          {p.openAccess && (
            <Badge variant="outline" className="text-xs bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              Open Access
            </Badge>
          )}
          {p.paperType && (
            <Badge variant="outline" className="text-xs">{p.paperType}</Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-balance">
          {p.title}
        </h1>

        {p.authors.length > 0 && (
          <div className="flex items-start gap-2 text-muted-foreground mb-4">
            <Users className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="text-sm">
              {p.authors.join(", ")}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground mb-4">
          {p.year && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {p.year}
            </span>
          )}
          {p.citationCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Quote className="h-4 w-4" />
              {p.citationCount.toLocaleString()} citations
            </span>
          )}
          {p.publisher && (
            <span className="flex items-center gap-1.5">
              <Award className="h-4 w-4" />
              {p.publisher}
            </span>
          )}
          {p.doi && (
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <a
                href={`https://doi.org/${p.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {p.doi}
              </a>
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            variant={isSaved ? "secondary" : "default"}
            size="sm"
            className="gap-1.5"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSaved ? (
              <>
                <BookmarkCheck className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                Save paper
              </>
            )}
          </Button>
          {p.pdfLink && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={p.pdfLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                View PDF
              </a>
            </Button>
          )}
          {p.sourceUrls.map((su) => (
            <Button key={su.url} asChild variant="ghost" size="sm" className="gap-1.5">
              <a href={su.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                {su.source}
              </a>
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCitation}
            className="gap-1.5"
          >
            <Quote className="h-4 w-4" />
            Cite
          </Button>
        </div>

        {/* Citation panel */}
        {showCitation && (
          <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(["APA", "MLA", "BibTeX", "Chicago"] as CitationFormat[]).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={citationFormat === f ? "secondary" : "ghost"}
                  className="h-7 text-xs"
                  onClick={() => setCitationFormat(f)}
                >
                  {f}
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs ml-auto"
                onClick={handleCopyCitation}
              >
                Copy
              </Button>
            </div>
            <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-3 rounded border border-border overflow-x-auto">
              {citation}
            </pre>
          </div>
        )}
      </Card>

      {/* Abstract */}
      <Card className="p-6 mb-4">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Abstract
        </h2>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {p.abstract}
        </p>
        {p.keywords.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex items-start gap-2">
              <Tags className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {p.keywords.map((k) => (
                  <span key={k} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </Card>

      {/* AI Insights */}
      <Card className="p-6 mb-4 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="font-semibold">AI-Powered Analysis</h2>
          {loadingInsights && (
            <Badge variant="outline" className="text-xs gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating…
            </Badge>
          )}
        </div>

        {loadingInsights && !insights ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        ) : insights ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                <Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Summary
              </h3>
              <p className="text-sm text-foreground/90 leading-relaxed">{insights.summary}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <InsightBlock
                title="Key Contributions"
                items={insights.keyContributions}
                icon={CheckCircle2}
                color="emerald"
              />
              <InsightBlock
                title="Advantages"
                items={insights.advantages}
                icon={TrendingUp}
                color="emerald"
              />
              <InsightBlock
                title="Limitations"
                items={insights.limitations}
                icon={AlertTriangle}
                color="amber"
              />
              <InsightBlock
                title="Future Scope"
                items={insights.futureScope}
                icon={Rocket}
                color="emerald"
              />
            </div>

            {insights.keywords.length > 0 && (
              <div>
                <h3 className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                  <Tags className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  AI-Extracted Keywords
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {insights.keywords.map((k) => (
                    <span key={k} className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">AI insights unavailable.</p>
        )}
      </Card>

      {/* Source availability */}
      <Card className="p-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Available On
        </h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {p.sourceUrls.length === 0 ? (
            <p className="text-sm text-muted-foreground">No direct source links available.</p>
          ) : (
            p.sourceUrls.map((su) => (
              <a
                key={su.url}
                href={su.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-md border border-border p-3 hover:bg-muted/50 transition"
              >
                <span className="text-sm font-medium">{su.source}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function InsightBlock({
  title,
  items,
  icon: Icon,
  color,
}: {
  title: string;
  items: string[];
  icon: React.ElementType;
  color: "emerald" | "amber";
}) {
  if (!items || items.length === 0) return null;
  const colorClasses = color === "amber"
    ? "text-amber-600 dark:text-amber-400"
    : "text-emerald-600 dark:text-emerald-400";
  return (
    <div>
      <h3 className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
        <Icon className={`h-3.5 w-3.5 ${colorClasses}`} />
        {title}
      </h3>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-foreground/80 flex items-start gap-1.5">
            <span className="text-muted-foreground mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
