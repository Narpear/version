'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { DailyEntry, Goal } from '@/types';
import { Target, Award, Flame, Calendar } from 'lucide-react';

interface WeeklySummaryProps {
  userId: string;
}

export default function WeeklySummary({ userId }: WeeklySummaryProps) {
  const [weekData, setWeekData] = useState<DailyEntry[]>([]);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [mealsLogged, setMealsLogged] = useState(0);
  const [healthyMeals, setHealthyMeals] = useState(0);
  const [workoutsCompleted, setWorkoutsCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeekData();
  }, [userId]);

  const loadWeekData = async () => {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      // Get active goal
      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (goalData) {
        setActiveGoal(goalData);
      }

      // Get daily entries
      const { data } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (data) {
        setWeekData(data);
      }

      // Get meals logged this week
      const { data: foodData } = await supabase
        .from('food_logs')
        .select('id, is_healthy')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (foodData) {
        setMealsLogged(foodData.length);
        setHealthyMeals(foodData.filter(f => f.is_healthy).length);
      }

      // Get workouts this week
      const { data: gymData } = await supabase
        .from('gym_logs')
        .select('id')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (gymData) {
        setWorkoutsCompleted(gymData.length);
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
          <p className="font-mono text-sm text-darkgray/70">
            {!activeGoal && "💡 Set a goal in Profile to get personalized insights!"}
          </p>
        </div>
      </Card>
    );
  }

  // Determine goal-specific metrics
  const goalType = activeGoal?.goal_type || null;
  
  // Universal stats
  const daysLogged = weekData.filter(d => 
    d.total_calories_in > 0 || d.total_calories_out > 0 || d.water_glasses > 0
  ).length;

  const activeDays = weekData.filter(d => d.total_calories_out > 0).length;
  const daysHitWaterGoal = weekData.filter(d => d.water_glasses >= 8).length;

  // Goal-aware metrics
  let daysHitGoal = 0;
  let avgCalorieBalance = 0;
  let goalLabel = 'On Track Days';
  let goalThreshold = 0;

  if (goalType === 'loss') {
    // For weight loss: want deficit >= 300
    goalThreshold = 300;
    daysHitGoal = weekData.filter(d => 
      d.caloric_deficit !== null && d.caloric_deficit >= goalThreshold
    ).length;
    goalLabel = 'Hit Deficit Goal';
    const totalDeficit = weekData.reduce((sum, d) => sum + (d.caloric_deficit || 0), 0);
    avgCalorieBalance = Math.round(totalDeficit / Math.max(daysLogged, 1));
  } else if (goalType === 'gain') {
    // For weight gain: want surplus (negative deficit) >= 300
    goalThreshold = -300;
    daysHitGoal = weekData.filter(d => 
      d.caloric_deficit !== null && d.caloric_deficit <= goalThreshold
    ).length;
    goalLabel = 'Hit Surplus Goal';
    const totalSurplus = weekData.reduce((sum, d) => sum + (d.caloric_deficit || 0), 0);
    avgCalorieBalance = Math.round(totalSurplus / Math.max(daysLogged, 1));
  } else if (goalType === 'maintenance') {
    // For maintenance: want deficit between -200 and 200
    daysHitGoal = weekData.filter(d => 
      d.caloric_deficit !== null && 
      Math.abs(d.caloric_deficit) <= 200
    ).length;
    goalLabel = 'Stayed Balanced';
    const totalBalance = weekData.reduce((sum, d) => sum + (d.caloric_deficit || 0), 0);
    avgCalorieBalance = Math.round(totalBalance / Math.max(daysLogged, 1));
  } else {
    // No goal set: just show days with any deficit/surplus tracked
    daysHitGoal = weekData.filter(d => d.caloric_deficit !== null).length;
    goalLabel = 'Days Calculated';
    const totalBalance = weekData.reduce((sum, d) => sum + (d.caloric_deficit || 0), 0);
    avgCalorieBalance = Math.round(totalBalance / Math.max(daysLogged, 1));
  }

  // Calculate current streak
  let currentStreak = 0;
  const sortedData = [...weekData].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  for (const entry of sortedData) {
    const hasActivity = entry.total_calories_in > 0 || 
                       entry.total_calories_out > 0 || 
                       entry.water_glasses > 0;
    if (hasActivity) {
      currentStreak++;
    } else {
      break;
    }
  }

  const consistencyScore = Math.round((daysLogged / 7) * 100);
  const healthyMealPercent = mealsLogged > 0 ? Math.round((healthyMeals / mealsLogged) * 100) : 0;

  // Dynamic messaging
  const getBalanceLabel = () => {
    if (!goalType) return `Avg Balance: ${avgCalorieBalance} cal`;
    if (goalType === 'loss') return `Avg Deficit: ${avgCalorieBalance} cal`;
    if (goalType === 'gain') return `Avg Surplus: ${Math.abs(avgCalorieBalance)} cal`;
    return `Avg Balance: ${Math.abs(avgCalorieBalance)} cal`;
  };

  const getGoalDescription = () => {
    if (!goalType) return 'Set a goal in Profile';
    if (goalType === 'loss') return '300+ cal deficit';
    if (goalType === 'gain') return '300+ cal surplus';
    return 'within ±200 cal';
  };

  return (
    <Card title="📊 This Week's Summary">
      {!activeGoal && (
        <div className="mb-4 p-3 bg-warning/20 border-2 border-darkgray">
          <p className="font-mono text-sm">💡 Set a goal in Profile to get personalized weekly insights!</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Streak Days */}
        <div className="text-center p-3 border-2 border-darkgray bg-primary/20">
          <Flame size={24} className="mx-auto mb-2 text-darkgray" />
          <p className="text-pixel-sm text-darkgray/70 mb-1">Current Streak</p>
          <p className="font-mono text-3xl">{currentStreak}</p>
          <p className="text-pixel-xs">days</p>
        </div>

        {/* Days Hit Goal (Adaptive) */}
        <div className="text-center p-3 border-2 border-darkgray bg-success/20">
          <Target size={24} className="mx-auto mb-2 text-darkgray" />
          <p className="text-pixel-sm text-darkgray/70 mb-1">{goalLabel}</p>
          <p className="font-mono text-3xl">{daysHitGoal}/7</p>
          <p className="text-pixel-xs">{getGoalDescription()}</p>
        </div>

        {/* Workouts Completed */}
        <div className="text-center p-3 border-2 border-darkgray bg-secondary/20">
          <p className="text-2xl mb-2">💪</p>
          <p className="text-pixel-sm text-darkgray/70 mb-1">Workouts Done</p>
          <p className="font-mono text-3xl">{workoutsCompleted}</p>
          <p className="text-pixel-xs">this week</p>
        </div>

        {/* Active Days */}
        <div className="text-center p-3 border-2 border-darkgray bg-accent/20">
          <Calendar size={24} className="mx-auto mb-2 text-darkgray" />
          <p className="text-pixel-sm text-darkgray/70 mb-1">Active Days</p>
          <p className="font-mono text-3xl">{activeDays}/7</p>
          <p className="text-pixel-xs">days</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-2 border-2 border-darkgray bg-white">
          <p className="text-pixel-xs text-darkgray/70 mb-1">Meals Logged</p>
          <p className="font-mono text-xl">{mealsLogged}</p>
        </div>

        <div className="text-center p-2 border-2 border-darkgray bg-white">
          <p className="text-pixel-xs text-darkgray/70 mb-1">Healthy Meals</p>
          <p className="font-mono text-xl">{healthyMeals} ({healthyMealPercent}%)</p>
        </div>

        <div className="text-center p-2 border-2 border-darkgray bg-white">
          <p className="text-pixel-xs text-darkgray/70 mb-1">Water Goals</p>
          <p className="font-mono text-xl">{daysHitWaterGoal}/7</p>
        </div>

        <div className="text-center p-2 border-2 border-darkgray bg-white">
          <p className="text-pixel-xs text-darkgray/70 mb-1">{getBalanceLabel().split(':')[0]}</p>
          <p className="font-mono text-xl">{Math.abs(avgCalorieBalance)}</p>
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
              borderRight: consistencyScore > 0 ? '4px solid #4A4A4A' : 'none'
            }}
          >
            {consistencyScore > 10 && (
              <span className="font-mono text-xs text-darkgray font-bold">
                {consistencyScore}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Achievements (Goal-Aware) */}
      <div className="space-y-2">
        {daysLogged === 7 && (
          <div className="p-3 bg-success border-2 border-darkgray flex items-center gap-3">
            <Award size={24} className="text-darkgray" />
            <p className="font-mono text-sm">🎉 Perfect Week! Logged every day!</p>
          </div>
        )}
        {daysHitGoal >= 5 && (
          <div className="p-3 bg-success border-2 border-darkgray flex items-center gap-3">
            <Target size={24} className="text-darkgray" />
            <p className="font-mono text-sm">
              {goalType === 'loss' && `🔥 ${daysHitGoal} days hit deficit goal!`}
              {goalType === 'gain' && `💪 ${daysHitGoal} days hit surplus goal!`}
              {goalType === 'maintenance' && `⚖️ ${daysHitGoal} days stayed balanced!`}
              {!goalType && `✅ ${daysHitGoal} days tracked!`}
            </p>
          </div>
        )}
        {currentStreak >= 7 && (
          <div className="p-3 bg-primary border-2 border-darkgray flex items-center gap-3">
            <Flame size={24} className="text-darkgray" />
            <p className="font-mono text-sm">🔥 {currentStreak} day streak! You're on fire!</p>
          </div>
        )}
        {workoutsCompleted >= 5 && (
          <div className="p-3 bg-secondary border-2 border-darkgray flex items-center gap-3">
            <span className="text-2xl">💪</span>
            <p className="font-mono text-sm">Strong week! {workoutsCompleted} workouts completed!</p>
          </div>
        )}
        {daysHitWaterGoal >= 5 && (
          <div className="p-3 bg-secondary border-2 border-darkgray flex items-center gap-3">
            <span className="text-2xl">💧</span>
            <p className="font-mono text-sm">Hydration champion! {daysHitWaterGoal} days hit water goal!</p>
          </div>
        )}
        {healthyMealPercent >= 80 && mealsLogged >= 10 && (
          <div className="p-3 bg-success border-2 border-darkgray flex items-center gap-3">
            <span className="text-2xl">🥗</span>
            <p className="font-mono text-sm">Nutrition superstar! {healthyMealPercent}% healthy meals!</p>
          </div>
        )}
      </div>

      {/* Motivational Messages */}
      {consistencyScore < 50 && (
        <div className="mt-4 p-3 bg-warning/20 border-2 border-darkgray">
          <p className="font-mono text-sm">💪 You've got this! Try logging every day this week.</p>
        </div>
      )}
      {consistencyScore >= 80 && (
        <div className="mt-4 p-3 bg-success/20 border-2 border-darkgray">
          <p className="font-mono text-sm">⭐ You're crushing it this week! Keep up the amazing work!</p>
        </div>
      )}
    </Card>
  );
}