import { NextResponse } from 'next/server';

export function middleware(req) {
  // Modify the CORS settings as needed for your particular use case
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  return NextResponse.next({ headers });
}
