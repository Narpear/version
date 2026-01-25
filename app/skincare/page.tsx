'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { User, SkincareLog } from '@/types';
import { Sparkles } from 'lucide-react';

export default function SkincarePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<SkincareLog[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const routines = [
    { 
      id: 'pre_gym', 
      label: 'Pre Gym', 
      icon: '💪',
      steps: [
        { id: 'cleansing_done', label: 'Cleansing' },
        { id: 'moisturizer_done', label: 'Moisturizer' },
      ]
    },
    { 
      id: 'post_shower', 
      label: 'Post Shower', 
      icon: '🚿',
      steps: [
        { id: 'cleansing_done', label: 'Cleansing' },
        { id: 'serum_done', label: 'Serum' },
        { id: 'moisturizer_done', label: 'Moisturizer' },
        { id: 'gua_sha_done', label: 'Gua Sha' },
      ]
    },
    { 
      id: 'bedtime', 
      label: 'Bedtime', 
      icon: '🌙',
      steps: [
        { id: 'cleansing_done', label: 'Cleansing' },
        { id: 'serum_done', label: 'Serum' },
        { id: 'moisturizer_done', label: 'Moisturizer' },
      ]
    },
  ] as const;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadTodayLogs(parsedUser.id);
  }, [router]);

  const loadTodayLogs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('skincare_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today);

      if (data) {
        setLogs(data);
      }
    } catch (error) {
      console.log('No skincare logs for today');
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
        // Update existing log
        const updated = {
          ...existingLog,
          [stepKey]: !existingLog[stepKey as keyof SkincareLog],
        };

        await supabase
          .from('skincare_logs')
          .update(updated)
          .eq('id', existingLog.id);

        setLogs(logs.map(log => log.id === existingLog.id ? updated : log));
      } else {
        // Create new log
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
        }
      }
    } catch (error) {
      console.error('Error updating skincare:', error);
      alert('Failed to update skincare routine');
    }
  };

  // Check if gua sha has been done today
  const guaShaToday = logs.some(log => log.gua_sha_done);

  if (loading) {
    return (
      <div className="container-pixel">
        <p className="font-mono text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container-pixel">
      <h1 className="heading-pixel">Skincare Tracker</h1>
      <p className="font-mono text-lg mb-6">Track your daily skincare routines</p>

      {/* Gua Sha Reminder */}
      {guaShaToday && (
        <div className="mb-6 p-4 bg-success border-4 border-darkgray">
          <p className="text-pixel-sm text-center">✨ Gua Sha completed today! ✨</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {routines.map((routine) => {
          const log = getRoutineLog(routine.id);
          const relevantSteps = routine.steps;
          const completedSteps = log 
            ? relevantSteps.filter(step => log[step.id as keyof SkincareLog] === true).length
            : 0;
          const isComplete = completedSteps === relevantSteps.length;

          return (
            <Card key={routine.id} title={`${routine.icon} ${routine.label}`}>
              <div className="space-y-3">
                {relevantSteps.map((step) => {
                  const isChecked = log?.[step.id as keyof SkincareLog] === true;
                  
                  // Disable gua sha if already done today (and this is not the log where it was done)
                  const isGuaShaDisabled = step.id === 'gua_sha_done' && guaShaToday && !isChecked;

                  return (
                    <button
                      key={step.id}
                      onClick={() => toggleStep(routine.id, step.id)}
                      disabled={isGuaShaDisabled}
                      className={`w-full p-3 border-4 border-darkgray text-left transition-all ${
                        isChecked 
                          ? 'bg-success' 
                          : isGuaShaDisabled
                          ? 'bg-gray-200 cursor-not-allowed opacity-50'
                          : 'bg-white hover:bg-lavender'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 border-4 border-darkgray flex items-center justify-center ${
                          isChecked ? 'bg-darkgray' : 'bg-white'
                        }`}>
                          {isChecked && (
                            <span className="text-white text-lg">✓</span>
                          )}
                        </div>
                        <span className="font-mono text-lg">
                          {step.label}
                          {step.id === 'gua_sha_done' && ' (1x/day)'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Progress */}
              <div className="mt-4">
                <p className="text-pixel-sm mb-2">
                  {completedSteps} / {relevantSteps.length} complete
                </p>
                <div className="progress-pixel h-4">
                  <div 
                    className="h-full transition-all"
                    style={{ 
                      width: `${(completedSteps / relevantSteps.length) * 100}%`,
                      backgroundColor: isComplete ? '#C1FBA4' : '#FFB5E8',
                      borderRight: completedSteps > 0 ? '4px solid #4A4A4A' : 'none'
                    }}
                  />
                </div>
              </div>

              {isComplete && (
                <div className="mt-3 p-2 bg-success border-2 border-darkgray text-center">
                  <p className="text-pixel-xs">Complete! ✨</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Daily Summary */}
      <Card title="Daily Summary" className="mt-6">
        <div className="flex items-center gap-4">
          <Sparkles size={48} className="text-primary" />
          <div>
            <p className="font-mono text-lg">
              Completed Routines: {logs.filter(log => {
                const routine = routines.find(r => r.id === log.time_of_day);
                if (!routine) return false;
                return routine.steps.every(step => log[step.id as keyof SkincareLog] === true);
              }).length} / {routines.length}
            </p>
            <p className="font-mono text-sm text-darkgray/70">
              {guaShaToday ? '✨ Gua Sha done today!' : 'Remember to do gua sha once today'} 💅
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}