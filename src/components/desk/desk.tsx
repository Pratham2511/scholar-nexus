"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { BookOpen, Compass } from "lucide-react";
import { useWorkspace } from "./use-workspace";
import { WorkspaceShell, type ActiveSection } from "../workspace/workspace-shell";
import { DiscoverView, type SearchFilters } from "../workspace/discover-view";
import { ReaderView } from "../workspace/reader-view";
import { SavedView } from "../workspace/saved-view";
import { ProjectsView } from "../workspace/projects-view";
import { CompareView } from "../workspace/compare-view";
import { UpdatesView } from "../workspace/updates-view";
import type { Paper } from "../workspace/paper-card";
import type { Workspace, Evidence } from "@/lib/workspace/schema";

interface DeskProps {
  section?: "discover" | "reading" | "projects" | "updates";
}

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

export function Desk({ section }: DeskProps) {
  const { state, mutate, storageStatus } = useWorkspace();

  // Active view routing
  const [currentSection, setCurrentSection] = useState<ActiveSection>(() => {
    if (section === "reading") return "reading";
    if (section === "projects") return "projects";
    if (section === "updates") return "updates";
    return "discover";
  });

  // Active paper in reader
  const [activeReaderPaper, setActiveReaderPaper] = useState<Paper | null>(null);

  // Active project
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([
    "Crossref",
    "arXiv",
    "Europe PMC",
  ]);
  const [filters, setFilters] = useState<SearchFilters>({
    sort: "relevance",
  });
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [diagnostics, setDiagnostics] = useState<
    Array<{ source: string; status?: string; error?: string; durationMs: number }>
  >([]);

  // Initialize active project if exists
  useEffect(() => {
    if (state.projects.length > 0 && !activeProjectId) {
      setActiveProjectId(state.projects[0].id);
    }
  }, [state.projects, activeProjectId]);

  // If activeReaderPaper is not set but reader route was requested, default to first saved paper
  useEffect(() => {
    if (currentSection === "reading" && !activeReaderPaper && state.papers.length > 0) {
      setActiveReaderPaper(state.papers[0]);
    }
  }, [currentSection, activeReaderPaper, state.papers]);

  // Derived sets for O(1) membership checks
  const savedPaperIds = useMemo(
    () => new Set(state.papers.map((p) => p.id)),
    [state.papers]
  );

  const comparedPaperIds = useMemo(
    () => new Set(state.compare),
    [state.compare]
  );

  // Search action
  const handleSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) return;
      setIsSearching(true);
      setDiagnostics([]);

      try {
        const payload = {
          query: q.trim(),
          yearFrom: filters.yearFrom,
          yearTo: filters.yearTo,
          openAccess: filters.openAccess,
          minCitations: filters.minCitations,
          sources: selectedProviders,
          sort: filters.sort || "relevance",
          deduplicate: true,
        };

        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && Array.isArray(data.papers)) {
          setSearchResults(data.papers);
          setDiagnostics(data.diagnostics || []);

          // Record in workspace searches history
          void mutate((draft) => {
            draft.searches.unshift({
              id: uid(),
              query: q.trim(),
              filters: payload as unknown as Record<string, unknown>,
              providers: selectedProviders,
              createdAt: now(),
              papers: data.papers.slice(0, 50),
              diagnostics: data.diagnostics || [],
            });
            if (draft.searches.length > 50) {
              draft.searches = draft.searches.slice(0, 50);
            }
          });
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Search failed", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [filters, selectedProviders, mutate]
  );

  // Toggle Save paper in Library
  const handleToggleSave = useCallback(
    (paper: Paper) => {
      void mutate((draft) => {
        const index = draft.papers.findIndex((p) => p.id === paper.id);
        if (index >= 0) {
          draft.papers.splice(index, 1);
        } else {
          draft.papers.unshift(paper);
        }
      });
    },
    [mutate]
  );

  // Toggle Compare paper
  const handleToggleCompare = useCallback(
    (paper: Paper) => {
      void mutate((draft) => {
        const exists = draft.compare.includes(paper.id);
        if (exists) {
          draft.compare = draft.compare.filter((id) => id !== paper.id);
        } else {
          if (draft.compare.length < 8) {
            draft.compare.push(paper.id);
            // Ensure paper is saved so metadata is retained
            if (!draft.papers.some((p) => p.id === paper.id)) {
              draft.papers.push(paper);
            }
          }
        }
      });
    },
    [mutate]
  );

  // Remove from compare
  const handleRemoveFromCompare = useCallback(
    (paperId: string) => {
      void mutate((draft) => {
        draft.compare = draft.compare.filter((id) => id !== paperId);
      });
    },
    [mutate]
  );

  const handleClearCompare = useCallback(() => {
    void mutate((draft) => {
      draft.compare = [];
    });
  }, [mutate]);

  // Open Paper in Reader View
  const handleOpenReader = useCallback((paper: Paper) => {
    setActiveReaderPaper(paper);
    setCurrentSection("reading");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Add Paper to Current Project
  const handleAddToProject = useCallback(
    (paper: Paper) => {
      if (state.projects.length === 0) {
        // Auto-create a default project if none exists
        const newProjId = uid();
        void mutate((draft) => {
          draft.projects.push({
            id: newProjId,
            name: "Initial Literature Review",
            question: "Synthesizing primary findings across search results",
            criteria: "Empirical papers with peer review or preprint release",
            members: [
              {
                paperId: paper.id,
                status: "unread",
                decision: "unscreened",
                reason: "",
                notes: "",
                tags: "",
              },
            ],
            createdAt: now(),
          });
          if (!draft.papers.some((p) => p.id === paper.id)) {
            draft.papers.push(paper);
          }
        });
        setActiveProjectId(newProjId);
        return;
      }

      const targetProjectId = activeProjectId || state.projects[0].id;
      void mutate((draft) => {
        const proj = draft.projects.find((p) => p.id === targetProjectId);
        if (proj && !proj.members.some((m) => m.paperId === paper.id)) {
          proj.members.push({
            paperId: paper.id,
            status: "unread",
            decision: "unscreened",
            reason: "",
            notes: "",
            tags: "",
          });
        }
        if (!draft.papers.some((p) => p.id === paper.id)) {
          draft.papers.push(paper);
        }
      });
    },
    [state.projects, activeProjectId, mutate]
  );

  // Create Project
  const handleCreateProject = useCallback(
    (name: string, question: string, criteria: string) => {
      const id = uid();
      void mutate((draft) => {
        draft.projects.push({
          id,
          name,
          question,
          criteria,
          members: [],
          createdAt: now(),
        });
      });
      setActiveProjectId(id);
    },
    [mutate]
  );

  // Update Member Decision
  const handleUpdateMemberDecision = useCallback(
    (
      projectId: string,
      paperId: string,
      decision: "include" | "exclude" | "maybe" | "unscreened",
      reason: string
    ) => {
      void mutate((draft) => {
        const proj = draft.projects.find((p) => p.id === projectId);
        if (proj) {
          const member = proj.members.find((m) => m.paperId === paperId);
          if (member) {
            const before = member.decision;
            member.decision = decision;
            member.reason = reason;

            draft.events.push({
              id: uid(),
              projectId,
              paperId,
              before,
              after: decision,
              reason,
              createdAt: now(),
            });
          }
        }
      });
    },
    [mutate]
  );

  // Capture Evidence
  const handleCaptureEvidence = useCallback(
    async (data: {
      statement: string;
      quote: string;
      field: Evidence["field"];
      kind: Evidence["kind"];
    }) => {
      if (!activeReaderPaper) return false;
      return mutate((draft) => {
        // Ensure paper is saved in workspace
        if (!draft.papers.some((p) => p.id === activeReaderPaper.id)) {
          draft.papers.push(activeReaderPaper);
        }
        draft.evidence.push({
          id: uid(),
          paperId: activeReaderPaper.id,
          field: data.field,
          statement: data.statement,
          quote: data.quote,
          kind: data.kind,
          createdAt: now(),
        });
      });
    },
    [activeReaderPaper, mutate]
  );

  // Delete Evidence
  const handleDeleteEvidence = useCallback(
    async (evidenceId: string) => {
      return mutate((draft) => {
        draft.evidence = draft.evidence.filter((e) => e.id !== evidenceId);
      });
    },
    [mutate]
  );

  // Create Alert
  const handleCreateAlert = useCallback(
    (alertQuery: string, frequency: "daily" | "weekly") => {
      void mutate((draft) => {
        draft.alerts.push({
          id: uid(),
          query: alertQuery,
          filters: {},
          providers: selectedProviders,
          frequency,
          lastRunAt: null,
          seen: [],
          createdAt: now(),
        });
      });
    },
    [selectedProviders, mutate]
  );

  // Delete Alert
  const handleDeleteAlert = useCallback(
    (alertId: string) => {
      void mutate((draft) => {
        draft.alerts = draft.alerts.filter((a) => a.id !== alertId);
      });
    },
    [mutate]
  );

  // Mark Inbox Read
  const handleMarkInboxRead = useCallback(
    (inboxId: string) => {
      void mutate((draft) => {
        const item = draft.inbox.find((i) => i.id === inboxId);
        if (item) item.read = true;
      });
    },
    [mutate]
  );

  // Mark All Inbox Read
  const handleMarkAllInboxRead = useCallback(() => {
    void mutate((draft) => {
      draft.inbox.forEach((i) => {
        i.read = true;
      });
    });
  }, [mutate]);

  // Export Snapshot
  const handleExportSnapshot = useCallback(() => {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kivo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  // Collect all papers known to the workspace
  const allKnownPapers = useMemo(() => {
    const map = new Map<string, Paper>();
    state.papers.forEach((p) => map.set(p.id, p));
    searchResults.forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    if (activeReaderPaper && !map.has(activeReaderPaper.id)) {
      map.set(activeReaderPaper.id, activeReaderPaper);
    }
    return Array.from(map.values());
  }, [state.papers, searchResults, activeReaderPaper]);

  // Compared papers list
  const comparedPapers = useMemo(() => {
    const map = new Map<string, Paper>(allKnownPapers.map((p) => [p.id, p]));
    return state.compare
      .map((id) => map.get(id))
      .filter((p): p is Paper => Boolean(p));
  }, [state.compare, allKnownPapers]);

  return (
    <WorkspaceShell
      currentSection={currentSection}
      onNavigate={setCurrentSection}
      storageStatus={storageStatus}
      savedCount={state.papers.length}
      compareCount={state.compare.length}
      unreadAlertsCount={state.inbox.filter((i) => !i.read).length}
      onExportSnapshot={handleExportSnapshot}
    >
      {/* 1. Discover View */}
      {currentSection === "discover" && (
        <DiscoverView
          query={searchQuery}
          setQuery={setSearchQuery}
          selectedProviders={selectedProviders}
          setSelectedProviders={setSelectedProviders}
          filters={filters}
          setFilters={setFilters}
          onSearch={handleSearch}
          isSearching={isSearching}
          results={searchResults}
          diagnostics={diagnostics}
          recentSearches={state.searches}
          savedPaperIds={savedPaperIds}
          comparedPaperIds={comparedPaperIds}
          onToggleSave={handleToggleSave}
          onToggleCompare={handleToggleCompare}
          onOpenReader={handleOpenReader}
          onAddToProject={handleAddToProject}
        />
      )}

      {/* 2. Reader View */}
      {currentSection === "reading" &&
        (activeReaderPaper ? (
          <ReaderView
            paper={activeReaderPaper}
            onBack={() => setCurrentSection("discover")}
            isSaved={savedPaperIds.has(activeReaderPaper.id)}
            isCompared={comparedPaperIds.has(activeReaderPaper.id)}
            onToggleSave={handleToggleSave}
            onToggleCompare={handleToggleCompare}
            workspaceEvidence={state.evidence}
            onCaptureEvidence={handleCaptureEvidence}
            onDeleteEvidence={handleDeleteEvidence}
          />
        ) : (
          <div className="tech-card bracketed p-16 text-center max-w-xl mx-auto space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-[rgba(58, 157, 124,0.08)] border border-[var(--border-primary-dim)] text-[var(--color-primary-bright)] shadow-[0_0_25px_rgba(58, 157, 124,0.22)]">
              <BookOpen className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-[var(--text-primary)] font-display">
                No Paper Selected in Reader
              </h3>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                Select any scientific paper from literature discovery or your library to read the abstract, trace citations, and capture evidence.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCurrentSection("discover")}
                className="btn btn-primary h-11 px-6 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider"
              >
                <Compass className="w-4.5 h-4.5" />
                <span>DISCOVER LITERATURE</span>
              </button>
            </div>
          </div>
        ))}

      {/* 3. Saved Vault View */}
      {currentSection === "saved" && (
        <SavedView
          papers={state.papers}
          comparedPaperIds={comparedPaperIds}
          onToggleSave={handleToggleSave}
          onToggleCompare={handleToggleCompare}
          onOpenReader={handleOpenReader}
          onNavigateToDiscover={() => setCurrentSection("discover")}
          onAddToProject={handleAddToProject}
        />
      )}

      {/* 4. Projects & Screening View */}
      {currentSection === "projects" && (
        <ProjectsView
          projects={state.projects}
          activeProjectId={activeProjectId}
          onSelectProject={setActiveProjectId}
          onCreateProject={handleCreateProject}
          onUpdateMemberDecision={handleUpdateMemberDecision}
          allPapers={allKnownPapers}
          evidenceList={state.evidence}
          onOpenReader={handleOpenReader}
        />
      )}

      {/* 5. Compare Studio View */}
      {currentSection === "compare" && (
        <CompareView
          comparedPapers={comparedPapers}
          onRemovePaper={handleRemoveFromCompare}
          onClearAll={handleClearCompare}
          onOpenReader={handleOpenReader}
          onNavigateToDiscover={() => setCurrentSection("discover")}
          evidenceList={state.evidence}
        />
      )}

      {/* 6. Alerts Radar View */}
      {currentSection === "updates" && (
        <UpdatesView
          inbox={state.inbox}
          alerts={state.alerts}
          onMarkRead={handleMarkInboxRead}
          onMarkAllRead={handleMarkAllInboxRead}
          onCreateAlert={handleCreateAlert}
          onDeleteAlert={handleDeleteAlert}
          onOpenReader={handleOpenReader}
          onToggleSave={handleToggleSave}
          savedPaperIds={savedPaperIds}
        />
      )}
    </WorkspaceShell>
  );
}
