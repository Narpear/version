import { supabase } from '@/lib/supabase';
import { calculateActualDeficit } from '@/lib/calculations';

/**
 * Recalculates cumulative deficits for the active goal
 * Call this whenever food, gym, or weight data changes on ANY day
 */
export async function recalculateGoalCumulatives(userId: string): Promise<void> {
  try {
    // Get active goal
    const { data: goal } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
      
    if (!goal) return;
    
    // Sum all apparent deficits since goal start
    const { data: allEntries } = await supabase
      .from('daily_entries')
      .select('apparent_deficit, weight_kg, date')
      .eq('user_id', userId)
      .gte('date', goal.start_date)
      .not('apparent_deficit', 'is', null)
      .order('date', { ascending: false });
      
    if (!allEntries) return;
    
    const cumulativeApparent = allEntries.reduce((sum, e) => sum + (e.apparent_deficit || 0), 0);
    
    // Get most recent weight entry
    const latestWeight = allEntries.find(e => e.weight_kg)?.weight_kg || goal.start_weight_kg;
    
    // Calculate actual deficit from weight change (start weight vs latest weight)
    const cumulativeActual = calculateActualDeficit(
      goal.start_weight_kg,
      parseFloat(latestWeight),
      goal.goal_type
    );
    
    // Update goal with cumulative values
    await supabase
      .from('goals')
      .update({
        cumulative_apparent_deficit: cumulativeApparent,
        cumulative_actual_deficit: cumulativeActual,
        current_weight_kg: latestWeight
      })
      .eq('id', goal.id);
      
  } catch (error) {
    console.error('Error recalculating goal cumulatives:', error);
  }
}