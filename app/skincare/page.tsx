'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { User, SkincareLog } from '@/types';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function SkincarePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<SkincareLog[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const routines = [
    { 
      id: 'pre_gym', 
      label: 'Pre Gym', 
      icon: '',
      steps: [
        { id: 'cleansing_done', label: 'Cleansing' },
        { id: 'moisturizer_done', label: 'Moisturizer' },
      ]
    },
    { 
      id: 'post_shower', 
      label: 'Post Shower', 
      icon: '',
      steps: [
        { id: 'cleansing_done', label: 'Cleansing' },
        { id: 'serum_done', label: 'Serum' },
        { id: 'moisturizer_done', label: 'Moisturizer' },
      ]
    },
    { 
      id: 'bedtime', 
      label: 'Bedtime', 
      icon: '',
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
        toast('Saved!');
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
          toast('Saved!');
        }
      }
    } catch (error) {
      console.error('Error updating skincare:', error);
      alert('Failed to update skincare routine');
    }
  };

  // Gua sha is once per day (any routine log can store it)
  const guaShaToday = logs.some(log => log.gua_sha_done);

  const toggleGuaSha = async () => {
    if (!user) return;

    try {
      // If already done, turn it off wherever it is
      const existing = logs.find(l => l.gua_sha_done);
      if (existing) {
        const updated = { ...existing, gua_sha_done: false };
        await supabase.from('skincare_logs').update({ gua_sha_done: false }).eq('id', existing.id);
        setLogs(logs.map(l => (l.id === existing.id ? updated : l)));
        toast('Saved!');
        return;
      }

      // Otherwise, store it on bedtime log if possible (or create bedtime log)
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

  return (
    <div className="container-pixel">
      <h1 className="heading-pixel">Skincare Tracker</h1>
      <p className="font-mono text-lg mb-6">Pre-gym stays the same. Post-shower + bedtime are your main routines.</p>

      {/* Gua Sha Reminder */}
      <Card title="Gua Sha (Once a day)" className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-lg">
            Status: <span className="font-bold">{guaShaToday ? 'Done' : 'Not done'}</span>
          </p>
          <button
            onClick={toggleGuaSha}
            className={`px-4 py-3 border-2 border-darkgray font-mono text-lg transition-all ${
              guaShaToday ? 'bg-success' : 'bg-white hover:bg-lavender'
            }`}
          >
            {guaShaToday ? 'Undo' : 'Mark done'}
          </button>
        </div>
        <p className="font-mono text-sm text-darkgray/70 mt-2">Tip: do it once anytime (morning or night) — your choice.</p>
      </Card>

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

                  return (
                    <button
                      key={step.id}
                      onClick={() => toggleStep(routine.id, step.id)}
                      className={`w-full p-3 border-2 border-darkgray text-left transition-all ${
                        isChecked 
                          ? 'bg-success' 
                          : 'bg-white hover:bg-lavender'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 border-2 border-darkgray flex items-center justify-center ${
                          isChecked ? 'bg-darkgray' : 'bg-white'
                        }`}>
                          {isChecked && (
                            <span className="text-white text-lg">✓</span>
                          )}
                        </div>
                        <span className="font-mono text-lg">
                          {step.label}
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
                      borderRight: completedSteps > 0 ? '2px solid #4A4A4A' : 'none'
                    }}
                  />
                </div>
              </div>

              {isComplete && (
                <div className="mt-3 p-2 bg-success border-2 border-darkgray text-center">
                  <p className="text-pixel-xs">Complete</p>
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
              {guaShaToday ? 'Gua Sha done today' : 'Remember to do gua sha once today'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}