export async function aiCompletion(body: { messages: { role: string; content: string }[]; temperature?: number; [key:string]: unknown }) {
  if (process.env.AI_ENABLED !== 'true' || !process.env.AI_BASE_URL || !process.env.AI_MODEL) throw new Error('Optional AI is not configured. Reading and manual evidence capture are available.');
  const endpoint = new URL(process.env.AI_BASE_URL.replace(/\/$/,'')+'/chat/completions');
  if (!['http:','https:'].includes(endpoint.protocol)) throw new Error('Invalid AI endpoint');
  const response = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(process.env.AI_API_KEY?{Authorization:`Bearer ${process.env.AI_API_KEY}`}:{})},body:JSON.stringify({...body,model:process.env.AI_MODEL}),signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error(`Optional AI returned HTTP ${response.status}`);
  return response.json();
}
