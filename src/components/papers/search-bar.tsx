"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/app-store";
import { runSearch } from "@/lib/actions";

interface SearchBarProps {
  /** When true, render a large hero-style search bar. */
  hero?: boolean;
  /** Optional placeholder text. */
  placeholder?: string;
}

export function SearchBar({ hero = false, placeholder }: SearchBarProps) {
  const rawQuery = useAppStore((s) => s.rawQuery);
  const setRawQuery = useAppStore((s) => s.setRawQuery);
  const isSearching = useAppStore((s) => s.isSearching);
  const [local, setLocal] = useState(rawQuery);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocal(rawQuery);
  }, [rawQuery]);

  const handleSubmit = useCallback(async () => {
    const q = local.trim();
    if (!q) return;
    setRawQuery(q);
    await runSearch(q);
  }, [local, setRawQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  if (hero) {
    return (
      <div className="w-full">
        <div className="relative rounded-2xl border border-border bg-card shadow-lg shadow-emerald-500/5 transition focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20">
          <Sparkles className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-emerald-500" />
          <Textarea
            ref={textareaRef}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Describe what you're researching in natural language…\n\nExample: I need recent papers about blockchain in healthcare with more than 50 citations but no survey papers."}
            className="min-h-[120px] resize-none border-0 bg-transparent pl-12 pr-32 pt-4 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isSearching}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              ⌘ + ↵
            </span>
            <Button
              onClick={handleSubmit}
              disabled={isSearching || !local.trim()}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isSearching ? "Searching…" : "Search"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Compact inline variant
  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSubmit();
          }}
          placeholder={placeholder || "Search papers…"}
          className="h-10 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          disabled={isSearching}
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={isSearching || !local.trim()}
        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        size="sm"
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Search</span>
      </Button>
    </div>
  );
}
