import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/documents/route';
function fixture() {
 const objects=[
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>',
  stream('BT /F1 12 Tf 50 700 Td (Page one reports 120 molecules.) Tj ET'),
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>',
  stream('BT /F1 12 Tf 50 700 Td (Page two reports limitations.) Tj ET'),
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
 ];
 let pdf='%PDF-1.4\n';const offsets=[0];
 objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});
 const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
 pdf+=offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');
 pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 return Buffer.from(pdf);
}
function stream(text:string){return `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`;}
test('PDF upload retains page boundaries and a content hash',async()=>{
 const request=new NextRequest('http://localhost/api/documents',{method:'POST',headers:{'content-type':'application/pdf'},body:fixture()});
 const response=await POST(request);const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));assert.equal(data.pages.length,2);assert.match(data.hash,/^[a-f0-9]{64}$/);assert.match(data.pages[0].text,/120 molecules/);assert.match(data.pages[1].text,/limitations/);assert.equal(data.pages[1].page,2);
});
test('PDF endpoint rejects wrong signatures and oversized uploads before extraction',async()=>{
 const request=(body:string,headers:Record<string,string>={})=>new NextRequest('http://localhost/api/documents',{method:'POST',headers:{'content-type':'application/pdf',...headers},body});
 assert.equal((await POST(request('not a pdf'))).status,422);
 assert.equal((await POST(request('%PDF-',{'content-length':String(16*1024*1024)}))).status,413);
});
