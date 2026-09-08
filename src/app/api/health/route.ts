import { NextResponse } from 'next/server';
export async function GET(){return NextResponse.json({status:'ok',mode:'single-user-local',aiEnabled:process.env.AI_ENABLED==='true'});}
