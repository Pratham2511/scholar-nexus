"use client";

import {
  Compass,
  Bookmark,
  FolderGit2,
  Scale,
  BookOpen,
  Bell,
  Download,
  HardDrive,
  Telescope,
} from "lucide-react";
import type { StorageStatus } from "../desk/use-workspace";

export type ActiveSection =
  | "discover"
  | "reading"
  | "saved"
  | "projects"
  | "compare"
  | "updates";

interface WorkspaceShellProps {
  currentSection: ActiveSection;
  onNavigate: (section: ActiveSection) => void;
  storageStatus: StorageStatus;
  savedCount: number;
  compareCount: number;
  unreadAlertsCount: number;
  onExportSnapshot?: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: {
  id: ActiveSection;
  index: string;
  label: string;
  short: string;
  icon: typeof Compass;
}[] = [
  { id: "discover", index: "01", label: "Discover", short: "Find", icon: Compass },
  { id: "reading", index: "02", label: "Reader", short: "Read", icon: BookOpen },
  { id: "saved", index: "03", label: "Library", short: "Saved", icon: Bookmark },
  { id: "projects", index: "04", label: "Projects", short: "Work", icon: FolderGit2 },
  { id: "compare", index: "05", label: "Compare", short: "Compare", icon: Scale },
  { id: "updates", index: "06", label: "Alerts", short: "Alerts", icon: Bell },
];

export function WorkspaceShell({
  currentSection,
  onNavigate,
  storageStatus,
  savedCount,
  compareCount,
  unreadAlertsCount,
  onExportSnapshot,
  children,
}: WorkspaceShellProps) {
  const badges: Partial<Record<ActiveSection, number>> = {
    saved: savedCount,
    compare: compareCount,
    updates: unreadAlertsCount,
  };

  return (
    <div className="min-h-screen flex flex-col text-[var(--text-primary)] antialiased relative z-10">
      {/* ============== EDITORIAL MASTHEAD ============== */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-primary-dim)] bg-[var(--bg-obsidian)]/85 backdrop-blur-2xl shadow-[0_4px_40px_rgba(0,0,0,0.7)]">
        {/* Top mono metadata strip */}
        <div className="border-b border-[var(--border-dim)]">
          <div className="mx-auto flex max-w-[1880px] w-full items-center justify-between px-5 sm:px-8 lg:px-12 xl:px-14 py-1.5">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--text-muted)]">
              KIVO <span className="text-[var(--color-primary)]">·</span> The Evidence Desk
            </span>
            <span className="hidden sm:flex items-center gap-4 font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--text-muted)]">
              <span>Vol. II</span>
              <span className="text-[var(--text-faint)]">/</span>
              <span className="text-[var(--color-green)] flex items-center gap-1.5">
                <span className="hud-dot animate-pulse-signal" style={{ color: "var(--color-green)" }} />
                Live Repositories
              </span>
              <span className="text-[var(--text-faint)]">/</span>
              <span>EST. 2025</span>
            </span>
          </div>
        </div>

        {/* Masthead row */}
        <div className="mx-auto flex h-[68px] sm:h-[76px] max-w-[1880px] w-full items-center justify-between px-5 sm:px-8 lg:px-12 xl:px-14">
          {/* Brand */}
          <button
            type="button"
            onClick={() => onNavigate("discover")}
            className="flex items-center gap-3.5 text-left focus:outline-none group"
            aria-label="KIVO home"
          >
            <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-[10px] border border-[var(--border-primary-dim)] bg-[rgba(58, 157, 124,0.07)] text-[var(--color-primary-bright)] shadow-[0_0_22px_rgba(58, 157, 124,0.18)] group-hover:border-[var(--color-primary)] group-hover:shadow-[0_0_32px_rgba(58, 157, 124,0.36)] transition-all">
              <Telescope className="h-[22px] w-[22px]" strokeWidth={1.6} />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[var(--text-primary)] font-display flex items-center gap-2" style={{ fontOpticalSizing: "auto" }}>
                KIVO
                <span className="hud-dot animate-pulse-signal" style={{ color: "var(--color-primary)" }} />
              </span>
              <span className="mt-1 text-[10px] font-mono tracking-[0.2em] text-[var(--color-primary-bright)]/80 uppercase font-semibold">
                Literature Intelligence
              </span>
            </div>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              const badge = badges[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`group relative flex items-center gap-2.5 rounded-[8px] px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[rgba(58, 157, 124,0.10)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]"
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] tracking-wider ${
                      isActive ? "text-[var(--color-primary)]" : "text-[var(--text-faint)] group-hover:text-[var(--text-muted)]"
                    }`}
                  >
                    {item.index}
                  </span>
                  <Icon
                    className={`h-4 w-4 ${isActive ? "text-[var(--color-primary-bright)]" : ""}`}
                    strokeWidth={1.7}
                  />
                  <span className={isActive ? "font-semibold" : ""}>{item.label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span
                      className={`ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-mono font-bold ${
                        isActive
                          ? "bg-[var(--color-primary)] text-[#06140e]"
                          : "bg-white/[0.10] text-[var(--text-secondary)]"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-[1px] left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent shadow-[0_0_8px_var(--color-primary)]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status + backup */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className={`hud-badge ${
                storageStatus === "synced" ? "green" : "brass"
              } px-3 py-1.5`}
              title={
                storageStatus === "synced"
                  ? "Workspace synced"
                  : "Persistent browser storage engine active"
              }
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {storageStatus === "synced" ? "SYNCED" : "LOCAL ENGINE"}
              </span>
            </div>

            {onExportSnapshot && (
              <button
                type="button"
                onClick={onExportSnapshot}
                className="hidden sm:inline-flex items-center gap-2 rounded-[8px] border border-[var(--border-medium)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-mono font-medium text-[var(--text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--text-primary)] hover:bg-[rgba(58, 157, 124,0.06)] transition-all"
                title="Backup research workspace"
              >
                <Download className="h-4 w-4 text-[var(--color-primary-bright)]" />
                <span>BACKUP</span>
              </button>
            )}
          </div>
        </div>

        {/* Editorial rule */}
        <div className="editorial-rule" />
      </header>

      {/* ============== MAIN STAGE ============== */}
      <main className="flex-1 w-full max-w-[1880px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-14 py-8 sm:py-10 pb-28 lg:pb-10">
        {children}
      </main>

      {/* ============== FOOTER (sticky to bottom) ============== */}
      <footer className="w-full border-t border-[var(--border-primary-dim)] bg-[var(--bg-obsidian)]/92 backdrop-blur-xl mt-auto pb-24 lg:pb-0">
        <div className="mx-auto max-w-[1880px] px-5 sm:px-8 lg:px-12 xl:px-14 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[var(--color-primary-bright)] font-bold font-display text-lg">KIVO</span>
              <span className="font-mono text-[11px] tracking-wider text-[var(--text-muted)]">
                {"//"} The Evidence Desk — local-first research synthesis
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-5 font-mono text-[11px] tracking-wider">
              <span className="flex items-center gap-1.5 text-[var(--color-green)]">
                <span className="hud-dot animate-pulse-signal" style={{ color: "var(--color-green)" }} />
                3 Repositories Online
              </span>
              <span className="text-[var(--text-muted)]">Crossref · arXiv · Europe PMC</span>
              <span className="text-[var(--text-faint)]">v2.0 — KIVO Edition</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ============== MOBILE BOTTOM NAV ============== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border-primary-dim)] bg-[var(--bg-obsidian)]/95 backdrop-blur-2xl">
        <div className="grid grid-cols-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            const badge = badges[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                  isActive ? "text-[var(--color-primary-bright)]" : "text-[var(--text-muted)]"
                }`}
              >
                <span className="relative">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -right-2.5 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-mono font-bold text-[#06140e]">
                      {badge}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-mono ${isActive ? "font-bold" : ""}`}>{item.short}</span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
