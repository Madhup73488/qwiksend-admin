import { NextResponse } from 'next/server';

export async function GET() {
    console.log('[PING] Received GET request');
    return NextResponse.json({ status: 'ok', time: new Date().toISOString() });
}

export async function POST(req) {
    console.log('[PING] Received POST request');
    const body = await req.json().catch(() => ({}));
    console.log('[PING] Body:', body);
    return NextResponse.json({ status: 'ok', received: body });
}
