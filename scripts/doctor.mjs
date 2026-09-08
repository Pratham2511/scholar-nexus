import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
let failed = false;
console.log("Node", process.version, "(supported: Node 22 or 24)");
if (![22, 24].includes(Number(process.versions.node.split(".")[0]))) {
  console.error("Use Node 22 or 24.");
  failed = true;
}
try {
  await db.researchWorkspace.count();
  console.log("Database and migrations: ready");
} catch (e) {
  console.error(
    "Database not ready: start PostgreSQL and run npm run db:deploy.",
  );
  failed = true;
} finally {
  await db.$disconnect();
}
console.log(
  "Optional AI:",
  process.env.AI_ENABLED === "true"
    ? "enabled; verify AI_BASE_URL and AI_MODEL"
    : "disabled",
);
for (const key of [
  "OPENALEX_API_KEY",
  "SEMANTIC_SCHOLAR_API_KEY",
  "IEEE_API_KEY",
  "CORE_API_KEY",
])
  console.log(
    key,
    process.env[key] ? "configured" : "not configured (optional)",
  );
for (const [name, url] of [
  ["Crossref", "https://api.crossref.org/works?rows=1&query=graph"],
  [
    "Europe PMC",
    "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=graph&format=json&pageSize=1",
  ],
]) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    console.log(name, "HTTP", response.status);
    if (!response.ok) failed = true;
  } catch (e) {
    console.error(name, "unreachable:", e.message);
    failed = true;
  }
}
process.exitCode = failed ? 1 : 0;
