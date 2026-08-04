"use client";

import { useAppStore } from "@/store/app-store";
import {
  BookOpen,
  Home as HomeIcon,
  Library,
  GitCompareArrows,
  User,
  Moon,
  Sun,
  Network as NetworkIcon,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const NAV_ITEMS = [
  { view: "home" as const, label: "Home", icon: HomeIcon },
  { view: "results" as const, label: "Results", icon: BookOpen },
  { view: "network" as const, label: "Network", icon: NetworkIcon },
  { view: "compare" as const, label: "Compare", icon: GitCompareArrows },
  { view: "library" as const, label: "Library", icon: Library },
  { view: "profile" as const, label: "Profile", icon: User },
];

export function Header() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const compareIds = useAppStore((s) => s.compareIds);
  const savedIds = useAppStore((s) => s.savedIds);

  // V2: On mount, read the persisted theme from localStorage (default: dark).
  // The inline script in layout.tsx already applied the class before hydration,
  // so here we just sync the store with what's on the DOM.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("scholarai-theme") as "light" | "dark" | null;
      const initial = stored || "dark";
      setTheme(initial);
      if (initial === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {
      document.documentElement.classList.add("dark");
    }
  }, [setTheme]);

  // V2: Persist theme changes to localStorage and apply the class.
  useEffect(() => {
    try {
      localStorage.setItem("scholarai-theme", theme);
    } catch {
      /* ignore */
    }
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 mr-2 shrink-0"
          aria-label="ScholarAI home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline font-semibold text-lg tracking-tight">
            Scholar<span className="text-emerald-600 dark:text-emerald-400">AI</span>
          </span>
        </button>

        <nav className="flex flex-1 items-center gap-0.5 sm:gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.view;
            const badge =
              item.view === "compare" ? compareIds.size :
              item.view === "library" ? savedIds.size : 0;
            return (
              <Button
                key={item.view}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView(item.view)}
                className={cn(
                  "h-9 gap-1.5 font-medium",
                  isActive && "bg-secondary text-secondary-foreground shadow-sm",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
                {badge > 0 && (
                  <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-semibold text-white">
                    {badge}
                  </span>
                )}
              </Button>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="shrink-0"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
}
