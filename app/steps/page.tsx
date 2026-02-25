'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { Footprints, TrendingUp, CheckCircle2, Zap, Heart, Brain, Sun, Target, Activity, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DailySteps {
  date: string;
  steps: number;
  displayDate: string;
}

const DEFAULT_STEP_GOAL = 8000;

const stepsFacts = [
  { icon: Heart, title: 'Heart Health', fact: '8,000 steps a day is associated with a significantly lower risk of cardiovascular disease.', color: '#FFB5E8' },
  { icon: Brain, title: 'Mental Boost', fact: 'Walking increases blood flow to the brain and can improve mood, focus, and memory.', color: '#B5DEFF' },
  { icon: Zap, title: 'Calorie Burn', fact: 'On average, 1,000 steps burns around 40–50 calories depending on your weight and pace.', color: '#FFFFB5' },
  { icon: Sun, title: 'Daily Movement', fact: 'Breaking up sitting with short walks every hour has measurable metabolic benefits.', color: '#C1FBA4' },
  { icon: Target, title: 'Longevity', fact: 'Studies show people hitting 8,000+ steps daily have lower all-cause mortality rates.', color: '#FFB5E8' },
  { icon: Activity, title: 'Blood Sugar', fact: 'A 10-minute walk after meals can reduce blood sugar spikes by up to 22%.', color: '#B5DEFF' },
];

export default function StepsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [steps, setSteps] = useState(0);
  const [inputSteps, setInputSteps] = useState('0');
  const [weeklyData, setWeeklyData] = useState<DailySteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Goal state
  const [stepGoal, setStepGoal] = useState<number | null>(null); // null = not set yet
  const [goalInput, setGoalInput] = useState('8000');
  const [editingGoal, setEditingGoal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

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
    loadData(parsedUser.id, selectedDate);
  }, [router, selectedDate]);

  const loadData = async (userId: string, date: string) => {
    try {
      // Load user's steps goal
      const { data: userData } = await supabase
        .from('users')
        .select('steps_goal')
        .eq('id', userId)
        .single();

      if (userData?.steps_goal) {
        setStepGoal(userData.steps_goal);
        setGoalInput(String(userData.steps_goal));
      } else {
        setStepGoal(null); // triggers first-time setup screen
      }

      // Load selected date's steps
      const { data: dateData } = await supabase
        .from('steps_logs')
        .select('steps')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (dateData) {
        setSteps(dateData.steps || 0);
        setInputSteps(String(dateData.steps || 0));
      } else {
        setSteps(0);
        setInputSteps('0');
      }

      // Load last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];

      const { data: weekData } = await supabase
        .from('steps_logs')
        .select('date, steps')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', today)
        .order('date', { ascending: true });

      const allDays: DailySteps[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const existing = weekData?.find(e => e.date === dateStr);
        allDays.push({
          date: dateStr,
          steps: existing?.steps || 0,
          displayDate: d.toLocaleDateString('en-US', { weekday: 'short' }),
        });
      }
      setWeeklyData(allDays);
    } catch (error) {
      console.log('Error loading steps data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGoal = async () => {
    if (!user) return;
    const val = parseInt(goalInput);
    if (isNaN(val) || val < 1000 || val > 100000) {
      toast('Please enter a goal between 1,000 and 100,000');
      return;
    }
    setSavingGoal(true);
    try {
      await supabase
        .from('users')
        .update({ steps_goal: val })
        .eq('id', user.id);

      // Update localStorage too so User type stays fresh
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({ ...parsed, steps_goal: val }));
      }

      setStepGoal(val);
      setEditingGoal(false);
      toast('Goal saved!');
    } catch (error) {
      console.error('Error saving goal:', error);
      toast('Failed to save goal');
    } finally {
      setSavingGoal(false);
    }
  };

  const saveSteps = async (newSteps: number) => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('steps_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', selectedDate)
        .single();

      if (existing) {
        await supabase.from('steps_logs').update({ steps: newSteps }).eq('id', existing.id);
      } else {
        await supabase.from('steps_logs').insert({ user_id: user.id, date: selectedDate, steps: newSteps });
      }

      setSteps(newSteps);
      setInputSteps(String(newSteps));
      setWeeklyData(prev =>
        prev.map(d => d.date === selectedDate ? { ...d, steps: newSteps } : d)
      );
      toast('Saved!');
    } catch (error) {
      console.error('Error saving steps:', error);
      toast('Failed to save steps');
    } finally {
      setSaving(false);
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

  // First-time setup screen
  if (stepGoal === null) {
    return (
      <div className="container-pixel">
        <h1 className="heading-pixel mb-6">Steps Tracker</h1>
        <Card title="Set Your Daily Steps Goal">
          <div className="text-center py-4 mb-6">
            <Footprints size={48} className="mx-auto mb-4 text-darkgray/40" />
            <p className="font-mono text-lg mb-2">Let's set your daily step goal.</p>
            <p className="font-mono text-sm text-darkgray/60 mb-6">
              The NHS and most health guidelines recommend 8,000–10,000 steps per day. You can change this anytime.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[5000, 7500, 8000, 10000, 12000, 15000].map(preset => (
                <button
                  key={preset}
                  onClick={() => setGoalInput(String(preset))}
                  className={`p-3 border-2 font-mono text-base transition-all ${
                    goalInput === String(preset)
                      ? 'bg-primary border-darkgray font-bold'
                      : 'bg-white border-darkgray hover:bg-lavender'
                  }`}
                >
                  {preset.toLocaleString()}
                  {preset === 8000 && <span className="block text-pixel-xs text-darkgray/60">recommended</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-3 items-end max-w-xs mx-auto mb-6">
              <div className="flex-1">
                <Input
                  type="number"
                  label="Or enter custom goal"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="e.g. 9000"
                  min={1000}
                />
              </div>
            </div>
            <Button onClick={saveGoal} disabled={savingGoal} className="w-full max-w-xs">
              {savingGoal ? 'Saving...' : 'Set Goal & Start Tracking'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const GOAL = stepGoal;
  const percentage = Math.min((steps / GOAL) * 100, 100);
  const isComplete = steps >= GOAL;
  const weeklyAverage = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((sum, d) => sum + d.steps, 0) / weeklyData.length)
    : 0;
  const daysHitGoal = weeklyData.filter(d => d.steps >= GOAL).length;

  return (
    <div className="container-pixel">
      {/* Date Navigation */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="heading-pixel">Steps Tracker</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => changeDate(-1)} className="p-2 border-2 border-darkgray bg-white hover:bg-lavender">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <p className="font-mono text-lg">
              {isToday ? 'Today' : new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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

      <div className="flex items-center justify-between mb-6">
        <p className="font-mono text-lg">Goal: {GOAL.toLocaleString()} steps per day</p>
        <button
          onClick={() => { setEditingGoal(true); setGoalInput(String(GOAL)); }}
          className="flex items-center gap-2 p-2 border-2 border-darkgray bg-white hover:bg-lavender font-mono text-sm"
        >
          <Settings size={16} />
          Change Goal
        </button>
      </div>

      {/* Edit goal inline modal */}
      {editingGoal && (
        <Card title="Update Steps Goal" className="mb-6">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[5000, 7500, 8000, 10000, 12000, 15000].map(preset => (
              <button
                key={preset}
                onClick={() => setGoalInput(String(preset))}
                className={`p-3 border-2 font-mono text-sm transition-all ${
                  goalInput === String(preset)
                    ? 'bg-primary border-darkgray font-bold'
                    : 'bg-white border-darkgray hover:bg-lavender'
                }`}
              >
                {preset.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                type="number"
                label="Custom goal"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                min={1000}
              />
            </div>
            <Button onClick={saveGoal} disabled={savingGoal}>
              {savingGoal ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={() => setEditingGoal(false)} variant="secondary">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Main Tracker Card */}
      <Card title={`${isToday ? "Today's" : "Day's"} Steps`} className="mb-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Footprints size={40} className={isComplete ? 'text-success' : 'text-darkgray/40'} />
            <p className="font-mono text-6xl font-bold transition-all" style={{ color: isComplete ? '#2d7a2d' : '#4A4A4A' }}>
              {steps.toLocaleString()}
            </p>
          </div>
          <p className="font-mono text-sm text-darkgray/60">of {GOAL.toLocaleString()} steps</p>
          {isComplete && (
            <div className="mt-3">
              <p className="font-mono text-lg text-success font-bold">Daily goal complete!</p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="progress-pixel h-6">
            <div
              className="h-full transition-all"
              style={{
                width: `${percentage}%`,
                backgroundColor: isComplete ? '#C1FBA4' : '#B5DEFF',
                borderRight: percentage > 0 ? '2px solid #4A4A4A' : 'none',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-pixel-xs text-darkgray/50">0</p>
            <p className="text-pixel-xs text-darkgray/50">{Math.round(GOAL / 2).toLocaleString()}</p>
            <p className="text-pixel-xs text-darkgray/50">{GOAL.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {[500, 1000, 2000, 5000].map(n => (
            <button
              key={n}
              onClick={() => saveSteps(steps + n)}
              disabled={saving}
              className="p-2 border-2 border-darkgray bg-white hover:bg-lavender font-mono text-sm transition-all"
            >
              +{n >= 1000 ? `${n / 1000}k` : n}
            </button>
          ))}
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              type="number"
              label="Set exact steps"
              value={inputSteps}
              onChange={(e) => setInputSteps(e.target.value)}
              placeholder="e.g. 7500"
              min={0}
            />
          </div>
          <Button
            onClick={() => {
              const val = parseInt(inputSteps);
              if (!isNaN(val) && val >= 0) saveSteps(val);
            }}
            disabled={saving}
          >
            Set
          </Button>
          <Button
            onClick={() => saveSteps(Math.max(0, steps - 500))}
            disabled={saving || steps === 0}
            variant="secondary"
          >
            -500
          </Button>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card title={`${isToday ? "Today's" : "Day's"} Progress`}>
          <div className="text-center py-2">
            <p className="text-4xl font-bold font-mono" style={{ color: isComplete ? '#C1FBA4' : '#B5DEFF' }}>
              {steps.toLocaleString()}
            </p>
            <p className="text-sm font-mono text-darkgray/70 mt-1">of {GOAL.toLocaleString()}</p>
            <p className="text-sm font-mono text-darkgray/70">~{Math.round(steps * 0.045)} cal burned</p>
          </div>
        </Card>

        <Card title="7-Day Average">
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp size={24} className="text-secondary" />
              <p className="text-4xl font-bold font-mono text-secondary">{weeklyAverage.toLocaleString()}</p>
            </div>
            <p className="text-sm font-mono text-darkgray/70 mt-1">steps per day</p>
          </div>
        </Card>

        <Card title="Goal Days">
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2
                size={32}
                className={daysHitGoal >= 5 ? 'text-success fill-current' : 'text-darkgray/40'}
              />
            </div>
            <p className={`text-lg font-bold font-mono ${daysHitGoal >= 5 ? 'text-success' : 'text-secondary'}`}>
              {daysHitGoal}/7 days
            </p>
          </div>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card title="7-Day Steps Trend" className="mb-6">
        <div className="w-full h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData} margin={{ top: 10, right: 100, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="stepsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B5DEFF" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#B5DEFF" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A4A4A" opacity={0.15} />
              <XAxis dataKey="displayDate" stroke="#4A4A4A" style={{ fontSize: '12px', fontFamily: 'VT323, monospace' }} />
              <YAxis
                stroke="#4A4A4A"
                style={{ fontSize: '12px', fontFamily: 'VT323, monospace' }}
                tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFF9F0', border: '2px solid #4A4A4A', fontFamily: 'VT323, monospace', fontSize: '16px' }}
                formatter={(value: any) => [value.toLocaleString(), 'Steps']}
                labelFormatter={(label) => `Day: ${label}`}
              />
              <ReferenceLine
                y={GOAL}
                stroke="#C1FBA4"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: `Goal: ${GOAL.toLocaleString()}`,
                  position: 'right',
                  style: { fontFamily: 'VT323, monospace', fontSize: '13px', fill: '#2C7A2C' },
                }}
              />
              <Area
                type="monotone"
                dataKey="steps"
                stroke="#B5DEFF"
                strokeWidth={2}
                fill="url(#stepsFill)"
                dot={{ fill: '#B5DEFF', strokeWidth: 2, r: 4, stroke: '#4A4A4A' }}
                activeDot={{ r: 7 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 text-pixel-xs flex-wrap mt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#C1FBA4] border border-darkgray"></div>
            <span>Your goal ({GOAL.toLocaleString()} steps)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#B5DEFF] border border-darkgray"></div>
            <span>Daily steps</span>
          </div>
        </div>
      </Card>

      {/* Facts + Tips unchanged from before */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Footprints size={24} className="text-primary" />
          <h2 className="text-pixel-lg">Why Steps Matter</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stepsFacts.map((fact, i) => {
            const IconComponent = fact.icon;
            return (
              <Card key={i} className="hover:shadow-lg transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 border-2 border-darkgray" style={{ backgroundColor: fact.color }}>
                    <IconComponent size={32} className="text-darkgray" />
                  </div>
                  <h3 className="font-mono font-bold text-lg mb-2">{fact.title}</h3>
                  <p className="text-pixel-xs text-darkgray/80 leading-relaxed">{fact.fact}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="bg-lavender/30">
        <div className="flex gap-4">
          <Footprints size={32} className="text-primary shrink-0 mt-1" />
          <div>
            <h3 className="font-mono font-bold text-lg mb-3">Tips to Hit Your Goal</h3>
            <ul className="text-pixel-sm space-y-2 text-darkgray/90">
              <li>• Take the stairs instead of the elevator whenever possible</li>
              <li>• Park further away or get off public transport one stop early</li>
              <li>• Walk during phone calls instead of sitting</li>
              <li>• Set a reminder every hour to get up and move for 5 minutes</li>
              <li>• A 10-minute walk after each meal adds ~3,000 steps easily</li>
              <li>• Walk to grab lunch or coffee instead of ordering in</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}