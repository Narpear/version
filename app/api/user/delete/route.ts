import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    // gym_log_sets has no user_id column — clear it via the parent gym_logs ids first
    const { data: gymLogs } = await supabase
      .from('gym_logs')
      .select('id')
      .eq('user_id', user_id);

    if (gymLogs && gymLogs.length > 0) {
      await supabase
        .from('gym_log_sets')
        .delete()
        .in('gym_log_id', gymLogs.map(log => log.id));
    }

    const userOwnedTables = [
      'gym_logs',
      'food_logs',
      'food_templates',
      'meal_templates',
      'steps_logs',
      'skincare_logs',
      'daily_entries',
      'workout_templates',
      'goals',
    ];

    for (const table of userOwnedTables) {
      const { error } = await supabase.from(table).delete().eq('user_id', user_id);
      if (error) throw error;
    }

    const { error: userError } = await supabase.from('users').delete().eq('id', user_id);
    if (userError) throw userError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
