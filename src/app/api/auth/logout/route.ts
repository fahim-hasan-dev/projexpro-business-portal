import { NextResponse } from 'next/server';

export function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('projexpro_token', '', {
    expires: new Date(0),
    path: '/',
  });
  response.cookies.set('cat-admin-token', '', {
    expires: new Date(0),
    path: '/',
  });
  return response;
}

