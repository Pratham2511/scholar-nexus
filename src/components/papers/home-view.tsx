"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { SearchBar } from "@/components/papers/search-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Clock, BookMarked, Zap, ShieldCheck, Globe2, Layers } from "lucide-react";
import { refreshRecentSearches, runSearch } from "@/lib/actions";

interface TrendingTopic {
  topic: string;
  domain: string;
}

export function HomeView() {
  const setView = useAppStore((s) => s.setView);
  const setRawQuery = useAppStore((s) => s.setRawQuery);
  const recentSearches = useAppStore((s) => s.recentSearches);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);

  useEffect(() => {
    void refreshRecentSearches();
    void fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => setTrending(d.topics || []))
      .catch(() => setTrending([]));
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
          AI-Powered Multi-Source Research Discovery
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
          searches Semantic Scholar, arXiv, Crossref &amp; PubMed in parallel, removes duplicates,
          and ranks papers by relevance — with AI-generated insights for each.
        </p>
      </div>

      {/* Search */}
      <div className="mb-10">
        <SearchBar hero />
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
        <FeatureCard icon={Globe2} title="Multi-Source" desc="4 academic APIs in parallel" />
        <FeatureCard icon={Layers} title="Deduplicated" desc="Smart DOI + title merging" />
        <FeatureCard icon={Zap} title="AI Ranked" desc="Relevance score 0-100" />
        <FeatureCard icon={ShieldCheck} title="AI Insights" desc="Summary, contributions, limits" />
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
            <h3 className="font-medium text-sm">Saved Library</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Bookmark papers for later and revisit them anytime.
            </p>
            <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-emerald-600 dark:text-emerald-400" onClick={() => setView("library")}>
              Open library →
            </Button>
          </div>
        </Card>
        <Card className="p-5 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-sm">AI Recommendations</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Get personalized topic suggestions based on your saved papers.
            </p>
            <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-emerald-600 dark:text-emerald-400" onClick={() => setView("profile")}>
              View profile →
            </Button>
          </div>
        </Card>
        <Card className="p-5 flex items-start gap-3">
          <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-sm">Compare Papers</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Side-by-side comparison of methods, datasets, and metrics.
            </p>
            <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-emerald-600 dark:text-emerald-400" onClick={() => setView("compare")}>
              Open compare →
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <Card className="p-4 flex flex-col items-center text-center gap-1.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </Card>
  );
}
