import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitedResponse } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { max: 120, windowMs: 60_000 };

/** Curated list of trending research topics, grouped by domain. */
const TRENDING = [
  { topic: "Large Language Models for Scientific Discovery", domain: "Artificial Intelligence" },
  { topic: "Federated Learning Privacy Preservation", domain: "Machine Learning" },
  { topic: "CRISPR Gene Editing in Cancer Therapy", domain: "Biotechnology" },
  { topic: "Quantum Computing Error Correction", domain: "Quantum Physics" },
  { topic: "Graph Neural Networks for Drug Discovery", domain: "Bioinformatics" },
  { topic: "Climate Change Carbon Capture Materials", domain: "Environmental Science" },
  { topic: "Autonomous Vehicle Perception Systems", domain: "Robotics" },
  { topic: "Blockchain in Healthcare Data Security", domain: "Distributed Systems" },
  { topic: "Diffusion Models for Image Generation", domain: "Computer Vision" },
  { topic: "Topological Insulators and Quantum Materials", domain: "Condensed Matter" },
  { topic: "mRNA Vaccine Development Platforms", domain: "Immunology" },
  { topic: "Reinforcement Learning for Robotics", domain: "AI" },
];

/**
 * GET /api/trending — returns curated trending research topics.
 */
export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);
  return NextResponse.json({ topics: TRENDING });
}
