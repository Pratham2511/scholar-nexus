"use client";

import { useState } from "react";
import {
  FolderGit2,
  Plus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type { Workspace, Project, Evidence } from "@/lib/workspace/schema";
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
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectQuestion, setNewProjectQuestion] = useState("");
  const [newProjectCriteria, setNewProjectCriteria] = useState("");

  const [activeTab, setActiveTab] = useState<"screening" | "matrix">("screening");

  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), newProjectQuestion.trim(), newProjectCriteria.trim());
    setNewProjectName("");
    setNewProjectQuestion("");
    setNewProjectCriteria("");
    setIsCreating(false);
  };

  const projectMembers = currentProject ? currentProject.members : [];
  const papersMap = new Map(allPapers.map((p) => [p.id, p]));

  return (
    <div className="space-y-8">
      {/* Header Deck */}
      <div className="space-y-5">
        <div className="hud-badge iris py-1.5 px-4 text-xs sm:text-sm font-mono tracking-wider font-semibold">
          <span className="hud-dot animate-pulse-signal" />
          <span>SYSTEMATIC REVIEW WORKBENCH // EVIDENCE PROTOCOLS</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2.5">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display">
              Screening <span className="text-[var(--color-primary-bright)]">Projects</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
              Formalize inclusion criteria, execute blind screening triage, and synthesize research evidence.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="btn btn-primary h-11 px-5 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>NEW PROJECT</span>
          </button>
        </div>
      </div>

      {/* Create Project Console */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="tech-card bracketed p-6 sm:p-8 space-y-5 border-indigo-500/30 shadow-xl"
        >
          <div className="flex items-center gap-2.5">
            <span className="hud-badge iris text-xs font-semibold">INITIALIZE</span>
            <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">
              Configure Systematic Review Project
            </h3>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">
              Project Title
            </label>
            <input
              type="text"
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Systematic Review on Temporal Graph Neural Networks"
              className="h-11 w-full rounded-lg border border-indigo-500/25 bg-[var(--bg-obsidian)] px-3 text-sm text-white placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:outline-none transition-all font-sans"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">
              Primary Research Question
            </label>
            <input
              type="text"
              value={newProjectQuestion}
              onChange={(e) => setNewProjectQuestion(e.target.value)}
              placeholder="e.g. Which inductive graph architectures minimize hallucination in temporal reasoning?"
              className="h-11 w-full rounded-lg border border-indigo-500/25 bg-[var(--bg-obsidian)] px-3 text-sm text-white placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:outline-none transition-all font-sans"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">
              Inclusion / Exclusion Protocol Criteria
            </label>
            <textarea
              rows={2}
              value={newProjectCriteria}
              onChange={(e) => setNewProjectCriteria(e.target.value)}
              placeholder="Include empirical evaluations from 2021-2026 reporting benchmark precision..."
              className="w-full rounded border border-[var(--border-medium)] bg-[var(--bg-obsidian)] p-2.5 text-xs text-white placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-all font-sans"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="btn btn-secondary h-8 px-3 text-xs"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="btn btn-primary h-8 px-4 text-xs font-mono"
            >
              INITIALIZE PROJECT
            </button>
          </div>
        </form>
      )}

      {/* Project Selector Strip */}
      {projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {projects.map((proj) => {
            const isSelected = currentProject?.id === proj.id;
            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => onSelectProject(proj.id)}
                className={`rounded border px-3 py-1.5 transition-all ${
                  isSelected
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary-bright)] font-bold shadow-[0_0_12px_var(--color-primary-glow)]"
                    : "border-[var(--border-dim)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white"
                }`}
              >
                {proj.name} ({proj.members.length})
              </button>
            );
          })}
        </div>
      )}

      {/* Active Project Workspace */}
      {currentProject ? (
        <div className="space-y-6">
          {/* Active Project Details Card */}
          <div className="tech-card bracketed p-6 space-y-3">
            <h2 className="text-xl font-bold text-white font-display">
              {currentProject.name}
            </h2>
            {currentProject.question && (
              <div className="text-xs text-slate-300 font-sans">
                <span className="font-mono text-[var(--color-primary-bright)] uppercase font-semibold text-[10px] mr-1">
                  QUESTION:
                </span>
                <span>{currentProject.question}</span>
              </div>
            )}
            {currentProject.criteria && (
              <div className="text-xs text-[var(--text-secondary)] font-sans">
                <span className="font-mono text-[var(--text-muted)] uppercase font-semibold text-[10px] mr-1">
                  CRITERIA:
                </span>
                <span>{currentProject.criteria}</span>
              </div>
            )}

            {/* View Mode Tabs */}
            <div className="mt-4 flex border-b border-[var(--border-dim)] gap-6 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("screening")}
                className={`py-2.5 font-bold border-b-2 transition-colors ${
                  activeTab === "screening"
                    ? "border-[var(--color-primary)] text-[var(--color-primary-bright)]"
                    : "border-transparent text-[var(--text-muted)] hover:text-white"
                }`}
              >
                SCREENING QUEUE ({projectMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("matrix")}
                className={`py-2.5 font-bold border-b-2 transition-colors ${
                  activeTab === "matrix"
                    ? "border-[var(--color-primary)] text-[var(--color-primary-bright)]"
                    : "border-transparent text-[var(--text-muted)] hover:text-white"
                }`}
              >
                EVIDENCE MATRIX
              </button>
            </div>
          </div>

          {/* Screening Queue */}
          {activeTab === "screening" && (
            <div className="space-y-4">
              {projectMembers.length === 0 ? (
                <div className="tech-card bracketed p-12 text-center text-xs text-[var(--text-muted)] font-mono">
                  NO PAPERS CATALOGED IN THIS PROJECT YET. USE &ldquo;ADD TO PROJECT&rdquo; ON ANY PAPER CARD.
                </div>
              ) : (
                projectMembers.map((member) => {
                  const paper = papersMap.get(member.paperId);
                  if (!paper) return null;

                  return (
                    <div
                      key={member.paperId}
                      className="tech-card bracketed p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`hud-badge ${
                              member.decision === "include"
                                ? "green"
                                : member.decision === "exclude"
                                ? "red"
                                : member.decision === "maybe"
                                ? "iris"
                                : ""
                            } py-0.5 px-2.5 text-xs font-semibold`}
                          >
                            <span className="hud-dot" />
                            <span className="uppercase">{member.decision}</span>
                          </span>
                          <span className="text-sm font-mono text-slate-400">
                            {paper.year || "Year unknown"} • {paper.authors[0] || "Unknown"} et al.
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenReader(paper)}
                          className="btn btn-secondary h-8 px-3 text-xs font-mono font-semibold"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[var(--color-primary-bright)]" />
                          <span>OPEN IN READER</span>
                        </button>
                      </div>

                      <h4 className="font-bold text-lg sm:text-xl text-white font-display">
                        {paper.title}
                      </h4>

                      {/* Decision Toggles */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-2 font-mono text-xs sm:text-sm">
                        <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold mr-1">
                          TRIAGE:
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateMemberDecision(
                              currentProject.id,
                              member.paperId,
                              "include",
                              member.reason
                            )
                          }
                          className={`rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                            member.decision === "include"
                              ? "border-[var(--color-green)] bg-[var(--color-green)]/20 text-white shadow-[0_0_12px_rgba(36,199,95,0.3)]"
                              : "border-indigo-500/20 text-slate-300 hover:border-[var(--color-green)] hover:text-white"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 inline mr-1 text-[var(--color-green)]" />
                          <span>INCLUDE</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateMemberDecision(
                              currentProject.id,
                              member.paperId,
                              "exclude",
                              member.reason
                            )
                          }
                          className={`rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                            member.decision === "exclude"
                              ? "border-[var(--color-red)] bg-[var(--color-red)]/20 text-white shadow-[0_0_12px_rgba(242,64,64,0.3)]"
                              : "border-indigo-500/20 text-slate-300 hover:border-[var(--color-red)] hover:text-white"
                          }`}
                        >
                          <XCircle className="w-4 h-4 inline mr-1 text-[var(--color-red)]" />
                          <span>EXCLUDE</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateMemberDecision(
                              currentProject.id,
                              member.paperId,
                              "maybe",
                              member.reason
                            )
                          }
                          className={`rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                            member.decision === "maybe"
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                              : "border-indigo-500/20 text-slate-300 hover:border-[var(--color-primary)] hover:text-white"
                          }`}
                        >
                          <HelpCircle className="w-4 h-4 inline mr-1 text-[var(--color-primary-bright)]" />
                          <span>MAYBE</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Matrix Tab */}
          {activeTab === "matrix" && (
            <div className="tech-card bracketed p-0 overflow-x-auto border-[var(--border-medium)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-dim)] bg-[var(--bg-obsidian)] font-mono text-[var(--text-muted)]">
                    <th className="p-3.5">PAPER</th>
                    <th className="p-3.5">STATUS</th>
                    {fields.map((f) => (
                      <th key={f} className="p-3.5 uppercase">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-dim)] text-slate-300">
                  {projectMembers.map((member) => {
                    const paper = papersMap.get(member.paperId);
                    if (!paper) return null;
                    const paperEv = evidenceList.filter((e) => e.paperId === member.paperId);

                    return (
                      <tr key={member.paperId} className="hover:bg-white/[0.02]">
                        <td className="p-3.5 max-w-[220px]">
                          <span className="font-bold text-white block line-clamp-1 font-display">
                            {paper.title}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {paper.year || "—"}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono">
                          <span className="capitalize text-[var(--color-primary-bright)]">
                            {member.decision}
                          </span>
                        </td>
                        {fields.map((f) => {
                          const ev = paperEv.find((e) => e.field === f);
                          return (
                            <td key={f} className="p-3.5 max-w-[180px]">
                              {ev ? (
                                <span className="text-slate-300 line-clamp-2 text-xs">
                                  {ev.statement}
                                </span>
                              ) : (
                                <span className="text-[var(--text-muted)] font-mono">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="tech-card bracketed p-16 text-center max-w-lg mx-auto space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-primary-dim)] text-[var(--color-primary-bright)] shadow-[0_0_20px_var(--color-primary-glow)]">
            <FolderGit2 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white font-display">
              No Systematic Projects Found
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Create your first systematic review project to define literature questions, set protocol criteria, and screen papers.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="btn btn-primary h-9 px-4 text-xs font-mono uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>INITIALIZE PROJECT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
