"use client";

import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Sparkles,
  Loader2,
  Bookmark,
  History,
  Quote,
  Save,
  Plus,
  X,
  Lightbulb,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ProfileData {
  profile: {
    id: string;
    email: string;
    name: string | null;
    affiliation: string | null;
    researchInterests: string | null;
  };
  favorites: string[];
  stats: { savedCount: number; searchCount: number };
}

interface ExportRecord {
  id: string;
  paperTitle: string;
  format: string;
  createdAt: string;
}

interface RecentSearch {
  id: string;
  query: string;
  createdAt: string;
  resultCount: number | null;
}

export function ProfileView() {
  const setView = useAppStore((s) => s.setView);
  const setRawQuery = useAppStore((s) => s.setRawQuery);
  const [data, setData] = useState<ProfileData | null>(null);
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", affiliation: "", researchInterests: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [newFav, setNewFav] = useState("");

  const loadAll = async () => {
    const [profileRes, exportsRes, historyRes] = await Promise.all([
      fetch("/api/profile"),
      fetch("/api/exports"),
      fetch("/api/history"),
    ]);
    const profileData = await profileRes.json();
    setData(profileData);
    setForm({
      name: profileData.profile?.name || "",
      affiliation: profileData.profile?.affiliation || "",
      researchInterests: profileData.profile?.researchInterests || "",
    });
    setExports((await exportsRes.json()).exports || []);
    setRecentSearches((await historyRes.json()).history || []);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  // Generate recommendations when saved papers change
  const generateRecs = async () => {
    if (!data || data.stats.savedCount === 0) return;
    setLoadingRecs(true);
    try {
      // Fetch saved paper titles
      const libRes = await fetch("/api/library");
      const libData = await libRes.json();
      const titles = (libData.papers || []).map((p: { title: string }) => p.title);
      const recRes = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titles }),
      });
      const recData = await recRes.json();
      setRecommendations(recData.topics || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    if (data && data.stats.savedCount > 0) {
      void generateRecs();
    }
  }, [data?.stats.savedCount]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      toast.success("Profile updated");
      setEditing(false);
      void loadAll();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddFavorite = async () => {
    if (!newFav.trim()) return;
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", topic: newFav.trim() }),
    });
    setNewFav("");
    toast.success("Topic added to favorites");
    void loadAll();
  };

  const handleRemoveFavorite = async (topic: string) => {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", topic }),
    });
    toast.success("Topic removed");
    void loadAll();
  };

  const handleRecentClick = (query: string) => {
    setRawQuery(query);
    setView("results");
    // Trigger search via store-driven action
    void import("@/lib/actions").then((m) => m.runSearch(query));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <User className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your researcher profile, favorite topics, and view your activity.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <Bookmark className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          <div>
            <div className="text-2xl font-bold">{data?.stats.savedCount ?? 0}</div>
            <div className="text-xs text-muted-foreground">Saved papers</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <History className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          <div>
            <div className="text-2xl font-bold">{data?.stats.searchCount ?? 0}</div>
            <div className="text-xs text-muted-foreground">Searches run</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Quote className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          <div>
            <div className="text-2xl font-bold">{exports.length}</div>
            <div className="text-xs text-muted-foreground">Citations exported</div>
          </div>
        </Card>
      </div>

      {/* Profile card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Researcher Profile</h2>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                {savingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          )}
        </div>

        {!editing ? (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Name</dt>
              <dd>{data?.profile?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="text-muted-foreground">{data?.profile?.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Affiliation</dt>
              <dd>{data?.profile?.affiliation || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Research interests</dt>
              <dd className="whitespace-pre-wrap">{data?.profile?.researchInterests || "—"}</dd>
            </div>
          </dl>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="name" className="text-xs">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="affiliation" className="text-xs">Affiliation</Label>
              <Input id="affiliation" value={form.affiliation} onChange={(e) => setForm({ ...form, affiliation: e.target.value })} placeholder="e.g. MIT, Stanford" />
            </div>
            <div>
              <Label htmlFor="interests" className="text-xs">Research interests</Label>
              <Textarea id="interests" value={form.researchInterests} onChange={(e) => setForm({ ...form, researchInterests: e.target.value })} placeholder="Describe your research focus…" rows={3} />
            </div>
          </div>
        )}
      </Card>

      {/* Favorite topics */}
      <Card className="p-5">
        <h2 className="font-semibold mb-3">Favorite Topics</h2>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {data?.favorites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No favorite topics yet.</p>
          ) : (
            data?.favorites.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1 pr-1.5">
                {t}
                <button onClick={() => handleRemoveFavorite(t)} className="ml-0.5 rounded-full hover:bg-background p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add a topic…"
            value={newFav}
            onChange={(e) => setNewFav(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleAddFavorite();
            }}
            className="h-9"
          />
          <Button onClick={handleAddFavorite} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </Card>

      {/* AI recommendations */}
      {data && data.stats.savedCount > 0 && (
        <Card className="p-5 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="font-semibold">AI-Recommended Topics</h2>
            {loadingRecs && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          {recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              {loadingRecs ? "Analyzing your saved papers…" : "No recommendations yet."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {recommendations.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setRawQuery(t);
                    setView("results");
                    void import("@/lib/actions").then((m) => m.runSearch(t));
                  }}
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Recent searches */}
      <Card className="p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Recent Searches
        </h2>
        {recentSearches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No searches yet.</p>
        ) : (
          <ul className="space-y-1.5 max-h-64 overflow-y-auto">
            {recentSearches.slice(0, 12).map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => handleRecentClick(s.query)}
                  className="w-full flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-sm hover:bg-muted/50"
                >
                  <span className="truncate flex-1">{s.query}</span>
                  {s.resultCount !== null && (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {s.resultCount}
                    </Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Export history */}
      <Card className="p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Quote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Export History
        </h2>
        {exports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No citations exported yet.</p>
        ) : (
          <ul className="space-y-1.5 max-h-64 overflow-y-auto">
            {exports.slice(0, 20).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                <span className="truncate flex-1">{e.paperTitle}</span>
                <Badge variant="secondary" className="shrink-0 text-xs">{e.format}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
