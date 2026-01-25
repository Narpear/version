import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Signup request:', body);

    const { email, password, name, height_cm, age } = body;

    if (!email || !password || !height_cm || !age) {
      console.log('Missing fields');
      return NextResponse.json(
        { error: 'All fields required' },
        { status: 400 }
      );
    }

    console.log('Creating user...');
    const user = await createUser(email, password, name, height_cm, age);
    console.log('User created:', user);

    if (!user) {
      console.log('User creation returned null');
      return NextResponse.json(
        { error: 'User creation failed - email might already exist' },
        { status: 400 }
      );
    }

    // Don't send password hash to client
    const { password_hash, ...userWithoutPassword } = user as any;

    return NextResponse.json({ 
      success: true, 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}