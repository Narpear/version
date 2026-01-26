'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import WeightChart from '@/components/WeightChart';
import { supabase } from '@/lib/supabase';
import { DailyEntry, Goal, User } from '@/types';
import {
  calculateBMR,
  calculateDeficit,
  calculateEnergyChange,
  calculateNetIntake,
  calculateProgress,
  getDeficitColor,
  getProgressColor,
} from '@/lib/calculations';
import { RefreshCw, TrendingDown } from 'lucide-react';
import { Info } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function ProgressPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [dailyEntry, setDailyEntry] = useState<DailyEntry | null>(null);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const [todayWeight, setTodayWeight] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadData(parsedUser.id);
  }, [router]);

  const loadData = async (userId: string) => {
    try {
      // Load active goal
      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (goalData) {
        setActiveGoal(goalData);
      }

      // Load today's daily entry
      const { data: entryData } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (entryData) {
        setDailyEntry(entryData);
        if (entryData.weight_kg) {
          setTodayWeight(entryData.weight_kg);
        }
      }

      // Load weight history (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: historyData } = await supabase
        .from('daily_entries')
        .select('date, weight_kg')
        .eq('user_id', userId)
        .not('weight_kg', 'is', null)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (historyData) {
        const formattedData = historyData.map((entry) => ({
          date: entry.date,
          weight: entry.weight_kg,
          displayDate: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));
        setWeightHistory(formattedData);
      }
    } catch (error) {
      console.log('No data found');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!user || todayWeight <= 0) {
      alert('Please enter your weight for today');
      return;
    }

    setCalculating(true);

    try {
      const { data: entryData } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      const caloriesIn = entryData?.total_calories_in || 0;
      const caloriesOut = entryData?.total_calories_out || 0;

      const bmr = calculateBMR(todayWeight, user.height_cm, user.age, user.gender);
      const netIntake = calculateNetIntake(caloriesIn, caloriesOut);
      const deficit = calculateDeficit(bmr, netIntake);

      if (entryData) {
        await supabase
          .from('daily_entries')
          .update({
            weight_kg: todayWeight,
            bmr: bmr,
            net_intake: netIntake,
            caloric_deficit: deficit,
          })
          .eq('id', entryData.id);
      } else {
        await supabase.from('daily_entries').insert({
          user_id: user.id,
          date: today,
          weight_kg: todayWeight,
          bmr: bmr,
          total_calories_in: caloriesIn,
          total_calories_out: caloriesOut,
          net_intake: netIntake,
          caloric_deficit: deficit,
          water_glasses: 0,
        });
      }

      if (activeGoal) {
        await supabase.from('goals').update({ current_weight_kg: todayWeight }).eq('id', activeGoal.id);
      }

      await loadData(user.id);
      toast('Saved!');
    } catch (error) {
      console.error('Error calculating:', error);
      alert('Failed to calculate');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="container-pixel">
        <p className="font-mono text-lg">Loading...</p>
      </div>
    );
  }

  const bmr = dailyEntry?.bmr || 0;
  const caloriesIn = dailyEntry?.total_calories_in || 0;
  const caloriesOut = dailyEntry?.total_calories_out || 0;
  const netIntake = dailyEntry?.net_intake || 0;
  const balance = dailyEntry?.caloric_deficit || 0;
  const deficitColor = getDeficitColor(balance, activeGoal?.goal_type);

  const energyChange = activeGoal && dailyEntry?.weight_kg ? calculateEnergyChange(activeGoal.start_weight_kg, dailyEntry.weight_kg) : 0;

  const progress = activeGoal && activeGoal.total_energy_kcal_needed
    ? calculateProgress(energyChange, activeGoal.total_energy_kcal_needed, activeGoal.goal_type)
    : 0;

  // Goal-aware labels
  const getPageTitle = () => {
    if (activeGoal?.goal_type === 'loss') return 'Caloric Deficit Calculator';
    if (activeGoal?.goal_type === 'gain') return 'Caloric Surplus Tracker';
    if (activeGoal?.goal_type === 'maintenance') return 'Caloric Balance Tracker';
    return 'Caloric Progress';
  };

  const getBalanceLabel = () => {
    if (activeGoal?.goal_type === 'loss') return 'Deficit';
    if (activeGoal?.goal_type === 'gain') return 'Surplus';
    if (activeGoal?.goal_type === 'maintenance') return 'Balance';
    return 'Balance';
  };

  const getBalanceMessage = () => {
    if (activeGoal?.goal_type === 'loss') {
      if (balance >= 500) return '🔥 Excellent!';
      if (balance >= 300) return '✅ Great!';
      if (balance >= 100) return '👍 Good';
      if (balance >= 0) return '⚠️ Low';
      return '❌ Surplus';
    }
    if (activeGoal?.goal_type === 'gain') {
      if (balance <= -500) return '🔥 Excellent!';
      if (balance <= -300) return '✅ Great!';
      if (balance <= -100) return '👍 Good';
      if (balance <= 0) return '⚠️ Low';
      return '❌ Deficit';
    }
    if (activeGoal?.goal_type === 'maintenance') {
      if (Math.abs(balance) <= 100) return '⚖️ Perfect!';
      if (Math.abs(balance) <= 200) return '✅ Great!';
      if (Math.abs(balance) <= 300) return '👍 Good';
      return '⚠️ Off Balance';
    }
    if (balance >= 500) return '🔥 Excellent!';
    if (balance >= 300) return '✅ Great!';
    if (balance >= 100) return '👍 Good';
    if (balance >= 0) return '⚠️ Low';
    return '❌ Surplus';
  };

  const progressPercent = Math.min(progress * 100, 100);
  const progressColor = getProgressColor(progress);

  const bmi =
    user?.height_cm && (dailyEntry?.weight_kg || activeGoal?.start_weight_kg)
      ? (Number(dailyEntry?.weight_kg || activeGoal?.start_weight_kg) / Math.pow(Number(user.height_cm) / 100, 2))
      : null;

  const bmiLabel = (value: number) => {
    if (value < 18.5) return 'Underweight';
    if (value < 25) return 'Normal';
    if (value < 30) return 'Overweight';
    return 'Obese';
  };

  return (
    <div className="container-pixel">
      <h1 className="heading-pixel">{getPageTitle()}</h1>
      <p className="font-mono text-lg mb-2">Track your daily {getBalanceLabel().toLowerCase()} and progress</p>
      <p className="text-pixel-xs text-darkgray/60 mb-6">Autosaved to your account.</p>

      {/* Weight Chart */}
      {weightHistory.length > 0 && (
        <Card title="Weight Progress (Last 30 Days)" className="mb-6">
          <WeightChart data={weightHistory} goal={activeGoal} />
        </Card>
      )}

      {/* Weight Input & Calculate Button */}
      <Card title="Today's Weight & Calculation" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="number"
            label="Weight Today (kg)"
            value={todayWeight}
            onChange={(e) => setTodayWeight(parseFloat(e.target.value))}
            placeholder="Enter your weight"
            step={0.1}
            min={0}
          />
          <div className="flex items-end gap-4 mt-7">
            <Button onClick={handleCalculate} disabled={calculating || todayWeight <= 0} className="flex-1">
              {calculating ? 'Calculating...' : dailyEntry?.caloric_deficit ? 'Recalculate' : `Calculate ${getBalanceLabel()}`}
            </Button>
            {dailyEntry?.caloric_deficit && (
              <Button onClick={handleCalculate} disabled={calculating} variant="secondary">
                <RefreshCw size={20} />
              </Button>
            )}
          </div>
        </div>
        <p className="font-mono text-sm text-darkgray/70 mt-4">
          Enter your weight and click Calculate to compute today's {getBalanceLabel().toLowerCase()}. Click Recalculate if you update food or gym data.
        </p>
      </Card>

      {/* Today's Stats */}
      {dailyEntry && dailyEntry.caloric_deficit !== null && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-pixel-sm text-darkgray/70">BMR</p>
                <span
                  className="inline-flex items-center justify-center"
                  title="BMR is the calories your body burns at rest. We estimate it using the Mifflin-St Jeor formula."
                >
                  <Info size={14} className="text-darkgray/70" />
                </span>
              </div>
              <p className="font-mono text-2xl">{bmr}</p>
              <p className="font-mono text-xs text-darkgray/50">cal/day</p>
            </Card>
            <Card>
              <p className="text-pixel-sm text-darkgray/70 mb-1">Calories In</p>
              <p className="font-mono text-2xl">{caloriesIn}</p>
              <p className="font-mono text-xs text-darkgray/50">from food</p>
            </Card>
            <Card>
              <p className="text-pixel-sm text-darkgray/70 mb-1">Calories Out</p>
              <p className="font-mono text-2xl">{caloriesOut}</p>
              <p className="font-mono text-xs text-darkgray/50">from gym</p>
            </Card>
            <Card>
              <p className="text-pixel-sm text-darkgray/70 mb-1">Net Intake</p>
              <p className="font-mono text-2xl">{netIntake}</p>
              <p className="font-mono text-xs text-darkgray/50">in - out</p>
            </Card>
            <Card style={{ backgroundColor: deficitColor }}>
              <p className="text-pixel-sm text-darkgray/70 mb-1">{getBalanceLabel()}</p>
              <p className="font-mono text-2xl font-bold">{balance}</p>
              <p className="font-mono text-xs text-darkgray/50">{getBalanceMessage()}</p>
            </Card>
          </div>

          <Card title="How It's Calculated" className="mb-6">
            <div className="font-mono text-sm space-y-2">
              <p>
                BMR (Mifflin-St Jeor): (10 × {todayWeight}kg) + (6.25 × {user?.height_cm}cm) - (5 × {user?.age}) - 161 ={' '}
                <strong>{bmr} cal</strong>
              </p>
              <p>
                Net Intake: {caloriesIn} (food) - {caloriesOut} (gym) = <strong>{netIntake} cal</strong>
              </p>
              <p>
                Caloric {getBalanceLabel()}: {bmr} (BMR) - {netIntake} (net) ={' '}
                <strong style={{ color: balance >= 0 ? '#2d7a2d' : '#c92a2a' }}>{balance} cal</strong>
              </p>
            </div>
          </Card>

          {bmi !== null && (
            <Card title="BMI (Quick Check)" className="mb-6">
              <p className="font-mono text-lg">
                BMI: <span className="font-bold">{bmi.toFixed(1)}</span> ({bmiLabel(bmi)})
              </p>
              <p className="font-mono text-sm text-darkgray/70 mt-2">
                Formula: weight(kg) / height(m)²
              </p>
            </Card>
          )}
        </>
      )}

      {/* Overall Progress */}
      {activeGoal && (
        <Card title="Overall Progress to Goal" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-pixel-sm text-darkgray/70 mb-1">Start Weight</p>
              <p className="font-mono text-xl">{activeGoal.start_weight_kg} kg</p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70 mb-1">Current Weight</p>
              <p className="font-mono text-xl">{dailyEntry?.weight_kg || activeGoal.start_weight_kg} kg</p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70 mb-1">Goal Weight</p>
              <p className="font-mono text-xl">{activeGoal.goal_weight_kg} kg</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-pixel-sm text-darkgray/70 mb-1">
                {activeGoal.goal_type === 'maintenance'
                  ? 'Daily Target'
                  : activeGoal.goal_type === 'loss'
                    ? 'Total Deficit Needed'
                    : 'Total Surplus Needed'}
              </p>
              <p className="font-mono text-2xl">
                {activeGoal.goal_type === 'maintenance'
                  ? `${activeGoal.daily_target_kcal > 0 ? '+' : ''}${activeGoal.daily_target_kcal} kcal/day`
                  : `${activeGoal.total_energy_kcal_needed?.toLocaleString() || 0} cal`}
              </p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70 mb-1">
                {activeGoal.goal_type === 'loss' ? 'Cumulative Deficit' : activeGoal.goal_type === 'gain' ? 'Cumulative Surplus' : 'Energy Change'}
              </p>
              <p className="font-mono text-2xl">{energyChange.toLocaleString()} cal</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-pixel-sm">Progress to Goal</p>
              <p className="text-pixel-sm font-bold">{progressPercent.toFixed(1)}%</p>
            </div>
            <div className="progress-pixel h-8">
              <div
                className="h-full transition-all flex items-center justify-center"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: progressColor,
                  borderRight: progressPercent > 0 ? '4px solid #4A4A4A' : 'none',
                }}
              >
                {progressPercent > 10 && (
                  <span className="font-mono text-xs text-darkgray font-bold">{progressPercent.toFixed(0)}%</span>
                )}
              </div>
            </div>
          </div>

          {progressPercent >= 100 && (
            <div className="mt-4 p-4 bg-success border-2 border-darkgray text-center">
              <p className="text-pixel-sm">GOAL ACHIEVED! Congratulations!</p>
            </div>
          )}
        </Card>
      )}

      {!dailyEntry?.caloric_deficit && (
        <Card>
          <div className="text-center py-8">
            <TrendingDown size={48} className="mx-auto mb-4 text-darkgray/30" />
            <p className="font-mono text-lg text-darkgray/70 mb-2">Nothing calculated today</p>
            <p className="font-mono text-sm text-darkgray/50">
              1. Log your food in Food Tracker
              <br />
              2. Log your workouts in Gym Tracker
              <br />
              3. Enter your weight above
              <br />
              4. Click &quot;Calculate {getBalanceLabel()}&quot;
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

