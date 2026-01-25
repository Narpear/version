import { NextResponse } from 'next/server';

export async function POST() {
  // Since we're using localStorage for auth, 
  // logout happens on the client side
  // This route is just for consistency
  return NextResponse.json({ success: true });
}