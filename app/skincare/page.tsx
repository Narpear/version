'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { User, SkincareLog } from '@/types';
import { Sparkles, TrendingUp, CheckCircle2, Sun, Moon, Dumbbell, Info, Smile } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface DailySkincare {
  date: string;
  completed_routines: number;
}

export default function SkincarePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<SkincareLog[]>([]);
  const [weeklyData, setWeeklyData] = useState<DailySkincare[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const routines = [
    { 
      id: 'pre_gym', 
      label: 'Pre Gym', 
      icon: Dumbbell,
      color: '#FFFFB5',
      steps: [
        { id: 'cleansing_done', label: 'Cleansing' },
        { id: 'moisturizer_done', label: 'Moisturizer' },
      ]
    },
    { 
      id: 'post_shower', 
      label: 'Post Shower', 
      icon: Sun,
      color: '#B5DEFF',
      steps: [
        { id: 'cleansing_done', label: 'Cleansing' },
        { id: 'serum_done', label: 'Serum' },
        { id: 'moisturizer_done', label: 'Moisturizer' },
      ]
    },
    { 
      id: 'bedtime', 
      label: 'Bedtime', 
      icon: Moon,
      color: '#FFB5E8',
      steps: [
        { id: 'cleansing_done', label: 'Cleansing' },
        { id: 'serum_done', label: 'Serum' },
        { id: 'moisturizer_done', label: 'Moisturizer' },
      ]
    },
  ] as const;

  const skincareTips = [
    {
      icon: Sun,
      title: 'Morning Routine',
      tip: 'Always apply sunscreen as the last step in your morning routine, even on cloudy days.',
      color: '#B5DEFF'
    },
    {
      icon: Moon,
      title: 'Night Care',
      tip: 'Your skin repairs itself at night. Use richer products and active ingredients before bed.',
      color: '#FFB5E8'
    },
    {
      icon: Sparkles,
      title: 'Consistency',
      tip: 'Results take time. Stick to your routine for at least 6-8 weeks to see real changes.',
      color: '#C1FBA4'
    },
    {
      icon: Smile,
      title: 'Hydration',
      tip: 'Drinking water and using moisturizer work together for healthy, glowing skin.',
      color: '#FFFFB5'
    },
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadSkincareData(parsedUser.id);
  }, [router]);

  const loadSkincareData = async (userId: string) => {
    try {
      // Get today's logs
      const { data, error } = await supabase
        .from('skincare_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today);

      if (data) {
        setLogs(data);
      }

      // Get last 7 days for chart
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];

      const { data: weekData } = await supabase
        .from('skincare_logs')
        .select('date, time_of_day, cleansing_done, serum_done, moisturizer_done')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', today)
        .order('date', { ascending: true });

      if (weekData) {
        // Group by date and count completed routines
        const dailyCompletion: { [key: string]: number } = {};
        
        weekData.forEach(log => {
          const routine = routines.find(r => r.id === log.time_of_day);
          if (!routine) return;
          
          const isComplete = routine.steps.every(step => log[step.id as keyof typeof log] === true);
          if (isComplete) {
            dailyCompletion[log.date] = (dailyCompletion[log.date] || 0) + 1;
          }
        });

        // Fill in all 7 days
        const allDays: DailySkincare[] = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const dateStr = date.toISOString().split('T')[0];
          allDays.push({
            date: dateStr,
            completed_routines: dailyCompletion[dateStr] || 0
          });
        }
        setWeeklyData(allDays);
      }
    } catch (error) {
      console.log('Error loading skincare data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoutineLog = (timeOfDay: string) => {
    return logs.find(log => log.time_of_day === timeOfDay);
  };

  const toggleStep = async (timeOfDay: string, stepKey: string) => {
    if (!user) return;

    try {
      const existingLog = getRoutineLog(timeOfDay);

      if (existingLog) {
        const updated = {
          ...existingLog,
          [stepKey]: !existingLog[stepKey as keyof SkincareLog],
        };

        await supabase
          .from('skincare_logs')
          .update(updated)
          .eq('id', existingLog.id);

        setLogs(logs.map(log => log.id === existingLog.id ? updated : log));
        toast('Saved!');
      } else {
        const newLog = {
          user_id: user.id,
          date: today,
          time_of_day: timeOfDay,
          cleansing_done: stepKey === 'cleansing_done',
          serum_done: stepKey === 'serum_done',
          moisturizer_done: stepKey === 'moisturizer_done',
          gua_sha_done: stepKey === 'gua_sha_done',
        };

        const { data, error } = await supabase
          .from('skincare_logs')
          .insert(newLog)
          .select()
          .single();

        if (data) {
          setLogs([...logs, data]);
          toast('Saved!');
        }
      }
    } catch (error) {
      console.error('Error updating skincare:', error);
      alert('Failed to update skincare routine');
    }
  };

  const guaShaToday = logs.some(log => log.gua_sha_done);

  const toggleGuaSha = async () => {
    if (!user) return;

    try {
      const existing = logs.find(l => l.gua_sha_done);
      if (existing) {
        const updated = { ...existing, gua_sha_done: false };
        await supabase.from('skincare_logs').update({ gua_sha_done: false }).eq('id', existing.id);
        setLogs(logs.map(l => (l.id === existing.id ? updated : l)));
        toast('Saved!');
        return;
      }

      const bedtimeLog = getRoutineLog('bedtime');
      if (bedtimeLog) {
        const updated = { ...bedtimeLog, gua_sha_done: true };
        await supabase.from('skincare_logs').update({ gua_sha_done: true }).eq('id', bedtimeLog.id);
        setLogs(logs.map(l => (l.id === bedtimeLog.id ? updated : l)));
        toast('Saved!');
      } else {
        const newLog = {
          user_id: user.id,
          date: today,
          time_of_day: 'bedtime',
          cleansing_done: false,
          serum_done: false,
          moisturizer_done: false,
          gua_sha_done: true,
        };

        const { data } = await supabase.from('skincare_logs').insert(newLog).select().single();
        if (data) setLogs([...logs, data]);
        toast('Saved!');
      }
    } catch (error) {
      console.error('Error updating gua sha:', error);
      alert('Failed to update gua sha');
    }
  };

  if (loading) {
    return (
      <div className="container-pixel">
        <p className="font-mono text-lg">Loading...</p>
      </div>
    );
  }

  const completedRoutines = logs.filter(log => {
    const routine = routines.find(r => r.id === log.time_of_day);
    if (!routine) return false;
    return routine.steps.every(step => log[step.id as keyof SkincareLog] === true);
  }).length;

  const totalSteps = logs.reduce((sum, log) => {
    const routine = routines.find(r => r.id === log.time_of_day);
    if (!routine) return sum;
    return sum + routine.steps.filter(step => log[step.id as keyof SkincareLog] === true).length;
  }, 0);

  const weeklyAverage = weeklyData.length > 0 
    ? (weeklyData.reduce((sum, d) => sum + d.completed_routines, 0) / weeklyData.length).toFixed(1)
    : '0';

  return (
    <div className="container-pixel">
      <h1 className="heading-pixel">Skincare Tracker</h1>
      <p className="font-mono text-lg mb-6">Consistency is key for healthy, glowing skin</p>

      {/* Gua Sha Card */}
      <Card title="Gua Sha (Daily Practice)" className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-lg mb-1">
              Status: <span className={`font-bold ${guaShaToday ? 'text-success' : 'text-darkgray'}`}>
                {guaShaToday ? '✓ Done' : 'Not done'}
              </span>
            </p>
            <p className="font-mono text-sm text-darkgray/70">Do it once anytime - morning or evening</p>
          </div>
          <button
            onClick={toggleGuaSha}
            className={`px-6 py-3 border-2 font-mono text-lg transition-all ${
              guaShaToday 
                ? 'bg-success border-success text-darkgray font-bold' 
                : 'bg-white border-darkgray hover:bg-lavender'
            }`}
          >
            {guaShaToday ? 'Undo' : 'Mark Done'}
          </button>
        </div>
      </Card>

      {/* Routine Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {routines.map((routine) => {
          const log = getRoutineLog(routine.id);
          const relevantSteps = routine.steps;
          const completedSteps = log 
            ? relevantSteps.filter(step => log[step.id as keyof SkincareLog] === true).length
            : 0;
          const isComplete = completedSteps === relevantSteps.length;
          const IconComponent = routine.icon;

          return (
            <Card key={routine.id}>
              <div className="flex items-center gap-2 mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-darkgray"
                  style={{ backgroundColor: routine.color }}
                >
                  <IconComponent size={20} className="text-darkgray" />
                </div>
                <h3 className="font-mono font-bold text-lg">{routine.label}</h3>
              </div>

              <div className="space-y-3 mb-4">
                {relevantSteps.map((step) => {
                  const isChecked = log?.[step.id as keyof SkincareLog] === true;

                  return (
                    <button
                      key={step.id}
                      onClick={() => toggleStep(routine.id, step.id)}
                      className={`w-full p-3 border-2 text-left transition-all ${
                        isChecked 
                          ? 'border-success' 
                          : 'bg-white border-darkgray hover:bg-lavender'
                      }`}
                      style={{
                        backgroundColor: isChecked ? routine.color : undefined
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-6 h-6 border-[3px] flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: isChecked ? '#2d2d2d' : '#ffffff',
                            borderColor: isChecked ? '#2d2d2d' : '#4A4A4A'
                          }}
                        >
                          {isChecked ? (
                            <span className="text-white text-xl font-black leading-none">✓</span>
                          ) : null}
                        </div>
                        <span className={`font-mono text-base ${
                          isChecked ? 'font-bold' : ''
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Progress */}
              <div>
                <p className="text-pixel-xs mb-2">
                  {completedSteps} of {relevantSteps.length} steps
                </p>
                <div className="progress-pixel h-3">
                  <div 
                    className="h-full transition-all"
                    style={{ 
                      width: `${(completedSteps / relevantSteps.length) * 100}%`,
                      backgroundColor: isComplete ? '#C1FBA4' : routine.color,
                      borderRight: completedSteps > 0 ? '2px solid #4A4A4A' : 'none'
                    }}
                  />
                </div>
              </div>

              {isComplete && (
                <div className="mt-3 text-center">
                  <p className="font-mono text-sm text-success font-bold">✓ Complete</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card title="Today's Progress">
          <div className="text-center py-2">
            <p className="text-4xl font-bold font-mono text-primary">
              {completedRoutines}
            </p>
            <p className="text-sm font-mono text-darkgray/70 mt-1">of {routines.length} routines</p>
            <p className="text-xs font-mono text-darkgray/70">{totalSteps} total steps</p>
          </div>
        </Card>

        <Card title="Weekly Average">
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp size={24} className="text-secondary" />
              <p className="text-4xl font-bold font-mono text-secondary">
                {weeklyAverage}
              </p>
            </div>
            <p className="text-sm font-mono text-darkgray/70 mt-1">routines per day</p>
          </div>
        </Card>

        <Card title="Consistency">
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 size={32} className={completedRoutines === routines.length ? 'text-success fill-current' : 'text-darkgray/40'} />
            </div>
            <p className={`text-lg font-bold font-mono ${completedRoutines === routines.length ? 'text-success' : 'text-darkgray/70'}`}>
              {completedRoutines === routines.length ? 'All Done!' : 'Keep Going'}
            </p>
          </div>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card title="7-Day Routine Completion" className="mb-6">
        <div className="flex items-end justify-between gap-2 h-40 mb-4">
          {weeklyData.map((day) => {
            const dayHeight = (day.completed_routines / routines.length) * 100;
            const isToday = day.date === today;
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const allComplete = day.completed_routines === routines.length;

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-center mb-1">
                  <p className="text-pixel-xs font-bold">{day.completed_routines}</p>
                </div>
                <div 
                  className="w-full border-2 border-darkgray relative transition-all hover:opacity-80"
                  style={{ 
                    height: `${Math.max(dayHeight, 10)}%`,
                    backgroundColor: isToday ? '#FFB5E8' : allComplete ? '#C1FBA4' : '#B5DEFF'
                  }}
                >
                  {day.completed_routines > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles size={14} className="text-darkgray/30" />
                    </div>
                  )}
                </div>
                <p className={`text-pixel-xs ${isToday ? 'font-bold' : 'text-darkgray/70'}`}>
                  {dayName}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-6 text-pixel-xs flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#C1FBA4] border border-darkgray"></div>
            <span>All routines</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#B5DEFF] border border-darkgray"></div>
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#FFB5E8] border border-darkgray"></div>
            <span>Today</span>
          </div>
        </div>
      </Card>

      {/* Skincare Tips */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={24} className="text-primary" />
          <h2 className="text-pixel-lg">Skincare Tips</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skincareTips.map((tip, i) => {
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

      {/* General Tips */}
      <Card className="bg-lavender/30">
        <div className="flex gap-4">
          <Sparkles size={32} className="text-primary shrink-0 mt-1" />
          <div>
            <h3 className="font-mono font-bold text-lg mb-3">Remember</h3>
            <ul className="text-pixel-sm space-y-2 text-darkgray/90">
              <li>• Patch test new products before adding them to your routine</li>
              <li>• Wait 30-60 seconds between applying different products</li>
              <li>• Less is more - don't overload your skin with too many products</li>
              <li>• Your skin changes with seasons - adjust your routine accordingly</li>
              <li>• Take progress photos to track improvements over time</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}