// Mifflin-St Jeor formula for BMR
export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: string = 'female'): number {
  if (gender === 'female') {
    return Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161);
  } else {
    return Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5);
  }
}

export function calculateNetIntake(caloriesIn: number, caloriesOut: number): number {
  return caloriesIn - caloriesOut;
}

export function calculateDeficit(bmr: number, netIntake: number): number {
  return bmr - netIntake;
}

export function calculateGoalEnergyNeeded(startWeight: number, goalWeight: number, goalType: 'loss' | 'gain' | 'maintenance'): number | null {
  if (goalType === 'maintenance') return null;
  const weightDifference = Math.abs(startWeight - goalWeight);
  return Math.round(weightDifference * 7700);
}

export function calculateDailyTargetKcal(goalType: 'loss' | 'gain' | 'maintenance'): number {
  if (goalType === 'loss') return -300;
  if (goalType === 'gain') return 300;
  return 0; // maintenance
}

export function calculateEnergyChange(startWeight: number, currentWeight: number): number {
  const weightDelta = currentWeight - startWeight;
  return Math.round(weightDelta * 7700);
}

export function calculateProgress(
  energyChange: number, 
  totalEnergyNeeded: number | null, 
  goalType: 'loss' | 'gain' | 'maintenance'
): number {
  if (!totalEnergyNeeded || totalEnergyNeeded === 0) return 0;
  
  if (goalType === 'loss') {
    // For loss: energyChange is negative (weight loss), we want it to approach -totalEnergyNeeded
    // Progress = abs(energyChange) / totalEnergyNeeded
    return Math.min(Math.abs(energyChange) / totalEnergyNeeded, 1);
  } else if (goalType === 'gain') {
    // For gain: energyChange is positive (weight gain), we want it to approach totalEnergyNeeded
    // Progress = energyChange / totalEnergyNeeded
    return Math.min(energyChange / totalEnergyNeeded, 1);
  }
  
  // Maintenance: progress based on adherence (handled separately)
  return 0;
}

// Legacy function names for backward compatibility
export function calculateGoalCalories(startWeight: number, goalWeight: number, goalType: 'loss' | 'gain' | 'maintenance'): number | null {
  return calculateGoalEnergyNeeded(startWeight, goalWeight, goalType);
}

export function calculateActualDeficit(startWeight: number, currentWeight: number): number {
  return calculateEnergyChange(startWeight, currentWeight);
}

export function getDeficitColor(balance: number, goalType?: 'loss' | 'gain' | 'maintenance'): string {
  // For loss: positive balance (deficit) is good
  if (goalType === 'loss') {
    if (balance >= 500) return '#C6EFCE';  // Excellent deficit
    if (balance >= 300) return '#E2F0D9';  // Great deficit
    if (balance >= 100) return '#FFF2CC';  // Good deficit
    if (balance >= 0) return '#FCE4D6';    // Low deficit
    return '#FADBD8';  // Surplus (not good for loss)
  }
  
  // For gain: negative balance (surplus) is good
  if (goalType === 'gain') {
    if (balance <= -500) return '#C6EFCE';  // Excellent surplus
    if (balance <= -300) return '#E2F0D9';  // Great surplus
    if (balance <= -100) return '#FFF2CC';  // Good surplus
    if (balance <= 0) return '#FCE4D6';     // Low surplus
    return '#FADBD8';  // Deficit (not good for gain)
  }
  
  // For maintenance: near zero is good
  if (goalType === 'maintenance') {
    if (Math.abs(balance) <= 100) return '#C6EFCE';  // Excellent balance
    if (Math.abs(balance) <= 200) return '#E2F0D9';  // Good balance
    if (Math.abs(balance) <= 300) return '#FFF2CC';  // Acceptable
    return '#FCE4D6';  // Too far from balance
  }
  
  // Default (no goal): original logic
  if (balance >= 500) return '#C6EFCE';
  if (balance >= 300) return '#E2F0D9';
  if (balance >= 100) return '#FFF2CC';
  if (balance >= 0) return '#FCE4D6';
  if (balance >= -100) return '#FDE9D9';
  if (balance >= -300) return '#FADBD8';
  return '#F4CCCC';
}

export function getProgressColor(progress: number): string {
  if (progress >= 1) return '#A8E6A3';
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