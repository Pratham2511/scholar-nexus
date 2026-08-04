// Test pdf-parse v2 directly to see if it works in this environment
const { PDFParse } = require('pdf-parse');

async function test() {
  console.log('1. Fetching arxiv PDF...');
  const res = await fetch('https://arxiv.org/pdf/1706.03762', { redirect: 'follow' });
  console.log('   HTTP', res.status);
  if (!res.ok) { console.log('   FETCH FAILED'); process.exit(1); }
  const buf = Buffer.from(await res.arrayBuffer());
  console.log('   Got', buf.length, 'bytes');

  console.log('2. Creating PDFParse instance...');
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  console.log('   Created');

  console.log('3. Calling getText()...');
  try {
    const result = await parser.getText();
    console.log('   SUCCESS! text length:', (result.text || '').length);
    console.log('   First 200 chars:', (result.text || '').slice(0, 200));
  } catch (e) {
    console.log('   FAILED:', e.message);
    console.log('   Stack:', e.stack);
  }
}

test().catch(e => { console.error('FATAL:', e); process.exit(1); });
