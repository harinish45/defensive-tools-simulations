import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://cve.circl.lu/api/last', {
      next: { revalidate: 0 },
      headers: { 'User-Agent': 'DefensiveTools/1.0' }
    });
    
    if (!res.ok) {
      throw new Error(`CIRCL API returned ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('CVE API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live CVE data', details: error.message },
      { status: 500 }
    );
  }
}