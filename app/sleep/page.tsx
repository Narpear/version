'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { User, SleepLog } from '@/types';
import { Moon, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useSwipe } from '@/hooks/useSwipe';

interface DailySleep {
  date: string;
  sleep_duration_hours: number;
  quality: number | null;
}

function calcDuration(bedtime: string, wakeTime: string): number {
  if (!bedtime || !wakeTime) return 0;
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  let bedMinutes = bH * 60 + bM;
  let wakeMinutes = wH * 60 + wM;
  if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60;
  return (wakeMinutes - bedMinutes) / 60;
}

function formatDuration(hours: number): string {
  if (!hours || hours === 0) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const QUALITY: Record<number, { label: string; color: string }> = {
  1: { label: 'Terrible', color: '#FFB5B5' },
  2: { label: 'Poor',     color: '#FFCFB5' },
  3: { label: 'Okay',     color: '#FFFFB5' },
  4: { label: 'Good',     color: '#C1FBA4' },
  5: { label: 'Great',    color: '#B5DEFF' },
};

export default function SleepPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [log, setLog] = useState<SleepLog | null>(null);
  const [weeklyData, setWeeklyData] = useState<DailySleep[]>([]);
  const [loading, setLoading] = useState(true);

  const [bedtime, setBedtime] = useState('');
  const [wakeTime, setWakeTime] = useState('');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;

  // Debounce ref for auto-save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logRef = useRef<SleepLog | null>(null);
  const userRef = useRef<User | null>(null);
  logRef.current = log;
  userRef.current = user;

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    const s = newDate.toISOString().split('T')[0];
    if (s <= today) setSelectedDate(s);
  };

  const { onTouchStart, onTouchEnd } = useSwipe(
    () => { if (!isToday) changeDate(1); },
    () => changeDate(-1),
  );

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/login'); return; }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    userRef.current = parsedUser;
    loadData(parsedUser.id, selectedDate);
  }, [router, selectedDate]);

  // Auto-save when both times are set
  useEffect(() => {
    if (!bedtime || !wakeTime) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persistTimes(bedtime, wakeTime);
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [bedtime, wakeTime]);

  const loadData = async (userId: string, date: string) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (data) {
        setLog(data);
        logRef.current = data;
        setBedtime(data.bedtime || '');
        setWakeTime(data.wake_time || '');
      } else {
        setLog(null);
        logRef.current = null;
        setBedtime('');
        setWakeTime('');
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];

      const { data: weekData } = await supabase
        .from('sleep_logs')
        .select('date, sleep_duration_hours, quality')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', today)
        .order('date', { ascending: true });

      const allDays: DailySleep[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const existing = weekData?.find(w => w.date === dateStr);
        allDays.push({
          date: dateStr,
          sleep_duration_hours: existing?.sleep_duration_hours || 0,
          quality: existing?.quality || null,
        });
      }
      setWeeklyData(allDays);
    } catch (err) {
      console.log('Error loading sleep data:', err);
    } finally {
      setLoading(false);
    }
  };

  const persistTimes = async (bt: string, wt: string) => {
    const currentUser = userRef.current;
    const currentLog = logRef.current;
    if (!currentUser) return;
    const duration = parseFloat(calcDuration(bt, wt).toFixed(2));
    const payload = {
      user_id: currentUser.id,
      date: selectedDate,
      bedtime: bt,
      wake_time: wt,
      sleep_duration_hours: duration,
      quality: currentLog?.quality ?? null,
    };
    try {
      if (currentLog) {
        const { data } = await supabase.from('sleep_logs').update(payload).eq('id', currentLog.id).select().single();
        if (data) { setLog(data); logRef.current = data; }
      } else {
        const { data } = await supabase.from('sleep_logs').insert(payload).select().single();
        if (data) { setLog(data); logRef.current = data; }
      }
      setWeeklyData(prev =>
        prev.map(d => d.date === selectedDate ? { ...d, sleep_duration_hours: duration } : d)
      );
      toast('Saved!');
    } catch (err) {
      console.error('Error saving sleep:', err);
    }
  };

  const saveQuality = async (q: number) => {
    const currentUser = userRef.current;
    const currentLog = logRef.current;
    if (!currentUser) return;
    try {
      if (currentLog) {
        await supabase.from('sleep_logs').update({ quality: q }).eq('id', currentLog.id);
        const updated = { ...currentLog, quality: q };
        setLog(updated);
        logRef.current = updated;
      } else {
        const dur = bedtime && wakeTime ? parseFloat(calcDuration(bedtime, wakeTime).toFixed(2)) : null;
        const { data } = await supabase
          .from('sleep_logs')
          .insert({ user_id: currentUser.id, date: selectedDate, bedtime: bedtime || null, wake_time: wakeTime || null, sleep_duration_hours: dur, quality: q })
          .select().single();
        if (data) { setLog(data); logRef.current = data; }
      }
      setWeeklyData(prev =>
        prev.map(d => d.date === selectedDate ? { ...d, quality: q } : d)
      );
      toast('Saved!');
    } catch (err) {
      console.error('Error saving quality:', err);
    }
  };

  if (loading) {
    return <div className="container-pixel"><p className="font-mono text-lg">Loading...</p></div>;
  }

  const duration = bedtime && wakeTime ? calcDuration(bedtime, wakeTime) : (log?.sleep_duration_hours || 0);
  const daysWithData = weeklyData.filter(d => d.sleep_duration_hours > 0);
  const weeklyAvg = daysWithData.length > 0
    ? daysWithData.reduce((s, d) => s + d.sleep_duration_hours, 0) / daysWithData.length
    : 0;

  const qualityInfo = log?.quality ? QUALITY[log.quality] : null;
  const MAX_CHART = 10;
  const durationColor = duration >= 8 ? '#C1FBA4' : duration >= 7 ? '#FFFFB5' : duration > 0 ? '#FFB5B5' : 'transparent';
  const durationLabel = duration >= 8 ? 'Excellent' : duration >= 7 ? 'Good' : duration >= 6 ? 'A bit short' : duration > 0 ? 'Too little sleep' : '';

  return (
    <div className="container-pixel" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* Date Navigation */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="heading-pixel">Sleep Tracker</h1>
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
              onChange={e => setSelectedDate(e.target.value)}
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

      {/* Log Sleep — times auto-save, no button needed */}
      <Card title="Log Your Sleep" className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-pixel-xs mb-2">Bedtime</p>
            <input
              type="time"
              value={bedtime}
              onChange={e => setBedtime(e.target.value)}
              className="input-pixel w-full text-xl"
            />
          </div>
          <div>
            <p className="text-pixel-xs mb-2">Wake Up</p>
            <input
              type="time"
              value={wakeTime}
              onChange={e => setWakeTime(e.target.value)}
              className="input-pixel w-full text-xl"
            />
          </div>
        </div>

        {duration > 0 && (
          <div
            className="text-center py-4 border-2 border-darkgray transition-colors"
            style={{ backgroundColor: durationColor }}
          >
            <p className="font-mono text-5xl font-bold">{formatDuration(duration)}</p>
            {durationLabel && <p className="text-pixel-xs mt-2 text-darkgray/70">{durationLabel}</p>}
          </div>
        )}

        {!bedtime && !wakeTime && (
          <p className="text-pixel-xs text-darkgray/40 text-center mt-2">Set your times above — saves automatically</p>
        )}
      </Card>

      {/* Quality — tap to save instantly, no emojis */}
      <Card title="Sleep Quality" className="mb-6">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(q => {
            const info = QUALITY[q];
            const isSelected = log?.quality === q;
            return (
              <button
                key={q}
                onClick={() => saveQuality(q)}
                className="flex-1 py-3 border-2 border-darkgray font-mono text-sm transition-all hover:opacity-80"
                style={{
                  backgroundColor: isSelected ? info.color : 'rgba(255,255,255,0.5)',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  boxShadow: isSelected ? '3px 3px 0 rgba(0,0,0,0.12)' : 'none',
                }}
              >
                {info.label}
              </button>
            );
          })}
        </div>
        {!qualityInfo && (
          <p className="text-pixel-xs text-center text-darkgray/40 mt-3">Tap to rate</p>
        )}
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card title="Tonight">
          <div className="text-center py-1">
            <p className="font-mono text-3xl font-bold text-primary">{formatDuration(duration)}</p>
          </div>
        </Card>
        <Card title="Quality">
          <div className="text-center py-1">
            <p className="font-mono text-3xl font-bold" style={{ color: qualityInfo ? '#4A4A4A' : '#ccc' }}>
              {log?.quality ?? '—'}
            </p>
            <p className="font-mono text-sm text-darkgray/60">{qualityInfo?.label || ''}</p>
          </div>
        </Card>
        <Card title="7-Day Avg">
          <div className="text-center py-1">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp size={18} className="text-secondary" />
              <p className="font-mono text-3xl font-bold text-secondary">{formatDuration(weeklyAvg)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 7-Night Chart */}
      <Card title="7-Night Overview" className="mb-6">
        <div className="flex items-end justify-between gap-2 h-40 mb-4 relative">
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-darkgray/20 pointer-events-none"
            style={{ bottom: `${(8 / MAX_CHART) * 100}%` }}
          >
            <span className="text-pixel-xs text-darkgray/30 absolute -top-4 right-0">8h</span>
          </div>
          {weeklyData.map(day => {
            const h = day.sleep_duration_hours;
            const barPct = Math.min((h / MAX_CHART) * 100, 100);
            const isDayToday = day.date === today;
            const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
            const barColor = isDayToday ? '#C9B5FF' : h >= 8 ? '#C1FBA4' : h >= 7 ? '#FFFFB5' : h > 0 ? '#FFB5B5' : '#e5e7eb';
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-pixel-xs font-bold">{h > 0 ? formatDuration(h) : ''}</p>
                <div
                  className="w-full border-2 border-darkgray transition-all"
                  style={{ height: `${Math.max(barPct, 4)}%`, backgroundColor: barColor }}
                />
                <p className={`text-pixel-xs ${isDayToday ? 'font-bold' : 'text-darkgray/60'}`}>{dayName}</p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 text-pixel-xs flex-wrap">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#C1FBA4] border border-darkgray" /><span>8h+</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#FFFFB5] border border-darkgray" /><span>7–8h</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#FFB5B5] border border-darkgray" /><span>Under 7h</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#C9B5FF] border border-darkgray" /><span>Today</span></div>
        </div>
      </Card>

      {/* Tips */}
      <Card className="bg-lavender/20">
        <div className="flex gap-4">
          <Moon size={28} className="text-primary shrink-0 mt-1" />
          <div>
            <h3 className="font-mono font-bold text-lg mb-3">Sleep Tips</h3>
            <ul className="text-pixel-sm space-y-2 text-darkgray/80">
              <li>• Keep a consistent schedule, even on weekends</li>
              <li>• Avoid screens 30–60 minutes before bed</li>
              <li>• Keep your room cool, dark, and quiet</li>
              <li>• Avoid caffeine after 2pm</li>
              <li>• Exercise regularly — but not too close to bedtime</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
