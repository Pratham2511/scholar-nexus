"use client";

import {
  Compass,
  Bookmark,
  FolderGit2,
  Scale,
  BookOpen,
  Bell,
  Download,
  GraduationCap,
  Activity,
  Sparkles,
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
  const navItems = [
    {
      id: "discover" as const,
      label: "Discover",
      icon: Compass,
      badge: null,
    },
    {
      id: "reading" as const,
      label: "Reader",
      icon: BookOpen,
      badge: null,
    },
    {
      id: "saved" as const,
      label: "Library",
      icon: Bookmark,
      badge: savedCount > 0 ? savedCount : null,
    },
    {
      id: "projects" as const,
      label: "Projects",
      icon: FolderGit2,
      badge: null,
    },
    {
      id: "compare" as const,
      label: "Compare",
      icon: Scale,
      badge: compareCount > 0 ? compareCount : null,
    },
    {
      id: "updates" as const,
      label: "Alerts",
      icon: Bell,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : null,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-100 relative z-10">
      {/* Top Application Header - High-profile highlighted status */}
      <header className="sticky top-0 z-40 w-full border-b border-indigo-500/25 bg-[#050813]/95 backdrop-blur-2xl shadow-[0_4px_35px_rgba(0,0,0,0.85),0_1px_0_rgba(99,102,241,0.2)]">
        <div className="mx-auto flex h-20 sm:h-22 max-w-[1880px] w-full items-center justify-between px-5 sm:px-8 lg:px-12 xl:px-14">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-6 sm:gap-10">
            <button
              type="button"
              onClick={() => onNavigate("discover")}
              className="flex items-center gap-3.5 text-left focus:outline-none group"
            >
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:border-indigo-400 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-display flex items-center gap-2">
                  Scholar<span className="text-[var(--color-primary-bright)]">Nexus</span>
                  <span className="hud-dot animate-pulse-signal" style={{ color: "var(--color-primary)" }} />
                </span>
                <span className="text-xs font-mono tracking-widest text-indigo-300/90 uppercase font-semibold">
                  Scientific Literature Observatory
                </span>
              </div>
            </button>

            {/* Main Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-2 pl-6 border-l border-indigo-500/20">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`relative flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm sm:text-base font-sans font-semibold transition-all ${
                      isActive
                        ? "bg-indigo-600/25 text-white border border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.25)] font-bold"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${isActive ? "text-[var(--color-primary-bright)]" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                    {item.badge !== null && (
                      <span
                        className={`ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                          isActive
                            ? "bg-[var(--color-primary)] text-black"
                            : "bg-white/[0.12] text-slate-200"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Status Console & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Real-time Storage HUD Badge */}
            <div
              className={`hud-badge ${
                storageStatus === "synced"
                  ? "green"
                  : storageStatus === "local"
                  ? "iris"
                  : "iris"
              } text-xs sm:text-sm px-4 py-2 font-mono font-medium`}
              title={
                storageStatus === "synced"
                  ? "PostgreSQL database fully synced"
                  : "Persistent browser storage engine active"
              }
            >
              <span className="hud-dot animate-pulse-signal" />
              <span className="hidden sm:inline">
                {storageStatus === "synced" ? "DATABASE // SYNCED" : "LOCAL ENGINE // ACTIVE"}
              </span>
            </div>

            {/* Quick Export Snapshot Button */}
            {onExportSnapshot && (
              <button
                type="button"
                onClick={onExportSnapshot}
                className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-[var(--bg-surface)] px-3.5 py-2 text-xs sm:text-sm font-mono font-medium text-slate-200 hover:border-[var(--color-primary)] hover:text-white hover:bg-indigo-950/30 transition-all shadow-sm"
                title="Backup research workspace state"
              >
                <Download className="h-4 w-4 text-[var(--color-primary-bright)]" />
                <span>BACKUP</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="flex md:hidden items-center justify-around border-t border-indigo-500/20 px-3 py-2 bg-[#050813]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-mono ${
                  isActive ? "text-[var(--color-primary-bright)] font-bold" : "text-slate-400"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace Stage */}
      <main className="flex-1 w-full max-w-[1880px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-14 py-8 sm:py-10">
        {children}
      </main>

      {/* Footer Technical Metadata */}
      <footer className="w-full border-t border-indigo-500/20 bg-[#050813]/90 py-6 sm:py-8 text-sm text-[var(--text-muted)] font-mono">
        <div className="mx-auto flex max-w-[1880px] flex-wrap items-center justify-between gap-4 px-5 sm:px-8 lg:px-12 xl:px-14">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[var(--color-primary-bright)] font-bold font-display text-base">SCHOLARNEXUS</span>
            <span className="text-slate-400">{"//"} Academic Literature Observatory & Synthesis Workbench</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-[var(--color-green)] font-medium">
              <Activity className="h-3.5 w-3.5" /> 9 Academic Repositories Online
            </span>
            <span className="text-slate-400">v2.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
