'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import WeeklySummary from '@/components/WeeklySummary';
import { supabase } from '@/lib/supabase';
import { User, DailyEntry, Goal } from '@/types';
import { calculateEnergyChange, calculateProgress, getProgressColor, getDeficitColor } from '@/lib/calculations';
import { Utensils, Dumbbell, Droplet, TrendingDown, Target, Flame } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Check if needs onboarding
    const needsOnboarding = localStorage.getItem('needsOnboarding');
    if (needsOnboarding === 'true') {
      router.push('/onboarding');
      return;
    }
    
    loadDashboardData(parsedUser.id);
  }, [router]);

  const loadDashboardData = async (userId: string) => {
    try {
      // Load today's entry
      const { data: entryData } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (entryData) {
        setTodayEntry(entryData);
      }

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

      // Calculate streak
      await calculateStreak(userId);
    } catch (error) {
      console.log('Loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = async (userId: string) => {
    try {
      // Get all daily entries, ordered by date descending
      const { data } = await supabase
        .from('daily_entries')
        .select('date, total_calories_in, total_calories_out, water_glasses')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (!data || data.length === 0) {
        setStreak(0);
        return;
      }

      let currentStreak = 0;
      const todayDate = new Date().toISOString().split('T')[0];
      
      // Check if today has any logging
      const todayLogged = data[0]?.date === todayDate && 
        (data[0].total_calories_in > 0 || data[0].total_calories_out > 0 || data[0].water_glasses > 0);

      if (!todayLogged && data[0]?.date !== todayDate) {
        // Streak is broken if today isn't logged and latest entry isn't today
        setStreak(0);
        return;
      }

      // Count consecutive days with any activity
      for (let i = 0; i < data.length; i++) {
        const entry = data[i];
        const hasActivity = entry.total_calories_in > 0 || 
                           entry.total_calories_out > 0 || 
                           entry.water_glasses > 0;

        if (hasActivity) {
          // Check if this date is consecutive with previous
          if (i === 0) {
            currentStreak = 1;
          } else {
            const currentDate = new Date(entry.date);
            const prevDate = new Date(data[i - 1].date);
            const diffTime = prevDate.getTime() - currentDate.getTime();
            const diffDays = diffTime / (1000 * 3600 * 24);

            if (diffDays === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        } else {
          break;
        }
      }

      setStreak(currentStreak);
    } catch (error) {
      console.error('Error calculating streak:', error);
      setStreak(0);
    }
  };

  if (loading) {
    return (
      <div className="container-pixel">
        <p className="font-mono text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const caloriesIn = todayEntry?.total_calories_in || 0;
  const caloriesOut = todayEntry?.total_calories_out || 0;
  const waterGlasses = todayEntry?.water_glasses || 0;
  const balance = todayEntry?.caloric_deficit || null;
  const weight = todayEntry?.weight_kg || null;

  const balanceColor = balance !== null ? getDeficitColor(balance, activeGoal?.goal_type) : '#FFFFFF';

  // Overall progress
  const energyChange = activeGoal && weight
    ? calculateEnergyChange(activeGoal.start_weight_kg, weight)
    : 0;
  
  const progress = activeGoal && activeGoal.total_energy_kcal_needed
    ? calculateProgress(energyChange, activeGoal.total_energy_kcal_needed, activeGoal.goal_type)
    : 0;

  // Get goal-aware labels
  const getBalanceLabel = () => {
    if (activeGoal?.goal_type === 'loss') return 'Deficit';
    if (activeGoal?.goal_type === 'gain') return 'Surplus';
    if (activeGoal?.goal_type === 'maintenance') return 'Balance';
    return 'Deficit';
  };

  const getBalanceMessage = () => {
    if (!balance) return null;
    if (activeGoal?.goal_type === 'loss') {
      if (balance >= 500) return 'Excellent';
      if (balance >= 300) return 'Great';
      if (balance >= 100) return 'Good';
      if (balance >= 0) return 'Low';
      return 'Surplus';
    }
    if (activeGoal?.goal_type === 'gain') {
      if (balance <= -500) return 'Excellent';
      if (balance <= -300) return 'Great';
      if (balance <= -100) return 'Good';
      if (balance <= 0) return 'Low';
      return 'Deficit';
    }
    if (activeGoal?.goal_type === 'maintenance') {
      if (Math.abs(balance) <= 100) return 'Perfect';
      if (Math.abs(balance) <= 200) return 'Great';
      if (Math.abs(balance) <= 300) return 'Good';
      return 'Off Balance';
    }
    if (balance >= 500) return 'Excellent';
    if (balance >= 300) return 'Great';
    if (balance >= 100) return 'Good';
    if (balance >= 0) return 'Low';
    return 'Surplus';
  };

  const progressPercent = Math.min(progress * 100, 100);
  const progressColor = getProgressColor(progress);

  const waterPercent = (waterGlasses / 8) * 100;

  return (
    <div className="container-pixel">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="heading-pixel">Welcome Back, {user.name || 'Player'}!</h1>
          <p className="font-mono text-lg text-darkgray/70">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {streak > 0 && (
          <div className="text-center">
            <p className="text-pixel-sm text-darkgray/70">Current Streak</p>
            <div className="flex items-center justify-center gap-2">
              <Flame size={32} className="text-darkgray" />
              <p className="font-mono text-4xl">{streak}</p>
            </div>
            <p className="text-pixel-xs">{streak === 1 ? 'day' : 'days'}</p>
          </div>
        )}
      </div>

      {/* Today's Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Utensils size={20} className="text-primary" />
            <p className="text-pixel-sm text-darkgray/70">Calories In</p>
          </div>
          <p className="font-mono text-3xl">{caloriesIn}</p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell size={20} className="text-secondary" />
            <p className="text-pixel-sm text-darkgray/70">Calories Out</p>
          </div>
          <p className="font-mono text-3xl">{caloriesOut}</p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Droplet size={20} className="text-secondary" />
            <p className="text-pixel-sm text-darkgray/70">Water</p>
          </div>
          <p className="font-mono text-3xl">{waterGlasses}/8</p>
          <div className="progress-pixel h-2 mt-2">
            <div 
              className="h-full"
              style={{ 
                width: `${waterPercent}%`,
                backgroundColor: waterPercent >= 100 ? '#C1FBA4' : '#B5DEFF',
                borderRight: waterPercent > 0 ? '4px solid #4A4A4A' : 'none'
              }}
            />
          </div>
        </Card>

        <Card style={{ backgroundColor: balance !== null ? balanceColor : '#FFFFFF' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={20} className="text-darkgray" />
            <p className="text-pixel-sm text-darkgray/70">{getBalanceLabel()}</p>
          </div>
          <p className="font-mono text-3xl">
            {balance !== null ? balance : '—'}
          </p>
          {balance !== null && (
            <p className="text-pixel-xs mt-1">
              {getBalanceMessage()}
            </p>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/food">
            <button className="w-full btn-pixel flex items-center justify-center gap-2">
              <Utensils size={16} />
              <span>Log Food</span>
            </button>
          </Link>
          <Link href="/gym">
            <button className="w-full btn-pixel-secondary flex items-center justify-center gap-2">
              <Dumbbell size={16} />
              <span>Log Gym</span>
            </button>
          </Link>
          <Link href="/water">
            <button className="w-full btn-pixel-secondary flex items-center justify-center gap-2">
              <Droplet size={16} />
              <span>Add Water</span>
            </button>
          </Link>
          <Link href="/progress">
            <button className="w-full btn-pixel-success flex items-center justify-center gap-2">
              <TrendingDown size={16} />
              <span>Progress</span>
            </button>
          </Link>
        </div>
      </Card>

      {/* Weekly Summary */}
      {user && (
        <div className="mb-6">
          <WeeklySummary userId={user.id} />
        </div>
      )}

      {/* Motivational Message */}
      {balance === null && (
        <Card>
          <div className="text-center py-6">
            <Target size={48} className="mx-auto mb-4 text-primary" />
            <p className="font-mono text-lg mb-2">Ready to track today?</p>
            <p className="font-mono text-sm text-darkgray/70">
              Log your meals and workouts, then calculate your {getBalanceLabel().toLowerCase()}!
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}