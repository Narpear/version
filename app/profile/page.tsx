'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { User, Goal } from '@/types';
import { calculateGoalEnergyNeeded, calculateDailyTargetKcal, calculateEnergyChange, calculateProgress, getProgressColor } from '@/lib/calculations';
import { useToast } from '@/components/ui/ToastProvider';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);

  // Form state
  const [goalType, setGoalType] = useState<'loss' | 'gain' | 'maintenance'>('loss');
  const [startWeight, setStartWeight] = useState(0);
  const [goalWeight, setGoalWeight] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadGoal(parsedUser.id);
    loadCurrentWeight(parsedUser.id);
  }, [router]);

  const loadGoal = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (data) {
        setActiveGoal(data);
        setGoalType(data.goal_type);
        setStartWeight(data.start_weight_kg);
        setGoalWeight(data.goal_weight_kg);
        setStartDate(data.start_date);
      }
    } catch (error) {
      console.log('No active goal found');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentWeight = async (userId: string) => {
    try {
      // Get the most recent weight entry
      const { data, error } = await supabase
        .from('daily_entries')
        .select('weight_kg')
        .eq('user_id', userId)
        .not('weight_kg', 'is', null)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (data && data.weight_kg) {
        setCurrentWeight(data.weight_kg);
      }
    } catch (error) {
      console.log('No weight entries found');
    }
  };

  const handleSaveGoal = async () => {
    if (!user) return;
    
    // Validate weights based on goal type
    if (goalType === 'loss' && goalWeight >= startWeight) {
      alert('For weight loss, goal weight must be less than start weight');
      return;
    }
    if (goalType === 'gain' && goalWeight <= startWeight) {
      alert('For weight gain, goal weight must be greater than start weight');
      return;
    }
    if (goalType === 'maintenance' && Math.abs(startWeight - goalWeight) > 2) {
      alert('For maintenance, goal weight should be close to start weight (±2kg)');
      return;
    }
    
    setSaving(true);

    try {
      // Calculate total energy needed and daily target
      const totalEnergyNeeded = calculateGoalEnergyNeeded(startWeight, goalWeight, goalType);
      const dailyTarget = calculateDailyTargetKcal(goalType);

      // Deactivate old goals
      if (activeGoal) {
        await supabase
          .from('goals')
          .update({ is_active: false })
          .eq('id', activeGoal.id);
      }

      // Create new goal
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          goal_type: goalType,
          start_date: startDate,
          start_weight_kg: startWeight,
          goal_weight_kg: goalWeight,
          daily_target_kcal: dailyTarget,
          total_energy_kcal_needed: totalEnergyNeeded,
          current_weight_kg: startWeight,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setActiveGoal(data);
      toast('Saved!');
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="container-pixel">
        <p className="font-mono text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const weightDiff = Math.abs(startWeight - goalWeight);
  const totalEnergyNeeded = calculateGoalEnergyNeeded(startWeight, goalWeight, goalType);
  const dailyTarget = calculateDailyTargetKcal(goalType);

  // Calculate progress
  const energyChange = currentWeight && activeGoal 
    ? calculateEnergyChange(activeGoal.start_weight_kg, currentWeight)
    : 0;
  
  const progress = activeGoal && activeGoal.total_energy_kcal_needed
    ? calculateProgress(energyChange, activeGoal.total_energy_kcal_needed, activeGoal.goal_type)
    : 0;

  const progressPercent = Math.min(progress * 100, 100);
  const progressColor = getProgressColor(progress);

  const bmi =
    user?.height_cm && (currentWeight || activeGoal?.start_weight_kg)
      ? (Number(currentWeight || activeGoal?.start_weight_kg) / Math.pow(Number(user.height_cm) / 100, 2))
      : null;

  const bmiLabel = (value: number) => {
    if (value < 18.5) return 'Underweight';
    if (value < 25) return 'Normal';
    if (value < 30) return 'Overweight';
    return 'Obese';
  };

  return (
    <div className="container-pixel">
      <h1 className="heading-pixel">Profile & Goals</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info Card */}
        <Card title="Personal Info">
          <div className="space-y-3">
            <div>
              <p className="text-pixel-sm text-darkgray/70">Name</p>
              <p className="font-mono text-lg">{user.name}</p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70">Email</p>
              <p className="font-mono text-lg">{user.email}</p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70">Height</p>
              <p className="font-mono text-lg">{user.height_cm} cm</p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70">Age</p>
              <p className="font-mono text-lg">{user.age} years</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="secondary" className="w-full mt-6">
            Logout
          </Button>
          <p className="text-center font-mono text-xs mt-4 text-darkgray/50">
            View the {' '}
            <a href="/privacy" className="text-primary underline">
              Privacy Policy
            </a>
          </p>
          <br></br>
        </Card>

        {/* Goal Settings Card */}
        <Card title="Goal Settings">
          <div className="space-y-4">
            {/* Goal Type */}
            <div>
              <label className="block text-pixel-sm mb-2">Goal Type</label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as 'loss' | 'gain' | 'maintenance')}
                className="input-pixel w-full"
              >
                <option value="loss">Weight Loss</option>
                <option value="gain">Weight Gain</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            {/* Start Date */}
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            {/* Start Weight */}
            <Input
              type="number"
              label="Start Weight (kg)"
              value={startWeight}
              onChange={(e) => setStartWeight(parseFloat(e.target.value))}
              step={0.1}
              required
            />

            {/* Goal Weight */}
            <Input
              type="number"
              label="Goal Weight (kg)"
              value={goalWeight}
              onChange={(e) => setGoalWeight(parseFloat(e.target.value))}
              placeholder={goalType === 'loss' ? '55' : goalType === 'gain' ? '65' : '60'}
              step={0.1}
              required
            />

            {/* Calculated Info */}
            {startWeight > 0 && goalWeight > 0 && (
              <div className="p-4 bg-accent/30 border-2 border-darkgray mt-4">
                <p className="text-pixel-sm mb-2">Goal Summary:</p>
                <p className="font-mono text-sm">
                  {goalType === 'loss' ? 'Lose' : goalType === 'gain' ? 'Gain' : 'Maintain'}{' '}
                  {weightDiff.toFixed(1)} kg
                </p>
                {totalEnergyNeeded !== null && (
                  <p className="font-mono text-sm">
                    {goalType === 'loss' ? 'Total Deficit Needed' : 'Total Surplus Needed'}: {totalEnergyNeeded.toLocaleString()} calories
                  </p>
                )}
                <p className="font-mono text-sm">
                  Daily Target: {dailyTarget > 0 ? '+' : ''}{dailyTarget} kcal
                </p>
                {bmi !== null && (
                  <p className="font-mono text-sm mt-2">
                    BMI: {bmi.toFixed(1)} ({bmiLabel(bmi)})
                  </p>
                )}
              </div>
            )}

            <Button onClick={handleSaveGoal} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Goal'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Current Goal Display with Progress */}
      {activeGoal && (
        <Card title="Current Active Goal" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-pixel-sm text-darkgray/70">Type</p>
              <p className="font-mono text-lg capitalize">{activeGoal.goal_type}</p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70">Start Weight</p>
              <p className="font-mono text-lg">{activeGoal.start_weight_kg} kg</p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70">Current Weight</p>
              <p className="font-mono text-lg">
                {currentWeight ? `${currentWeight} kg` : 'Not tracked yet'}
              </p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70">Goal Weight</p>
              <p className="font-mono text-lg">{activeGoal.goal_weight_kg} kg</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-pixel-sm text-darkgray/70">
                {activeGoal.goal_type === 'maintenance'
                  ? 'Daily Target'
                  : activeGoal.goal_type === 'loss'
                    ? 'Total Deficit Needed'
                    : 'Total Surplus Needed'}
              </p>
              <p className="font-mono text-lg">
                {activeGoal.goal_type === 'maintenance' 
                  ? `${activeGoal.daily_target_kcal > 0 ? '+' : ''}${activeGoal.daily_target_kcal} kcal/day`
                  : `${activeGoal.total_energy_kcal_needed?.toLocaleString() || 0} cal`
                }
              </p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70">
                {activeGoal.goal_type === 'loss' ? 'Cumulative Deficit' : 
                 activeGoal.goal_type === 'gain' ? 'Cumulative Surplus' : 
                 'Energy Change'}
              </p>
              <p className="font-mono text-lg">
                {energyChange.toLocaleString()} cal
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-pixel-sm">Progress</p>
              <p className="text-pixel-sm">{progressPercent.toFixed(1)}%</p>
            </div>
            <div className="progress-pixel">
              <div 
                className="progress-pixel-fill" 
                style={{ 
                  width: `${progressPercent}%`,
                  backgroundColor: progressColor
                }}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}