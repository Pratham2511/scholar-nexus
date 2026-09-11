"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Scale,
  FileText,
  ExternalLink,
  Quote,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  PlusCircle,
} from "lucide-react";
import type { Evidence } from "@/lib/workspace/schema";
import { fields } from "@/lib/workspace/schema";
import { resolvePaperAccess } from "./source-resolver";
import type { Paper } from "./paper-card";

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

type CaptureMessage = { type: "success" | "error" | "info"; text: string };

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

  const [selectedField, setSelectedField] = useState<Evidence["field"]>("Findings");
  const [evidenceKind, setEvidenceKind] = useState<Evidence["kind"]>("author passage");
  const [textInput, setTextInput] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureMessage, setCaptureMessage] = useState<CaptureMessage | null>(null);

  const abstractRef = useRef<HTMLDivElement>(null);

  const trimmedInput = textInput.trim();
  const isVerbatimExcerpt =
    evidenceKind === "author passage"
      ? trimmedInput.length > 0 && paper.abstract.includes(trimmedInput)
      : trimmedInput.length > 0;

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection) return;
    const selected = selection.toString().trim();
    if (selected.length < 5) return;
    // Only capture selections that originated inside the abstract panel.
    if (abstractRef.current && abstractRef.current.contains(selection.anchorNode)) {
      setTextInput(selected);
      setEvidenceKind("author passage");
      setCaptureMessage({
        type: "info",
        text: "Passage captured to the quote input. Verify and capture.",
      });
    }
  };

  const handleSaveEvidence = async () => {
    setCaptureMessage(null);

    if (!trimmedInput) {
      setCaptureMessage({
        type: "error",
        text:
          evidenceKind === "author passage"
            ? "Enter or highlight a verbatim passage from the abstract."
            : "Write a synthesis note before saving.",
      });
      return;
    }

    if (evidenceKind === "author passage" && !paper.abstract.includes(trimmedInput)) {
      setCaptureMessage({
        type: "error",
        text: "Author passages must be verbatim excerpts from the abstract. Save paraphrases as a researcher note instead.",
      });
      return;
    }

    setIsCapturing(true);
    try {
      const success = await onCaptureEvidence({
        field: selectedField,
        kind: evidenceKind,
        statement: trimmedInput,
        quote: evidenceKind === "author passage" ? trimmedInput : "",
      });

      if (success) {
        setTextInput("");
        setCaptureMessage({ type: "success", text: "Evidence captured to the workspace." });
        setTimeout(() => setCaptureMessage(null), 3500);
      } else {
        setCaptureMessage({
          type: "error",
          text: "Could not save evidence. Try again in a moment.",
        });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDelete = async (evidenceId: string) => {
    await onDeleteEvidence(evidenceId);
  };

  const authorsDisplay =
    paper.authors.length > 0
      ? paper.authors.slice(0, 6).join(", ") +
        (paper.authors.length > 6 ? ` et al. (+${paper.authors.length - 6})` : "")
      : "Unknown authors";

  const accessVariantClass =
    access.accessBadge.variant === "emerald" ? "green" : "brass";

  return (
    <div className="space-y-7">
      {/* ====================== MASTHEAD ====================== */}
      <header className="space-y-4 animate-fade-up">
        <div className="flex flex-wrap items-center gap-3">
          <span className="section-index"><span className="num">02</span> / Reader</span>
          <span className="h-px flex-1 bg-[var(--border-dim)] min-w-[40px]" />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="btn btn-secondary h-9 px-3.5 text-xs font-mono font-bold uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleSave(paper)}
              className={`btn h-9 px-3.5 text-xs font-mono font-bold uppercase tracking-wider ${
                isSaved ? "btn-primary" : "btn-secondary"
              }`}
              title={isSaved ? "Remove from library" : "Save to library"}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleCompare(paper)}
              className={`btn h-9 px-3.5 text-xs font-mono font-bold uppercase tracking-wider ${
                isCompared ? "btn-coral" : "btn-secondary"
              }`}
              title="Compare side-by-side"
            >
              <Scale className="w-4 h-4" />
              <span>{isCompared ? "Comparing" : "Compare"}</span>
            </button>
          </div>
        </div>

        <h1
          className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold font-display leading-[1.1] text-[var(--text-primary)] pt-1"
          style={{ fontOpticalSizing: "auto" }}
        >
          {paper.title}
        </h1>

        <p className="text-base sm:text-lg text-[var(--text-secondary)] font-serif-italic">
          {authorsDisplay}
        </p>

        {/* Mono metadata strip */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          {paper.year && (
            <span className="rounded-md bg-white/[0.07] border border-[var(--border-dim)] px-2 py-0.5 text-[var(--text-primary)] font-bold tracking-wide">
              {paper.year}
            </span>
          )}
          {paper.venue && (
            <span
              className="max-w-[320px] truncate rounded-md bg-white/[0.03] border border-[var(--border-dim)] px-2 py-0.5 text-[var(--text-secondary)] font-medium"
              title={paper.venue}
            >
              {paper.venue}
            </span>
          )}
          {paper.citationCount !== null && (
            <span className="hud-badge brass py-1 px-2.5 text-[10px]">
              <span className="hud-dot" />
              <span>
                {paper.citationCount} {paper.citationCount === 1 ? "CITE" : "CITES"}
              </span>
            </span>
          )}
          <span
            className={`hud-badge ${accessVariantClass} py-1 px-2.5 text-[10px]`}
            title={access.accessBadge.tooltip}
          >
            {access.hasDirectPdf && <span className="hud-dot animate-pulse-signal" />}
            <span>{access.accessBadge.label}</span>
          </span>
          {paper.doi && (
            <span className="font-mono text-[11px] text-[var(--text-muted)] truncate max-w-[280px] flex items-center gap-1.5">
              <Quote className="w-3 h-3 text-[var(--color-primary)]/60" />
              DOI: {paper.doi}
            </span>
          )}
        </div>

        <div className="editorial-rule" />
      </header>

      {/* ====================== TWO-COLUMN BODY ====================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* ============ LEFT: abstract + access + evidence list ============ */}
        <div className="lg:col-span-7 space-y-6">
          {/* Abstract panel */}
          <section className="tech-card bracketed p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--color-primary)]" />
              <h2 className="section-index">
                <span className="num">02.1</span> Abstract
              </h2>
              <span className="h-px flex-1 bg-[var(--border-dim)]" />
              <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider hidden sm:inline">
                Highlight to capture
              </span>
            </div>

            {paper.abstract ? (
              <div
                ref={abstractRef}
                onMouseUp={handleTextSelection}
                className="text-[15px] sm:text-base text-[var(--text-secondary)] leading-[1.78] font-sans whitespace-pre-line select-text"
              >
                {paper.abstract}
              </div>
            ) : (
              <div className="rounded border border-dashed border-[var(--border-medium)] p-8 text-center text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">
                Abstract not provided in the index record. Open the original paper via the access block below.
              </div>
            )}
          </section>

          {/* Access & provenance */}
          <section className="tech-card p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--color-primary)]" />
              <h2 className="section-index">
                <span className="num">02.2</span> Access &amp; Provenance
              </h2>
              <span className="h-px flex-1 bg-[var(--border-dim)]" />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`hud-badge ${access.hasDirectPdf ? "green" : "brass"} py-1.5 px-3`}>
                {access.hasDirectPdf && <span className="hud-dot animate-pulse-signal" />}
                <span>{access.accessBadge.label}</span>
              </span>

              {access.primaryAction && (
                <a
                  href={access.primaryAction.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider ${
                    access.hasDirectPdf ? "btn-emerald" : "btn-secondary"
                  }`}
                >
                  {access.hasDirectPdf ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5" />
                  )}
                  <span>{access.hasDirectPdf ? "View PDF" : "View at source"}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </a>
              )}

              {access.secondaryActions.slice(0, 2).map((action) => (
                <a
                  key={action.url}
                  href={action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost h-9 px-3 text-[11px] font-mono uppercase tracking-wider"
                  title={action.label}
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{action.label}</span>
                </a>
              ))}
            </div>

            <p className="font-mono text-[10px] text-[var(--text-muted)] leading-relaxed">
              Access paths resolve directly from upstream repository metadata — no uploads, no mirrors, no model intermediaries.
            </p>
          </section>

          {/* Evidence list */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-[var(--color-primary)]" />
              <h2 className="section-index">
                <span className="num">02.3</span> Captured Evidence
              </h2>
              <span className="h-px flex-1 bg-[var(--border-dim)]" />
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                {paperEvidence.length} {paperEvidence.length === 1 ? "record" : "records"}
              </span>
            </div>

            {paperEvidence.length === 0 ? (
              <div className="tech-card bracketed p-8 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--border-primary-dim)] bg-[rgba(58, 157, 124,0.06)] text-[var(--color-primary-bright)]">
                  <Quote className="h-5 w-5" />
                </div>
                <p className="text-base text-[var(--text-secondary)] font-serif-italic">
                  No evidence captured yet for this paper.
                </p>
                <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider leading-relaxed">
                  Highlight a passage in the abstract above, or write a synthesis note using the capture panel.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paperEvidence.map((ev) => (
                  <article key={ev.id} className="paper-card p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="hud-badge brass py-1 px-2.5 text-[10px]">
                          <span className="hud-dot" />
                          <span>{ev.field}</span>
                        </span>
                        <span
                          className={`hud-badge ${
                            ev.kind === "author passage" ? "green" : "coral"
                          } py-1 px-2.5 text-[10px]`}
                        >
                          {ev.kind === "author passage" ? "Passage" : "Note"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                          {new Date(ev.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(ev.id)}
                          className="btn btn-ghost h-7 w-7 p-0"
                          title="Delete evidence"
                          aria-label="Delete evidence"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p
                      className={`text-[13.5px] leading-relaxed font-sans ${
                        ev.kind === "author passage"
                          ? "italic text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {ev.kind === "author passage" ? `\u201C${ev.statement}\u201D` : ev.statement}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ============ RIGHT: capture form (sticky) ============ */}
        <aside className="lg:col-span-5">
          <section className="tech-card bracketed p-5 sm:p-6 space-y-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-[var(--color-primary)]" />
              <h2 className="section-index">
                <span className="num">02.4</span> Capture Evidence
              </h2>
              <span className="h-px flex-1 bg-[var(--border-dim)]" />
            </div>

            {/* Field selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="reader-field-select"
                className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] block"
              >
                Classification field
              </label>
              <select
                id="reader-field-select"
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value as Evidence["field"])}
                className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-dim)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] transition-colors"
              >
                {fields.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Kind toggle */}
            <div className="space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">
                Evidence kind
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEvidenceKind("author passage")}
                  className={`rounded-md border px-3 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
                    evidenceKind === "author passage"
                      ? "border-[var(--color-green)] bg-[rgba(107,168,136,0.16)] text-[var(--color-green-bright)] shadow-[0_0_12px_var(--color-green-glow)]"
                      : "border-[var(--border-dim)] text-[var(--text-secondary)] hover:border-[var(--border-medium)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Author passage
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceKind("researcher note")}
                  className={`rounded-md border px-3 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
                    evidenceKind === "researcher note"
                      ? "border-[var(--color-coral)] bg-[rgba(217,119,87,0.16)] text-[var(--color-coral)] shadow-[0_0_12px_var(--color-coral-glow)]"
                      : "border-[var(--border-dim)] text-[var(--text-secondary)] hover:border-[var(--border-medium)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Researcher note
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <label
                htmlFor="reader-evidence-input"
                className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] block"
              >
                {evidenceKind === "author passage" ? "Verbatim quote" : "Synthesis note"}
              </label>
              <textarea
                id="reader-evidence-input"
                rows={5}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  evidenceKind === "author passage"
                    ? "Highlight any passage in the abstract above — or paste a verbatim excerpt here."
                    : "Write your own interpretation, critique, or synthesis of this paper."
                }
                className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-dim)] rounded-md p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] outline-none focus:border-[var(--color-primary)] transition-colors resize-y font-sans leading-relaxed"
              />

              {evidenceKind === "author passage" && trimmedInput.length > 0 && (
                <div
                  className={`flex items-center gap-1.5 font-mono text-[10px] ${
                    isVerbatimExcerpt
                      ? "text-[var(--color-green-bright)]"
                      : "text-[var(--color-red)]"
                  }`}
                >
                  {isVerbatimExcerpt ? (
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                  )}
                  <span>
                    {isVerbatimExcerpt
                      ? "Verified verbatim excerpt from the abstract."
                      : "Not a verbatim match against the abstract."}
                  </span>
                </div>
              )}

              {evidenceKind === "author passage" && (
                <p className="font-mono text-[10px] text-[var(--text-muted)] leading-relaxed">
                  Author passages are stored verbatim and matched against the paper&apos;s abstract. Paraphrases belong to researcher notes.
                </p>
              )}
            </div>

            {/* Capture message */}
            {captureMessage && (
              <div
                className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-xs ${
                  captureMessage.type === "success"
                    ? "border-[var(--border-emerald-dim)] bg-[rgba(107,168,136,0.08)] text-[var(--color-green-bright)]"
                    : captureMessage.type === "error"
                      ? "border-[var(--border-red-dim)] bg-[rgba(224,104,90,0.08)] text-[var(--color-red)]"
                      : "border-[var(--border-primary-dim)] bg-[rgba(58, 157, 124,0.08)] text-[var(--color-primary-bright)]"
                }`}
              >
                {captureMessage.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                ) : captureMessage.type === "error" ? (
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                ) : (
                  <Quote className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                )}
                <span className="leading-relaxed">{captureMessage.text}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              disabled={
                isCapturing ||
                !trimmedInput ||
                (evidenceKind === "author passage" && !isVerbatimExcerpt)
              }
              onClick={handleSaveEvidence}
              className="btn btn-primary w-full h-11 text-sm font-mono font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCapturing ? "Capturing…" : "Capture evidence"}</span>
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
