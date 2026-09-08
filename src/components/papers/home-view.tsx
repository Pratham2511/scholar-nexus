"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { SearchBar } from "@/components/papers/search-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import {
  Sparkles,
  TrendingUp,
  Clock,
  BookMarked,
  Zap,
  ShieldCheck,
  Globe2,
  Layers,
  Search,
  Database,
} from "lucide-react";
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
    // Load stats for the stats bar
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
        <div className="inline-flex items-center gap-2 rounded-[2px] border border-border-2 bg-surface px-3 py-1 font-mono text-xs uppercase tracking-wider text-text-tertiary mb-6">
          <span className="text-gold">●</span>
          The Scholar's Study · Academic Search & Synthesis
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-balance text-text-primary">
          Find the right papers,
          <br />
          <em className="text-gold font-light not-italic">
            across every academic source.
          </em>
        </h1>
        <p className="mt-5 font-ui text-base text-text-secondary font-light max-w-2xl mx-auto leading-relaxed">
          Describe your research in natural language. Search across Crossref, arXiv, Europe PMC, OpenAlex, and PubMed with source-linked evidence synthesis and citation networks.
        </p>
      </div>

      {/* Stats bar with CountUp */}
      {stats && (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs text-text-tertiary">
          <span className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-gold" />
            <strong className="text-text-primary tabular-nums font-medium">
              <CountUp end={stats.totalSearches} />
            </strong>{" "}
            searches
          </span>
          <span className="flex items-center gap-1.5">
            <BookMarked className="h-3.5 w-3.5 text-gold" />
            <strong className="text-text-primary tabular-nums font-medium">
              <CountUp end={stats.totalPapersSaved} />
            </strong>{" "}
            papers saved
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-gold" />
            <strong className="text-text-primary tabular-nums font-medium">
              <CountUp end={stats.totalSourcesActive} />
            </strong>{" "}
            sources active
          </span>
          {stats.totalCollections > 0 && (
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-teal" />
              <strong className="text-text-primary tabular-nums font-medium">
                <CountUp end={stats.totalCollections} />
              </strong>{" "}
              collections
            </span>
          )}
          {stats.totalAlerts > 0 && (
            <span className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-red" />
              <strong className="text-text-primary tabular-nums font-medium">
                <CountUp end={stats.totalAlerts} />
              </strong>{" "}
              alerts
            </span>
          )}
        </div>
      )}

      {/* Search */}
      <div className="mb-10">
        <SearchBar hero />
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
        <FeatureCard
          icon={Globe2}
          title="Multi-Source Search"
          desc="Crossref, arXiv, Europe PMC, OpenAlex, Semantic Scholar in parallel."
        />
        <FeatureCard
          icon={Layers}
          title="Smart Deduplication"
          desc="Merged by DOI + title, preserving highest quality metadata."
        />
        <FeatureCard
          icon={Zap}
          title="Scholarly Ranking"
          desc="Multi-dimensional relevance scoring across citation and venue context."
        />
        <FeatureCard
          icon={ShieldCheck}
          title="Evidence Traceability"
          desc="Direct linkage from synthesized claims to supporting passages."
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Trending */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-gold" />
            <h2 className="font-display text-xl font-normal text-text-primary">
              Trending Inquiries
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trending.length === 0 ? (
              <p className="font-mono text-xs text-text-tertiary">Loading inquiries…</p>
            ) : (
              trending.map((t) => (
                <button
                  key={t.topic}
                  onClick={() => handleTrendingClick(t.topic)}
                  className="group rounded-[2px] border border-border-2 bg-surface px-2.5 py-1.5 text-left text-xs transition duration-150 hover:border-gold"
                >
                  <span className="font-ui text-text-primary">{t.topic}</span>
                  <span className="ml-2 font-mono text-[0.65rem] text-text-tertiary group-hover:text-gold uppercase">
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
            <Clock className="h-4 w-4 text-gold" />
            <h2 className="font-display text-xl font-normal text-text-primary">
              Recent Searches
            </h2>
          </div>
          {recentSearches.length === 0 ? (
            <div className="font-ui text-xs text-text-tertiary">
              <p>No recorded searches. Enter a research question above.</p>
            </div>
          ) : (
            <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {recentSearches.slice(0, 8).map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => handleRecentClick(s.query)}
                    className="w-full flex items-center justify-between gap-3 rounded-[2px] border border-border bg-surface px-3 py-2 text-left font-mono text-xs text-text-secondary hover:border-gold hover:text-gold transition duration-150"
                  >
                    <span className="truncate flex-1">{s.query}</span>
                    {s.resultCount !== null && (
                      <span className="font-mono text-[0.65rem] text-text-tertiary uppercase">
                        {s.resultCount} records
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Navigation cards */}
      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-start gap-3">
          <BookMarked className="h-4 w-4 text-gold mt-1 shrink-0" />
          <div>
            <h3 className="font-display text-lg font-normal text-text-primary">Saved Library</h3>
            <p className="font-ui text-xs text-text-secondary font-light mt-1 leading-relaxed">
              Curate literature into projects with inclusion criteria and status screening.
            </p>
            <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-teal hover:text-gold" onClick={() => setView("library")}>
              Open library →
            </Button>
          </div>
        </Card>
        <Card className="p-5 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-gold mt-1 shrink-0" />
          <div>
            <h3 className="font-display text-lg font-normal text-text-primary">Citation Network</h3>
            <p className="font-ui text-xs text-text-secondary font-light mt-1 leading-relaxed">
              Visualize scholarly connections and citation graphs across related studies.
            </p>
            <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-teal hover:text-gold" onClick={() => setView("network")}>
              Open network →
            </Button>
          </div>
        </Card>
        <Card className="p-5 flex items-start gap-3">
          <Layers className="h-4 w-4 text-gold mt-1 shrink-0" />
          <div>
            <h3 className="font-display text-lg font-normal text-text-primary">Research Desk</h3>
            <p className="font-ui text-xs text-text-secondary font-light mt-1 leading-relaxed">
              Synthesize findings, trace source passages, and export bibliography matrices.
            </p>
            <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-teal hover:text-gold" onClick={() => setView("profile")}>
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
      <div className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-border-2 bg-surface-2 text-gold">
        <Icon className="h-4 w-4" />
      </div>
      <div className="font-display text-base font-normal text-text-primary">{title}</div>
      <div className="font-ui text-xs text-text-secondary font-light leading-snug">{desc}</div>
    </Card>
  );
}
