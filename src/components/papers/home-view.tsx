"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { SearchBar } from "@/components/papers/search-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Clock, BookMarked, Zap, ShieldCheck, Globe2, Layers, Search, Library, Database } from "lucide-react";
import { refreshRecentSearches, runSearch } from "@/lib/actions";

interface TrendingTopic {
  topic: string;
  domain: string;
}

interface Stats {
  totalSearches: number;
  totalPapersSaved: number;
  totalSourcesActive: number;
  totalCollections: number;
  totalAlerts: number;
}

export function HomeView() {
  const setView = useAppStore((s) => s.setView);
  const setRawQuery = useAppStore((s) => s.setRawQuery);
  const recentSearches = useAppStore((s) => s.recentSearches);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void refreshRecentSearches();
    void fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => setTrending(d.topics || []))
      .catch(() => setTrending([]));
    // V2: Load stats for the stats bar
    void fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats(null));
  }, []);

  const handleTrendingClick = (topic: string) => {
    setRawQuery(topic);
    void runSearch(topic);
  };

  const handleRecentClick = (query: string) => {
    setRawQuery(query);
    void runSearch(query);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-700 dark:text-emerald-300 mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Multi-Source Research Discovery · v2.0
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
          Find the right papers,
          <br />
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            across every academic source.
          </span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
          Describe your research in natural language. ScholarAI understands your intent,
          searches Semantic Scholar, arXiv, Crossref, PubMed, OpenAlex, IEEE, bioRxiv,
          medRxiv &amp; Europe PMC in parallel, removes duplicates, ranks papers by
          relevance — with AI-generated insights, citation graphs, and PDF Q&amp;A for each.
        </p>
      </div>

      {/* V2: Stats bar */}
      {stats && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <strong className="text-foreground tabular-nums">{stats.totalSearches}</strong> searches
          </span>
          <span className="flex items-center gap-1.5">
            <BookMarked className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <strong className="text-foreground tabular-nums">{stats.totalPapersSaved}</strong> papers saved
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <strong className="text-foreground tabular-nums">{stats.totalSourcesActive}</strong> sources active
          </span>
          {stats.totalCollections > 0 && (
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <strong className="text-foreground tabular-nums">{stats.totalCollections}</strong> collections
            </span>
          )}
          {stats.totalAlerts > 0 && (
            <span className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <strong className="text-foreground tabular-nums">{stats.totalAlerts}</strong> alerts
            </span>
          )}
        </div>
      )}

      {/* Search */}
      <div className="mb-10">
        <SearchBar hero />
      </div>

      {/* V2: Feature highlights — expanded with real value subtitles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
        <FeatureCard
          icon={Globe2}
          title="9 Sources in Parallel"
          desc="Semantic Scholar, arXiv, Crossref, PubMed, OpenAlex, IEEE, bioRxiv, medRxiv, Europe PMC — all at once."
        />
        <FeatureCard
          icon={Layers}
          title="Smart Deduplication"
          desc="Same paper on multiple sources? We merge by DOI + title and keep the richest metadata."
        />
        <FeatureCard
          icon={Zap}
          title="AI-Ranked Results"
          desc="Relevance score 0–100 across 6 dimensions: relevance, citations, recency, venue, OA, multi-source."
        />
        <FeatureCard
          icon={ShieldCheck}
          title="AI Insights + Synthesis"
          desc="Per-paper summary, contributions, limitations + cross-paper evidence synthesis with one click."
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Trending */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-semibold">Trending Research Topics</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trending.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading trending topics…</p>
            ) : (
              trending.map((t) => (
                <button
                  key={t.topic}
                  onClick={() => handleTrendingClick(t.topic)}
                  className="group rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:border-emerald-500/50 hover:bg-emerald-500/5 transition text-left"
                >
                  <span className="text-foreground">{t.topic}</span>
                  <span className="ml-2 text-xs text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {t.domain}
                  </span>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Recent searches */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-semibold">Recent Searches</h2>
          </div>
          {recentSearches.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              <p>No searches yet. Try one of the trending topics above, or describe your research in the search bar.</p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {recentSearches.slice(0, 8).map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => handleRecentClick(s.query)}
                    className="w-full flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left text-sm hover:bg-muted/50 transition"
                  >
                    <span className="truncate flex-1">{s.query}</span>
                    {s.resultCount !== null && (
                      <Badge variant="secondary" className="shrink-0">
                        {s.resultCount} results
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* CTA row */}
      <div className="mt-12 grid sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-start gap-3">
          <BookMarked className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-sm">Saved Library & Collections</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Bookmark papers and organize them into named collections for later reference.
            </p>
            <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-emerald-600 dark:text-emerald-400" onClick={() => setView("library")}>
              Open library →
            </Button>
          </div>
        </Card>
        <Card className="p-5 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-sm">Citation Network</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Visualize how papers cite each other in a force-directed graph. Click any node to dive in.
            </p>
            <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-emerald-600 dark:text-emerald-400" onClick={() => setView("network")}>
              Open network →
            </Button>
          </div>
        </Card>
        <Card className="p-5 flex items-start gap-3">
          <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-sm">AI Recommendations</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Get personalized topic suggestions based on your saved papers and followed authors.
            </p>
            <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-emerald-600 dark:text-emerald-400" onClick={() => setView("profile")}>
              View profile →
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <Card className="p-4 flex flex-col items-center text-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground leading-snug">{desc}</div>
    </Card>
  );
}
