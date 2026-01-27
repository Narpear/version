// Constants
export const KCAL_PER_KG = 7700; // Energy equivalent of 1kg body weight

// Calculate energy change from weight difference (same as calculateActualDeficit)
export function calculateEnergyChange(
  startWeightKg: number,
  currentWeightKg: number
): number {
  const weightChange = startWeightKg - currentWeightKg;
  return Math.round(weightChange * KCAL_PER_KG);
}

// BMR Calculation using Mifflin-St Jeor equation
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female'
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === 'male' ? base + 5 : base - 161;
  return Math.round(bmr);
}

// Net Intake = Calories In - Calories Out (from exercise)
export function calculateNetIntake(caloriesIn: number, caloriesOut: number): number {
  return caloriesIn - caloriesOut;
}

// Apparent Deficit = BMR - Net Intake (what the food/gym data suggests)
export function calculateApparentDeficit(bmr: number, netIntake: number): number {
  return bmr - netIntake;
}

// Actual Deficit = Weight change converted to calories (what actually happened)
export function calculateActualDeficit(
  startWeightKg: number,
  currentWeightKg: number,
  goalType: 'loss' | 'gain' | 'maintenance'
): number {
  const weightChange = startWeightKg - currentWeightKg; // Positive = weight lost
  const actualDeficit = Math.round(weightChange * KCAL_PER_KG);
  
  // For weight gain goals, this will be negative (which represents a surplus)
  // For weight loss goals, this will be positive (which represents a deficit)
  return actualDeficit;
}

// Calculate total energy needed to reach goal
export function calculateGoalEnergyNeeded(
  startWeightKg: number,
  goalWeightKg: number,
  goalType: 'loss' | 'gain' | 'maintenance'
): number {
  const weightDiff = Math.abs(startWeightKg - goalWeightKg);
  
  if (goalType === 'maintenance') {
    return 0; // No specific energy target for maintenance
  }
  
  return Math.round(weightDiff * KCAL_PER_KG);
}

// Calculate daily target based on goal type
export function calculateDailyTargetKcal(goalType: 'loss' | 'gain' | 'maintenance'): number {
  if (goalType === 'loss') return 300; // 500 cal deficit per day
  if (goalType === 'gain') return 300; // 500 cal surplus per day
  return 0; // Maintenance = balance
}

// Calculate progress toward goal (0 to 1)
export function calculateProgress(
  actualDeficit: number,
  goalEnergyNeeded: number,
  goalType: 'loss' | 'gain' | 'maintenance'
): number {
  if (goalEnergyNeeded === 0 || goalType === 'maintenance') return 0;
  
  // For loss: positive actualDeficit / positive goal = progress
  // For gain: negative actualDeficit (surplus) / positive goal = progress
  // So we need to use absolute value of actualDeficit for gain goals
  
  if (goalType === 'loss') {
    return Math.max(0, actualDeficit / goalEnergyNeeded);
  } else if (goalType === 'gain') {
    // actualDeficit will be negative for weight gain (surplus)
    // Convert to positive surplus for progress calculation
    const actualSurplus = Math.abs(actualDeficit);
    return Math.max(0, actualSurplus / goalEnergyNeeded);
  }
  
  return 0;
}

// Get color for apparent deficit/surplus based on goal type
export function getApparentDeficitColor(
  apparentDeficit: number,
  goalType?: 'loss' | 'gain' | 'maintenance'
): string {
  if (!goalType || goalType === 'loss') {
    // Weight loss: want high deficit (green)
    if (apparentDeficit >= 500) return '#C6EFCE'; // Light green
    if (apparentDeficit >= 300) return '#E2F0D9'; // Lighter green
    if (apparentDeficit >= 100) return '#FFF2CC'; // Light yellow
    if (apparentDeficit >= 0) return '#FCE4D6';   // Light orange
    if (apparentDeficit >= -100) return '#FDE9D9'; // Peach
    if (apparentDeficit >= -300) return '#FADBD8'; // Light pink
    return '#F4CCCC'; // Pink
  } else if (goalType === 'gain') {
    // Weight gain: want surplus (negative deficit = green)
    if (apparentDeficit <= -500) return '#C6EFCE'; // Light green (high surplus)
    if (apparentDeficit <= -300) return '#E2F0D9'; // Lighter green
    if (apparentDeficit <= -100) return '#FFF2CC'; // Light yellow
    if (apparentDeficit <= 0) return '#FCE4D6';    // Light orange
    if (apparentDeficit <= 100) return '#FDE9D9';  // Peach
    if (apparentDeficit <= 300) return '#FADBD8';  // Light pink
    return '#F4CCCC'; // Pink (deficit when wanting gain)
  } else {
    // Maintenance: want balance (close to 0)
    const abs = Math.abs(apparentDeficit);
    if (abs <= 100) return '#C6EFCE';  // Perfect balance
    if (abs <= 200) return '#E2F0D9';  // Good
    if (abs <= 300) return '#FFF2CC';  // Okay
    return '#FCE4D6'; // Off balance
  }
}

// Get color for progress bar
export function getProgressColor(progress: number): string {
  if (progress >= 1) return '#A8E6A3';      // Complete
  if (progress >= 0.95) return '#B5E9B0';
  if (progress >= 0.9) return '#C2ECBD';
  if (progress >= 0.85) return '#CFEFC9';
  if (progress >= 0.8) return '#DCF2D6';
  if (progress >= 0.75) return '#E9F5E3';
  if (progress >= 0.7) return '#F0F8E8';
  if (progress >= 0.65) return '#F7FBEE';
  if (progress >= 0.6) return '#FFFEF3';
  if (progress >= 0.55) return '#FFFCEB';
  if (progress >= 0.5) return '#FFF9E3';
  if (progress >= 0.45) return '#FFF6DB';
  if (progress >= 0.4) return '#FFF3D3';
  if (progress >= 0.35) return '#FFF0CB';
  if (progress >= 0.3) return '#FFEDC3';
  if (progress >= 0.25) return '#FFEABB';
  if (progress >= 0.2) return '#FFE7B3';
  if (progress >= 0.15) return '#FFE0A8';
  if (progress >= 0.1) return '#FFD99D';
  if (progress >= 0.05) return '#FFD292';
  return '#FFCB87';
}

// Legacy alias
export const getDeficitColor = getApparentDeficitColor;

// Format deficit/surplus for display
export function formatDeficitSurplus(
  value: number,
  goalType: 'loss' | 'gain' | 'maintenance'
): string {
  if (goalType === 'loss') {
    // For loss, positive = deficit (good), negative = surplus (bad)
    return value >= 0 ? `${value} cal deficit` : `${Math.abs(value)} cal surplus`;
  } else if (goalType === 'gain') {
    // For gain, negative = surplus (good), positive = deficit (bad)
    return value <= 0 ? `${Math.abs(value)} cal surplus` : `${value} cal deficit`;
  } else {
    // For maintenance, show balance
    if (Math.abs(value) <= 50) return 'Balanced';
    return value > 0 ? `${value} cal deficit` : `${Math.abs(value)} cal surplus`;
  }
}

// Get message for apparent deficit quality
export function getApparentDeficitMessage(
  apparentDeficit: number,
  goalType: 'loss' | 'gain' | 'maintenance'
): string {
  if (goalType === 'loss') {
    if (apparentDeficit >= 500) return 'Excellent Deficit';
    if (apparentDeficit >= 300) return 'Great Deficit';
    if (apparentDeficit >= 100) return 'Good Deficit';
    if (apparentDeficit >= 0) return 'Low Deficit';
    return 'In Surplus';
  } else if (goalType === 'gain') {
    if (apparentDeficit <= -500) return 'Excellent Surplus';
    if (apparentDeficit <= -300) return 'Great Surplus';
    if (apparentDeficit <= -100) return 'Good Surplus';
    if (apparentDeficit <= 0) return 'Low Surplus';
    return 'In Deficit';
  } else {
    const abs = Math.abs(apparentDeficit);
    if (abs <= 100) return 'Perfect Balance';
    if (abs <= 200) return 'Great Balance';
    if (abs <= 300) return 'Good Balance';
    return 'Off Balance';
  }
}