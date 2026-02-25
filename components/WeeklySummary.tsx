'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { DailyEntry, Goal } from '@/types';
import { Target, Award, Flame, Calendar, Dumbbell, Footprints, Sparkles } from 'lucide-react';

interface WeeklySummaryProps {
  userId: string;
}

export default function WeeklySummary({ userId }: WeeklySummaryProps) {
  const [weekData, setWeekData] = useState<DailyEntry[]>([]);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [mealsLogged, setMealsLogged] = useState(0);
  const [healthyMeals, setHealthyMeals] = useState(0);
  const [workoutsCompleted, setWorkoutsCompleted] = useState(0);
  const [daysHitSteps, setDaysHitSteps] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [skincareConsistency, setSkincareConsistency] = useState(0);
  const [avgProtein, setAvgProtein] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeekData();
  }, [userId]);

  const loadWeekData = async () => {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const [
        { data: goalData },
        { data: entriesData },
        { data: foodData },
        { data: gymData },
        { data: stepsData },
        { data: skincareData },
        { data: userData },
      ] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', userId).eq('is_active', true).single(),
        supabase.from('daily_entries').select('*').eq('user_id', userId).gte('date', startDate).lte('date', endDate).order('date', { ascending: true }),
        supabase.from('food_logs').select('id, is_healthy, protein_g').eq('user_id', userId).gte('date', startDate).lte('date', endDate),
        supabase.from('gym_logs').select('id').eq('user_id', userId).gte('date', startDate).lte('date', endDate),
        supabase.from('steps_logs').select('steps, date').eq('user_id', userId).gte('date', startDate).lte('date', endDate),
        supabase.from('skincare_logs').select('date, cleansing_done, serum_done, moisturizer_done').eq('user_id', userId).gte('date', startDate).lte('date', endDate),
        supabase.from('users').select('steps_goal').eq('id', userId).single(),
      ]);

      if (goalData) setActiveGoal(goalData);
      if (entriesData) setWeekData(entriesData);

      if (foodData) {
        setMealsLogged(foodData.length);
        setHealthyMeals(foodData.filter(f => f.is_healthy).length);
        const totalProtein = foodData.reduce((sum, f) => sum + (f.protein_g ?? 0), 0);
        setAvgProtein(Math.round(totalProtein / 7));
      }

      if (gymData) setWorkoutsCompleted(gymData.length);

      if (stepsData) {
        const stepsGoal = userData?.steps_goal || 8000;
        const hitting = stepsData.filter(s => s.steps >= stepsGoal).length;
        const total = stepsData.reduce((sum, s) => sum + s.steps, 0);
        setDaysHitSteps(hitting);
        setTotalSteps(total);
      }

      if (skincareData) {
        const dayMap = new Map<string, { cleansing: boolean; serum: boolean; moisturizer: boolean }>();
        for (const log of skincareData) {
          if (!dayMap.has(log.date)) dayMap.set(log.date, { cleansing: false, serum: false, moisturizer: false });
          const day = dayMap.get(log.date)!;
          if (log.cleansing_done) day.cleansing = true;
          if (log.serum_done) day.serum = true;
          if (log.moisturizer_done) day.moisturizer = true;
        }
        const fullDays = [...dayMap.values()].filter(d => d.cleansing && d.serum && d.moisturizer).length;
        setSkincareConsistency(fullDays);
      }

    } catch (error) {
      console.error('Error loading week data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="font-mono text-sm">Loading weekly summary...</p>;
  }

  if (weekData.length === 0 && mealsLogged === 0 && workoutsCompleted === 0) {
    return (
      <Card title="This Week's Summary">
        <div className="text-center py-6">
          <p className="font-mono text-lg mb-2">Ready to start tracking?</p>
          {!activeGoal && (
            <p className="font-mono text-sm text-darkgray/70">Set a goal in Profile to get personalized insights.</p>
          )}
        </div>
      </Card>
    );
  }

  const goalType = activeGoal?.goal_type || null;

  const daysLogged = weekData.filter(d =>
    d.total_calories_in > 0 || d.total_calories_out > 0 || d.water_glasses > 0
  ).length;

  const activeDays = weekData.filter(d => d.total_calories_out > 0).length;
  const daysHitWaterGoal = weekData.filter(d => d.water_glasses >= 8).length;

  let daysHitGoal = 0;
  let avgCalorieBalance = 0;
  let goalLabel = 'On Track Days';

  if (goalType === 'loss') {
    daysHitGoal = weekData.filter(d => (d.apparent_deficit ?? 0) >= 300).length;
    goalLabel = 'Hit Deficit Goal';
    const totalDeficit = weekData.reduce((sum, d) => sum + (d.apparent_deficit ?? 0), 0);
    avgCalorieBalance = Math.round(totalDeficit / Math.max(daysLogged, 1));
  } else if (goalType === 'gain') {
    daysHitGoal = weekData.filter(d => (d.apparent_deficit ?? 0) <= -300).length;
    goalLabel = 'Hit Surplus Goal';
    const totalSurplus = weekData.reduce((sum, d) => sum + (d.apparent_deficit ?? 0), 0);
    avgCalorieBalance = Math.round(totalSurplus / Math.max(daysLogged, 1));
  } else if (goalType === 'maintenance') {
    daysHitGoal = weekData.filter(d => Math.abs(d.apparent_deficit ?? 0) <= 200).length;
    goalLabel = 'Stayed Balanced';
    const totalBalance = weekData.reduce((sum, d) => sum + (d.apparent_deficit ?? 0), 0);
    avgCalorieBalance = Math.round(totalBalance / Math.max(daysLogged, 1));
  } else {
    daysHitGoal = weekData.filter(d => d.apparent_deficit !== null && d.apparent_deficit !== undefined).length;
    goalLabel = 'Days Calculated';
    const totalBalance = weekData.reduce((sum, d) => sum + (d.apparent_deficit ?? 0), 0);
    avgCalorieBalance = Math.round(totalBalance / Math.max(daysLogged, 1));
  }

  let currentStreak = 0;
  const sortedData = [...weekData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const entry of sortedData) {
    const hasActivity = entry.total_calories_in > 0 || entry.total_calories_out > 0 || entry.water_glasses > 0;
    if (hasActivity) currentStreak++;
    else break;
  }

  const consistencyScore = Math.round((daysLogged / 7) * 100);
  const healthyMealPercent = mealsLogged > 0 ? Math.round((healthyMeals / mealsLogged) * 100) : 0;

  const getGoalDescription = () => {
    if (!goalType) return 'days tracked';
    if (goalType === 'loss') return '300+ cal deficit';
    if (goalType === 'gain') return '300+ cal surplus';
    return '±200 cal of target';
  };

  return (
    <Card title="This Week's Summary">
      {!activeGoal && (
        <div className="mb-4 p-3 bg-warning/20 border-2 border-darkgray">
          <p className="font-mono text-sm">Set a goal in Profile to get personalized weekly insights.</p>
        </div>
      )}

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 border-2 border-darkgray bg-primary/20">
          <Flame size={24} className="mx-auto mb-2 text-darkgray" />
          <p className="text-pixel-sm text-darkgray/70 mb-1">Current Streak</p>
          <p className="font-mono text-3xl">{currentStreak}</p>
          <p className="text-pixel-xs">days</p>
        </div>

        <div className="text-center p-3 border-2 border-darkgray bg-success/20">
          <Target size={24} className="mx-auto mb-2 text-darkgray" />
          <p className="text-pixel-sm text-darkgray/70 mb-1">{goalLabel}</p>
          <p className="font-mono text-3xl">{daysHitGoal}/7</p>
          <p className="text-pixel-xs">{getGoalDescription()}</p>
        </div>

        <div className="text-center p-3 border-2 border-darkgray bg-secondary/20">
          <Dumbbell size={24} className="mx-auto mb-2 text-darkgray" />
          <p className="text-pixel-sm text-darkgray/70 mb-1">Exercises Done</p>
          <p className="font-mono text-3xl">{workoutsCompleted}</p>
          <p className="text-pixel-xs">this week</p>
        </div>

        <div className="text-center p-3 border-2 border-darkgray bg-accent/20">
          <Footprints size={24} className="mx-auto mb-2 text-darkgray" />
          <p className="text-pixel-sm text-darkgray/70 mb-1">Step Goal Days</p>
          <p className="font-mono text-3xl">{daysHitSteps}/7</p>
          <p className="text-pixel-xs">8,000+ steps</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-2 border-2 border-darkgray bg-white">
          <p className="text-pixel-xs text-darkgray/70 mb-1">Meals Logged</p>
          <p className="font-mono text-xl">{mealsLogged}</p>
        </div>

        <div className="text-center p-2 border-2 border-darkgray bg-white">
          <p className="text-pixel-xs text-darkgray/70 mb-1">Healthy Foods</p>
          <p className="font-mono text-xl">{healthyMeals} ({healthyMealPercent}%)</p>
        </div>

        <div className="text-center p-2 border-2 border-darkgray bg-white">
          <p className="text-pixel-xs text-darkgray/70 mb-1">Avg Protein/day</p>
          <p className="font-mono text-xl">{avgProtein}g</p>
        </div>

        <div className="text-center p-2 border-2 border-darkgray bg-white">
          <p className="text-pixel-xs text-darkgray/70 mb-1">Total Steps</p>
          <p className="font-mono text-xl">{totalSteps.toLocaleString()}</p>
        </div>

        <div className="text-center p-2 border-2 border-darkgray bg-white">
          <p className="text-pixel-xs text-darkgray/70 mb-1">Water Goals</p>
          <p className="font-mono text-xl">{daysHitWaterGoal}/7</p>
        </div>

        <div className="text-center p-2 border-2 border-darkgray bg-white">
          <p className="text-pixel-xs text-darkgray/70 mb-1">Active Days</p>
          <p className="font-mono text-xl">{activeDays}/7</p>
        </div>

        <div className="text-center p-2 border-2 border-darkgray bg-white">
          <p className="text-pixel-xs text-darkgray/70 mb-1">Skincare Days</p>
          <p className="font-mono text-xl">{skincareConsistency}/7</p>
        </div>

        <div className="text-center p-2 border-2 border-darkgray bg-white">
          <p className="text-pixel-xs text-darkgray/70 mb-1">Avg Balance</p>
          <p className="font-mono text-xl">{Math.abs(avgCalorieBalance)} cal</p>
        </div>
      </div>

      {/* Consistency Score */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-pixel-sm">Consistency Score</p>
          <p className="text-pixel-sm font-bold">{consistencyScore}%</p>
        </div>
        <div className="progress-pixel h-6">
          <div
            className="h-full transition-all flex items-center justify-center"
            style={{
              width: `${consistencyScore}%`,
              backgroundColor: consistencyScore >= 80 ? '#C1FBA4' : consistencyScore >= 50 ? '#FFF2CC' : '#FFB5E8',
              borderRight: consistencyScore > 0 ? '4px solid #4A4A4A' : 'none',
            }}
          >
            {consistencyScore > 10 && (
              <span className="font-mono text-xs text-darkgray font-bold">{consistencyScore}%</span>
            )}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="space-y-2">
        {daysLogged === 7 && (
          <div className="p-3 bg-success border-2 border-darkgray flex items-center gap-3">
            <Award size={24} className="text-darkgray" />
            <p className="font-mono text-sm">Perfect week. Logged every day.</p>
          </div>
        )}
        {daysHitGoal >= 5 && (
          <div className="p-3 bg-success border-2 border-darkgray flex items-center gap-3">
            <Target size={24} className="text-darkgray" />
            <p className="font-mono text-sm">
              {goalType === 'loss' && `${daysHitGoal} days hit deficit goal.`}
              {goalType === 'gain' && `${daysHitGoal} days hit surplus goal.`}
              {goalType === 'maintenance' && `${daysHitGoal} days stayed balanced.`}
              {!goalType && `${daysHitGoal} days tracked.`}
            </p>
          </div>
        )}
        {currentStreak >= 7 && (
          <div className="p-3 bg-primary border-2 border-darkgray flex items-center gap-3">
            <Flame size={24} className="text-darkgray" />
            <p className="font-mono text-sm">{currentStreak} day streak.</p>
          </div>
        )}
        {workoutsCompleted >= 5 && (
          <div className="p-3 bg-secondary border-2 border-darkgray flex items-center gap-3">
            <Dumbbell size={24} className="text-darkgray" />
            <p className="font-mono text-sm">Strong week. {workoutsCompleted} workouts completed.</p>
          </div>
        )}
        {daysHitSteps >= 5 && (
          <div className="p-3 bg-secondary border-2 border-darkgray flex items-center gap-3">
            <Footprints size={24} className="text-darkgray" />
            <p className="font-mono text-sm">Hit 8,000 steps on {daysHitSteps} days.</p>
          </div>
        )}
        {skincareConsistency >= 5 && (
          <div className="p-3 bg-accent border-2 border-darkgray flex items-center gap-3">
            <Sparkles size={24} className="text-darkgray" />
            <p className="font-mono text-sm">Full skincare routine on {skincareConsistency} days.</p>
          </div>
        )}
        {daysHitWaterGoal >= 5 && (
          <div className="p-3 bg-secondary border-2 border-darkgray flex items-center gap-3">
            <span className="text-2xl">💧</span>
            <p className="font-mono text-sm">Hydration goal met on {daysHitWaterGoal} days.</p>
          </div>
        )}
        {healthyMealPercent >= 80 && mealsLogged >= 10 && (
          <div className="p-3 bg-success border-2 border-darkgray flex items-center gap-3">
            <span className="text-2xl">🥗</span>
            <p className="font-mono text-sm">{healthyMealPercent}% healthy meals this week.</p>
          </div>
        )}
      </div>

      {/* Motivational */}
      {consistencyScore < 50 && (
        <div className="mt-4 p-3 bg-warning/20 border-2 border-darkgray">
          <p className="font-mono text-sm">Try logging every day this week.</p>
        </div>
      )}
      {consistencyScore >= 80 && (
        <div className="mt-4 p-3 bg-success/20 border-2 border-darkgray">
          <p className="font-mono text-sm">Great consistency this week. Keep it up.</p>
        </div>
      )}
    </Card>
  );
}