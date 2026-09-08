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
import { Logo } from "@/components/ui/logo";
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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-ground">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 mr-4 shrink-0"
          aria-label="ScholarNexus home"
        >
          <Logo size="sm" />
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
                  "h-8 gap-1.5 font-ui uppercase tracking-wider text-xs",
                  isActive && "border-b-2 border-accent text-text-primary",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{item.label}</span>
                {badge > 0 && (
                  <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-accent px-1 font-mono text-[10px] text-ground">
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
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
