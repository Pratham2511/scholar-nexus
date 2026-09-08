import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(){try{await db.researchWorkspace.count();return NextResponse.json({status:'ready',database:'available'});}catch{return NextResponse.json({status:'not-ready',error:'Start PostgreSQL and run npm run db:deploy.'},{status:503});}}
