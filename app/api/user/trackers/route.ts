import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const REQUIRED_TRACKERS = ['food', 'gym', 'progress'];

export async function PATCH(request: NextRequest) {
  try {
    const { user_id, selected_trackers } = await request.json();

    if (!user_id || !Array.isArray(selected_trackers)) {
      return NextResponse.json(
        { error: 'user_id and selected_trackers array required' },
        { status: 400 }
      );
    }

    // Always enforce the three non-removable trackers
    const merged = Array.from(new Set([...REQUIRED_TRACKERS, ...selected_trackers]));

    const { error } = await supabase
      .from('users')
      .update({ selected_trackers: merged })
      .eq('id', user_id);

    if (error) throw error;

    return NextResponse.json({ selected_trackers: merged });
  } catch (error) {
    console.error('Error updating trackers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
