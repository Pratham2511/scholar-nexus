"use client";

import { useState } from "react";
import {
  FolderGit2,
  Plus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  ScrollText,
  Table2,
  Layers,
  FileText,
  ArrowRight,
  CircleSlash,
} from "lucide-react";
import type { Project, Evidence } from "@/lib/workspace/schema";
import { fields } from "@/lib/workspace/schema";
import type { Paper } from "./paper-card";
import { resolvePaperAccess } from "./source-resolver";

interface ProjectsViewProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, question: string, criteria: string) => void;
  onUpdateMemberDecision: (
    projectId: string,
    paperId: string,
    decision: "include" | "exclude" | "maybe" | "unscreened",
    reason: string
  ) => void;
  allPapers: Paper[];
  evidenceList: Evidence[];
  onOpenReader: (paper: Paper) => void;
}

type Decision = "unscreened" | "include" | "exclude" | "maybe";

export function ProjectsView({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onUpdateMemberDecision,
  allPapers,
  evidenceList,
  onOpenReader,
}: ProjectsViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newCriteria, setNewCriteria] = useState("");
  const [activeTab, setActiveTab] = useState<"screening" | "matrix">("screening");
  // Per-paper reason drafts (paperId -> reason text)
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});

  const currentProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateProject(newName.trim(), newQuestion.trim(), newCriteria.trim());
    setNewName("");
    setNewQuestion("");
    setNewCriteria("");
    setIsCreating(false);
  };

  const papersMap = new Map(allPapers.map((p) => [p.id, p]));

  const members = currentProject?.members ?? [];
  const counts = {
    total: members.length,
    include: members.filter((m) => m.decision === "include").length,
    exclude: members.filter((m) => m.decision === "exclude").length,
    maybe: members.filter((m) => m.decision === "maybe").length,
    unscreened: members.filter((m) => m.decision === "unscreened").length,
  };

  const setDecision = (paperId: string, decision: Decision) => {
    if (!currentProject) return;
    const member = members.find((m) => m.paperId === paperId);
    const reason = reasonDrafts[paperId] ?? member?.reason ?? "";
    onUpdateMemberDecision(currentProject.id, paperId, decision, reason);
  };

  const commitReason = (paperId: string, reason: string) => {
    if (!currentProject) return;
    const member = members.find((m) => m.paperId === paperId);
    if (!member || member.decision === "unscreened") return;
    if ((member.reason ?? "") === reason) return;
    onUpdateMemberDecision(currentProject.id, paperId, member.decision, reason);
  };

  return (
    <div className="space-y-8">
      {/* ===== MASTHEAD ===== */}
      <div className="space-y-3 animate-fade-up">
        <div className="flex items-center gap-3">
          <span className="section-index">
            <span className="num">04</span> / Projects
          </span>
          <span className="h-px flex-1 bg-[var(--border-dim)]" />
          <span className="hud-badge brass py-1">
            <span className="hud-dot animate-pulse-signal" />
            {projects.length} {projects.length === 1 ? "Project" : "Projects"}
          </span>
        </div>
        <h1
          className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold font-display leading-[1.08] text-[var(--text-primary)]"
          style={{ fontOpticalSizing: "auto" }}
        >
          Screening &amp;{" "}
          <span className="font-serif-italic text-[var(--color-primary-bright)]">
            synthesis.
          </span>
        </h1>
        <p className="text-[var(--text-secondary)] text-base max-w-2xl leading-relaxed">
          Define a research question and an inclusion protocol, then triage the
          evidence paper by paper. Every decision and its reason is recorded as
          a defensible audit trail.
        </p>
      </div>

      {/* ===== PROJECT SELECTOR + NEW BUTTON ===== */}
      {projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 animate-fade-up">
          {projects.map((proj) => {
            const active = currentProject?.id === proj.id;
            const projIn = proj.members.filter((m) => m.decision === "include").length;
            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => onSelectProject(proj.id)}
                className={`relative rounded-md border px-3.5 py-2 text-left transition-all font-mono ${
                  active
                    ? "border-[var(--color-primary)] bg-[rgba(58, 157, 124,0.10)] text-[var(--color-primary-bright)] shadow-[0_0_14px_var(--color-primary-glow)]"
                    : "border-[var(--border-dim)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-medium)]"
                }`}
              >
                <span className="text-[13px] font-semibold">{proj.name}</span>
                <span className="ml-2 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {proj.members.length} papers · {projIn} in
                </span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute -bottom-px left-3 right-3 h-[2px] rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]"
                  />
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsCreating((v) => !v)}
            className="btn btn-primary h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider ml-1"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? "Close" : "New Project"}</span>
          </button>
        </div>
      )}

      {/* ===== CREATE PROJECT FORM ===== */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="tech-card bracketed p-6 sm:p-7 space-y-5 animate-fade-up"
        >
          <div className="flex items-center gap-2.5">
            <span className="hud-badge brass text-[10px] font-semibold">
              <span className="hud-dot" />
              Initialize
            </span>
            <h3 className="section-index">
              <span className="num">04.0</span> Configure Systematic Review
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                Project Title
              </span>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Temporal Graph Networks for Dynamic Reasoning"
                className="h-11 w-full rounded-md border border-[var(--border-dim)] bg-[var(--bg-obsidian)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--color-primary)] focus:outline-none transition-all"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                Primary Research Question
              </span>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Which architectures minimize hallucination under temporal shift?"
                className="h-11 w-full rounded-md border border-[var(--border-dim)] bg-[var(--bg-obsidian)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--color-primary)] focus:outline-none transition-all"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                Inclusion / Exclusion Criteria
              </span>
              <input
                type="text"
                value={newCriteria}
                onChange={(e) => setNewCriteria(e.target.value)}
                placeholder="Empirical 2021–2026, benchmark precision reported…"
                className="h-11 w-full rounded-md border border-[var(--border-dim)] bg-[var(--bg-obsidian)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--color-primary)] focus:outline-none transition-all"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="btn btn-ghost h-9 px-4 text-xs font-mono uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newName.trim()}
              className="btn btn-primary h-9 px-5 text-xs font-mono font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Initialize Project
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ===== ACTIVE PROJECT CONTENT ===== */}
      {currentProject ? (
        <div className="space-y-6 animate-fade-up">
          {/* Project brief + KPIs + tabs */}
          <div className="tech-card bracketed p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2.5 min-w-0 flex-1">
                <h2
                  className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)] leading-tight"
                  style={{ fontOpticalSizing: "auto" }}
                >
                  {currentProject.name}
                </h2>
                {currentProject.question && (
                  <div className="flex flex-col gap-1 max-w-2xl">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-primary-bright)]">
                      Research Question
                    </span>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-serif-italic">
                      {currentProject.question}
                    </p>
                  </div>
                )}
                {currentProject.criteria && (
                  <div className="flex flex-col gap-1 max-w-2xl">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      Protocol Criteria
                    </span>
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                      {currentProject.criteria}
                    </p>
                  </div>
                )}
              </div>
              <span className="hud-badge brass py-1 shrink-0">
                <span className="hud-dot" />
                Created{" "}
                {new Date(currentProject.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="kpi-card">
                <span className="kpi-label flex items-center gap-2">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--text-muted)", boxShadow: "0 0 6px var(--text-muted)" }}
                  />
                  Total
                </span>
                <span className="kpi-value">{counts.total}</span>
                <span className="kpi-sub">papers queued</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label flex items-center gap-2">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--color-green)", boxShadow: "0 0 6px var(--color-green)" }}
                  />
                  Include
                </span>
                <span
                  className="kpi-value"
                  style={{ color: "var(--color-green-bright)" }}
                >
                  {counts.include}
                </span>
                <span className="kpi-sub">accepted</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label flex items-center gap-2">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--color-coral)", boxShadow: "0 0 6px var(--color-coral)" }}
                  />
                  Maybe
                </span>
                <span
                  className="kpi-value"
                  style={{ color: "var(--color-coral)" }}
                >
                  {counts.maybe}
                </span>
                <span className="kpi-sub">undecided</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label flex items-center gap-2">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--color-red)", boxShadow: "0 0 6px var(--color-red)" }}
                  />
                  Exclude
                </span>
                <span
                  className="kpi-value"
                  style={{ color: "var(--color-red)" }}
                >
                  {counts.exclude}
                </span>
                <span className="kpi-sub">rejected</span>
              </div>
            </div>

            {/* Tab toggle */}
            <div className="mt-2 flex items-center gap-1 border-b border-[var(--border-dim)] font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("screening")}
                className={`relative py-2.5 px-3 font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "screening"
                    ? "text-[var(--color-primary-bright)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <ScrollText className="w-3.5 h-3.5" />
                  Screening Queue ({counts.total})
                </span>
                {activeTab === "screening" && (
                  <span className="absolute -bottom-px left-3 right-3 h-[2px] rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("matrix")}
                className={`relative py-2.5 px-3 font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "matrix"
                    ? "text-[var(--color-primary-bright)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Table2 className="w-3.5 h-3.5" />
                  Evidence Matrix
                </span>
                {activeTab === "matrix" && (
                  <span className="absolute -bottom-px left-3 right-3 h-[2px] rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" />
                )}
              </button>
            </div>
          </div>

          {/* ===== SCREENING TAB ===== */}
          {activeTab === "screening" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="section-index">
                  <span className="num">04.1</span> Screening Queue
                </h3>
                <span className="h-px flex-1 bg-[var(--border-dim)]" />
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {counts.unscreened} unscreened
                </span>
              </div>

              {members.length === 0 ? (
                <div className="tech-card bracketed p-12 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-primary-dim)] bg-[rgba(58, 157, 124,0.06)] text-[var(--color-primary-bright)]">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold font-display text-[var(--text-primary)]">
                      No papers cataloged yet
                    </h4>
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
                      Use the{" "}
                      <span className="font-mono text-[var(--color-primary-bright)]">
                        Add to Project
                      </span>{" "}
                      control on any paper card in Discover or Saved to queue
                      it here for screening.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {members.map((member) => {
                    const paper = papersMap.get(member.paperId);
                    if (!paper) return null;
                    const access = resolvePaperAccess(paper);
                    const decision = member.decision as Decision;

                    const authorsDisplay =
                      paper.authors.length > 0
                        ? paper.authors.slice(0, 3).join(", ") +
                          (paper.authors.length > 3
                            ? ` et al. (+${paper.authors.length - 3})`
                            : "")
                        : "Unknown authors";

                    return (
                      <article
                        key={member.paperId}
                        className="paper-card bracketed space-y-3"
                      >
                        {/* Metadata strip */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                            {paper.year && (
                              <span className="rounded-md bg-white/[0.07] border border-[var(--border-dim)] px-2 py-0.5 text-[var(--text-primary)] font-bold tracking-wide">
                                {paper.year}
                              </span>
                            )}
                            {paper.citationCount !== null && (
                              <span className="hud-badge brass py-1 px-2.5 text-[10px]">
                                <span className="hud-dot" />
                                {paper.citationCount}{" "}
                                {paper.citationCount === 1 ? "CITE" : "CITES"}
                              </span>
                            )}
                            <span
                              className={`hud-badge py-1 px-2.5 text-[10px] ${
                                access.accessBadge.variant === "emerald"
                                  ? "green"
                                  : "brass"
                              }`}
                              title={access.accessBadge.tooltip}
                            >
                              {access.hasDirectPdf && (
                                <span className="hud-dot" />
                              )}
                              {access.accessBadge.label}
                            </span>
                            <span
                              className={`hud-badge py-1 px-2.5 text-[10px] ${
                                decision === "include"
                                  ? "green"
                                  : decision === "exclude"
                                    ? "red"
                                    : decision === "maybe"
                                      ? "coral"
                                      : ""
                              }`}
                            >
                              <span className="hud-dot" />
                              {decision.toUpperCase()}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenReader(paper)}
                            className="btn btn-secondary h-8 px-3 text-[11px] font-mono font-bold uppercase tracking-wider"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-[var(--color-primary-bright)]" />
                            Reader
                          </button>
                        </div>

                        {/* Title (serif, clickable) */}
                        <h3
                          onClick={() => onOpenReader(paper)}
                          className="text-base sm:text-lg font-semibold text-[var(--text-primary)] font-display leading-snug cursor-pointer hover:text-[var(--color-primary-bright)] transition-colors"
                          style={{ fontOpticalSizing: "auto" }}
                        >
                          {paper.title}
                        </h3>

                        {/* Authors (italic) */}
                        <p className="text-[13px] text-[var(--text-secondary)] italic font-serif-italic">
                          {authorsDisplay}
                        </p>

                        {/* Decision controls + reason input */}
                        <div className="pt-3 mt-1 border-t border-[var(--border-dim)] flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] mr-1">
                            Triage:
                          </span>

                          {/* INCLUDE — emerald */}
                          <button
                            type="button"
                            onClick={() => setDecision(member.paperId, "include")}
                            className={`btn h-8 px-3 text-[11px] font-mono font-bold uppercase tracking-wider ${
                              decision === "include"
                                ? "btn-emerald shadow-[0_0_14px_var(--color-green-glow)]"
                                : "bg-transparent text-[var(--text-secondary)] border border-[var(--border-dim)] hover:text-[var(--color-green-bright)] hover:bg-[rgba(107,168,136,0.06)]"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Include
                          </button>

                          {/* EXCLUDE — red-tinted inline */}
                          <button
                            type="button"
                            onClick={() => setDecision(member.paperId, "exclude")}
                            className={`btn h-8 px-3 text-[11px] font-mono font-bold uppercase tracking-wider ${
                              decision === "exclude"
                                ? "shadow-[0_0_14px_var(--color-red-glow)]"
                                : "bg-transparent text-[var(--text-secondary)] border border-[var(--border-dim)] hover:text-[var(--color-red)] hover:bg-[rgba(224,104,90,0.06)]"
                            }`}
                            style={
                              decision === "exclude"
                                ? {
                                    background: "rgba(224, 104, 90, 0.18)",
                                    color: "var(--color-red)",
                                    border: "1px solid var(--color-red)",
                                  }
                                : undefined
                            }
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Exclude
                          </button>

                          {/* MAYBE — coral */}
                          <button
                            type="button"
                            onClick={() => setDecision(member.paperId, "maybe")}
                            className={`btn h-8 px-3 text-[11px] font-mono font-bold uppercase tracking-wider ${
                              decision === "maybe"
                                ? "btn-coral shadow-[0_0_14px_var(--color-coral-glow)]"
                                : "bg-transparent text-[var(--text-secondary)] border border-[var(--border-dim)] hover:text-[var(--color-coral)] hover:bg-[rgba(217,119,87,0.06)]"
                            }`}
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            Maybe
                          </button>

                          {decision !== "unscreened" && (
                            <button
                              type="button"
                              onClick={() => setDecision(member.paperId, "unscreened")}
                              className="btn btn-ghost h-8 px-2.5 text-[11px] font-mono font-semibold uppercase tracking-wider"
                              title="Clear decision"
                            >
                              <CircleSlash className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Reason input */}
                          <input
                            type="text"
                            value={
                              reasonDrafts[member.paperId] ??
                              member.reason ??
                              ""
                            }
                            onChange={(e) =>
                              setReasonDrafts((prev) => ({
                                ...prev,
                                [member.paperId]: e.target.value,
                              }))
                            }
                            onBlur={(e) =>
                              commitReason(member.paperId, e.target.value)
                            }
                            placeholder={
                              decision === "unscreened"
                                ? "Optional reason — set after triage…"
                                : "Reason for decision…"
                            }
                            className="flex-1 min-w-[200px] h-8 rounded-md border border-[var(--border-dim)] bg-[var(--bg-obsidian)] px-3 text-[12px] text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] focus:border-[var(--color-primary)] focus:outline-none transition-all"
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== MATRIX TAB ===== */}
          {activeTab === "matrix" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="section-index">
                  <span className="num">04.2</span> Evidence Matrix
                </h3>
                <span className="h-px flex-1 bg-[var(--border-dim)]" />
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {evidenceList.filter((e) =>
                    members.some((m) => m.paperId === e.paperId)
                  ).length}{" "}
                  evidence items
                </span>
              </div>

              {members.length === 0 ? (
                <div className="tech-card bracketed p-10 text-center space-y-2">
                  <Layers className="h-6 w-6 mx-auto text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-muted)] font-mono">
                    No papers in matrix yet.
                  </p>
                </div>
              ) : (
                <div className="tech-card bracketed p-0 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-dim)] bg-[var(--bg-obsidian)] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                        <th className="p-3.5 sticky left-0 bg-[var(--bg-obsidian)] z-10 min-w-[240px]">
                          Paper
                        </th>
                        <th className="p-3.5">Decision</th>
                        {fields.map((f) => (
                          <th key={f} className="p-3.5 text-[10px] whitespace-nowrap">
                            {f}
                          </th>
                        ))}
                        <th className="p-3.5 text-[10px]">Σ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-dim)]">
                      {members.map((member) => {
                        const paper = papersMap.get(member.paperId);
                        if (!paper) return null;
                        const paperEv = evidenceList.filter(
                          (e) => e.paperId === member.paperId
                        );
                        return (
                          <tr
                            key={member.paperId}
                            className="hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="p-3.5 sticky left-0 bg-[var(--bg-surface)] z-10 max-w-[280px]">
                              <button
                                type="button"
                                onClick={() => onOpenReader(paper)}
                                className="text-left group block"
                              >
                                <span className="block font-bold text-[var(--text-primary)] font-display line-clamp-1 group-hover:text-[var(--color-primary-bright)] transition-colors">
                                  {paper.title}
                                </span>
                                <span className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5 block">
                                  {paper.year || "—"} ·{" "}
                                  {paper.authors[0] || "Unknown"}
                                  {paper.authors.length > 1 ? " et al." : ""}
                                </span>
                              </button>
                            </td>
                            <td className="p-3.5 font-mono">
                              <span
                                className={`hud-badge py-0.5 px-2 text-[9px] ${
                                  member.decision === "include"
                                    ? "green"
                                    : member.decision === "exclude"
                                      ? "red"
                                      : member.decision === "maybe"
                                        ? "coral"
                                        : ""
                                }`}
                              >
                                {member.decision}
                              </span>
                            </td>
                            {fields.map((f) => {
                              const cellEv = paperEv.filter((e) => e.field === f);
                              const count = cellEv.length;
                              return (
                                <td
                                  key={f}
                                  className="p-3.5 text-center align-middle min-w-[70px]"
                                >
                                  {count > 0 ? (
                                    <span
                                      title={cellEv
                                        .map((e) => e.statement)
                                        .join("\n\n")}
                                      className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md border border-[var(--border-emerald-dim)] bg-[rgba(107,168,136,0.10)] text-[var(--color-green-bright)] font-mono text-[11px] font-bold cursor-help"
                                    >
                                      {count}
                                    </span>
                                  ) : (
                                    <span className="font-mono text-[var(--text-faint)]">
                                      —
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-3.5 text-center font-mono font-bold text-[var(--color-primary-bright)]">
                              {paperEv.length}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="flex items-start gap-2 font-mono text-[10px] text-[var(--text-muted)] leading-relaxed">
                <FileText className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                Cells show the count of evidence items captured for each paper
                across the standardized fields. Hover a number to preview the
                underlying statements. Open the reader to author new evidence.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ===== EMPTY STATE — NO PROJECTS ===== */
        <div className="tech-card bracketed p-12 text-center max-w-xl mx-auto space-y-4 animate-fade-up">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border-primary-dim)] bg-[rgba(58, 157, 124,0.06)] text-[var(--color-primary-bright)] shadow-[0_0_18px_var(--color-primary-glow)]">
            <FolderGit2 className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold font-display text-[var(--text-primary)]">
              No screening projects yet
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Define a research question and an inclusion protocol, then queue
              candidate papers for systematic triage. Every decision and its
              reason is logged as a defensible audit trail.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="btn btn-primary h-10 px-5 text-xs font-mono font-bold uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      )}
    </div>
  );
}
