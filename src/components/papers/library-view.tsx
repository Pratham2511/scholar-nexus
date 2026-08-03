"use client";

import { useAppStore } from "@/store/app-store";
import { PaperCard } from "@/components/papers/paper-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Library, BookOpen, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchSavedPapers } from "@/lib/actions";
import type { AcademicPaper } from "@/lib/academic/types";

export function LibraryView() {
  const setView = useAppStore((s) => s.setView);
  const [saved, setSaved] = useState<AcademicPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const papers = await fetchSavedPapers();
        setSaved(papers);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Library className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          Saved Library
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {saved.length > 0
            ? `${saved.length} paper${saved.length === 1 ? "" : "s"} bookmarked for later.`
            : "Bookmark papers from search results to revisit them here."}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : saved.length === 0 ? (
        <Card className="p-10 text-center">
          <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your library is empty</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            When you find an interesting paper, click the bookmark button to save it here.
            Saved papers persist across searches.
          </p>
          <Button
            onClick={() => setView("home")}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <BookOpen className="h-4 w-4" />
            Start searching
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {saved.map((p) => (
            <PaperCard key={p.id} paper={p} />
          ))}
        </div>
      )}
    </div>
  );
}
