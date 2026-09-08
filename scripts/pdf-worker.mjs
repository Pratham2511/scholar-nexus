import { parentPort, workerData } from "node:worker_threads";
import { extractText, getDocumentProxy } from "unpdf";
try {
  const pdf = await getDocumentProxy(new Uint8Array(workerData));
  const result = await extractText(pdf, { mergePages: false });
  if (result.totalPages > 500) throw new Error("PDF exceeds 500 pages.");
  const pages = result.text.map((text, i) => ({ page: i + 1, text }));
  if (pages.reduce((n, p) => n + p.text.length, 0) > 3000000)
    throw new Error("Extracted PDF text exceeds 3 million characters.");
  parentPort.postMessage({ pages });
} catch (e) {
  parentPort.postMessage({ error: e.message });
}
