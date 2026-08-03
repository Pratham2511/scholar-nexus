import type { AcademicPaper } from "../academic/types";

export type CitationFormat = "APA" | "MLA" | "BibTeX" | "Chicago";

export function exportCitation(paper: AcademicPaper, format: CitationFormat): string {
  switch (format) {
    case "APA":
      return apa(paper);
    case "MLA":
      return mla(paper);
    case "BibTeX":
      return bibtex(paper);
    case "Chicago":
      return chicago(paper);
  }
}

function authorsApa(paper: AcademicPaper): string {
  const authors = paper.authors;
  if (authors.length === 0) return "Anonymous";
  if (authors.length === 1) return formatApaAuthor(authors[0]);
  if (authors.length === 2) return `${formatApaAuthor(authors[0])} & ${formatApaAuthor(authors[1])}`;
  if (authors.length <= 20) {
    return authors.slice(0, -1).map(formatApaAuthor).join(", ") + ", & " + formatApaAuthor(authors[authors.length - 1]);
  }
  return authors.slice(0, 19).map(formatApaAuthor).join(", ") + " . . . " + formatApaAuthor(authors[authors.length - 1]);
}

function formatApaAuthor(name: string): string {
  const parts = name.split(",").map((s) => s.trim());
  if (parts.length === 2) {
    // Already "Last, First"
    const [last, first] = parts;
    const initials = first.split(/\s+/).map((n) => n[0] + ".").join(" ");
    return `${last}, ${initials}`;
  }
  const tokens = name.trim().split(/\s+/);
  if (tokens.length === 1) return tokens[0];
  const last = tokens[tokens.length - 1];
  const initials = tokens.slice(0, -1).map((n) => n[0] + ".").join(" ");
  return `${last}, ${initials}`;
}

function apa(p: AcademicPaper): string {
  const year = p.year ?? "n.d.";
  const title = p.title.endsWith(".") ? p.title : p.title + ".";
  const venue = p.venue || p.publisher || "";
  const doi = p.doi ? ` https://doi.org/${p.doi}` : "";
  return `${authorsApa(p)} (${year}). ${title} ${venue ? venue + "." : ""}${doi}`.trim();
}

function mla(p: AcademicPaper): string {
  const year = p.year ?? "n.d.";
  const authors = p.authors.length === 0
    ? "Anonymous"
    : p.authors.length === 1
      ? mlaAuthor(p.authors[0])
      : `${mlaAuthor(p.authors[0])}, et al.`;
  const venue = p.venue || p.publisher || "";
  const doi = p.doi ? ` doi: ${p.doi}.` : ".";
  return `${authors}. "${p.title}." ${venue ? venue + ", " : ""}${year}${doi}`;
}

function mlaAuthor(name: string): string {
  const tokens = name.trim().split(/\s+/);
  if (tokens.length === 1) return tokens[0];
  return `${tokens[tokens.length - 1]}, ${tokens.slice(0, -1).join(" ")}`;
}

function bibtex(p: AcademicPaper): string {
  const key = makeBibKey(p);
  const authors = p.authors.length ? p.authors.join(" and ") : "Anonymous";
  const year = p.year ?? "";
  const venue = p.venue || p.publisher || "";
  const lines = [
    `@article{${key},`,
    `  title = {${p.title}},`,
    `  author = {${authors}},`,
  ];
  if (year) lines.push(`  year = {${year}},`);
  if (venue) lines.push(`  journal = {${venue}},`);
  if (p.doi) lines.push(`  doi = {${p.doi}},`);
  if (p.pdfLink) lines.push(`  url = {${p.pdfLink}},`);
  lines.push("}");
  return lines.join("\n");
}

function chicago(p: AcademicPaper): string {
  const year = p.year ?? "n.d.";
  const authors = p.authors.length === 0
    ? "Anonymous"
    : p.authors.length === 1
      ? chicagoAuthor(p.authors[0])
      : `${chicagoAuthor(p.authors[0])} et al.`;
  const venue = p.venue || p.publisher || "";
  const doi = p.doi ? ` https://doi.org/${p.doi}.` : ".";
  return `${authors}. "${p.title}." ${venue ? venue + ", " : ""}${year}${doi}`;
}

function chicagoAuthor(name: string): string {
  const tokens = name.trim().split(/\s+/);
  if (tokens.length === 1) return tokens[0];
  return `${tokens[tokens.length - 1]}, ${tokens.slice(0, -1).join(" ")}`;
}

function makeBibKey(p: AcademicPaper): string {
  const firstAuthor = p.authors[0] || "Anon";
  const last = firstAuthor.split(/\s+/).slice(-1)[0].toLowerCase().replace(/[^a-z]/g, "");
  const year = p.year || "nd";
  const titleWord = p.title.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") || "untitled";
  return `${last}${year}${titleWord}`;
}
