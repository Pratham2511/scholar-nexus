import { create } from "zustand";
import type {
  AcademicPaper,
  AIUnderstoodQuery,
  EvidenceSynthesis,
  NetworkGraph,
  SearchFilters,
  SourceResult,
} from "@/lib/academic/types";
import type { Collection, SearchAlert } from "@/lib/academic/types";

export type ViewName =
  | "home"
  | "results"
  | "details"
  | "compare"
  | "library"
  | "profile"
  | "network"  // V2 — Visual Paper Network
  | "author";  // V2 — Author Profile

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

  // V2 — AI Synthesis
  synthesis: EvidenceSynthesis | null;
  setSynthesis: (s: EvidenceSynthesis | null) => void;
  isSynthesizing: boolean;
  setIsSynthesizing: (b: boolean) => void;

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

  // V2 — Collections
  collections: Collection[];
  setCollections: (c: Collection[]) => void;
  activeCollectionId: string | null;
  setActiveCollectionId: (id: string | null) => void;

  // V2 — Search Alerts
  alerts: SearchAlert[];
  setAlerts: (a: SearchAlert[]) => void;
  alertModalOpen: boolean;
  setAlertModalOpen: (b: boolean) => void;

  // V2 — Network View
  networkGraph: NetworkGraph | null;
  setNetworkGraph: (g: NetworkGraph | null) => void;
  selectedNetworkNodeId: string | null;
  setSelectedNetworkNodeId: (id: string | null) => void;
  isNetworkLoading: boolean;
  setIsNetworkLoading: (b: boolean) => void;

  // V2 — Author Profile
  selectedAuthorName: string | null;
  setSelectedAuthorName: (n: string | null) => void;

  // Theme (V2: default is dark)
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

  // V2 — Synthesis
  synthesis: null,
  setSynthesis: (s) => set({ synthesis: s }),
  isSynthesizing: false,
  setIsSynthesizing: (b) => set({ isSynthesizing: b }),

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

  // V2 — Collections
  collections: [],
  setCollections: (c) => set({ collections: c }),
  activeCollectionId: null,
  setActiveCollectionId: (id) => set({ activeCollectionId: id }),

  // V2 — Alerts
  alerts: [],
  setAlerts: (a) => set({ alerts: a }),
  alertModalOpen: false,
  setAlertModalOpen: (b) => set({ alertModalOpen: b }),

  // V2 — Network
  networkGraph: null,
  setNetworkGraph: (g) => set({ networkGraph: g }),
  selectedNetworkNodeId: null,
  setSelectedNetworkNodeId: (id) => set({ selectedNetworkNodeId: id }),
  isNetworkLoading: false,
  setIsNetworkLoading: (b) => set({ isNetworkLoading: b }),

  // V2 — Author
  selectedAuthorName: null,
  setSelectedAuthorName: (n) => set({ selectedAuthorName: n }),

  // V2 — Dark theme is default
  theme: "dark",
  toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
  setTheme: (t) => set({ theme: t }),

  recentSearches: [],
  setRecentSearches: (r) => set({ recentSearches: r }),
}));
