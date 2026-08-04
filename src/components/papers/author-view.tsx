"use client";

import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  ArrowLeft,
  Loader2,
  Building2,
  FileText,
  Quote,
  Award,
  Heart,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AuthorProfile } from "@/lib/academic/types";
import { PaperCard } from "@/components/papers/paper-card";
import { toast } from "sonner";

export function AuthorView() {
  const selectedAuthorName = useAppStore((s) => s.selectedAuthorName);
  const setView = useAppStore((s) => s.setView);
  const setSelectedAuthorName = useAppStore((s) => s.setSelectedAuthorName);
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [togglingFollow, setTogglingFollow] = useState(false);

  useEffect(() => {
    if (!selectedAuthorName) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setProfile(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/author?name=${encodeURIComponent(selectedAuthorName)}`,
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Failed" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setProfile(data.profile);
        setIsFollowing(data.isFollowing);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load author profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedAuthorName]);

  const handleFollow = async () => {
    if (!profile) return;
    setTogglingFollow(true);
    try {
      const res = await fetch("/api/author", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          action: isFollowing ? "unfollow" : "follow",
        }),
      });
      if (!res.ok) throw new Error("Failed to toggle follow");
      const data = await res.json();
      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? "Unfollowed author" : "Following author");
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setTogglingFollow(false);
    }
  };

  if (!selectedAuthorName) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 text-center">
        <Card className="p-10">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No author selected</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Click any author name in a paper card or detail page to view their profile.
          </p>
          <Button variant="outline" size="sm" onClick={() => setView("results")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to results
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSelectedAuthorName(null);
          setView("results");
        }}
        className="mb-4 gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {loading || !profile ? (
        <Card className="p-6 mb-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Author header */}
          <Card className="p-6 mb-4">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl font-bold shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight mb-2">{profile.name}</h1>
                {profile.affiliations.length > 0 && (
                  <div className="flex items-start gap-1.5 text-sm text-muted-foreground mb-2">
                    <Building2 className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{profile.affiliations.slice(0, 3).join(", ")}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <strong>{profile.paperCount.toLocaleString()}</strong> papers
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Quote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <strong>{profile.citationCount.toLocaleString()}</strong> citations
                  </span>
                  {profile.hIndex !== null && (
                    <span className="flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      h-index: <strong>{profile.hIndex}</strong>
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={handleFollow}
                disabled={togglingFollow}
                variant={isFollowing ? "secondary" : "default"}
                size="sm"
                className="gap-1.5"
              >
                {togglingFollow ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className={`h-4 w-4 ${isFollowing ? "fill-current" : ""}`} />
                )}
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </Card>

          {/* Papers list */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Recent Papers ({profile.papers.length})
            </h2>
            {profile.papers.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                No papers found for this author in Semantic Scholar.
              </Card>
            ) : (
              <div className="space-y-3">
                {profile.papers.map((p) => (
                  <PaperCard key={p.id} paper={p} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
