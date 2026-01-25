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

export function calculateGoalCalories(startWeight: number, goalWeight: number, goalType: 'loss' | 'gain' | 'maintenance'): number {
  if (goalType === 'maintenance') return 0;
  const weightDifference = Math.abs(startWeight - goalWeight);
  return Math.round(weightDifference * 7700);
}

export function calculateActualDeficit(startWeight: number, currentWeight: number): number {
  const weightLoss = startWeight - currentWeight;
  return Math.round(weightLoss * 7700);
}

export function calculateProgress(actualDeficit: number, goalDeficit: number): number {
  if (goalDeficit === 0) return 0;
  return actualDeficit / goalDeficit;
}

export function getDeficitColor(deficit: number): string {
  if (deficit >= 500) return '#C6EFCE';
  if (deficit >= 300) return '#E2F0D9';
  if (deficit >= 100) return '#FFF2CC';
  if (deficit >= 0) return '#FCE4D6';
  if (deficit >= -100) return '#FDE9D9';
  if (deficit >= -300) return '#FADBD8';
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