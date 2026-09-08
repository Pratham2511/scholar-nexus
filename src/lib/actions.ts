import { useAppStore } from "@/store/app-store";
import type { AcademicPaper, SearchFilters, SearchResult } from "@/lib/academic/types";

// NOTE: This file exports async functions that run on the client (they are
// invoked from client components but call the API routes via fetch).
// We can't import the Zustand store directly into a server component, so we
// expose helper functions that fetch + then return state updates the caller
// can apply. The "use server" directive is omitted intentionally — these are
// client-side async helpers that we colocate here for organization.

let searchSequence = 0;
let activeSearch: AbortController | null = null;
export async function runSearch(query: string, filters?: SearchFilters): Promise<void> {
  const store = useAppStore.getState();
  const sequence = ++searchSequence;
  activeSearch?.abort();
  const controller = new AbortController(); activeSearch = controller;
  store.setRawQuery(query);
  store.setNetworkGraph(null); store.setSynthesis(null); store.setSelectedPaper(null);
  store.setIsSearching(true);
  store.setView("results");
  try {
    const res = await fetch("/api/search", {
      signal: controller.signal,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        filters: filters || store.filters,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Search failed" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = (await res.json()) as SearchResult;
    if (sequence !== searchSequence) return;
    store.setPapers(data.papers);
    store.setUnderstoodQuery(data.understoodQuery);
    store.setSourceResults(data.sources);
    store.setSearchDurationMs(data.durationMs);
    store.setDuplicatesRemoved(data.duplicatesRemoved);
    // Refresh recent searches in the background
    void refreshRecentSearches();
  } catch (err) {
    if (sequence !== searchSequence || controller.signal.aborted) return;
    console.error("[runSearch] error:", err);
    store.setPapers([]);
    store.setSourceResults([]);
    store.setUnderstoodQuery({topic:query,intent:"Search failed; retry the original query",keywords:[],excludeKeywords:[],searchTerms:[query],filters:filters||store.filters,reasoning:"Search unavailable"});
    throw err;
  } finally {
    if (sequence === searchSequence) store.setIsSearching(false);
  }
}

export async function fetchSavedPapers(): Promise<AcademicPaper[]> {
  const res = await fetch("/api/library", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  const papers = data.papers as AcademicPaper[];
  useAppStore.getState().setSavedIds(new Set(papers.map((p) => p.id)));
  return papers;
}

export async function toggleSavePaper(paper: AcademicPaper): Promise<boolean> {
  const store = useAppStore.getState();
  const isSaved = store.savedIds.has(paper.id);
  if (isSaved) {
    const response = await fetch(`/api/library?paperId=${encodeURIComponent(paper.id)}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Could not remove saved paper");
    store.removeSaved(paper.id);
    return false;
  } else {
    const response = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper }),
    });
    if (!response.ok) throw new Error("Could not save paper");
    store.addSaved(paper.id);
    return true;
  }
}

export async function refreshRecentSearches(): Promise<void> {
  try {
    const res = await fetch("/api/history", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    useAppStore.getState().setRecentSearches(data.history || []);
  } catch {
    /* ignore */
  }
}

export async function fetchPaperInsights(
  paper: AcademicPaper,
  userQuery?: string,
): Promise<AcademicPaper["aiInsights"]> {
  const res = await fetch("/api/ai/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: paper.title,
      abstract: paper.abstract,
      userQuery,
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch insights");
  }
  const data = await res.json();
  return data.insights;
}
