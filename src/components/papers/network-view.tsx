"use client";

import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Network as NetworkIcon,
  Loader2,
  Sparkles,
  Trash2,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  GitCompareArrows,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import type { NetworkNode, NetworkEdge, NetworkGraph, AcademicPaper } from "@/lib/academic/types";
import { toggleSavePaper } from "@/lib/actions";
import { toast } from "sonner";

export function NetworkView() {
  const papers = useAppStore((s) => s.papers);
  const networkGraph = useAppStore((s) => s.networkGraph);
  const setNetworkGraph = useAppStore((s) => s.setNetworkGraph);
  const isNetworkLoading = useAppStore((s) => s.isNetworkLoading);
  const setIsNetworkLoading = useAppStore((s) => s.setIsNetworkLoading);
  const selectedNetworkNodeId = useAppStore((s) => s.selectedNetworkNodeId);
  const setSelectedNetworkNodeId = useAppStore((s) => s.setSelectedNetworkNodeId);
  const setView = useAppStore((s) => s.setView);
  const setSelectedPaper = useAppStore((s) => s.setSelectedPaper);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const compareIds = useAppStore((s) => s.compareIds);
  const savedIds = useAppStore((s) => s.savedIds);

  const svgRef = useRef<SVGSVGElement>(null);

  // Build the initial graph from current search results (seed papers)
  // and fetch 1-hop neighbors for each via the citations API.
  useEffect(() => {
    if (papers.length === 0) return;
    if (networkGraph) return; // already built
    void buildNetwork(papers);
  }, [papers]);

  async function buildNetwork(seedPapers: AcademicPaper[]) {
    setIsNetworkLoading(true);
    try {
      const nodes: NetworkNode[] = seedPapers.slice(0, 20).map((p) => ({
        id: p.id,
        title: p.title,
        authors: p.authors,
        year: p.year,
        citationCount: p.citationCount,
        relevanceScore: p.relevanceScore,
        doi: p.doi,
        source: p.sources[0] || "Unknown",
        isSeed: true,
      }));
      const edges: NetworkEdge[] = [];
      const nodeIds = new Set(nodes.map((n) => n.id));

      // Fetch 1-hop neighbors for the top 5 seed papers in parallel
      // (capped to avoid hammering the Semantic Scholar API)
      const top5 = seedPapers.slice(0, 5);
      await Promise.all(
        top5.map(async (paper) => {
          try {
            const res = await fetch(
              `/api/citations?paperId=${encodeURIComponent(paper.id)}&title=${encodeURIComponent(paper.title)}&type=refs`,
            );
            if (!res.ok) return;
            const data = (await res.json()) as { references: NetworkGraph["nodes"] extends never ? never : import("@/lib/academic/types").CitationGraph };
            const refs = data.references || [];
            for (const r of refs.slice(0, 3)) {
              const neighborId = r.paperId || `nb-${r.doi || r.title.slice(0, 40)}`;
              if (!nodeIds.has(neighborId)) {
                nodes.push({
                  id: neighborId,
                  title: r.title,
                  authors: r.authors,
                  year: r.year,
                  citationCount: r.citationCount,
                  relevanceScore: undefined,
                  doi: r.doi,
                  source: "Semantic Scholar",
                  isSeed: false,
                });
                nodeIds.add(neighborId);
              }
              edges.push({ source: paper.id, target: neighborId });
            }
          } catch {
            /* ignore per-paper errors */
          }
        }),
      );

      setNetworkGraph({ nodes, edges });
    } finally {
      setIsNetworkLoading(false);
    }
  }

  // Render the D3 force-directed graph whenever the graph data changes
  useEffect(() => {
    if (!networkGraph || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = 600;

    // Color scale: red → yellow → green based on relevance score
    const color = d3
      .scaleLinear<string>()
      .domain([0, 50, 100])
      .range(["#ef4444", "#eab308", "#22c55e"])
      .interpolate(d3.interpolateRgb);

    // Size scale: log of citation count
    const size = d3
      .scaleSqrt()
      .domain([0, d3.max(networkGraph.nodes, (d) => d.citationCount) || 100])
      .range([6, 28]);

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });
    svg.call(zoom);

    // Force simulation
    const simulation = d3
      .forceSimulation(networkGraph.nodes)
      .force(
        "link",
        d3
          .forceLink<NetworkNode, NetworkEdge>(networkGraph.edges)
          .id((d) => d.id)
          .distance(90)
          .strength(0.4),
      )
      .force("charge", d3.forceManyBody().strength(-180))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => size(d.citationCount) + 6));

    // Edges (arrows)
    const link = g
      .append("g")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.3)
      .selectAll("line")
      .data(networkGraph.edges)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    // Arrow marker definition
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "currentColor")
      .attr("opacity", 0.5);

    // Nodes
    const node = g
      .append("g")
      .selectAll<SVGGElement, NetworkNode>("g")
      .data(networkGraph.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(drag(simulation) as any);

    node
      .append("circle")
      .attr("r", (d) => size(d.citationCount))
      .attr("fill", (d) => {
        const score = d.relevanceScore;
        if (score === undefined) return "#64748b"; // slate for non-seed nodes
        return color(score);
      })
      .attr("stroke", (d) => (d.isSeed ? "#10b981" : "transparent"))
      .attr("stroke-width", 2);

    // Labels (truncated to first 6 words)
    node
      .append("text")
      .text((d) => {
        const words = d.title.split(/\s+/).slice(0, 6).join(" ");
        return words + (d.title.split(/\s+/).length > 6 ? "…" : "");
      })
      .attr("x", (d) => size(d.citationCount) + 4)
      .attr("y", 4)
      .attr("font-size", "10px")
      .attr("fill", "currentColor")
      .attr("opacity", 0.8);

    // Highlight ring for selected node
    node
      .append("circle")
      .attr("class", "selection-ring")
      .attr("r", (d) => size(d.citationCount) + 6)
      .attr("fill", "none")
      .attr("stroke", "#fbbf24")
      .attr("stroke-width", 2)
      .attr("opacity", (d) => (selectedNetworkNodeId === d.id ? 1 : 0));

    // Click → select node
    node.on("click", (_event, d) => {
      setSelectedNetworkNodeId(d.id);
      // Re-render selection rings
      node.selectAll(".selection-ring").attr("opacity", (n: NetworkNode) =>
        n.id === d.id ? 1 : 0,
      );
    });

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NetworkNode).x)
        .attr("y1", (d) => (d.source as NetworkNode).y)
        .attr("x2", (d) => (d.target as NetworkNode).x)
        .attr("y2", (d) => (d.target as NetworkNode).y);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [networkGraph, selectedNetworkNodeId]);

  const selectedNode = useMemo(
    () => networkGraph?.nodes.find((n) => n.id === selectedNetworkNodeId) || null,
    [networkGraph, selectedNetworkNodeId],
  );

  if (papers.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <Card className="p-10 text-center">
          <NetworkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No papers to visualize yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Run a search first — then come back to see a force-directed graph of how the papers connect via citations.
          </p>
          <Button onClick={() => setView("home")} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
            <ArrowLeft className="h-4 w-4" />
            Go to search
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <NetworkIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Citation Network
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Force-directed graph of {networkGraph?.nodes.length || papers.length} papers and their citation links.
            Click a node to see details. Drag to rearrange. Scroll to zoom.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setNetworkGraph(null);
            void buildNetwork(papers);
          }}
          className="gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Rebuild
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Graph canvas */}
        <Card className="p-0 overflow-hidden">
          {isNetworkLoading && !networkGraph ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Building graph and fetching citation neighbors…</p>
              </div>
            </div>
          ) : (
            <svg ref={svgRef} className="w-full text-foreground" style={{ height: 600 }} />
          )}
          {/* Legend */}
          <div className="px-4 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground flex flex-wrap gap-4">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
              Seed paper
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-slate-500" />
              Neighbor (cited)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
              Low relevance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-500" />
              Medium
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
              High relevance
            </span>
            <span className="ml-auto">Node size ∝ citation count</span>
          </div>
        </Card>

        {/* Selected node panel */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 text-sm">Selected Node</h3>
          {!selectedNode ? (
            <p className="text-sm text-muted-foreground">
              Click any node to see its details here.
            </p>
          ) : (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm leading-snug">{selectedNode.title}</h4>
              </div>
              {selectedNode.authors.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {selectedNode.authors.slice(0, 3).join(", ")}
                  {selectedNode.authors.length > 3 ? ` +${selectedNode.authors.length - 3}` : ""}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {selectedNode.year && (
                  <Badge variant="outline">{selectedNode.year}</Badge>
                )}
                <Badge variant="outline">{selectedNode.citationCount.toLocaleString()} citations</Badge>
                {selectedNode.relevanceScore !== undefined && (
                  <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                    Score: {selectedNode.relevanceScore}
                  </Badge>
                )}
                {selectedNode.isSeed && (
                  <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                    Seed
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedNode.doi && (
                  <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <a href={`https://doi.org/${selectedNode.doi}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                      DOI
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => {
                    const paper = papers.find((p) => p.id === selectedNode.id);
                    if (paper) {
                      setSelectedPaper(paper);
                      setView("details");
                    } else {
                      toast.info("This is a neighbor paper — open the original to see full details.");
                    }
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                  View details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => {
                    toggleCompare(selectedNode.id);
                    toast.success(
                      compareIds.has(selectedNode.id) ? "Removed from compare" : "Added to compare",
                    );
                  }}
                >
                  <GitCompareArrows className="h-3 w-3" />
                  Compare
                </Button>
                {papers.find((p) => p.id === selectedNode.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={async () => {
                      const paper = papers.find((p) => p.id === selectedNode.id)!;
                      try {
                        await toggleSavePaper(paper);
                        toast.success("Paper saved to library");
                      } catch {
                        toast.error("Failed to save paper");
                      }
                    }}
                  >
                    {savedIds.has(selectedNode.id) ? (
                      <>
                        <BookmarkCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-3 w-3" />
                        Save
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// D3 drag behavior helper
function drag(simulation: d3.Simulation<NetworkNode, undefined>) {
  function dragstarted(event: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  function dragged(event: any) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  function dragended(event: any) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
}
