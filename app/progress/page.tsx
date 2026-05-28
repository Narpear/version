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
  calculateApparentDeficit,
  calculateActualDeficit,
  calculateNetIntake,
  calculateProgress,
  getApparentDeficitColor,
  getProgressColor,
  getApparentDeficitMessage,
  formatDeficitSurplus,
} from '@/lib/calculations';
import { RefreshCw, TrendingDown, Info, Lightbulb, Target, Calendar, Scale, Zap, AlertCircle, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
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
  const [showProgressInfo, setShowProgressInfo] = useState(false);
  const [showCalcSettingsModal, setShowCalcSettingsModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [stepsCount, setStepsCount] = useState(0);

  type CalcSettings = { bmrMultiplier: number; includeGym: boolean; includeSteps: boolean };
  const defaultSettings: CalcSettings = { bmrMultiplier: 1.0, includeGym: false, includeSteps: false };

  const [calcSettings, setCalcSettings] = useState<CalcSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('progress_calc_settings');
      if (saved) return JSON.parse(saved);
    }
    return defaultSettings;
  });

  // draft is only used inside the modal — committed to calcSettings on Save
  const [draft, setDraft] = useState<CalcSettings>(calcSettings);

  const openSettingsModal = () => {
    setDraft(calcSettings);
    setShowCalcSettingsModal(true);
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setSavingSettings(true);
    try {
      // Commit draft → calcSettings + persist
      setCalcSettings(draft);
      localStorage.setItem('progress_calc_settings', JSON.stringify(draft));
      await supabase.from('users').update({
        calc_bmr_multiplier: draft.bmrMultiplier,
        calc_include_gym: draft.includeGym,
        calc_include_steps: draft.includeSteps,
      }).eq('id', user.id);

      // Fetch all previously calculated daily entries
      const { data: entries } = await supabase
        .from('daily_entries')
        .select('id, date, bmr, total_calories_in, total_calories_out')
        .eq('user_id', user.id)
        .not('bmr', 'is', null);

      if (entries && entries.length > 0) {
        const { data: stepsLogs } = await supabase
          .from('steps_logs')
          .select('date, steps')
          .eq('user_id', user.id);

        const stepsMap = new Map<string, number>();
        for (const s of stepsLogs || []) stepsMap.set(s.date, s.steps);

        await Promise.all(entries.map(entry => {
          const effectiveBMR = Math.round((entry.bmr || 0) * draft.bmrMultiplier);
          const gymCals = draft.includeGym ? (entry.total_calories_out || 0) : 0;
          const stepsCals = draft.includeSteps
            ? Math.round((stepsMap.get(entry.date) || 0) * 0.045) : 0;
          const netIntake = (entry.total_calories_in || 0) - gymCals - stepsCals;
          const apparentDeficit = effectiveBMR - netIntake;
          return supabase
            .from('daily_entries')
            .update({ apparent_deficit: apparentDeficit, net_intake: netIntake })
            .eq('id', entry.id);
        }));

        if (activeGoal) {
          const { data: updatedEntries } = await supabase
            .from('daily_entries')
            .select('apparent_deficit')
            .eq('user_id', user.id)
            .gte('date', activeGoal.start_date)
            .not('apparent_deficit', 'is', null);
          const cumulative = (updatedEntries || []).reduce((s, e) => s + (e.apparent_deficit || 0), 0);
          await supabase.from('goals').update({ cumulative_apparent_deficit: cumulative }).eq('id', activeGoal.id);
        }

        toast(`Recalculated ${entries.length} day${entries.length !== 1 ? 's' : ''}!`);
      } else {
        toast('Settings saved!');
      }

      await loadData(user.id, selectedDate);
      setShowCalcSettingsModal(false);
    } catch {
      toast('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const bmrActivityLabel = (m: number) => {
    if (m <= 1.05) return 'Sedentary (resting only)';
    if (m <= 1.275) return 'Very light activity';
    if (m <= 1.46) return 'Light activity';
    if (m <= 1.6) return 'Moderate activity';
    if (m <= 1.8) return 'Very active';
    return 'Extremely active';
  };

  const [selectedWeight, setSelectedWeight] = useState(0);

  // Date state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Load persisted calculation settings from DB, fall back to localStorage
    supabase
      .from('users')
      .select('calc_bmr_multiplier, calc_include_gym, calc_include_steps')
      .eq('id', parsedUser.id)
      .single()
      .then(({ data }) => {
        if (data && data.calc_bmr_multiplier !== null) {
          const settings = {
            bmrMultiplier: data.calc_bmr_multiplier ?? 1.0,
            includeGym: data.calc_include_gym ?? false,
            includeSteps: data.calc_include_steps ?? false,
          };
          setCalcSettings(settings);
          setDraft(settings);
          localStorage.setItem('progress_calc_settings', JSON.stringify(settings));
        }
      });

    loadData(parsedUser.id, selectedDate);
  }, [router, selectedDate]);

  const loadData = async (userId: string, date: string) => {
    try {
      // Load active goal
      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (goalData) {
        // Calculate cumulative deficits from all entries since goal start
        const { data: allEntries } = await supabase
          .from('daily_entries')
          .select('apparent_deficit, actual_deficit')
          .eq('user_id', userId)
          .gte('date', goalData.start_date)
          .not('apparent_deficit', 'is', null);
          
        if (allEntries) {
          const cumulativeApparent = allEntries.reduce((sum, e) => sum + (e.apparent_deficit || 0), 0);
          const cumulativeActual = allEntries.reduce((sum, e) => sum + (e.actual_deficit || 0), 0);
          
          // Update goal with cumulative values
          await supabase
            .from('goals')
            .update({
              cumulative_apparent_deficit: cumulativeApparent,
              cumulative_actual_deficit: cumulativeActual
            })
            .eq('id', goalData.id);
            
          // Update local state
          goalData.cumulative_apparent_deficit = cumulativeApparent;
          goalData.cumulative_actual_deficit = cumulativeActual;
        }
        
        setActiveGoal(goalData);
      }

      // Load selected date's daily entry
      const { data: entryData } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (entryData) {
        setDailyEntry(entryData);
        if (entryData.weight_kg) {
          setSelectedWeight(entryData.weight_kg);
        } else {
          // No weight for this day — fetch last tracked weight
          const { data: lastWeightEntry } = await supabase
            .from('daily_entries')
            .select('weight_kg')
            .eq('user_id', userId)
            .not('weight_kg', 'is', null)
            .lt('date', date)
            .order('date', { ascending: false })
            .limit(1)
            .single();
          setSelectedWeight(lastWeightEntry?.weight_kg || 0);
        }
      } else {
        setDailyEntry(null);
        // No entry at all — fetch last tracked weight
        const { data: lastWeightEntry } = await supabase
          .from('daily_entries')
          .select('weight_kg')
          .eq('user_id', userId)
          .not('weight_kg', 'is', null)
          .lt('date', date)
          .order('date', { ascending: false })
          .limit(1)
          .single();
        setSelectedWeight(lastWeightEntry?.weight_kg || 0);
      }

      // Load steps for selected date
      const { data: stepsData } = await supabase
        .from('steps_logs')
        .select('steps')
        .eq('user_id', userId)
        .eq('date', date)
        .single();
      setStepsCount(stepsData?.steps || 0);

      // Load ALL weight history
      const { data: historyData } = await supabase
        .from('daily_entries')
        .select('date, weight_kg')
        .eq('user_id', userId)
        .not('weight_kg', 'is', null)
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
    if (!user || selectedWeight <= 0) {
      toast('Please enter your weight');
      return;
    }

    setCalculating(true);

    try {
      const { data: entryData } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', selectedDate)
        .single();

      const caloriesIn = entryData?.total_calories_in || 0;
      const caloriesOut = entryData?.total_calories_out || 0;

      const baseBMR = calculateBMR(selectedWeight, user.height_cm, user.age, user.gender);
      const effectiveBMR = Math.round(baseBMR * calcSettings.bmrMultiplier);
      const gymCalories = calcSettings.includeGym ? caloriesOut : 0;
      const stepsCalories = calcSettings.includeSteps ? Math.round(stepsCount * 0.045) : 0;
      const netIntake = calculateNetIntake(caloriesIn, gymCalories + stepsCalories);
      const apparentDeficit = calculateApparentDeficit(effectiveBMR, netIntake);
      const bmr = baseBMR;

      // Save/update daily entry with weight and apparent deficit
      if (entryData) {
        await supabase
          .from('daily_entries')
          .update({
            weight_kg: selectedWeight,
            bmr: bmr,
            net_intake: netIntake,
            apparent_deficit: apparentDeficit,
          })
          .eq('id', entryData.id);
      } else {
        await supabase.from('daily_entries').insert({
          user_id: user.id,
          date: selectedDate,
          weight_kg: selectedWeight,
          bmr: bmr,
          total_calories_in: caloriesIn,
          total_calories_out: caloriesOut,
          net_intake: netIntake,
          apparent_deficit: apparentDeficit,
          water_glasses: 0,
        });
      }

      // Recalculate cumulative deficits for the goal
      if (activeGoal) {
        // Sum all apparent deficits since goal start up to selected date
        const { data: allEntries } = await supabase
          .from('daily_entries')
          .select('apparent_deficit, weight_kg, date')
          .eq('user_id', user.id)
          .gte('date', activeGoal.start_date)
          .lte('date', selectedDate)
          .not('apparent_deficit', 'is', null)
          .order('date', { ascending: false });
        
        if (allEntries) {
          const cumulativeApparent = allEntries.reduce((sum, e) => sum + (e.apparent_deficit || 0), 0);
          
          // Get most recent weight (could be from selected date or earlier)
          const latestWeight = allEntries.find(e => e.weight_kg)?.weight_kg || activeGoal.start_weight_kg;
          
          // Calculate actual deficit from weight change
          const cumulativeActual = calculateActualDeficit(
            activeGoal.start_weight_kg,
            parseFloat(latestWeight),
            activeGoal.goal_type
          );
          
          // Update goal with cumulative values
          await supabase
            .from('goals')
            .update({
              cumulative_apparent_deficit: cumulativeApparent,
              cumulative_actual_deficit: cumulativeActual,
              current_weight_kg: latestWeight
            })
            .eq('id', activeGoal.id);
        }
      }

      await loadData(user.id, selectedDate);
      toast('Saved!');
    } catch (error) {
      console.error('Error calculating:', error);
      toast('Failed to calculate');
    } finally {
      setCalculating(false);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="container-pixel">
        <p className="font-mono text-lg">Loading...</p>
      </div>
    );
  }

  const bmr = dailyEntry?.bmr || 0;
  const effectiveBMR = Math.round(bmr * calcSettings.bmrMultiplier);
  const caloriesIn = dailyEntry?.total_calories_in || 0;
  const caloriesOut = dailyEntry?.total_calories_out || 0;
  const netIntake = dailyEntry?.net_intake || 0;
  const apparentDeficit = dailyEntry?.apparent_deficit || 0;
  const apparentDeficitColor = getApparentDeficitColor(apparentDeficit, activeGoal?.goal_type);

  const progress = activeGoal && activeGoal.total_energy_kcal_needed
    ? calculateProgress(activeGoal.cumulative_actual_deficit || 0, activeGoal.total_energy_kcal_needed, activeGoal.goal_type)
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

  const tips = [
    {
      icon: Target,
      title: 'Stay Consistent',
      tip: 'Track your weight, food, and workouts daily for best results. Small daily actions lead to big changes.',
      color: '#B5DEFF'
    },
    {
      icon: Scale,
      title: 'Weigh Smart',
      tip: 'Weigh yourself at the same time each day (morning is best) for accurate tracking.',
      color: '#FFB5E8'
    },
    {
      icon: Zap,
      title: 'Calorie Accuracy',
      tip: 'Be honest with portion sizes. Underestimating food intake is the most common tracking mistake.',
      color: '#FFFFB5'
    },
    {
      icon: Calendar,
      title: 'Be Patient',
      tip: 'Healthy weight change is 0.5-1kg per week. Faster isn\'t always better for long-term success.',
      color: '#C1FBA4'
    },
  ];

  return (
    <div className="container-pixel">
      {/* Date Navigation */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="heading-pixel">{getPageTitle()}</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => changeDate(-1)} className="p-2 border-2 border-darkgray bg-white hover:bg-lavender">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <p className="font-mono text-lg">
              {selectedDate === today ? 'Today' : new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={today}
              className="text-pixel-xs border-2 border-darkgray p-1 mt-1"
            />
          </div>
          <button 
            onClick={() => changeDate(1)} 
            disabled={isToday}
            className={`p-2 border-2 border-darkgray ${isToday ? 'bg-gray-200 cursor-not-allowed' : 'bg-white hover:bg-lavender'}`}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <p className="font-mono text-lg mb-2">Track your daily {getBalanceLabel().toLowerCase()} and progress</p>
      <p className="text-pixel-xs text-darkgray/60 mb-6">Autosaved to your account.</p>

      {/* Weight Input & Calculate Button */}
      <Card title={`${isToday ? 'Today\'s' : 'Day\'s'} Weight & Calculation`} className="mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <Input
              type="number"
              label={`Weight for ${isToday ? 'Today' : new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (kg)`}
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(parseFloat(e.target.value))}
              placeholder="Enter your weight"
              step={0.1}
              min={0}
            />
          </div>
          <div className="flex items-center gap-4 pb-0.5">
            <Button onClick={handleCalculate} disabled={calculating || selectedWeight <= 0} className="flex-1">
              {calculating ? 'Calculating...' : dailyEntry?.apparent_deficit !== undefined && dailyEntry?.apparent_deficit !== null ? 'Recalculate' : `Calculate ${getBalanceLabel()}`}
            </Button>
            {dailyEntry?.apparent_deficit !== undefined && dailyEntry?.apparent_deficit !== null && (
              <Button onClick={handleCalculate} disabled={calculating} variant="secondary">
                <RefreshCw size={20} />
              </Button>
            )}
          </div>
        </div>
        <p className="font-mono text-sm text-darkgray/70 mt-4">
          Enter your weight and click Calculate to compute {isToday ? 'today\'s' : 'the'} {getBalanceLabel().toLowerCase()}. Click Recalculate if you update food or gym data.
        </p>
      </Card>

      {/* Day's Stats */}
      {dailyEntry && dailyEntry.apparent_deficit !== null && dailyEntry.apparent_deficit !== undefined && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-pixel-sm text-darkgray/70">
                  {calcSettings.bmrMultiplier > 1.0 ? 'Effective BMR' : 'Resting BMR'}
                </p>
                <span
                  className="inline-flex items-center justify-center cursor-help"
                  title={calcSettings.bmrMultiplier > 1.0
                    ? `Resting BMR (${bmr} cal) × ${calcSettings.bmrMultiplier.toFixed(2)} activity multiplier = ${effectiveBMR} cal effective`
                    : 'BMR is the calories your body burns at rest. We estimate it using the Mifflin-St Jeor formula.'}
                >
                  <Info size={14} className="text-darkgray/70" />
                </span>
              </div>
              <p className="font-mono text-2xl">{calcSettings.bmrMultiplier > 1.0 ? effectiveBMR : bmr}</p>
              <p className="font-mono text-xs text-darkgray/50">
                {calcSettings.bmrMultiplier > 1.0 ? `${bmr} × ${calcSettings.bmrMultiplier.toFixed(2)}` : 'cal/day'}
              </p>
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
            <Card style={{ backgroundColor: apparentDeficitColor }}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-pixel-sm text-darkgray/70">Daily {getBalanceLabel()}</p>
                <span
                  className="inline-flex items-center justify-center cursor-help"
                  title="Based on your food and gym tracking"
                >
                  <Info size={14} className="text-darkgray/70" />
                </span>
              </div>
              <p className="font-mono text-2xl font-bold">{apparentDeficit}</p>
              <p className="font-mono text-xs text-darkgray/50">{getApparentDeficitMessage(apparentDeficit, activeGoal?.goal_type || 'loss')}</p>
            </Card>
          </div>

        </>
      )}

      {/* Overall Progress */}
      {activeGoal && (
        <Card
          title="Overall Progress to Goal"
          className="mb-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-pixel-sm text-darkgray/70 mb-1">Start Weight</p>
              <p className="font-mono text-2xl font-bold">{activeGoal.start_weight_kg} kg</p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70 mb-1">Current Weight</p>
              <p className="font-mono text-2xl font-bold">{dailyEntry?.weight_kg || activeGoal.start_weight_kg} kg</p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70 mb-1">Goal Weight</p>
              <p className="font-mono text-2xl font-bold">{activeGoal.goal_weight_kg} kg</p>
            </div>
            {(() => {
              const startW = activeGoal.start_weight_kg;
              const currentW = dailyEntry?.weight_kg || activeGoal.start_weight_kg;
              const diff = startW - currentW;
              if (diff === 0 || startW === 0) return null;
              const pct = Math.abs((diff / startW) * 100).toFixed(1);
              const lost = activeGoal.goal_type === 'gain' ? diff < 0 : diff > 0;
              return (
                <div className="border-2 border-primary/30 bg-primary/10 p-3 rounded">
                  <p className="text-pixel-sm text-darkgray/70 mb-1">
                    {activeGoal.goal_type === 'gain' ? 'Body Weight Gained' : 'Body Weight Lost'}
                  </p>
                  <p className="font-mono text-2xl font-bold" style={{ color: lost ? '#2d7a2d' : '#c92a2a' }}>
                    {lost ? '-' : '+'}{pct}%
                  </p>
                  <p className="font-mono text-xs text-darkgray/50">of start weight</p>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-pixel-sm text-darkgray/70 mb-1">
                {activeGoal.goal_type === 'maintenance'
                  ? 'Daily Target'
                  : activeGoal.goal_type === 'loss'
                    ? 'Total Deficit Needed'
                    : 'Total Surplus Needed'}
              </p>
              <p className="font-mono text-xl">
                {activeGoal.goal_type === 'maintenance'
                  ? `${activeGoal.daily_target_kcal > 0 ? '+' : ''}${activeGoal.daily_target_kcal} kcal/day`
                  : `${activeGoal.total_energy_kcal_needed?.toLocaleString() || 0} cal`}
              </p>
            </div>
            <div className="border-2 border-primary/20 bg-primary/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-pixel-sm text-darkgray/70">Apparent (Food/Gym)</p>
                <span
                  className="inline-flex items-center justify-center cursor-help"
                  title="Cumulative deficit/surplus based on your daily food and gym tracking"
                >
                  <Info size={12} className="text-darkgray/70" />
                </span>
              </div>
              <p className="font-mono text-xl">
                {activeGoal.cumulative_apparent_deficit?.toLocaleString() || '0'} cal
              </p>
              <p className="text-pixel-xs text-darkgray/60 mt-1">
                {formatDeficitSurplus(activeGoal.cumulative_apparent_deficit || 0, activeGoal.goal_type)}
              </p>
            </div>
            <div className="border-2 border-success/20 bg-success/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-pixel-sm text-darkgray/70">Actual (Weight Change)</p>
                <span
                  className="inline-flex items-center justify-center cursor-help"
                  title="Cumulative deficit/surplus calculated from your actual weight change (1kg ≈ 7700 cal)"
                >
                  <Info size={12} className="text-darkgray/70" />
                </span>
              </div>
              <p className="font-mono text-xl font-bold">
                {activeGoal.cumulative_actual_deficit?.toLocaleString() || '0'} cal
              </p>
              <p className="text-pixel-xs text-darkgray/60 mt-1">
                {formatDeficitSurplus(activeGoal.cumulative_actual_deficit || 0, activeGoal.goal_type)}
              </p>
            </div>
          </div>

          <div className="mb-4">
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

          {/* Info Section */}
          <div className="mt-6 border-t-2 border-darkgray/20 pt-4">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
              <button
                onClick={() => setShowProgressInfo(!showProgressInfo)}
                className="flex items-center gap-2 text-pixel-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Info size={16} />
                <span className="underline">What's the difference between Apparent and Actual?</span>
              </button>
              <button
                type="button"
                onClick={openSettingsModal}
                className="flex items-center gap-1.5 text-pixel-sm text-darkgray/60 hover:text-darkgray transition-colors"
              >
                <Settings size={14} />
                <span className="underline">Calculation settings</span>
              </button>
            </div>

            {showProgressInfo && (
              <div className="mt-4 p-4 bg-accent/30 border-2 border-darkgray rounded-lg">
                <div className="space-y-3 font-mono text-sm">
                  <div>
                    <p className="font-bold mb-1">Apparent {getBalanceLabel()} (Food/Gym Based):</p>
                    <p className="text-darkgray/80">
                      This is calculated from your daily food intake and gym workouts. 
                      It's what your tracking <em>suggests</em> should happen based on the data you log.
                    </p>
                    <p className="text-xs text-darkgray/60 mt-1">
                      Formula: BMR - (Calories In - Calories Out from exercise)
                    </p>
                  </div>

                  <div>
                    <p className="font-bold mb-1">Actual {getBalanceLabel()} (Weight Based):</p>
                    <p className="text-darkgray/80">
                      This is calculated from your actual weight change. 
                      It represents what <em>really happened</em> to your body. 
                      We use the rule of thumb that 1 kg of body weight ≈ 7,700 calories.
                    </p>
                    <p className="text-xs text-darkgray/60 mt-1">
                      Formula: (Start Weight - Current Weight) × 7,700 cal/kg
                    </p>
                  </div>

                  <div className="pt-2 border-t border-darkgray/20">
                    <p className="font-bold mb-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      Why might they differ?
                    </p>
                    <ul className="text-xs text-darkgray/70 space-y-1 ml-4">
                      <li>• Inaccurate food logging (portion sizes, hidden calories)</li>
                      <li>• Water retention or loss (not fat)</li>
                      <li>• Overestimating calories burned during exercise</li>
                      <li>• Metabolic adaptation over time</li>
                      <li>• Natural weight fluctuations</li>
                    </ul>
                    <p className="text-xs text-darkgray/70 mt-2">
                      Progress is based on <strong>Actual</strong> weight change since that's what truly matters!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Weight Chart */}
      {weightHistory.length > 0 && (
        <Card title="Progress" className="mb-6">
          <WeightChart data={weightHistory} goal={activeGoal} />
        </Card>
      )}

      {/* BMI Quick Check */}
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

      {/* How It's Calculated */}
      {dailyEntry && dailyEntry.apparent_deficit !== null && dailyEntry.apparent_deficit !== undefined && (
        <Card title={`How It's Calculated (${calcSettings.bmrMultiplier > 1.0 ? 'Effective BMR' : 'Resting BMR'})`} className="mb-6">
          <div className="font-mono text-sm space-y-2">
            <p>
              BMR (Mifflin-St Jeor): (10 × {selectedWeight}kg) + (6.25 × {user?.height_cm}cm) - (5 × {user?.age}) {user?.gender === 'male' ? '+ 5' : '- 161'} ={' '}
              <strong>{bmr} cal</strong>
            </p>
            {calcSettings.bmrMultiplier > 1.0 && (
              <p>
                Activity multiplier: {bmr} (resting BMR) × <strong>{calcSettings.bmrMultiplier.toFixed(2)}</strong> ({bmrActivityLabel(calcSettings.bmrMultiplier)}) ={' '}
                <strong style={{ color: '#2d7a2d' }}>{effectiveBMR} cal effective</strong>
              </p>
            )}
            <p>
              Net Intake: {caloriesIn} (food){calcSettings.includeGym && caloriesOut > 0 ? ` - ${caloriesOut} (gym)` : ''} = <strong>{netIntake} cal</strong>
            </p>
            <p>
              Apparent {getBalanceLabel()}: {effectiveBMR} ({calcSettings.bmrMultiplier > 1.0 ? 'effective BMR' : 'BMR'}) - {netIntake} (net) ={' '}
              <strong style={{ color: apparentDeficit >= 0 ? '#2d7a2d' : '#c92a2a' }}>{apparentDeficit} cal</strong>
            </p>
            <p className="text-darkgray/70 text-xs mt-2">
              This is what your food/gym tracking suggests. Your actual deficit/surplus is calculated from weight change.
            </p>
          </div>
        </Card>
      )}

      {/* Tips Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={24} className="text-primary" />
          <h2 className="text-pixel-lg">Progress Tips</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((tip, i) => {
            const IconComponent = tip.icon;
            return (
              <Card key={i} className="hover:shadow-lg transition-all">
                <div className="flex gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-darkgray shrink-0"
                    style={{ backgroundColor: tip.color }}
                  >
                    <IconComponent size={24} className="text-darkgray" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-base mb-1">{tip.title}</h3>
                    <p className="text-pixel-xs text-darkgray/80 leading-relaxed">{tip.tip}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {(!dailyEntry?.apparent_deficit && dailyEntry?.apparent_deficit !== 0) && (
        <Card>
          <div className="text-center py-8">
            <TrendingDown size={48} className="mx-auto mb-4 text-darkgray/30" />
            <p className="font-mono text-lg text-darkgray/70 mb-2">Nothing calculated for this day</p>
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

      {/* ── Calculation Settings Modal ── */}
      {showCalcSettingsModal && (
        <>
          {/* Backdrop — own layer, below modal */}
          <div
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: 50 }}
            onClick={() => !savingSettings && setShowCalcSettingsModal(false)}
          />
          {/* Modal — own layer, above backdrop, pointer-events only on content */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
            style={{ zIndex: 51 }}
          >
          <div className="bg-white border-4 border-darkgray max-w-md w-full shadow-pixel pointer-events-auto">
            <div className="sticky top-0 bg-white border-b-4 border-darkgray p-4 flex justify-between items-center">
              <h2 className="heading-pixel text-xl flex items-center gap-2">
                <Settings size={18} /> Calculation Settings
              </h2>
              <button
                onClick={() => setShowCalcSettingsModal(false)}
                disabled={savingSettings}
                className="p-2 border-2 border-darkgray bg-warning hover:bg-warning/70 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* BMR Multiplier */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-pixel-sm text-darkgray/80">BMR Activity Multiplier</p>
                  <span className="font-mono text-base font-bold">{calcSettings.bmrMultiplier.toFixed(2)}×</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={2.0}
                  step={0.025}
                  value={draft.bmrMultiplier}
                  onChange={e => setDraft(d => ({ ...d, bmrMultiplier: parseFloat(e.target.value) }))}
                  className="w-full accent-primary mb-1"
                />
                <div className="flex justify-between text-pixel-xs text-darkgray/40">
                  <span>1.0× Sedentary</span>
                  <span className="font-mono text-xs text-darkgray/70">{bmrActivityLabel(draft.bmrMultiplier)}</span>
                  <span>2.0× Extreme</span>
                </div>
                <p className="text-pixel-xs text-darkgray/50 mt-2">
                  Resting BMR ({bmr} cal) × {draft.bmrMultiplier.toFixed(2)} = <strong>{Math.round(bmr * draft.bmrMultiplier)} cal effective</strong>
                </p>
              </div>

              {/* Include Gym */}
              <button
                type="button"
                onClick={() => setDraft(d => ({ ...d, includeGym: !d.includeGym }))}
                className={`w-full p-3 border-2 text-left transition-all ${
                  draft.includeGym ? 'border-success' : 'border-darkgray bg-white hover:bg-lavender'
                }`}
                style={{ backgroundColor: draft.includeGym ? '#C1FBA4' : undefined }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 border-[3px] flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: draft.includeGym ? '#2d2d2d' : '#ffffff',
                      borderColor: draft.includeGym ? '#2d2d2d' : '#4A4A4A',
                    }}
                  >
                    {draft.includeGym && <span className="text-white text-xl font-black leading-none">✓</span>}
                  </div>
                  <div>
                    <p className="font-mono text-sm font-bold">Include gym calories burned</p>
                    <p className="text-pixel-xs text-darkgray/60">Subtracts workout calories from net intake</p>
                  </div>
                </div>
              </button>

              {/* Include Steps */}
              <button
                type="button"
                onClick={() => setDraft(d => ({ ...d, includeSteps: !d.includeSteps }))}
                className={`w-full p-3 border-2 text-left transition-all ${
                  draft.includeSteps ? 'border-success' : 'border-darkgray bg-white hover:bg-lavender'
                }`}
                style={{ backgroundColor: draft.includeSteps ? '#C1FBA4' : undefined }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 border-[3px] flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: draft.includeSteps ? '#2d2d2d' : '#ffffff',
                      borderColor: draft.includeSteps ? '#2d2d2d' : '#4A4A4A',
                    }}
                  >
                    {draft.includeSteps && <span className="text-white text-xl font-black leading-none">✓</span>}
                  </div>
                  <div>
                    <p className="font-mono text-sm font-bold">Include steps calories burned</p>
                    <p className="text-pixel-xs text-darkgray/60">≈45 cal per 1,000 steps</p>
                  </div>
                </div>
              </button>

              <p className="text-pixel-xs text-darkgray/40 italic border-t-2 border-darkgray/10 pt-4">
                Saving will recalculate every previously tracked day using these settings.
              </p>

              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full btn-pixel-success py-3 font-mono font-bold text-base disabled:opacity-60"
              >
                {savingSettings ? 'Recalculating all days…' : 'Save & Recalculate All'}
              </button>
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
}