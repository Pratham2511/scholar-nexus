"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Bookmark,
  Plus,
  Trash2,
  Radio,
  BookOpen,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { Workspace } from "@/lib/workspace/schema";
import type { Paper } from "./paper-card";
import { resolvePaperAccess } from "./source-resolver";

interface UpdatesViewProps {
  inbox: Workspace["inbox"];
  alerts: Workspace["alerts"];
  onMarkRead: (inboxId: string) => void;
  onMarkAllRead: () => void;
  onCreateAlert: (query: string, frequency: "daily" | "weekly") => void;
  onDeleteAlert: (alertId: string) => void;
  onOpenReader: (paper: Paper) => void;
  onToggleSave: (paper: Paper) => void;
  savedPaperIds: Set<string>;
}

export function UpdatesView({
  inbox,
  alerts,
  onMarkRead,
  onMarkAllRead,
  onCreateAlert,
  onDeleteAlert,
  onOpenReader,
  onToggleSave,
  savedPaperIds,
}: UpdatesViewProps) {
  const [newAlertQuery, setNewAlertQuery] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("weekly");
  const [isCreating, setIsCreating] = useState(false);

  const unreadCount = inbox.filter((i) => !i.read).length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertQuery.trim()) return;
    onCreateAlert(newAlertQuery.trim(), frequency);
    setNewAlertQuery("");
    setIsCreating(false);
  };

  return (
    <div className="space-y-8">
      {/* Header Deck */}
      <div className="space-y-5">
        <div className="hud-badge iris py-1.5 px-4 text-xs sm:text-sm font-mono tracking-wider font-semibold">
          <span className="hud-dot animate-pulse-signal" />
          <span>CONTINUOUS MONITORING // {alerts.length} ALERTS ACTIVE</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2.5">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display">
              Research Feed & <span className="text-[var(--color-primary-bright)]">Alerts</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
              Continuous repository sweeps monitoring newly published preprints and journal releases matching your topics.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs sm:text-sm">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="btn btn-secondary h-11 px-4 text-xs sm:text-sm font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 text-[var(--color-green)]" />
                <span>ACKNOWLEDGE ALL</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="btn btn-primary h-11 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>NEW ALERT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create Alert Console */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="tech-card bracketed p-6 sm:p-8 space-y-5 border-indigo-500/30 font-mono text-xs sm:text-sm shadow-xl"
        >
          <div className="flex items-center gap-2.5">
            <span className="hud-badge iris text-xs font-semibold">CONFIGURE</span>
            <h3 className="text-base font-bold text-white uppercase tracking-wide">
              Configure Standing Repository Sweep
            </h3>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 uppercase tracking-wider font-semibold">
              Research Inquiry / Concept to Monitor
            </label>
            <input
              type="text"
              required
              value={newAlertQuery}
              onChange={(e) => setNewAlertQuery(e.target.value)}
              placeholder="e.g. Temporal graph neural networks, APT detection, LLM reasoning"
              className="h-11 w-full rounded-lg border border-indigo-500/25 bg-[var(--bg-obsidian)] px-3 text-sm text-white placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:outline-none transition-all font-sans"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-300 uppercase tracking-wider font-semibold">
              Sweep Cadence
            </label>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2.5 text-sm text-slate-200 cursor-pointer font-sans">
                <input
                  type="radio"
                  name="freq"
                  checked={frequency === "daily"}
                  onChange={() => setFrequency("daily")}
                  className="h-4 w-4 text-[var(--color-primary)]"
                />
                <span>Daily Digest Sweep</span>
              </label>
              <label className="flex items-center gap-2.5 text-sm text-slate-200 cursor-pointer font-sans">
                <input
                  type="radio"
                  name="freq"
                  checked={frequency === "weekly"}
                  onChange={() => setFrequency("weekly")}
                  className="h-4 w-4 text-[var(--color-primary)]"
                />
                <span>Weekly Synthesis Sweep</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 font-mono text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="btn btn-secondary h-10 px-4 text-xs sm:text-sm font-semibold"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="btn btn-primary h-10 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider"
            >
              SAVE ALERT
            </button>
          </div>
        </form>
      )}

      {/* Active Monitored Topics Bar */}
      {alerts.length > 0 && (
        <div className="tech-card bracketed p-4 flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-[var(--text-muted)] uppercase text-[10px] mr-2">
            ACTIVE MONITORS:
          </span>
          {alerts.map((al) => (
            <div
              key={al.id}
              className="flex items-center gap-2 rounded bg-white/[0.04] border border-[var(--border-dim)] px-2.5 py-1 text-slate-200"
            >
              <span>{al.query}</span>
              <span className="text-[10px] text-[var(--color-amber)] capitalize bg-[var(--color-amber)]/10 px-1 rounded">
                {al.frequency}
              </span>
              <button
                type="button"
                onClick={() => onDeleteAlert(al.id)}
                className="text-slate-500 hover:text-rose-400 ml-1"
                title="Delete alert"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Feed Stream */}
      {inbox.length > 0 ? (
        <div className="space-y-4">
          {inbox.map((item) => {
            const paper = item.paper as unknown as Paper;
            const isSaved = savedPaperIds.has(paper.id);
            const access = resolvePaperAccess(paper);

            return (
              <div
                key={item.id}
                className={`tech-card interactive bracketed p-6 sm:p-7 space-y-3.5 transition-all ${
                  item.read ? "opacity-75" : "border-indigo-500/30"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        item.read ? "bg-slate-600" : "bg-[var(--color-primary-bright)] animate-pulse"
                      }`}
                    />
                    <span className="text-indigo-400 font-semibold text-xs sm:text-sm">
                      MATCH: &ldquo;{alerts.find((a) => a.id === item.alertId)?.query || "Monitored Query"}&rdquo;
                    </span>
                    <span className="text-slate-400 text-xs">
                      • {new Date(item.discoveredAt).toLocaleDateString()}
                    </span>
                  </div>

                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(item.id)}
                      className="text-slate-400 hover:text-white text-xs font-semibold"
                    >
                      MARK READ
                    </button>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white font-display leading-snug">
                  {paper.title}
                </h3>

                <p className="text-sm sm:text-base text-slate-300 font-sans">
                  {paper.authors?.slice(0, 3).join(", ")}
                  {paper.authors && paper.authors.length > 3 ? " et al." : ""} •{" "}
                  {paper.year || "Year unknown"} • {paper.venue || "Preprint Repository"}
                </p>

                {paper.abstract && (
                  <p className="text-sm sm:text-base text-slate-200 line-clamp-2 leading-relaxed font-sans">
                    {paper.abstract}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-indigo-500/20 font-mono text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenReader(paper)}
                      className="btn btn-primary h-9 px-4 text-xs font-bold"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>READER</span>
                    </button>

                    {access.primaryAction && (
                      <a
                        href={access.primaryAction.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary h-9 px-4 text-xs font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[var(--color-primary-bright)]" />
                        <span>{access.primaryAction.label}</span>
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleSave(paper)}
                    className={`rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                      isSaved
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                        : "border-indigo-500/20 text-slate-300 hover:border-[var(--color-primary)] hover:text-white"
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 inline mr-1.5 ${isSaved ? "fill-current text-indigo-400" : ""}`} />
                    <span>{isSaved ? "SAVED" : "SAVE TO LIBRARY"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="tech-card bracketed p-16 text-center max-w-xl mx-auto space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.3)]">
            <Bell className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white font-display">
              Research Feed is Clear
            </h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Create continuous research monitors to automatically track and receive newly indexed papers matching your topics.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="btn btn-primary h-11 px-6 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>CONFIGURE MONITOR</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
