const origin = process.env.LOCAL_APP_URL || "http://127.0.0.1:3000";
const url = new URL(origin);
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
  throw new Error("Alert worker requires a loopback app URL.");
console.log("ScholarNexus local alert worker running. Stop with Ctrl+C.");
let stopped = false;
let timer;
process.on("SIGINT", () => {
  stopped = true;
  clearTimeout(timer);
});
process.on("SIGTERM", () => {
  stopped = true;
  clearTimeout(timer);
});
async function tick() {
  try {
    const response = await fetch(origin + "/api/alerts/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(16000),
    });
    const data = await response.json();
    if (!response.ok) console.error(new Date().toISOString(), data.error);
    else if (data.checked)
      console.log(new Date().toISOString(), "Checked a living search.");
  } catch (error) {
    console.error("Local app unavailable:", error.message);
  }
  if (!stopped) timer = setTimeout(tick, 60000);
}
void tick();
