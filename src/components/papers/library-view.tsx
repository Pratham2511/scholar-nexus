"use client";

import { useAppStore } from "@/store/app-store";
import { PaperCard } from "@/components/papers/paper-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Library, BookOpen, Loader2, Plus, Folder, FolderPlus, Trash2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchSavedPapers } from "@/lib/actions";
import type { AcademicPaper, Collection } from "@/lib/academic/types";
import { toast } from "sonner";

export function LibraryView() {
  const setView = useAppStore((s) => s.setView);
  const collections = useAppStore((s) => s.collections);
  const setCollections = useAppStore((s) => s.setCollections);
  const activeCollectionId = useAppStore((s) => s.activeCollectionId);
  const setActiveCollectionId = useAppStore((s) => s.setActiveCollectionId);
  const [allSaved, setAllSaved] = useState<AcademicPaper[]>([]);
  const [collectionPapers, setCollectionPapers] = useState<AcademicPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creating, setCreating] = useState(false);

  // Load all saved papers + collections on mount
  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const papers = await fetchSavedPapers();
        setAllSaved(papers);
        await loadCollections();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load papers in the active collection
  useEffect(() => {
    if (!activeCollectionId) {
      setCollectionPapers([]);
      return;
    }
    void (async () => {
      try {
        // Get the paperIds in this collection
        const res = await fetch(`/api/collections/paper?collectionId=${activeCollectionId}`);
        if (!res.ok) return;
        const data = await res.json();
        const idsInCollection = new Set((data.papers || []).map((p: { paperId: string }) => p.paperId));
        // Filter the all-saved list to only those in this collection
        setCollectionPapers(allSaved.filter((p) => idsInCollection.has(p.id)));
      } catch {
        setCollectionPapers([]);
      }
    })();
  }, [activeCollectionId, allSaved]);

  async function loadCollections() {
    try {
      const res = await fetch("/api/collections");
      if (!res.ok) return;
      const data = await res.json();
      setCollections(data.collections || []);
    } catch {
      /* ignore */
    }
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create collection");
      const data = await res.json();
      setCollections([data.collection as Collection, ...collections]);
      setNewCollectionName("");
      toast.success(`Created collection "${data.collection.name}"`);
    } catch {
      toast.error("Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCollection = async (id: string, name: string) => {
    if (!confirm(`Delete collection "${name}"? Papers in it will remain in your saved library.`)) return;
    try {
      await fetch(`/api/collections?id=${id}`, { method: "DELETE" });
      const next = collections.filter((c) => c.id !== id);
      setCollections(next);
      if (activeCollectionId === id) setActiveCollectionId(null);
      toast.success(`Deleted collection "${name}"`);
    } catch {
      toast.error("Failed to delete collection");
    }
  };

  const displayedPapers = activeCollectionId ? collectionPapers : allSaved;
  const activeCollection = collections.find((c) => c.id === activeCollectionId);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Library className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          {activeCollection ? activeCollection.name : "Saved Library"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {loading
            ? "Loading…"
            : displayedPapers.length > 0
              ? `${displayedPapers.length} paper${displayedPapers.length === 1 ? "" : "s"} ${activeCollection ? "in this collection" : "bookmarked for later"}.`
              : activeCollection
                ? "This collection is empty. Add papers from any search result via the 'Save to…' dropdown."
                : "Bookmark papers from search results to revisit them here."}
        </p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* V2: Collections sidebar */}
        <div className="space-y-3">
          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium text-sm flex items-center gap-1.5">
                <Folder className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Collections
              </h2>
            </div>
            {/* All Papers button */}
            <button
              onClick={() => setActiveCollectionId(null)}
              className={`w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-left transition ${
                !activeCollectionId
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "hover:bg-muted/50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                All Papers
              </span>
              <Badge variant="outline" className="text-xs">{allSaved.length}</Badge>
            </button>
            {/* Per-collection buttons */}
            {collections.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition ${
                  activeCollectionId === c.id
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "hover:bg-muted/50"
                }`}
              >
                <button
                  onClick={() => setActiveCollectionId(c.id)}
                  className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="truncate">{c.name}</span>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className="text-xs">{c.paperCount}</Badge>
                  <button
                    onClick={() => handleDeleteCollection(c.id, c.name)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition"
                    title="Delete collection"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            {/* New collection input */}
            <div className="flex gap-1 mt-2 pt-2 border-t border-border">
              <Input
                placeholder="New collection…"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreateCollection();
                }}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={handleCreateCollection}
                disabled={creating || !newCollectionName.trim()}
                className="h-8 px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Papers list */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : displayedPapers.length === 0 ? (
            <Card className="p-10 text-center">
              {activeCollection ? (
                <>
                  <FolderPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">This collection is empty</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Add papers from search results using the &quot;Save to…&quot; dropdown on any paper card.
                  </p>
                  <Button
                    onClick={() => setView("home")}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <BookOpen className="h-4 w-4" />
                    Start searching
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {activeCollection && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveCollectionId(null)}
                  className="mb-2 gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to all papers
                </Button>
              )}
              {displayedPapers.map((p) => (
                <PaperCard key={p.id} paper={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
