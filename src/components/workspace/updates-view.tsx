"use client";

import { useState, type FormEvent } from "react";
import {
  Bell,
  CheckCircle2,
  Bookmark,
  Plus,
  Trash2,
  BookOpen,
  ExternalLink,
  FileText,
  Search,
  Check,
  Radio,
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

  const unreadCount = inbox.filter((i) => !i.read).length;

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newAlertQuery.trim()) return;
    onCreateAlert(newAlertQuery.trim(), frequency);
    setNewAlertQuery("");
  };

  return (
    <div className="space-y-7">
      {/* ============ SECTION MASTHEAD ============ */}
      <div className="space-y-3 animate-fade-up">
        <div className="flex flex-wrap items-center gap-3">
          <span className="section-index">
            <span className="num">06</span> / Alerts
          </span>
          <span className="h-px flex-1 bg-[var(--border-dim)]" />
          <span className="hud-badge brass py-1">
            {unreadCount > 0 && <span className="hud-dot animate-pulse-signal" />}
            {unreadCount} unread · {alerts.length} alerts
          </span>
        </div>
        <h1
          className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold font-display leading-[1.08] text-[var(--text-primary)]"
          style={{ fontOpticalSizing: "auto" }}
        >
          Living searches &{" "}
          <span className="font-serif-italic text-[var(--color-primary-bright)]">
            updates.
          </span>
        </h1>
        <p className="text-[var(--text-secondary)] text-base max-w-2xl leading-relaxed">
          Standing queries that sweep scholarly repositories on your chosen
          cadence. New matches land in the inbox; alerts keep running until you
          delete them.
        </p>
      </div>

      {/* ============ TWO-COLUMN WORKSPACE ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ---------- LEFT: INBOX ---------- */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="section-index">
              <span className="num">06.1</span> / Inbox
            </h3>
            <span className="h-px flex-1 bg-[var(--border-dim)]" />
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              {inbox.length} items · {unreadCount} unread
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="btn btn-secondary h-8 px-3 text-[11px] font-mono font-semibold uppercase tracking-wider"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-green)]" />
                Mark all read
              </button>
            )}
          </div>

          {inbox.length > 0 && (
            <div className="kpi-card">
              <span className="kpi-label">Unread matches</span>
              <span className="kpi-value">{unreadCount}</span>
              <span className="kpi-sub">awaiting your review</span>
            </div>
          )}

          {inbox.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {inbox.map((item) => {
                const paper = item.paper;
                const isSaved = savedPaperIds.has(paper.id);
                const access = resolvePaperAccess(paper);
                const alert = alerts.find((a) => a.id === item.alertId);
                return (
                  <article
                    key={item.id}
                    className={`tech-card bracketed p-4 sm:p-5 space-y-3 transition-all ${
                      item.read ? "opacity-65" : ""
                    }`}
                  >
                    {/* Header row — dot, matched alert, discoveredAt, mark read */}
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                      <span
                        className={`hud-dot ${
                          !item.read
                            ? "animate-pulse-signal text-[var(--color-primary-bright)]"
                            : "text-[var(--text-faint)]"
                        }`}
                      />
                      {alert && (
                        <span
                          className="text-[var(--color-primary-bright)] uppercase tracking-wider font-semibold truncate max-w-[260px]"
                          title={alert.query}
                        >
                          Match · &ldquo;{alert.query}&rdquo;
                        </span>
                      )}
                      <span className="text-[var(--text-muted)]">
                        {new Date(item.discoveredAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                      <span className="ml-auto">
                        {!item.read && (
                          <button
                            type="button"
                            onClick={() => onMarkRead(item.id)}
                            className="btn btn-ghost h-7 px-2 text-[10px] font-mono font-semibold uppercase tracking-wider"
                          >
                            <Check className="w-3 h-3" />
                            Mark read
                          </button>
                        )}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => onOpenReader(paper)}
                      className="text-base sm:text-lg font-semibold font-display text-[var(--text-primary)] leading-snug cursor-pointer hover:text-[var(--color-primary-bright)] transition-colors line-clamp-2"
                      style={{ fontOpticalSizing: "auto" }}
                    >
                      {paper.title}
                    </h3>

                    {/* Mono metadata */}
                    <p className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
                      {paper.authors.length > 0
                        ? `${paper.authors.slice(0, 3).join(", ")}${paper.authors.length > 3 ? " et al." : ""}`
                        : "Unknown authors"}
                      {paper.year ? ` · ${paper.year}` : ""}
                      {paper.venue ? ` · ${paper.venue}` : ""}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenReader(paper)}
                        className="btn btn-primary h-8 px-3 text-[11px] font-mono font-bold uppercase tracking-wider"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Reader
                      </button>
                      {access.primaryAction && (
                        <a
                          href={access.primaryAction.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`btn h-8 px-3 text-[11px] font-mono font-semibold uppercase tracking-wider ${
                            access.hasDirectPdf ? "btn-emerald" : "btn-secondary"
                          }`}
                        >
                          {access.hasDirectPdf && (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          <span>{access.primaryAction.label}</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleSave(paper)}
                        className={`btn h-8 px-3 text-[11px] font-mono font-semibold uppercase tracking-wider ${
                          isSaved ? "btn-amber" : "btn-ghost"
                        }`}
                        title={isSaved ? "Saved to library" : "Save to library"}
                        aria-pressed={isSaved}
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${
                            isSaved ? "fill-current" : ""
                          }`}
                        />
                        {isSaved ? "Saved" : "Save"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="tech-card bracketed p-8 sm:p-10 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border-primary-dim)] bg-[rgba(58, 157, 124,0.06)] text-[var(--color-primary-bright)]">
                <Bell className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h4
                  className="text-lg sm:text-xl font-bold font-display text-[var(--text-primary)]"
                  style={{ fontOpticalSizing: "auto" }}
                >
                  The inbox is quiet
                </h4>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
                  New records matched by your standing queries arrive here. In
                  local mode there is no background worker, so the inbox stays
                  empty — schedule a worker against the server alert runner to
                  populate this stream.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ---------- RIGHT: ALERTS MANAGEMENT ---------- */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="section-index">
              <span className="num">06.2</span> / Standing queries
            </h3>
            <span className="h-px flex-1 bg-[var(--border-dim)]" />
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              {alerts.length} active
            </span>
          </div>

          {/* New alert form */}
          <form
            onSubmit={handleCreate}
            className="tech-card bracketed p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[var(--color-primary)]" />
              <h4 className="section-index">New standing query</h4>
            </div>

            <div className="search-field flex items-center gap-2 px-3">
              <Search className="w-4 h-4 text-[var(--color-primary)]" />
              <input
                type="text"
                required
                value={newAlertQuery}
                onChange={(e) => setNewAlertQuery(e.target.value)}
                placeholder="Topic or phrase to monitor…"
                className="flex-1 bg-transparent border-0 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-faint)] text-sm py-2.5"
                aria-label="Alert query"
              />
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                Cadence
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFrequency("daily")}
                  className={`btn h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider ${
                    frequency === "daily" ? "btn-primary" : "btn-secondary"
                  }`}
                  aria-pressed={frequency === "daily"}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency("weekly")}
                  className={`btn h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider ${
                    frequency === "weekly" ? "btn-emerald" : "btn-secondary"
                  }`}
                  aria-pressed={frequency === "weekly"}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="submit"
                disabled={!newAlertQuery.trim()}
                className="btn btn-primary h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Alert
              </button>
            </div>
          </form>

          {/* Alerts list or empty state */}
          {alerts.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {alerts.map((al) => (
                <article
                  key={al.id}
                  className="tech-card bracketed p-4 sm:p-5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <h4
                        className="text-base font-semibold font-display text-[var(--text-primary)] leading-snug line-clamp-2"
                        style={{ fontOpticalSizing: "auto" }}
                      >
                        {al.query}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                        <span
                          className={`hud-badge py-1 px-2 text-[10px] ${
                            al.frequency === "daily" ? "brass" : "green"
                          }`}
                        >
                          {al.frequency === "daily" && (
                            <span className="hud-dot" />
                          )}
                          {al.frequency}
                        </span>
                        <span>
                          Last run:{" "}
                          {al.lastRunAt
                            ? new Date(al.lastRunAt).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "Never"}
                        </span>
                        <span className="text-[var(--text-faint)]">·</span>
                        <span>
                          Created{" "}
                          {new Date(al.createdAt).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteAlert(al.id)}
                      className="btn btn-ghost h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--color-red)] hover:border-[var(--border-red-dim)]"
                      title="Delete alert"
                      aria-label={`Delete alert: ${al.query}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="tech-card bracketed p-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--border-dim)] bg-white/[0.02] text-[var(--text-muted)]">
                <Radio className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4
                  className="text-base font-semibold font-display text-[var(--text-primary)]"
                  style={{ fontOpticalSizing: "auto" }}
                >
                  No standing queries yet
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
                  Compose a query above to start monitoring a topic. Saved
                  alerts appear here.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
