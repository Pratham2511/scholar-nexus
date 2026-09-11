"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  FileText,
  Bookmark,
  Scale,
  ExternalLink,
  Quote,
  Sparkles,
  Network,
  CheckCircle2,
  Trash2,
  BookOpen,
  Send,
  RefreshCw,
} from "lucide-react";
import type { Workspace, Evidence } from "@/lib/workspace/schema";
import { fields } from "@/lib/workspace/schema";
import { resolvePaperAccess } from "./source-resolver";
import type { Paper } from "./paper-card";

interface CitationNeighbor {
  id: string;
  title: string;
  year: number | null;
  authors: string[];
  citationCount: number | null;
  direction: "citing" | "cited";
}

interface ReaderViewProps {
  paper: Paper;
  onBack: () => void;
  isSaved: boolean;
  isCompared: boolean;
  onToggleSave: (p: Paper) => void;
  onToggleCompare: (p: Paper) => void;
  workspaceEvidence: Evidence[];
  onCaptureEvidence: (data: {
    statement: string;
    quote: string;
    field: Evidence["field"];
    kind: Evidence["kind"];
  }) => Promise<boolean>;
  onDeleteEvidence: (evidenceId: string) => Promise<boolean>;
}

export function ReaderView({
  paper,
  onBack,
  isSaved,
  isCompared,
  onToggleSave,
  onToggleCompare,
  workspaceEvidence,
  onCaptureEvidence,
  onDeleteEvidence,
}: ReaderViewProps) {
  const access = resolvePaperAccess(paper);
  const paperEvidence = workspaceEvidence.filter((e) => e.paperId === paper.id);

  // Evidence capture state
  const [selectedField, setSelectedField] = useState<Evidence["field"]>("Findings");
  const [evidenceKind, setEvidenceKind] = useState<Evidence["kind"]>("author passage");
  const [quoteInput, setQuoteInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureMessage, setCaptureMessage] = useState("");

  // AI Assistant state
  const [aiQuestion, setAiQuestion] = useState("");
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<{
    answer: string;
    status: string;
    passages?: { page: number; text: string }[];
  } | null>(null);

  // Citation Explorer state
  const [activeTab, setActiveTab] = useState<"evidence" | "ai" | "citations">("evidence");
  const [citationDirection, setCitationDirection] = useState<"refs" | "cites">("refs");
  const [citationsList, setCitationsList] = useState<CitationNeighbor[] | null>(null);
  const [isLoadingCitations, setIsLoadingCitations] = useState(false);

  // Text selection handler
  const textContainerRef = useRef<HTMLDivElement>(null);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 5) {
      const selected = selection.toString().trim();
      setQuoteInput(selected);
      setEvidenceKind("author passage");
      setCaptureMessage("Passage captured to quote input.");
    }
  };

  const handleSaveEvidence = async () => {
    if (evidenceKind === "author passage" && !quoteInput.trim()) {
      setCaptureMessage("Select or input an author passage first.");
      return;
    }
    if (evidenceKind === "researcher note" && !noteInput.trim()) {
      setCaptureMessage("Write a synthesis note first.");
      return;
    }

    setIsCapturing(true);
    setCaptureMessage("");
    try {
      const success = await onCaptureEvidence({
        field: selectedField,
        kind: evidenceKind,
        statement: evidenceKind === "author passage" ? quoteInput.trim() : noteInput.trim(),
        quote: evidenceKind === "author passage" ? quoteInput.trim() : "",
      });

      if (success) {
        setQuoteInput("");
        setNoteInput("");
        setCaptureMessage("Evidence statement successfully saved!");
        setTimeout(() => setCaptureMessage(""), 3000);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setIsAskingAi(true);
    setAiAnswer(null);
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId: paper.id,
          question: aiQuestion.trim(),
          context: paper.abstract,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiAnswer(data);
      } else {
        setAiAnswer({ answer: data.error || "Unable to resolve query.", status: "error" });
      }
    } catch {
      setAiAnswer({ answer: "Connection failure while querying AI endpoint.", status: "error" });
    } finally {
      setIsAskingAi(false);
    }
  };

  // Load citations on demand
  useEffect(() => {
    if (activeTab !== "citations") return;
    if (citationsList !== null) return;

    let mounted = true;
    setIsLoadingCitations(true);

    const targetUrl =
      citationDirection === "refs"
        ? `/api/citations/references?paperId=${encodeURIComponent(paper.id)}`
        : `/api/citations/citations?paperId=${encodeURIComponent(paper.id)}`;

    fetch(targetUrl)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Citation fetch failed"))))
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : data.citations || data.references || [];
        setCitationsList(list);
      })
      .catch(() => {
        if (!mounted) return;
        setCitationsList([]);
      })
      .finally(() => {
        if (mounted) setIsLoadingCitations(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeTab, citationDirection, paper.id, citationsList]);

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Command Header */}
      <div className="tech-card bracketed p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="btn btn-secondary h-10 px-4 text-xs sm:text-sm font-mono font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK</span>
          </button>
          <span className="hidden lg:inline-block max-w-lg truncate text-sm font-mono text-slate-400">
            {"//"} {paper.title}
          </span>
        </div>

        {/* Source-Aware Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs sm:text-sm">
          {access.primaryAction && (
            <a
              href={access.primaryAction.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-emerald h-10 px-4 text-xs sm:text-sm font-bold"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{access.primaryAction.isDirectPdf ? "VIEW / DOWNLOAD PDF" : access.primaryAction.label}</span>
            </a>
          )}

          {access.doiUrl && (
            <a
              href={access.doiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary h-10 px-4 text-xs sm:text-sm font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[var(--color-primary-bright)]" />
              <span>DOI SOURCE</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => onToggleCompare(paper)}
            className={`rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
              isCompared
                ? "border-[var(--color-purple)] bg-[var(--color-purple)]/20 text-white shadow-[0_0_12px_rgba(167,139,250,0.3)]"
                : "border-indigo-500/20 text-slate-300 hover:border-[var(--color-purple)] hover:text-white"
            }`}
          >
            <Scale className="w-4 h-4 inline mr-1.5" />
            <span>{isCompared ? "COMPARING" : "COMPARE"}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSave(paper)}
            className={`rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
              isSaved
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                : "border-indigo-500/20 text-slate-300 hover:border-[var(--color-primary)] hover:text-white"
            }`}
          >
            <Bookmark className={`w-4 h-4 inline mr-1.5 ${isSaved ? "fill-current text-indigo-400" : ""}`} />
            <span>{isSaved ? "SAVED" : "SAVE"}</span>
          </button>
        </div>
      </div>

      {/* Two-Column Research Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Metadata & Evidence Studio */}
        <div className="lg:col-span-5 space-y-5">
          {/* Paper Metadata Card */}
          <div className="tech-card bracketed p-6 space-y-3.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display leading-snug">
              {paper.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {paper.year && (
                <span className="rounded-md bg-white/[0.08] border border-indigo-500/20 px-2.5 py-1 text-slate-200 font-bold">
                  {paper.year}
                </span>
              )}
              {paper.venue && (
                <span className="rounded-md bg-white/[0.04] border border-indigo-500/20 px-2.5 py-1 text-slate-300 font-medium">
                  {paper.venue}
                </span>
              )}
              {paper.citationCount !== null && (
                <span className="hud-badge iris py-1 px-2.5 text-xs font-semibold">
                  <span className="hud-dot" />
                  <span>{paper.citationCount} CITES</span>
                </span>
              )}
              <span className="hud-badge green py-1 px-2.5 text-xs font-semibold">
                {access.accessBadge.label}
              </span>
            </div>

            <div className="text-sm text-slate-300 pt-1 font-sans">
              <span className="font-mono text-slate-400 uppercase text-xs mr-1.5 font-bold">AUTHORS:</span>
              {paper.authors.join(", ") || "Unknown"}
            </div>

            {paper.doi && (
              <div className="text-xs text-slate-400 font-mono">
                DOI: {paper.doi}
              </div>
            )}
          </div>

          {/* Evidence Studio & Knowledge Tabs */}
          <div className="tech-card bracketed p-0 overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-[var(--border-dim)] bg-[var(--bg-obsidian)] font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("evidence")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 border-b-2 transition-all ${
                  activeTab === "evidence"
                    ? "border-[var(--color-primary)] text-[var(--color-primary-bright)] bg-white/[0.03] font-bold"
                    : "border-transparent text-[var(--text-muted)] hover:text-white"
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span>EVIDENCE ({paperEvidence.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 border-b-2 transition-all ${
                  activeTab === "ai"
                    ? "border-[var(--color-primary)] text-[var(--color-primary-bright)] bg-white/[0.03] font-bold"
                    : "border-transparent text-[var(--text-muted)] hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>ASK AI</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("citations")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 border-b-2 transition-all ${
                  activeTab === "citations"
                    ? "border-[var(--color-primary)] text-[var(--color-primary-bright)] bg-white/[0.03] font-bold"
                    : "border-transparent text-[var(--text-muted)] hover:text-white"
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>CITATIONS</span>
              </button>
            </div>

            {/* Tab 1: Evidence Capture & Catalog */}
            {activeTab === "evidence" && (
              <div className="p-4 space-y-4 font-mono text-xs">
                <div className="rounded border border-[var(--border-dim)] bg-[var(--bg-obsidian)]/50 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px] uppercase">
                      CAPTURE EVIDENCE CLAIM
                    </span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setEvidenceKind("author passage")}
                        className={`px-2 py-0.5 rounded ${
                          evidenceKind === "author passage"
                            ? "bg-[var(--color-primary)] text-[var(--bg-obsidian)] font-bold"
                            : "bg-white/[0.06] text-slate-400"
                        }`}
                      >
                        PASSAGE
                      </button>
                      <button
                        type="button"
                        onClick={() => setEvidenceKind("researcher note")}
                        className={`px-2 py-0.5 rounded ${
                          evidenceKind === "researcher note"
                            ? "bg-[var(--color-primary)] text-[var(--bg-obsidian)] font-bold"
                            : "bg-white/[0.06] text-slate-400"
                        }`}
                      >
                        NOTE
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                      Classification Field:
                    </label>
                    <select
                      value={selectedField}
                      onChange={(e) => setSelectedField(e.target.value as Evidence["field"])}
                      className="h-8 w-full rounded border border-[var(--border-medium)] bg-[var(--bg-obsidian)] px-2 text-xs text-white focus:border-[var(--color-primary)] focus:outline-none"
                    >
                      {fields.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  {evidenceKind === "author passage" ? (
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                        Verbatim Quote (Highlight text on right):
                      </label>
                      <textarea
                        rows={3}
                        value={quoteInput}
                        onChange={(e) => setQuoteInput(e.target.value)}
                        placeholder="Highlight any passage in the abstract to capture it automatically..."
                        className="w-full rounded border border-[var(--border-medium)] bg-[var(--bg-obsidian)] p-2 text-xs text-slate-200 placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] focus:outline-none font-sans"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                        Synthesis Note / Finding:
                      </label>
                      <textarea
                        rows={3}
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Write evaluation or empirical finding..."
                        className="w-full rounded border border-[var(--border-medium)] bg-[var(--bg-obsidian)] p-2 text-xs text-slate-200 placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] focus:outline-none font-sans"
                      />
                    </div>
                  )}

                  {captureMessage && (
                    <p className="text-xs text-[var(--color-primary-bright)]">
                      {captureMessage}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={isCapturing}
                    onClick={handleSaveEvidence}
                    className="btn btn-primary w-full h-8 text-xs font-mono uppercase"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SAVE EVIDENCE RECORD</span>
                  </button>
                </div>

                {/* Catalog of Saved Evidence */}
                <div className="space-y-2">
                  <h4 className="text-[var(--text-muted)] uppercase font-bold text-[10px]">
                    Saved Findings ({paperEvidence.length})
                  </h4>
                  {paperEvidence.length === 0 ? (
                    <p className="text-[var(--text-muted)] text-xs italic">
                      No evidence recorded yet. Highlight text in the abstract to capture passages.
                    </p>
                  ) : (
                    paperEvidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded border border-[var(--border-dim)] bg-white/[0.02] p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="hud-badge iris py-0.5 px-2 text-xs font-semibold">
                            {ev.field}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteEvidence(ev.id)}
                            className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                            title="Delete evidence"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-slate-200 italic leading-relaxed font-sans text-sm">
                          &ldquo;{ev.statement}&rdquo;
                        </p>
                        <span className="block text-[10px] text-[var(--text-muted)] font-mono">
                          {ev.kind} · {new Date(ev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: AI Query */}
            {activeTab === "ai" && (
              <div className="p-4 space-y-3 font-mono text-xs">
                <form onSubmit={handleAskAi} className="space-y-2">
                  <label className="text-[var(--text-muted)] uppercase text-[10px] block">
                    Inquire paper abstract:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder="e.g. What dataset was evaluated?"
                      className="h-8 flex-1 rounded border border-[var(--border-medium)] bg-[var(--bg-obsidian)] px-2.5 text-xs text-white focus:border-[var(--color-primary)] focus:outline-none font-sans"
                    />
                    <button
                      type="submit"
                      disabled={isAskingAi || !aiQuestion.trim()}
                      className="btn btn-primary h-8 px-3 text-xs"
                    >
                      {isAskingAi ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </form>

                {aiAnswer && (
                  <div className="rounded border border-[var(--border-primary-dim)] bg-[var(--bg-surface-elevated)] p-3 space-y-1">
                    <span className="font-bold text-[var(--color-primary-bright)] block text-xs">
                      AI SYNTHESIS:
                    </span>
                    <p className="text-slate-200 leading-relaxed font-sans text-xs">
                      {aiAnswer.answer}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Citation Graph */}
            {activeTab === "citations" && (
              <div className="p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCitationDirection("refs");
                      setCitationsList(null);
                    }}
                    className={`px-2.5 py-1 rounded text-xs transition-all ${
                      citationDirection === "refs"
                        ? "bg-[var(--color-primary)] text-[var(--bg-obsidian)] font-bold"
                        : "bg-white/[0.04] text-slate-400"
                    }`}
                  >
                    REFERENCES CITED
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCitationDirection("cites");
                      setCitationsList(null);
                    }}
                    className={`px-2.5 py-1 rounded text-xs transition-all ${
                      citationDirection === "cites"
                        ? "bg-[var(--color-primary)] text-[var(--bg-obsidian)] font-bold"
                        : "bg-white/[0.04] text-slate-400"
                    }`}
                  >
                    CITING PAPERS
                  </button>
                </div>

                {isLoadingCitations && (
                  <div className="flex items-center justify-center py-6 text-[var(--text-muted)]">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[var(--color-primary-bright)]" />
                    Tracing citation graph...
                  </div>
                )}

                {!isLoadingCitations && citationsList && citationsList.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {citationsList.map((neighbor, i) => (
                      <div
                        key={i}
                        className="rounded border border-[var(--border-dim)] bg-white/[0.02] p-2.5"
                      >
                        <h5 className="font-bold text-white text-xs font-display">
                          {neighbor.title}
                        </h5>
                        <p className="text-[11px] text-[var(--text-muted)] pt-0.5 font-sans">
                          {neighbor.authors?.slice(0, 2).join(", ")} {neighbor.year ? `(${neighbor.year})` : ""}
                          {neighbor.citationCount !== null ? ` · ${neighbor.citationCount} cites` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoadingCitations && citationsList && citationsList.length === 0 && (
                  <p className="text-[var(--text-muted)] py-6 text-center italic">
                    No citation relationships indexed for this paper.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reading Canvas */}
        <div className="lg:col-span-7">
          <div className="tech-card bracketed p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-dim)] pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--color-primary-bright)]" />
                <h3 className="text-base font-bold text-white font-display">
                  Document Abstract & Evidence Passages
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                HIGHLIGHT TEXT TO CAPTURE
              </span>
            </div>

            {/* Reading Content Canvas with Selection Listener */}
            <div
              ref={textContainerRef}
              onMouseUp={handleTextSelection}
              className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans select-text space-y-4"
            >
              {paper.abstract ? (
                <div className="whitespace-pre-line leading-relaxed">
                  {paper.abstract}
                </div>
              ) : (
                <div className="rounded border border-dashed border-[var(--border-medium)] p-12 text-center text-xs text-[var(--text-muted)] font-mono">
                  ABSTRACT NOT PROVIDED IN INDEX RECORD. OPEN ORIGINAL PAPER AT SOURCE USING THE BUTTONS ABOVE.
                </div>
              )}
            </div>

            {/* Source Access Banner */}
            <div className="tech-card bracketed p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div>
                <span className="font-bold text-white block">
                  ORIGINAL PUBLICATION ACCESS
                </span>
                <span className="text-[var(--text-muted)] text-[11px] font-sans">
                  {access.hasDirectPdf
                    ? "Direct verified PDF is immediately accessible."
                    : "Access publisher landing page via official DOI resolver."}
                </span>
              </div>
              {access.primaryAction && (
                <a
                  href={access.primaryAction.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary h-8 px-3 text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{access.primaryAction.label}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
