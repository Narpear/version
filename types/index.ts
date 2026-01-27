export interface User {
  id: string;
  name: string;
  email: string;
  height_cm: number;
  age: number;
  gender: 'male' | 'female';
  created_at?: string;
  updated_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  goal_type: 'loss' | 'gain' | 'maintenance';
  start_date: string;
  start_weight_kg: number;
  current_weight_kg: number | null;
  goal_weight_kg: number;
  total_energy_kcal_needed: number | null;
  daily_target_kcal: number;
  cumulative_apparent_deficit?: number;  // NEW
  cumulative_actual_deficit?: number;    // NEW
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DailyEntry {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number | null;
  bmr: number | null;
  total_calories_in: number;
  total_calories_out: number;
  net_intake: number | null;
  caloric_deficit?: number | null;       // DEPRECATED - keep for backwards compatibility
  apparent_deficit?: number | null;      // NEW - from food/gym
  actual_deficit?: number | null;        // NEW - from weight change
  water_glasses: number;
  created_at?: string;
  updated_at?: string;
}

export interface GymLog {
  id: string;
  user_id: string;
  date: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  calories_burned: number;
  warmup_done: boolean;
  cooldown_done: boolean;
  meditation_done: boolean;
  notes: string | null;
}

export interface FoodLog {
  id: string;
  user_id: string;
  date: string;
  meal_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  is_healthy: boolean;
  meal_type: 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'snack' | null;
}

export interface SkincareLog {
  id: string;
  user_id: string;
  date: string;
  time_of_day: 'pre_gym' | 'post_shower' | 'bedtime';
  cleansing_done: boolean;
  serum_done: boolean;
  moisturizer_done: boolean;
  gua_sha_done: boolean;
}

export interface FoodTemplate {
  id: string;
  user_id: string;
  template_name: string;
  meal_type: 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'snack' | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  is_healthy: boolean;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  template_name: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  calories_burned: number;
  notes: string | null;
}