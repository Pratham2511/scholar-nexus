"use client";
import Link from "next/link";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from "react";
import {
  Search,
  ArrowUpRight,
  Plus,
  X,
  BookOpen,
  Bookmark,
  SlidersHorizontal,
  Download,
  Check,
  RefreshCw,
  ArrowRight,
  Upload,
  Undo2,
  Columns3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type {
  AcademicPaper,
  SearchFilters,
  SearchResult,
  CitationNeighbor,
} from "@/lib/academic/types";
import {
  fields,
  type Workspace,
  type Evidence,
  type Project,
  type DocumentRecord,
} from "@/lib/workspace/schema";
import {
  bibliography,
  evidenceCSV,
  screeningCSV,
} from "@/lib/workspace/exports";
import { useWorkspace } from "./use-workspace";
import { Logo } from "@/components/ui/logo";
import { CountUp } from "@/components/ui/count-up";

type Section = "discover" | "projects" | "reading" | "updates";
type Change = (fn: (s: Workspace) => void) => Promise<boolean>;
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const date = (s: string) =>
  new Date(s).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const defaults = ["Crossref", "arXiv", "Europe PMC"];
function keep(s: Workspace, p: AcademicPaper) {
  if (!s.papers.some((x) => x.id === p.id)) s.papers.unshift(p);
}
function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Choice({
  value,
  onChange,
  items,
  label,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  items: string[];
  label: string;
  labels?: Record<string, string>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i} value={i}>
            {labels?.[i] || i}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="desk-empty">
      <BookOpen size={24} strokeWidth={1.3} />
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}

export function Desk({ section = "discover" }: { section?: Section }) {
  const { state, error, setError, ready, saving, reload, mutate } =
    useWorkspace();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sources, setSources] = useState(defaults);
  const [providers, setProviders] = useState<
    { name: string; configured: boolean; requiredKey?: string }[]
  >(defaults.map((name) => ({ name, configured: true })));
  const [showFilters, setShowFilters] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<AcademicPaper | null>(null);
  const [targetEvidence, setTargetEvidence] = useState<Evidence | undefined>();
  const [projectId, setProjectId] = useState("");
  const request = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const [welcome, setWelcome] = useState(true);
  const activeProject =
    state.projects.find((p) => p.id === projectId) || state.projects[0];
  const execute = useCallback(
    async (q: string, f: SearchFilters, ss: string[], cursor?: string) => {
      if (!q.trim()) return;
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      const seq = ++sequence.current;
      setSearching(true);
      setSearchError("");
      setWelcome(false);
      setSelected(null);
      setTargetEvidence(undefined);
      if (!cursor) setResult(null);
      try {
        const r = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, filters: f, sources: ss, cursor }),
          signal: controller.signal,
        });
        const d = await r.json();
        if (seq !== sequence.current) return;
        if (!r.ok) {
          if (d.sources) setResult(d);
          throw new Error(d.error || "Search failed.");
        }
        setResult((previous) =>
          cursor && previous
            ? { ...d, papers: [...previous.papers, ...d.papers] }
            : d,
        );
        if (!cursor)
          void mutate((s) => {
            s.searches.unshift({
              id: uid(),
              query: q,
              filters: f as Record<string, unknown>,
              providers: ss,
              createdAt: now(),
              papers: d.papers,
              diagnostics: d.sources.map(
                (source: {
                  source: string;
                  status: string;
                  error?: string;
                  durationMs: number;
                }) => ({
                  source: source.source,
                  status: source.status,
                  error: source.error,
                  durationMs: source.durationMs,
                }),
              ),
              coverage: d.coverage,
            });
            s.searches = s.searches.slice(0, 100);
          });
      } catch (e) {
        if (!controller.signal.aborted && seq === sequence.current)
          setSearchError(e instanceof Error ? e.message : "Search failed.");
      } finally {
        if (seq === sequence.current) setSearching(false);
      }
    },
    [mutate],
  );
  useEffect(() => {
    void fetch("/api/search")
      .then((r) => r.json())
      .then((d) => setProviders(d.providers))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (section !== "discover") return;
    const restore = () => {
      const p = new URLSearchParams(window.location.search);
      const q = p.get("q") || "";
      let f: SearchFilters = {};
      try {
        f = JSON.parse(p.get("filters") || "{}");
      } catch {}
      const ss = p.getAll("source");
      setQuery(q);
      setFilters(f);
      setSources(ss.length ? ss : defaults);
      if (q) void execute(q, f, ss.length ? ss : defaults);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => {
      window.removeEventListener("popstate", restore);
      request.current?.abort();
    };
  }, [section, execute]);
  function search(e?: FormEvent) {
    e?.preventDefault();
    const p = new URLSearchParams({
      q: query,
      filters: JSON.stringify(filters),
    });
    sources.forEach((s) => p.append("source", s));
    window.history.pushState(null, "", "/discover?" + p);
    void execute(query, filters, sources);
  }
  function compare(p: AcademicPaper) {
    void mutate((s) => {
      keep(s, p);
      s.compare = s.compare.includes(p.id)
        ? s.compare.filter((id) => id !== p.id)
        : s.compare.length < 8
          ? [...s.compare, p.id]
          : s.compare;
    });
  }
  function open(p: AcademicPaper, evidence?: Evidence) {
    setSelected(p);
    setTargetEvidence(evidence);
  }
  const listing =
    section === "discover"
      ? result?.papers || []
      : section === "projects"
        ? state.papers.filter((p) =>
            activeProject?.members.some((m) => m.paperId === p.id),
          )
        : state.papers;
  const resultList = (
    <div className="desk-list">
      {searching && !result && (
        <div className="desk-loading" role="status">
          <div className="desk-loading-dots" aria-hidden="true">
            <span className="loading-dot-1">·</span>
            <span className="loading-dot-2">·</span>
            <span className="loading-dot-3">·</span>
          </div>
          <h2>Searching academic sources…</h2>
          <p>You can edit your query while the sources respond.</p>
        </div>
      )}
      {searchError && (
        <div className="desk-error" role="alert">
          <h2>Search could not complete</h2>
          <p>{searchError}</p>
          <Button onClick={() => search()} variant="outline">
            <RefreshCw /> Retry search
          </Button>
        </div>
      )}
      {result && (
        <>
          <div className="results-heading">
            <span>
              {result.papers.length} records shown{" "}
              <span className="muted">/ {result.totalFound} in snapshot</span>
            </span>
            <Choice
              value="Relevance"
              onChange={() => {}}
              items={["Relevance"]}
              label="Result order"
            />
          </div>
          <details className="source-details">
            <summary>
              Source report · {result.sources.filter((s) => s.success).length} /{" "}
              {result.sources.length} completed
            </summary>
            <p>{result.coverage}</p>
            <p>
              {result.retrievedCount} retrieved · {result.duplicatesRemoved}{" "}
              duplicates merged · {result.filteredCount} filtered out ·{" "}
              {(result.durationMs / 1000).toFixed(1)} seconds
            </p>
            {result.sources.map((s) => (
              <p key={s.source}>
                <strong>{s.source}</strong> — {s.status}
                {s.error ? " · " + s.error : ""}
              </p>
            ))}
            <p>
              Relevance uses title and available text. Citation counts are
              provider metadata, not evidence of study quality.
            </p>
          </details>
        </>
      )}
      {!welcome &&
        !searching &&
        !searchError &&
        result?.papers.length === 0 && (
          <Empty title="No matching records in this snapshot">
            <p>
              Try fewer filters or a different source. This bounded search does
              not establish that no literature exists.
            </p>
          </Empty>
        )}
      {listing.map((paper, index) => (
        <PaperRow
          key={paper.id}
          paper={paper}
          index={index}
          selected={selected?.id === paper.id}
          saved={state.papers.some((p) => p.id === paper.id)}
          compared={state.compare.includes(paper.id)}
          onOpen={() => open(paper)}
          onSave={() => void mutate((s) => keep(s, paper))}
          onCompare={() => compare(paper)}
        />
      ))}
      {section === "discover" && result?.cursor && (
        <Button
          className="load-more"
          variant="outline"
          disabled={searching}
          onClick={() => void execute(query, filters, sources, result.cursor!)}
        >
          Load more from this snapshot <ArrowRight />
        </Button>
      )}
    </div>
  );
  return (
    <div className="evidence-desk">
      <a href="#workspace" className="skip-link">
        Skip to workspace
      </a>
      <header className="desk-header">
        <Link
          href="/discover"
          aria-label="ScholarNexus home"
          className="inline-flex items-center"
        >
          <Logo size="sm" />
        </Link>
        <nav aria-label="Main navigation">
          {(["discover", "projects", "reading", "updates"] as Section[]).map(
            (s, i) => (
              <Link
                href={"/" + s}
                key={s}
                aria-current={section === s ? "page" : undefined}
              >
                <span className="nav-index">0{i + 1}</span>
                {s[0].toUpperCase() + s.slice(1)}
                {s === "updates" && state.inbox.some((n) => !n.read) && (
                  <span className="unread-count">
                    {state.inbox.filter((n) => !n.read).length}
                  </span>
                )}
              </Link>
            ),
          )}
        </nav>
        <span className="local-label">Personal research desk</span>
      </header>
      <main id="workspace" className="desk-main">
        <div className="desk-kicker">
          <span>THE EVIDENCE DESK</span>
          <span>
            {saving
              ? "Saving research…"
              : ready
                ? "Local workspace"
                : "Search available · saved research loading"}
          </span>
        </div>
        {error && (
          <div className="desk-error compact" role="alert">
            <span>{error}</span>
            <Button variant="outline" onClick={() => void reload()}>
              Reload saved research
            </Button>
          </div>
        )}
        {section === "discover" && (
          <>
            <div className="discover-title">
              <h1>
                Follow the question.
                <br />
                <em>Find the evidence.</em>
              </h1>
              <p>
                Search across academic sources.
                <br />
                Read closely. Build a review you can trace.
              </p>
            </div>
            <form className="search-form" onSubmit={search}>
              <label className="sr-only" htmlFor="research-query">
                Research topic, exact title, DOI, or arXiv ID
              </label>
              <Search aria-hidden="true" />
              <input
                id="research-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="A research question, paper title, or DOI…"
                required
                maxLength={1000}
              />
              <Button type="submit" disabled={!query.trim() || !sources.length}>
                Search papers <ArrowRight />
              </Button>
            </form>
            <div className="search-tools">
              <span>
                Crossref · arXiv · Europe PMC{" "}
                <span className="muted">+ configured sources</span>
              </span>
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
              >
                <SlidersHorizontal /> Filters & sources
              </Button>
            </div>
            {showFilters && (
              <div className="desk-filters">
                <label>
                  From year
                  <Input
                    type="number"
                    min={1800}
                    max={2100}
                    value={filters.yearFrom || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        yearFrom: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
                <label>
                  Through year
                  <Input
                    type="number"
                    min={1800}
                    max={2100}
                    value={filters.yearTo || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        yearTo: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
                <label>
                  Author
                  <Input
                    value={filters.author || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, author: e.target.value })
                    }
                  />
                </label>
                <label>
                  Exclude terms, separated by commas
                  <Input
                    value={filters.excludeKeywords?.join(",") || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        excludeKeywords: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
                <label>
                  Publication type
                  <Choice
                    value={filters.paperType || "any"}
                    onChange={(v) => setFilters({ ...filters, paperType: v })}
                    items={[
                      "any",
                      "article",
                      "preprint",
                      "review",
                      "conference",
                    ]}
                    label="Publication type"
                  />
                </label>
                <label className="check-label">
                  <Checkbox
                    checked={!!filters.openAccessOnly}
                    onCheckedChange={(v) =>
                      setFilters({ ...filters, openAccessOnly: v === true })
                    }
                  />{" "}
                  Open access only
                </label>
                <fieldset>
                  <legend>Academic sources</legend>
                  {providers.map((p) => (
                    <label key={p.name} className="check-label">
                      <Checkbox
                        checked={sources.includes(p.name)}
                        disabled={!p.configured}
                        onCheckedChange={(checked) =>
                          setSources(
                            checked
                              ? [...sources, p.name]
                              : sources.filter((s) => s !== p.name),
                          )
                        }
                      />
                      {p.name}
                      {!p.configured && (
                        <span className="muted">Requires {p.requiredKey}</span>
                      )}
                    </label>
                  ))}
                </fieldset>
                <p className="muted">
                  Year filters are sent to the baseline sources before
                  retrieval. Other filters apply to the returned snapshot;
                  unknown values do not satisfy a filter.
                </p>
              </div>
            )}
            {welcome && !result && !searching ? (
              <div className="desk-start">
                <section>
                  <div className="section-label">YOUR NEXT LINE OF INQUIRY</div>
                  <h2>A good search is a starting point.</h2>
                  <p>
                    Keep the original question, compare what the papers actually
                    report, and save the passages behind your conclusions.
                  </p>
                  <div className="starter-queries">
                    {[
                      "Graph neural networks for molecules",
                      '"Attention Is All You Need"',
                      "10.1038/s41586-021-03819-2",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuery(q);
                          window.history.pushState(
                            null,
                            "",
                            "/discover?q=" + encodeURIComponent(q),
                          );
                          void execute(q, {}, defaults);
                        }}
                      >
                        {q}
                        <ArrowUpRight size={18} />
                      </button>
                    ))}
                  </div>
                </section>
                <aside>
                  <div className="section-label">RETURN TO YOUR RESEARCH</div>
                  {state.searches.slice(0, 3).map((s) => (
                    <a
                      href={
                        "/discover?q=" +
                        encodeURIComponent(s.query) +
                        "&filters=" +
                        encodeURIComponent(JSON.stringify(s.filters)) +
                        s.providers
                          .map((p) => "&source=" + encodeURIComponent(p))
                          .join("")
                      }
                      key={s.id}
                    >
                      {s.query}
                      <small>
                        {date(s.createdAt)} · {s.papers.length} records saved in
                        snapshot
                      </small>
                    </a>
                  ))}
                  {!state.searches.length && (
                    <p>
                      Your search records will appear here. Projects, passages,
                      and notes stay together when you return.
                    </p>
                  )}
                  <Link className="text-link" href="/projects">
                    Open projects <ArrowRight size={16} />
                  </Link>
                </aside>
              </div>
            ) : (
              <WorkspaceSplit
                selected={selected}
                onClose={() => setSelected(null)}
                list={resultList}
                reader={
                  selected && (
                    <Reader
                      key={selected.id}
                      paper={selected}
                      state={state}
                      mutate={mutate}
                      target={targetEvidence}
                      onClose={() => setSelected(null)}
                      onError={setError}
                    />
                  )
                }
              />
            )}
          </>
        )}
        {section === "projects" && (
          <Projects
            state={state}
            mutate={mutate}
            active={activeProject}
            select={setProjectId}
            onOpen={open}
            onError={setError}
          />
        )}
        {section === "reading" && (
          <>
            <div className="page-title">
              <div>
                <h1>Reading & evidence</h1>
                <p>Every cell begins with a source.</p>
              </div>
              <div className="button-row">
                <Button
                  variant="outline"
                  onClick={() =>
                    download(
                      "evidence-matrix.csv",
                      evidenceCSV(state),
                      "text/csv",
                    )
                  }
                >
                  <Download /> Evidence CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    download(
                      "bibliography.bib",
                      bibliography(state.papers, "bib"),
                    )
                  }
                >
                  BibTeX
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    download(
                      "bibliography.ris",
                      bibliography(state.papers, "ris"),
                    )
                  }
                >
                  RIS
                </Button>
              </div>
            </div>
            <Tabs defaultValue={state.compare.length ? "matrix" : "papers"}>
              <TabsList>
                <TabsTrigger value="papers">
                  Saved papers · {state.papers.length}
                </TabsTrigger>
                <TabsTrigger value="matrix">
                  Evidence matrix · {state.compare.length}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="papers">
                {state.papers.length ? (
                  resultList
                ) : (
                  <Empty title="Your reading desk is ready">
                    <p>
                      Save a paper from Discover to read, annotate, and compare
                      its evidence.
                    </p>
                    <Link href="/discover" className="text-link">
                      Find papers <ArrowRight />
                    </Link>
                  </Empty>
                )}
              </TabsContent>
              <TabsContent value="matrix">
                <Matrix state={state} onOpen={open} />
              </TabsContent>
            </Tabs>
            <SearchRecords state={state} />
          </>
        )}
        {section === "updates" && (
          <Updates
            state={state}
            mutate={mutate}
            reload={reload}
            onError={setError}
            onOpen={open}
          />
        )}
        {section !== "discover" && selected && (
          <Dialog
            open
            onOpenChange={(v) => {
              if (!v) setSelected(null);
            }}
          >
            <DialogContent className="reading-modal" showCloseButton={false}>
              <DialogHeader>
                <DialogTitle className="sr-only">
                  Read paper and capture evidence
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Inspect source passages, upload a PDF, and save evidence.
                </DialogDescription>
              </DialogHeader>
              <Reader
                key={selected.id}
                paper={selected}
                state={state}
                mutate={mutate}
                target={targetEvidence}
                onClose={() => setSelected(null)}
                onError={setError}
              />
            </DialogContent>
          </Dialog>
        )}
      </main>
      <footer className="desk-footer">
        <span>
          ScholarNexus{" "}
          <span className="muted">/ A personal research workspace</span>
        </span>
        <span>Verify claims in their original context.</span>
      </footer>
      {!!state.compare.length && (
        <div className="comparison-tray">
          <Columns3 size={20} />
          <span>{state.compare.length} papers on the comparison desk</span>
          <Link href="/reading" className="tray-link">
            Open evidence matrix <ArrowRight size={16} />
          </Link>
          <Button
            variant="ghost"
            aria-label="Clear comparison"
            onClick={() =>
              void mutate((s) => {
                s.compare = [];
              })
            }
          >
            <X />
          </Button>
        </div>
      )}
    </div>
  );
}
function WorkspaceSplit({
  selected,
  onClose,
  list,
  reader,
}: {
  selected: AcademicPaper | null;
  onClose: () => void;
  list: React.ReactNode;
  reader: React.ReactNode;
}) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 850px)");
    const change = () => setMobile(m.matches);
    change();
    m.addEventListener("change", change);
    return () => m.removeEventListener("change", change);
  }, []);
  if (!selected) return list;
  if (mobile)
    return (
      <>
        {list}
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        >
          <DialogContent className="reading-modal" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle className="sr-only">Paper evidence</DialogTitle>
              <DialogDescription className="sr-only">
                Read the paper and save supporting passages.
              </DialogDescription>
            </DialogHeader>
            {reader}
          </DialogContent>
        </Dialog>
      </>
    );
  return (
    <ResizablePanelGroup direction="horizontal" className="desk-split">
      <ResizablePanel defaultSize={56} minSize={35}>
        {list}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={44} minSize={30}>
        {reader}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
function PaperRow({
  paper: p,
  index,
  selected,
  saved,
  compared,
  onOpen,
  onSave,
  onCompare,
}: {
  paper: AcademicPaper;
  index: number;
  selected: boolean;
  saved: boolean;
  compared: boolean;
  onOpen: () => void;
  onSave: () => void;
  onCompare: () => void;
}) {
  return (
    <article
      className={"paper-row" + (selected ? " selected" : "")}
      style={{ animationDelay: `${Math.min(index * 0.04, 0.3)}s` }}
    >
      <span className="paper-number">{String(index + 1).padStart(2, "0")}</span>
      <div className="paper-main">
        <div className="paper-meta">
          <span>{p.year ?? "Year unknown"}</span>
          <span>{p.paperType || "Type not supplied"}</span>
          <span>
            {p.openAccess === true
              ? "Open access"
              : p.openAccess === false
                ? "Access restricted"
                : "Access unknown"}
          </span>
        </div>
        <h2>
          <button onClick={onOpen}>{p.title}</button>
        </h2>
        <p className="authors">
          {p.authors.slice(0, 4).join(" · ")}
          {p.authors.length > 4 ? " · et al." : ""}
        </p>
        <p className="abstract-preview">
          {p.abstract ||
            "Abstract not supplied by this source. Open the source record or upload a PDF to inspect the text."}
        </p>
        <div className="paper-bottom">
          <span>
            {p.sources.join(" / ")}{" "}
            <span className="muted">
              ·{" "}
              {p.citationCount == null
                ? "Citations unknown"
                : p.citationCount.toLocaleString() + " citations"}
            </span>
          </span>
          <div>
            <Button
              variant="ghost"
              onClick={onSave}
              disabled={saved}
              aria-label={saved ? "Paper saved" : "Save " + p.title}
            >
              {saved ? <Check /> : <Bookmark />}
              <span>{saved ? "Saved" : "Save"}</span>
            </Button>
            <Button
              variant="ghost"
              onClick={onCompare}
              aria-pressed={compared}
              aria-label={"Compare " + p.title}
            >
              <Columns3 />
              <span>{compared ? "Selected" : "Compare"}</span>
            </Button>
            <Button variant="ghost" onClick={onOpen}>
              Read <ArrowUpRight />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Reader({
  paper: p,
  state,
  mutate,
  onClose,
  onError,
  target,
}: {
  paper: AcademicPaper;
  state: Workspace;
  mutate: Change;
  onClose: () => void;
  onError: (s: string) => void;
  target?: Evidence;
}) {
  const documents = state.documents.filter((d) => d.paperId === p.id);
  const [documentId, setDocumentId] = useState(
    target?.documentId || "abstract",
  );
  const doc = documents.find((d) => d.id === documentId);
  const [page, setPage] = useState(target?.page || 1);
  const [quote, setQuote] = useState(target?.quote || "");
  const [field, setField] = useState<string>(target?.field || "Findings");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{
    answer: string;
    coverage: string;
    status: string;
    passages: { page: number; text: string }[];
  } | null>(null);
  const [localError, setLocalError] = useState("");
  const [neighbors, setNeighbors] = useState<CitationNeighbor[] | null>(null);
  const [direction, setDirection] = useState("refs");
  const [tab, setTab] = useState("source");
  const input = useRef<HTMLInputElement>(null);
  const source =
    doc?.pages.find((x) => x.page === page)?.text || (!doc ? p.abstract : "");
  const evidence = state.evidence.filter((e) => e.paperId === p.id);
  async function upload(file: File) {
    setBusy(true);
    setLocalError("");
    try {
      const r = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const id = uid();
      const ok = await mutate((s) => {
        keep(s, p);
        s.documents.push({
          id,
          paperId: p.id,
          name: file.name,
          hash: d.hash,
          pages: d.pages,
          createdAt: now(),
        });
      });
      if (ok) {
        setDocumentId(id);
        setPage(1);
        setQuote("");
      }
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "PDF upload failed.");
    } finally {
      setBusy(false);
    }
  }
  async function capture(kind: Evidence["kind"]) {
    if (
      kind === "author passage" &&
      (!quote.trim() || !source.includes(quote))
    ) {
      setLocalError(
        "Select or paste an exact passage from the text on this page.",
      );
      return;
    }
    const ok = await mutate((s) => {
      keep(s, p);
      s.evidence.push({
        id: uid(),
        paperId: p.id,
        field: field as Evidence["field"],
        statement: kind === "author passage" ? quote : note,
        quote: kind === "author passage" ? quote : "",
        kind,
        documentId: doc?.id,
        page: doc ? page : undefined,
        createdAt: now(),
      });
    });
    if (ok) {
      setQuote("");
      setNote("");
      setLocalError("");
    }
  }
  async function ask() {
    setBusy(true);
    setAnswer(null);
    setLocalError("");
    try {
      if (!(await mutate((s) => keep(s, p)))) return;
      const r = await fetch("/api/ai/ask-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: p.id, documentId: doc?.id, question }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setAnswer(d);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Question failed.");
    } finally {
      setBusy(false);
    }
  }
  async function citations(type: string) {
    setDirection(type);
    setNeighbors(null);
    setBusy(true);
    setLocalError("");
    try {
      const id =
        p.identifiers?.semanticScholar ||
        (p.doi
          ? "DOI:" + p.doi
          : p.identifiers?.arxiv
            ? "ARXIV:" + p.identifiers.arxiv
            : p.id);
      const r = await fetch(
        `/api/citations?paperId=${encodeURIComponent(id)}&title=${encodeURIComponent(p.title)}&type=${type}`,
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setNeighbors(type === "refs" ? d.references : d.citations);
    } catch (e) {
      setLocalError(
        e instanceof Error ? e.message : "Citation source unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <aside className="reader-panel">
      <div className="reader-toolbar">
        <span className="section-label">SOURCE & EVIDENCE</span>
        <Button
          variant="ghost"
          onClick={onClose}
          aria-label="Close reading panel"
        >
          <X />
        </Button>
      </div>
      <h2>{p.title}</h2>
      <p className="reader-byline">{p.authors.join(" · ")}</p>
      <div className="source-links">
        {p.sourceUrls.map((u) => (
          <a key={u.url} href={u.url} target="_blank" rel="noreferrer">
            {u.source} <ArrowUpRight size={14} />
          </a>
        ))}
        {p.pdfLink && (
          <a href={p.pdfLink} target="_blank" rel="noreferrer">
            Provider PDF <ArrowUpRight size={14} />
          </a>
        )}
      </div>
      <p className="muted">
        {p.venue || "Venue not supplied"} · {p.year ?? "Year unknown"}
        {p.retrievedAt ? " · Retrieved " + date(p.retrievedAt) : ""}
      </p>
      <details className="source-details">
        <summary>Provenance & integrity</summary>
        {p.provenance?.map((v, i) => (
          <p key={i}>
            {v.source}: {v.citationCount ?? "unknown"} citations ·{" "}
            {date(v.retrievedAt)}
          </p>
        ))}
        {p.integrityNotices?.map((notice,i)=><p key={i} className="desk-error"><a href={notice.url} target="_blank" rel="noreferrer">{notice.source} reports a {notice.kind} · retrieved {date(notice.retrievedAt)}. Inspect the provider record.</a></p>)}
        <p>Integrity coverage is incomplete. An absent notice does not establish that a paper is unaffected.</p>
        <p>{p.doi ? "DOI: " + p.doi : "No DOI supplied."}</p>
      </details>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="source">Read</TabsTrigger>
          <TabsTrigger value="evidence">
            Evidence · {evidence.length}
          </TabsTrigger>
          <TabsTrigger value="ask">Questions</TabsTrigger>
          <TabsTrigger value="citations">Citations</TabsTrigger>
        </TabsList>
        <TabsContent value="source">
          <div className="reading-controls">
            <Choice
              value={documentId}
              onChange={(v) => {
                setDocumentId(v);
                setPage(1);
                setQuote("");
                setAnswer(null);
              }}
              items={["abstract", ...documents.map((d) => d.id)]}
              labels={Object.fromEntries([
                ["abstract", "Available abstract"],
                ...documents.map((d) => [d.id, d.name]),
              ])}
              label="Text version"
            />
            <input
              ref={input}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.[0]) void upload(e.target.files[0]);
              }}
            />
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              <Upload /> Upload PDF
            </Button>
          </div>
          {doc && (
            <>
              <p className="muted">
                {doc.name} · SHA-256 {doc.hash.slice(0, 12)}…
              </p>
              <div className="page-control">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage(page - 1);
                    setQuote("");
                  }}
                >
                  Previous
                </Button>
                <span>
                  Page {page} / {doc.pages.length}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= doc.pages.length}
                  onClick={() => {
                    setPage(page + 1);
                    setQuote("");
                  }}
                >
                  Next
                </Button>
              </div>
              <p className="muted">
                Text extraction may omit figures, tables, equations, and scanned
                content. Check the original PDF.
              </p>
            </>
          )}
          <div className="text-label">
            {doc ? "FULL TEXT · PAGE " + page : "ABSTRACT ONLY"}
          </div>
          <div
            className="source-passage"
            onMouseUp={() => {
              const selection = window.getSelection()?.toString();
              if (selection && source.includes(selection)) setQuote(selection);
            }}
          >
            {quote && source.includes(quote) ? (
              <>
                {source.slice(0, source.indexOf(quote))}
                <mark>{quote}</mark>
                {source.slice(source.indexOf(quote) + quote.length)}
              </>
            ) : (
              source ||
              "Not reported in available text. Upload a permitted PDF to read and capture page-level evidence."
            )}
          </div>
          <div className="capture-box">
            <h3>Keep a supporting passage</h3>
            <p>
              Select text above or paste an exact excerpt. It will retain this
              source location.
            </p>
            <label>
              Evidence field
              <Choice
                value={field}
                onChange={setField}
                items={[...fields]}
                label="Evidence field"
              />
            </label>
            <label>
              Exact source passage
              <Textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                rows={3}
              />
            </label>
            <Button
              disabled={!quote.trim()}
              onClick={() => void capture("author passage")}
            >
              <Plus /> Add to evidence matrix
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="evidence">
          {evidence.map((e) => (
            <div key={e.id} className="evidence-entry">
              <span className="text-label">
                {e.field} / {e.kind}
              </span>
              <p>{e.statement}</p>
              {e.quote && (
                <Button
                  variant="link"
                  onClick={() => {
                    setDocumentId(e.documentId || "abstract");
                    setPage(e.page || 1);
                    setQuote(e.quote);
                    setTab("source");
                  }}
                >
                  Inspect passage · {e.page ? "page " + e.page : "abstract"}{" "}
                  <ArrowUpRight />
                </Button>
              )}
              <Button
                variant="ghost"
                aria-label="Remove evidence entry"
                onClick={() =>
                  void mutate((s) => {
                    s.evidence = s.evidence.filter((x) => x.id !== e.id);
                  })
                }
              >
                <X />
              </Button>
            </div>
          ))}
          {!evidence.length && (
            <p>No evidence captured yet. Select a passage in Read to begin.</p>
          )}
          <label>
            Annotation field
            <Choice
              value={field}
              onChange={setField}
              items={[...fields]}
              label="Annotation field"
            />
          </label>
          <label>
            Your interpretation or note
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <p className="muted">
            Saved as a researcher annotation, separate from author passages.
          </p>
          <Button
            disabled={!note.trim()}
            onClick={() => void capture("researcher note")}
          >
            Save note
          </Button>
        </TabsContent>
        <TabsContent value="ask">
          <p>
            Ask about the {doc ? "uploaded full text" : "available abstract"}.
            Responses point to source passages and abstain when no supporting
            passage is found.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask();
            }}
          >
            <label>
              Question
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                minLength={3}
                maxLength={1000}
              />
            </label>
            <Button disabled={busy || question.trim().length < 3}>
              Find supporting passages
            </Button>
          </form>
          {answer && (
            <div className="qa-answer">
              <span className="text-label">
                {answer.coverage} / {answer.status}
              </span>
              <p>{answer.answer}</p>
              {answer.passages.map((a, i) => (
                <button
                  key={i}
                  className="quote-button"
                  onClick={() => {
                    setPage(a.page);
                    setQuote(a.text);
                    setTab("source");
                  }}
                >
                  <blockquote>{a.text}</blockquote>
                  <span>
                    Inspect {doc ? "page " + a.page : "abstract"}{" "}
                    <ArrowUpRight size={14} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="citations">
          <p>
            Explore actual citation relationships reported by Semantic Scholar,
            up to 20 neighbors per direction. Coverage is incomplete; citations
            are not endorsements.
          </p>
          <div className="button-row">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void citations("refs")}
            >
              References
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void citations("cites")}
            >
              Citing papers
            </Button>
          </div>
          {neighbors && (
            <>
              <p className="text-label">
                {direction === "refs"
                  ? "THIS PAPER CITES"
                  : "PAPERS CITING THIS WORK"}{" "}
                · publication order
              </p>
              <ol className="citation-list">
                {[...neighbors]
                  .sort((a, b) => (a.year || 0) - (b.year || 0))
                  .map((n) => (
                    <li key={n.paperId}>
                      <span>{n.year ?? "Unknown year"}</span>
                      <a
                        href={
                          "https://www.semanticscholar.org/paper/" +
                          encodeURIComponent(n.paperId)
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        {n.title} <ArrowUpRight size={14} />
                      </a>
                    </li>
                  ))}
              </ol>
              {!neighbors.length && (
                <p>No relationships returned by this provider.</p>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
      {busy && <p role="status">Working…</p>}
      {localError && (
        <p className="desk-error" role="alert">
          {localError}
        </p>
      )}
    </aside>
  );
}
function Matrix({
  state,
  onOpen,
}: {
  state: Workspace;
  onOpen: (p: AcademicPaper, e?: Evidence) => void;
}) {
  const papers = state.papers.filter((p) => state.compare.includes(p.id));
  if (!papers.length)
    return (
      <Empty title="Compare the evidence, side by side">
        <p>
          Select Compare on papers from any search. Your selection stays with
          this workspace.
        </p>
        <Link href="/discover" className="text-link">
          Find papers <ArrowRight />
        </Link>
      </Empty>
    );
  return (
    <>
      <p className="matrix-intro">
        Author passages and researcher annotations stay distinct. Different
        samples, units, and evaluation settings may prevent a direct comparison.
      </p>
      <div
        className="matrix-scroll"
        tabIndex={0}
        role="region"
        aria-label="Evidence comparison table"
      >
        <table className="evidence-matrix">
          <thead>
            <tr>
              <th scope="col">Evidence field</th>
              {papers.map((p) => (
                <th scope="col" key={p.id}>
                  <span className="text-label">{p.year ?? "Year unknown"}</span>
                  <button onClick={() => onOpen(p)}>{p.title}</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field}>
                <th scope="row">{field}</th>
                {papers.map((p) => {
                  const evidence = state.evidence.filter(
                    (e) => e.paperId === p.id && e.field === field,
                  );
                  return (
                    <td key={p.id}>
                      {evidence.length ? (
                        evidence.map((e) => (
                          <button
                            className="matrix-evidence"
                            key={e.id}
                            onClick={() => onOpen(p, e)}
                          >
                            <span className="text-label">{e.kind}</span>
                            <p>{e.statement}</p>
                            <span className="evidence-marker">
                              {e.quote
                                ? e.page
                                  ? "p. " + e.page
                                  : "Abstract"
                                : "Researcher note"}{" "}
                              <ArrowUpRight size={14} />
                            </span>
                          </button>
                        ))
                      ) : (
                        <button
                          className="missing-evidence"
                          onClick={() => onOpen(p)}
                        >
                          Not reported in captured evidence.
                          <span>
                            Inspect available text <Plus size={14} />
                          </span>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Projects({
  state,
  mutate,
  active,
  select,
  onOpen,
  onError,
}: {
  state: Workspace;
  mutate: Change;
  active?: Project;
  select: (id: string) => void;
  onOpen: (p: AcademicPaper) => void;
  onError: (s: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [criteria, setCriteria] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [editing, setEditing] = useState(false);
  const [editedMember, setEditedMember] = useState<
    Project["members"][number] | null
  >(null);
  async function create(e: FormEvent) {
    e.preventDefault();
    const id = active && editing ? active.id : uid();
    const ok = await mutate((s) => {
      if (editing) {
        const p = s.projects.find((p) => p.id === id)!;
        p.name = name;
        p.question = question;
        p.criteria = criteria;
      } else
        s.projects.push({
          id,
          name,
          question,
          criteria,
          members: [],
          createdAt: now(),
        });
    });
    if (ok) {
      select(id);
      setCreating(false);
      setEditing(false);
      setName("");
      setQuestion("");
      setCriteria("");
    }
  }
  async function screen(decision: Project["members"][number]["decision"]) {
    if (!active) return;
    if (decision === "exclude" && !reason.trim()) {
      onError("Record an exclusion reason before excluding papers.");
      return;
    }
    const ok = await mutate((s) => {
      const project = s.projects.find((p) => p.id === active.id)!;
      for (const member of project.members.filter((m) =>
        checked.includes(m.paperId),
      )) {
        s.events.push({
          id: uid(),
          projectId: active.id,
          paperId: member.paperId,
          before: member.decision,
          after: decision,
          reason,
          createdAt: now(),
        });
        member.decision = decision;
        member.reason = reason;
      }
    });
    if (ok) {
      setChecked([]);
      setReason("");
    }
  }
  function undo() {
    if (!active) return;
    void mutate((s) => {
      const index = s.events.findLastIndex((e) => e.projectId === active.id);
      if (index < 0) return;
      const event = s.events[index];
      const member = s.projects
        .find((p) => p.id === active.id)
        ?.members.find((m) => m.paperId === event.paperId);
      if (member) {
        member.decision = event.before;
        member.reason =
          s.events
            .slice(0, index)
            .findLast(
              (e) => e.projectId === active.id && e.paperId === event.paperId,
            )?.reason || "";
      }
      s.events.splice(index, 1);
    });
  }
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Research projects</h1>
          <p>A question, its boundaries, and the evidence you keep.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(false);
            setCreating(true);
          }}
        >
          <Plus /> New project
        </Button>
      </div>
      {!state.projects.length ? (
        <Empty title="Give your review a home">
          <p>
            Create a project with a research question and inclusion criteria.
            Add saved papers, screen them, and keep your decisions.
          </p>
        </Empty>
      ) : (
        <div className="project-layout">
          <aside className="project-nav">
            {state.projects.map((p) => (
              <button
                key={p.id}
                className={active?.id === p.id ? "active" : ""}
                onClick={() => {
                  select(p.id);
                  setChecked([]);
                }}
              >
                <span>{p.name}</span>
                <small>{p.members.length} papers</small>
              </button>
            ))}
          </aside>
          {active && (
            <section className="project-content">
              <div className="project-heading">
                <h2>{active.name}</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setName(active.name);
                    setQuestion(active.question);
                    setCriteria(active.criteria);
                    setEditing(true);
                    setCreating(true);
                  }}
                >
                  Edit question & criteria
                </Button>
              </div>
              <p className="research-question">
                {active.question || "Research question not recorded."}
              </p>
              <details open>
                <summary>Inclusion & exclusion criteria</summary>
                <p className="preserve-space">
                  {active.criteria || "No criteria recorded yet."}
                </p>
              </details>
              <div className="screening-counts">
                {(["unscreened", "include", "exclude", "maybe"] as const).map(
                  (d) => (
                    <div key={d}>
                      <strong>
                        <CountUp
                          end={
                            active.members.filter((m) => m.decision === d).length
                          }
                        />
                      </strong>
                      <span>{d}</span>
                    </div>
                  ),
                )}
              </div>
              <p className="muted">
                Project-level screening counts, based on current decisions. This
                is not a complete systematic review flow.
              </p>
              <div className="button-row">
                <Button
                  variant="outline"
                  onClick={() =>
                    void mutate((s) => {
                      const project = s.projects.find(
                        (p) => p.id === active.id,
                      )!;
                      for (const id of s.compare)
                        if (!project.members.some((m) => m.paperId === id))
                          project.members.push({
                            paperId: id,
                            status: "unread",
                            decision: "unscreened",
                            reason: "",
                            notes: "",
                            tags: "",
                          });
                    })
                  }
                  disabled={!state.compare.length}
                >
                  <Plus /> Add comparison selection
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    download(
                      "project-screening.csv",
                      screeningCSV({ ...state, projects: [active] }),
                      "text/csv",
                    )
                  }
                >
                  <Download /> Screening CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    download(
                      "research-project.json",
                      JSON.stringify({ ...state, projects: [active] }, null, 2),
                      "application/json",
                    )
                  }
                >
                  Export project & search record
                </Button>
                <Button
                  variant="ghost"
                  disabled={
                    !state.events.some((e) => e.projectId === active.id)
                  }
                  onClick={undo}
                >
                  <Undo2 /> Undo last decision
                </Button>
              </div>
              <div className="screening-controls">
                <span>{checked.length} selected</span>
                <Input
                  aria-label="Screening decision reason"
                  placeholder="Decision reason (required for exclusion)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                {(["include", "exclude", "maybe"] as const).map((d) => (
                  <Button
                    key={d}
                    variant="outline"
                    disabled={!checked.length}
                    onClick={() => void screen(d)}
                  >
                    {d[0].toUpperCase() + d.slice(1)}
                  </Button>
                ))}
              </div>
              <div className="project-papers">
                <label className="check-label">
                  <Checkbox
                    checked={
                      active.members.length > 0 &&
                      checked.length === active.members.length
                    }
                    onCheckedChange={(v) =>
                      setChecked(v ? active.members.map((m) => m.paperId) : [])
                    }
                  />{" "}
                  Select all project papers
                </label>
                {active.members.map((m) => {
                  const p = state.papers.find((p) => p.id === m.paperId);
                  return (
                    <article key={m.paperId}>
                      <Checkbox
                        aria-label={"Select " + (p?.title || m.paperId)}
                        checked={checked.includes(m.paperId)}
                        onCheckedChange={(v) =>
                          setChecked(
                            v
                              ? [...checked, m.paperId]
                              : checked.filter((id) => id !== m.paperId),
                          )
                        }
                      />
                      <div>
                        <button
                          className="project-paper-title"
                          disabled={!p}
                          onClick={() => p && onOpen(p)}
                        >
                          {p?.title || m.paperId}
                        </button>
                        <p>
                          {m.decision} · {m.status}
                          {m.reason ? " · " + m.reason : ""}
                        </p>
                        {m.tags && <p className="muted">Tags: {m.tags}</p>}
                        {m.notes && <p className="preserve-space">{m.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => setEditedMember({ ...m })}
                      >
                        Notes & status
                      </Button>
                    </article>
                  );
                })}
                {!active.members.length && (
                  <p>
                    Add papers to Compare from Discover or Reading, then add
                    that selection to this project.
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      )}
      <SearchRecords state={state} />
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit project" : "Start a research project"}
            </DialogTitle>
            <DialogDescription>
              Record what you want to find and how you will assess it.
            </DialogDescription>
          </DialogHeader>
          <form className="desk-form" onSubmit={create}>
            <label>
              Project name
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
              />
            </label>
            <label>
              Research question
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </label>
            <label>
              Inclusion and exclusion criteria
              <Textarea
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                rows={5}
              />
            </label>
            <Button type="submit">Save project</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editedMember}
        onOpenChange={(v) => {
          if (!v) setEditedMember(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reading notes</DialogTitle>
            <DialogDescription>
              Your annotations remain separate from source evidence.
            </DialogDescription>
          </DialogHeader>
          {editedMember && (
            <form
              className="desk-form"
              onSubmit={(e) => {
                e.preventDefault();
                void mutate((s) => {
                  const p = s.projects.find((p) => p.id === active?.id);
                  if (p)
                    p.members = p.members.map((m) =>
                      m.paperId === editedMember.paperId ? editedMember : m,
                    );
                }).then((ok) => {
                  if (ok) setEditedMember(null);
                });
              }}
            >
              <label>
                Reading status
                <Choice
                  value={editedMember.status}
                  onChange={(v) =>
                    setEditedMember({
                      ...editedMember,
                      status: v as "unread" | "reading" | "read",
                    })
                  }
                  items={["unread", "reading", "read"]}
                  label="Reading status"
                />
              </label>
              <label>
                Tags
                <Input
                  value={editedMember.tags}
                  onChange={(e) =>
                    setEditedMember({ ...editedMember, tags: e.target.value })
                  }
                />
              </label>
              <label>
                Notes
                <Textarea
                  rows={5}
                  value={editedMember.notes}
                  onChange={(e) =>
                    setEditedMember({ ...editedMember, notes: e.target.value })
                  }
                />
              </label>
              <Button>Save notes</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function SearchRecords({ state }: { state: Workspace }) {
  return (
    <section className="search-records">
      <div className="section-label">REPRODUCIBLE SEARCH RECORDS</div>
      <h2>The path you took.</h2>
      {!state.searches.length ? (
        <p>
          Your completed searches will be recorded with the original query,
          filters, source outcomes, and first-page snapshots.
        </p>
      ) : (
        state.searches.slice(0, 12).map((s) => (
          <details key={s.id}>
            <summary>
              <span>{s.query}</span>
              <span>
                {date(s.createdAt)} · {s.papers.length} snapshot records
              </span>
            </summary>
            <p>{s.coverage}</p>
            <p>Providers: {s.providers.join(", ")}</p>
            <p>Explicit filters: {JSON.stringify(s.filters)}</p>
            {s.diagnostics.map((d) => (
              <p key={d.source}>
                {d.source}: {d.status}
                {d.error ? " · " + d.error : ""}
              </p>
            ))}
            <div className="button-row">
              <a
                className="text-link"
                href={
                  "/discover?q=" +
                  encodeURIComponent(s.query) +
                  "&filters=" +
                  encodeURIComponent(JSON.stringify(s.filters)) +
                  s.providers
                    .map((p) => "&source=" + encodeURIComponent(p))
                    .join("")
                }
              >
                Repeat search <RefreshCw size={14} />
              </a>
              <Button
                variant="outline"
                onClick={() =>
                  download(
                    "search-method.json",
                    JSON.stringify(s, null, 2),
                    "application/json",
                  )
                }
              >
                <Download /> Export search record
              </Button>
            </div>
            <p className="muted">
              Saved record identifiers:{" "}
              {s.papers.map((p) => p.doi || p.id).join("; ")}
            </p>
          </details>
        ))
      )}
    </section>
  );
}
function Updates({
  state,
  mutate,
  reload,
  onError,
  onOpen,
}: {
  state: Workspace;
  mutate: Change;
  reload: () => Promise<void>;
  onError: (s: string) => void;
  onOpen: (p: AcademicPaper) => void;
}) {
  const [query, setQuery] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [busy, setBusy] = useState("");
  async function run(id: string) {
    setBusy(id);
    try {
      const r = await fetch("/api/alerts/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await reload();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Alert failed.");
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Living searches</h1>
          <p>Keep a question open. See what your next check discovers.</p>
        </div>
      </div>
      <div className="updates-grid">
        <section>
          <h2>Saved checks</h2>
          <p>
            Scheduled checks run while the local worker and app are running.
            Results appear here; email is not sent. The first check establishes
            a baseline.
          </p>
          <form
            className="desk-form"
            onSubmit={(e) => {
              e.preventDefault();
              void mutate((s) => {
                s.alerts.push({
                  id: uid(),
                  query,
                  filters: {},
                  providers: defaults,
                  frequency: frequency as "daily" | "weekly",
                  lastRunAt: null,
                  seen: [],
                  createdAt: now(),
                });
              }).then((ok) => {
                if (ok) setQuery("");
              });
            }}
          >
            <label>
              Search query
              <Input
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={1000}
              />
            </label>
            <label>
              Check frequency
              <Choice
                value={frequency}
                onChange={setFrequency}
                items={["daily", "weekly"]}
                label="Check frequency"
              />
            </label>
            <Button>
              <Plus /> Save living search
            </Button>
          </form>
          {state.alerts.map((a) => (
            <article className="alert-entry" key={a.id}>
              <h3>{a.query}</h3>
              <p>
                {a.frequency} ·{" "}
                {a.lastRunAt
                  ? "Last checked " + date(a.lastRunAt)
                  : "Not checked yet"}
              </p>
              {a.error && <p className="desk-error">{a.error}</p>}
              <div className="button-row">
                <Button
                  variant="outline"
                  disabled={!!busy}
                  onClick={() => void run(a.id)}
                >
                  <RefreshCw className={busy === a.id ? "spin" : ""} /> Run now
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    void mutate((s) => {
                      s.alerts = s.alerts.filter((x) => x.id !== a.id);
                    })
                  }
                >
                  Remove check
                </Button>
              </div>
            </article>
          ))}
        </section>
        <section className="inbox">
          <div className="section-label">DISCOVERED SINCE YOUR BASELINE</div>
          <h2>Research inbox</h2>
          <p className="muted">
            Newly discovered matches may be older publications. Checks cover a
            bounded source snapshot.
          </p>
          {!state.inbox.length && (
            <Empty title="Nothing new to review">
              <p>
                Run a saved check to establish a baseline. Later checks add
                newly discovered matches here.
              </p>
            </Empty>
          )}
          {state.inbox.map((n) => (
            <article key={n.id} className={n.read ? "read" : "unread"}>
              <span className="text-label">
                Discovered {date(n.discoveredAt)} · published{" "}
                {n.paper.year ?? "year unknown"}
              </span>
              <h3>
                <button
                  onClick={() => {
                    onOpen(n.paper);
                    void mutate((s) => {
                      const item = s.inbox.find((x) => x.id === n.id);
                      if (item) item.read = true;
                      keep(s, n.paper);
                    });
                  }}
                >
                  {n.paper.title}
                </button>
              </h3>
              <p>{n.paper.authors.slice(0, 3).join(" · ")}</p>
              <Button
                variant="ghost"
                onClick={() =>
                  void mutate((s) => {
                    const item = s.inbox.find((x) => x.id === n.id);
                    if (item) item.read = !item.read;
                  })
                }
              >
                {n.read ? "Mark unread" : "Mark read"}
              </Button>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
