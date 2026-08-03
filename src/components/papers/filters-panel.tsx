"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/app-store";
import { SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const PAPER_TYPES = [
  { value: "any", label: "Any type" },
  { value: "Journal Article", label: "Journal Articles only" },
  { value: "Conference Paper", label: "Conference Papers only" },
  { value: "Review", label: "Review Articles only" },
  { value: "exclude:Review", label: "Exclude Reviews" },
  { value: "preprint", label: "Preprints only" },
];

export function FiltersPanel({ compact = false }: { compact?: boolean }) {
  const filters = useAppStore((s) => s.filters);
  const updateFilter = useAppStore((s) => s.updateFilter);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const rawQuery = useAppStore((s) => s.rawQuery);
  const setRawQuery = useAppStore((s) => s.setRawQuery);
  const [expanded, setExpanded] = useState(!compact);

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === "openAccessOnly") return v === true;
    if (v === undefined || v === null || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }).length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 font-medium text-sm hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Advanced Filters
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-semibold text-white">
              {activeCount}
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs gap-1">
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {expanded && (
        <div className="space-y-4">
          {/* Year range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="year-from" className="text-xs text-muted-foreground">Year from</Label>
              <Input
                id="year-from"
                type="number"
                inputMode="numeric"
                placeholder="2020"
                value={filters.yearFrom ?? ""}
                onChange={(e) => updateFilter("yearFrom", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="year-to" className="text-xs text-muted-foreground">Year to</Label>
              <Input
                id="year-to"
                type="number"
                inputMode="numeric"
                placeholder="2026"
                value={filters.yearTo ?? ""}
                onChange={(e) => updateFilter("yearTo", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="h-9"
              />
            </div>
          </div>

          {/* Min citations */}
          <div>
            <Label htmlFor="min-citations" className="text-xs text-muted-foreground">Minimum citations</Label>
            <Input
              id="min-citations"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={filters.minCitations ?? ""}
              onChange={(e) => updateFilter("minCitations", e.target.value ? parseInt(e.target.value, 10) : undefined)}
              className="h-9"
            />
          </div>

          {/* Author */}
          <div>
            <Label htmlFor="author" className="text-xs text-muted-foreground">Author name</Label>
            <Input
              id="author"
              placeholder="e.g. Bengio"
              value={filters.author ?? ""}
              onChange={(e) => updateFilter("author", e.target.value || undefined)}
              className="h-9"
            />
          </div>

          {/* Publisher */}
          <div>
            <Label htmlFor="publisher" className="text-xs text-muted-foreground">Publisher / Venue</Label>
            <Input
              id="publisher"
              placeholder="e.g. IEEE, Nature"
              value={filters.publisher ?? ""}
              onChange={(e) => updateFilter("publisher", e.target.value || undefined)}
              className="h-9"
            />
          </div>

          {/* Paper type */}
          <div>
            <Label htmlFor="paper-type" className="text-xs text-muted-foreground">Paper type</Label>
            <Select
              value={filters.paperType || "any"}
              onValueChange={(v) => updateFilter("paperType", v === "any" ? undefined : v)}
            >
              <SelectTrigger id="paper-type" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAPER_TYPES.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Open access */}
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="open-access" className="text-sm cursor-pointer">Open access only</Label>
            <Switch
              id="open-access"
              checked={!!filters.openAccessOnly}
              onCheckedChange={(c) => updateFilter("openAccessOnly", c || undefined)}
            />
          </div>

          {/* Keywords */}
          <div>
            <Label htmlFor="include-kw" className="text-xs text-muted-foreground">Keywords to include (comma-separated)</Label>
            <Input
              id="include-kw"
              placeholder="deep learning, transformer"
              value={(filters.includeKeywords || []).join(", ")}
              onChange={(e) => updateFilter("includeKeywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              className="h-9"
            />
          </div>
          <div>
            <Label htmlFor="exclude-kw" className="text-xs text-muted-foreground">Keywords to exclude (comma-separated)</Label>
            <Input
              id="exclude-kw"
              placeholder="survey, review"
              value={(filters.excludeKeywords || []).join(", ")}
              onChange={(e) => updateFilter("excludeKeywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              className="h-9"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
