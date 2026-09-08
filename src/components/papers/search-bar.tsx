"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search } from "lucide-react";
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

const TYPEWRITER_EXAMPLES = [
  "Recent transformer papers with 100+ citations",
  "Federated learning privacy 2023 no surveys",
  "CRISPR cancer therapy clinical trials open access",
  "Quantum error correction IEEE 2024",
  "Graph neural networks for drug discovery",
];

export function SearchBar({ hero = false, placeholder }: SearchBarProps) {
  const rawQuery = useAppStore((s) => s.rawQuery);
  const setRawQuery = useAppStore((s) => s.setRawQuery);
  const isSearching = useAppStore((s) => s.isSearching);
  const [local, setLocal] = useState(rawQuery);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Typewriter animation with blinking underscore
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [exampleIdx, setExampleIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setLocal(rawQuery);
  }, [rawQuery]);

  // Only animate the placeholder if the user hasn't typed anything
  useEffect(() => {
    if (!hero || local) return;

    const current = TYPEWRITER_EXAMPLES[exampleIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && charIdx < current.length) {
      timeout = setTimeout(() => {
        setTypedPlaceholder(current.slice(0, charIdx + 1));
        setCharIdx(charIdx + 1);
      }, 40);
    } else if (!isDeleting && charIdx === current.length) {
      // Pause at full word
      timeout = setTimeout(() => setIsDeleting(true), 2500);
    } else if (isDeleting && charIdx > 0) {
      timeout = setTimeout(() => {
        setTypedPlaceholder(current.slice(0, charIdx - 1));
        setCharIdx(charIdx - 1);
      }, 25);
    } else if (isDeleting && charIdx === 0) {
      setIsDeleting(false);
      setExampleIdx((exampleIdx + 1) % TYPEWRITER_EXAMPLES.length);
    }

    return () => clearTimeout(timeout);
  }, [hero, local, charIdx, isDeleting, exampleIdx]);

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
    const dynamicPlaceholder = local
      ? (placeholder || "Describe what you're researching in natural language…")
      : `e.g. ${typedPlaceholder}${!isDeleting && charIdx === TYPEWRITER_EXAMPLES[exampleIdx].length ? "" : "_"}`;

    return (
      <div className="w-full">
        <div className="relative rounded-[2px] border border-border-2 bg-surface-inset p-1 transition-[border-color,box-shadow] focus-within:border-border-2 focus-within:ring-1 focus-within:ring-border-2">
          <Search className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-accent" />
          <Textarea
            ref={textareaRef}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={dynamicPlaceholder}
            className="min-h-[110px] resize-none border-0 bg-transparent pl-12 pr-32 pt-3 font-mono text-sm text-text-primary shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isSearching}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="hidden font-mono text-[0.7rem] text-text-tertiary sm:inline">
              ⌘ + ↵
            </span>
            <Button
              onClick={handleSubmit}
              disabled={isSearching || !local.trim()}
              size="sm"
            >
              {isSearching ? (
                <span className="tracking-widest">···</span>
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              {isSearching ? "Searching" : "Search"}
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
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSubmit();
          }}
          placeholder={placeholder || "Search papers…"}
          className="h-9 w-full rounded-[2px] border border-border-2 bg-surface-inset pl-9 pr-3 font-mono text-sm text-text-primary outline-none transition-colors focus:border-border-2 focus:ring-1 focus:ring-border-2"
          disabled={isSearching}
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={isSearching || !local.trim()}
        size="sm"
      >
        {isSearching ? (
          <span className="tracking-widest">···</span>
        ) : (
          <Search className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">{isSearching ? "Searching" : "Search"}</span>
      </Button>
    </div>
  );
}
