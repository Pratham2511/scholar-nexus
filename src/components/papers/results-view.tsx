"use client";

import { useAppStore } from "@/store/app-store";
import { PaperCard } from "@/components/papers/paper-card";
import { FiltersPanel } from "@/components/papers/filters-panel";
import { SearchBar } from "@/components/papers/search-bar";
import { AISynthesisCard } from "@/components/papers/ai-synthesis-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Search,
  SlidersHorizontal,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowUpDown,
  Bell,
} from "lucide-react";
import { useState, useMemo } from "react";
import { runSearch } from "@/lib/actions";

type SortKey = "relevance" | "citations" | "year" | "newest";

export function ResultsView() {
  const papers = useAppStore((s) => s.papers);
  const isSearching = useAppStore((s) => s.isSearching);
  const understoodQuery = useAppStore((s) => s.understoodQuery);
  const sourceResults = useAppStore((s) => s.sourceResults);
  const searchDurationMs = useAppStore((s) => s.searchDurationMs);
  const duplicatesRemoved = useAppStore((s) => s.duplicatesRemoved);
  const rawQuery = useAppStore((s) => s.rawQuery);
  const filters = useAppStore((s) => s.filters);
  const setAlertModalOpen = useAppStore((s) => s.setAlertModalOpen);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("relevance");

  const sortedPapers = useMemo(() => {
    const copy = [...papers];
    switch (sortBy) {
      case "citations":
        copy.sort((a, b) => b.citationCount - a.citationCount);
        break;
      case "year":
      case "newest":
        copy.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case "relevance":
      default:
        copy.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        break;
    }
    return copy;
  }, [papers, sortBy]);

  // V2: Compute max citations in results for percentile badges
  const maxCitationsInResults = useMemo(
    () => papers.reduce((max, p) => Math.max(max, p.citationCount), 0),
    [papers],
  );

  if (isSearching) {
    return <ResultsLoading />;
  }

  if (papers.length === 0 && !understoodQuery) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <Card className="p-10 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No search yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Use the search bar above to find research papers across multiple academic sources.
          </p>
          <SearchBar />
        </Card>
      </div>
    );
  }

  const successfulSources = sourceResults.filter((s) => s.success).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* Top search bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchBar />
          </div>
          {/* V2: Alert me button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAlertModalOpen(true)}
            className="gap-1.5 shrink-0"
            title="Get notified when new papers match this search"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alert me</span>
          </Button>
        </div>
      </div>

      {/* AI understanding summary */}
      {understoodQuery && (
        <Card className="p-4 mb-4 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">AI Query Understanding</span>
                <Badge variant="outline" className="text-xs bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                  Topic: {understoodQuery.topic}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{understoodQuery.reasoning}</p>
              <div className="flex flex-wrap gap-1.5">
                {understoodQuery.keywords.map((k) => (
                  <span key={k} className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                    {k}
                  </span>
                ))}
                {understoodQuery.excludeKeywords.map((k) => (
                  <span key={k} className="rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-700 dark:text-red-300 line-through">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* V2: AI Synthesis card (collapsible, fire-and-forget) */}
      <AISynthesisCard />

      {/* V2: Results summary strip */}
      <div className="flex items-center justify-between text-xs text-muted-foreground py-2 mb-3 border-b border-border">
        <span>
          Found <strong className="text-foreground">{papers.length}</strong> papers across{" "}
          <strong className="text-foreground">{successfulSources}</strong> sources ·{" "}
          {duplicatesRemoved} duplicates removed · {(searchDurationMs / 1000).toFixed(1)}s
        </span>
      </div>

      {/* Source status bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Sources:</span>
        {sourceResults.map((sr) => (
          <Badge
            key={sr.source}
            variant="outline"
            className={`text-xs gap-1 ${
              sr.success
                ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-red-500/5 border-red-500/30 text-red-700 dark:text-red-300"
            }`}
            title={sr.error || `${sr.papers.length} papers in ${sr.durationMs}ms`}
          >
            {sr.success ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {sr.source} · {sr.papers.length}
          </Badge>
        ))}
        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {duplicatesRemoved} duplicates removed
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {(searchDurationMs / 1000).toFixed(1)}s
          </span>
        </span>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar filters */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <FiltersPanel />
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {papers.length} {papers.length === 1 ? "paper" : "papers"} found
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden gap-1.5"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="citations">Sort: Citations</option>
                  <option value="newest">Sort: Newest</option>
                </select>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="lg:hidden mb-4">
              <FiltersPanel compact />
            </div>
          )}

          {sortedPapers.length === 0 ? (
            <Card className="p-10 text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No papers match your filters</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try loosening your constraints or rephrasing your search.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  useAppStore.getState().resetFilters();
                  void runSearch(rawQuery, {});
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Reset filters &amp; re-search
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedPapers.map((p) => (
                <PaperCard
                  key={p.id}
                  paper={p}
                  maxCitationsInResults={maxCitationsInResults}
                  totalInResults={papers.length}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <Card className="p-8 text-center mb-6 bg-emerald-500/5 border-emerald-500/20">
        <Loader2 className="h-10 w-10 mx-auto text-emerald-600 dark:text-emerald-400 animate-spin mb-3" />
        <h2 className="font-semibold mb-1">Searching across academic sources…</h2>
        <p className="text-sm text-muted-foreground">
          Querying Semantic Scholar, arXiv, Crossref, PubMed, OpenAlex, IEEE, bioRxiv, medRxiv &amp; Europe PMC in parallel.
        </p>
      </Card>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6 mb-1" />
            <Skeleton className="h-4 w-2/3 mb-3" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
