import { create } from "zustand";
import type { AcademicPaper, AIUnderstoodQuery, SearchFilters, SourceResult } from "@/lib/academic/types";

export type ViewName = "home" | "results" | "details" | "compare" | "library" | "profile";

interface AppState {
  // Navigation
  view: ViewName;
  setView: (v: ViewName) => void;

  // Search state
  rawQuery: string;
  setRawQuery: (q: string) => void;
  filters: SearchFilters;
  setFilters: (f: SearchFilters) => void;
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  resetFilters: () => void;

  // Results
  papers: AcademicPaper[];
  setPapers: (p: AcademicPaper[]) => void;
  understoodQuery: AIUnderstoodQuery | null;
  setUnderstoodQuery: (u: AIUnderstoodQuery | null) => void;
  sourceResults: SourceResult[];
  setSourceResults: (s: SourceResult[]) => void;
  isSearching: boolean;
  setIsSearching: (b: boolean) => void;
  searchDurationMs: number;
  setSearchDurationMs: (n: number) => void;
  duplicatesRemoved: number;
  setDuplicatesRemoved: (n: number) => void;

  // Paper details
  selectedPaper: AcademicPaper | null;
  setSelectedPaper: (p: AcademicPaper | null) => void;

  // Compare
  compareIds: Set<string>;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;

  // Saved papers (client-side cache of server state)
  savedIds: Set<string>;
  setSavedIds: (ids: Set<string>) => void;
  addSaved: (id: string) => void;
  removeSaved: (id: string) => void;

  // Theme
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;

  // Recent searches (loaded from server)
  recentSearches: { id: string; query: string; createdAt: string; resultCount: number | null }[];
  setRecentSearches: (r: AppState["recentSearches"]) => void;
}

const initialFilters: SearchFilters = {};

export const useAppStore = create<AppState>((set) => ({
  view: "home",
  setView: (v) => set({ view: v }),

  rawQuery: "",
  setRawQuery: (q) => set({ rawQuery: q }),
  filters: initialFilters,
  setFilters: (f) => set({ filters: f }),
  updateFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: {} }),

  papers: [],
  setPapers: (p) => set({ papers: p }),
  understoodQuery: null,
  setUnderstoodQuery: (u) => set({ understoodQuery: u }),
  sourceResults: [],
  setSourceResults: (s) => set({ sourceResults: s }),
  isSearching: false,
  setIsSearching: (b) => set({ isSearching: b }),
  searchDurationMs: 0,
  setSearchDurationMs: (n) => set({ searchDurationMs: n }),
  duplicatesRemoved: 0,
  setDuplicatesRemoved: (n) => set({ duplicatesRemoved: n }),

  selectedPaper: null,
  setSelectedPaper: (p) => set({ selectedPaper: p }),

  compareIds: new Set<string>(),
  toggleCompare: (id) =>
    set((s) => {
      const next = new Set(s.compareIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { compareIds: next };
    }),
  clearCompare: () => set({ compareIds: new Set<string>() }),

  savedIds: new Set<string>(),
  setSavedIds: (ids) => set({ savedIds: ids }),
  addSaved: (id) =>
    set((s) => {
      const next = new Set(s.savedIds);
      next.add(id);
      return { savedIds: next };
    }),
  removeSaved: (id) =>
    set((s) => {
      const next = new Set(s.savedIds);
      next.delete(id);
      return { savedIds: next };
    }),

  theme: "light",
  toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
  setTheme: (t) => set({ theme: t }),

  recentSearches: [],
  setRecentSearches: (r) => set({ recentSearches: r }),
}));
