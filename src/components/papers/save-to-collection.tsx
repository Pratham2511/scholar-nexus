"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { BookmarkPlus, Plus, Folder, Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { AcademicPaper, Collection } from "@/lib/academic/types";
import { toast } from "sonner";

interface SaveToCollectionProps {
  paper: AcademicPaper;
  /** Compact variant for inline use */
  compact?: boolean;
}

export function SaveToCollection({ paper, compact = false }: SaveToCollectionProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [paperCollectionIds, setPaperCollectionIds] = useState<Set<string>>(new Set());
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creating, setCreating] = useState(false);

  // Load collections on mount
  useEffect(() => {
    void loadCollections();
  }, []);

  // Load which collections this paper is already in
  useEffect(() => {
    if (collections.length === 0) return;
    void (async () => {
      const inIds = new Set<string>();
      await Promise.all(
        collections.map(async (c) => {
          try {
            const res = await fetch(`/api/collections/paper?collectionId=${c.id}`);
            if (!res.ok) return;
            const data = await res.json();
            if (Array.isArray(data.papers) && data.papers.some((p: { paperId: string }) => p.paperId === paper.id)) {
              inIds.add(c.id);
            }
          } catch {
            /* ignore */
          }
        }),
      );
      setPaperCollectionIds(inIds);
    })();
  }, [collections, paper.id]);

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

  const handleTogglePaperInCollection = async (collectionId: string) => {
    const isIn = paperCollectionIds.has(collectionId);
    try {
      if (isIn) {
        await fetch(`/api/collections/paper?collectionId=${collectionId}&paperId=${encodeURIComponent(paper.id)}`, {
          method: "DELETE",
        });
        const next = new Set(paperCollectionIds);
        next.delete(collectionId);
        setPaperCollectionIds(next);
        toast.success("Removed from collection");
      } else {
        await fetch("/api/collections/paper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collectionId, paper }),
        });
        const next = new Set(paperCollectionIds);
        next.add(collectionId);
        setPaperCollectionIds(next);
        toast.success("Added to collection");
      }
    } catch {
      toast.error("Failed to update collection");
    }
  };

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
      const newCollection = data.collection as Collection;
      setCollections([newCollection, ...collections]);
      // Add the paper to the new collection
      await fetch("/api/collections/paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId: newCollection.id, paper }),
      });
      setPaperCollectionIds(new Set([...paperCollectionIds, newCollection.id]));
      setNewCollectionName("");
      toast.success(`Created "${newCollection.name}" and added paper`);
    } catch {
      toast.error("Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={compact ? "h-8 gap-1" : "h-8 gap-1.5"}
          onClick={(e) => e.stopPropagation()}
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
          {!compact && <span className="hidden sm:inline">Save to…</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">Save to collection</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {collections.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            No collections yet. Create one below.
          </div>
        ) : (
          collections.map((c) => {
            const isIn = paperCollectionIds.has(c.id);
            return (
              <DropdownMenuItem
                key={c.id}
                onClick={() => handleTogglePaperInCollection(c.id)}
                className="gap-2 cursor-pointer"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <span className="flex-1 truncate text-sm">{c.name}</span>
                {isIn && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <div className="flex gap-1 px-1 py-1">
          <Input
            placeholder="New collection name…"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreateCollection();
              }
            }}
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            variant="default"
            onClick={handleCreateCollection}
            disabled={creating || !newCollectionName.trim()}
            className="h-8 px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {collections.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                // Navigate to library view to manage collections
                window.dispatchEvent(new CustomEvent("navigate-library"));
              }}
              className="gap-2 cursor-pointer text-muted-foreground"
            >
              <Folder className="h-3.5 w-3.5" />
              <span className="text-xs">Manage collections</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
