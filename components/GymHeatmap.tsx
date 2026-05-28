'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart2, X } from 'lucide-react';

type DayWorkout = {
  count: number;
  calories: number;
  exercises: string[];
  muscleGroups: string[];
};
type Gender = 'male' | 'female' | 'non-binary';

function cellColor(calories: number, gender: Gender): string {
  const female = ['#F0E8F8', '#E0B8F0', '#C07FE0', '#9444C8', '#5E1A8F'];
  const male   = ['#D8DDE6', '#A8C8F0', '#6699E8', '#3366CC', '#1A3A8F'];
  const palette = gender === 'female' ? female : male;
  if (calories === 0)   return palette[0];
  if (calories < 100)   return palette[1];
  if (calories < 250)   return palette[2];
  if (calories < 450)   return palette[3];
  return palette[4];
}

const LEGEND_CALS = [0, 60, 200, 380, 540];
const ROW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

export default function GymHeatmap({ userId, gender = 'male' }: { userId: string; gender?: Gender }) {
  const [workouts, setWorkouts] = useState<Map<string, DayWorkout>>(new Map());
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ lines: string[]; x: number; y: number } | null>(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split('T')[0];
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { data } = await supabase
        .from('gym_logs')
        .select('date, calories_burned, exercise_name, muscle_groups')
        .eq('user_id', userId)
        .gte('date', oneYearAgo.toISOString().split('T')[0])
        .lte('date', today);

      const map = new Map<string, DayWorkout>();
      for (const row of data || []) {
        const e = map.get(row.date) ?? { count: 0, calories: 0, exercises: [], muscleGroups: [] };
        e.count++;
        e.calories += row.calories_burned ?? 0;
        if (row.exercise_name && !e.exercises.includes(row.exercise_name)) {
          e.exercises.push(row.exercise_name);
        }
        for (const mg of (row.muscle_groups ?? [])) {
          if (!e.muscleGroups.includes(mg)) e.muscleGroups.push(mg);
        }
        map.set(row.date, e);
      }
      setWorkouts(map);
      setLoading(false);
    })();
  }, [userId]);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - 52 * 7);
    const dow = start.getDay();
    start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));

    const weeks: (Date | null)[][] = [];
    const monthLabels: { label: string; col: number }[] = [];
    const cur = new Date(start);
    let lastMonth = -1;

    while (cur <= today) {
      const week: (Date | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(cur);
        week.push(day <= today ? day : null);
        cur.setDate(cur.getDate() + 1);
      }
      const monday = week[0];
      if (monday && monday.getMonth() !== lastMonth) {
        monthLabels.push({ label: monday.toLocaleDateString('en-US', { month: 'short' }), col: weeks.length });
        lastMonth = monday.getMonth();
      }
      weeks.push(week);
    }
    return { weeks, monthLabels };
  }, []);

  const stats = useMemo(() => {
    const exerciseCounts = new Map<string, number>();
    const muscleCounts = new Map<string, number>();

    for (const wd of workouts.values()) {
      for (const ex of wd.exercises) {
        exerciseCounts.set(ex, (exerciseCounts.get(ex) ?? 0) + 1);
      }
      for (const mg of wd.muscleGroups) {
        muscleCounts.set(mg, (muscleCounts.get(mg) ?? 0) + 1);
      }
    }

    const sortedExercises = [...exerciseCounts.entries()].sort((a, b) => b[1] - a[1]);
    const sortedMuscles   = [...muscleCounts.entries()].sort((a, b) => b[1] - a[1]);
    const maxMuscle = sortedMuscles[0]?.[1] ?? 1;

    return { sortedExercises, sortedMuscles, maxMuscle };
  }, [workouts]);

  if (loading) return <p className="font-mono text-xs text-darkgray/50">Loading workout history...</p>;

  const totalDays = workouts.size;
  const totalCals = [...workouts.values()].reduce((s, d) => s + d.calories, 0);
  const accentDark = gender === 'female' ? '#5E1A8F' : '#1A3A8F';
  const accentMid  = gender === 'female' ? '#9444C8' : '#3366CC';

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-sm text-darkgray/70">
          <strong>{totalDays}</strong> workout days &nbsp;·&nbsp;
          <strong>{totalCals.toLocaleString()}</strong> cal burned in the last year
        </p>
        <button
          onClick={() => setShowStats(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-darkgray bg-white hover:bg-lavender font-mono text-xs transition-all"
        >
          <BarChart2 size={13} />
          Stats
        </button>
      </div>

      <div className="flex gap-2 items-start w-full">
        {/* Row labels */}
        <div className="flex flex-col shrink-0" style={{ paddingTop: 26, gap: 3 }}>
          {ROW_LABELS.map((lbl, i) => (
            <div key={i} style={{ height: 18, fontSize: 11, lineHeight: '18px', color: '#6b7280', textAlign: 'right', paddingRight: 4, minWidth: 30 }}>
              {lbl}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {/* Month labels */}
          <div style={{ display: 'flex', gap: 3, height: 24, marginBottom: 2 }}>
            {weeks.map((_, wi) => {
              const ml = monthLabels.find(m => m.col === wi);
              return (
                <div key={wi} style={{ flex: 1, fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'visible' }}>
                  {ml?.label ?? ''}
                </div>
              );
            })}
          </div>

          {/* Cells */}
          <div style={{ display: 'flex', gap: 3 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map((day, di) => {
                  if (!day) return <div key={di} style={{ paddingBottom: '100%' }} />;
                  const ds = day.toISOString().split('T')[0];
                  const wd = workouts.get(ds);
                  const cal = wd?.calories ?? 0;
                  return (
                    <div
                      key={di}
                      style={{ paddingBottom: '100%', position: 'relative', backgroundColor: cellColor(cal, gender), borderRadius: 3, cursor: 'default' }}
                      className="border border-darkgray/10 hover:scale-125 transition-transform"
                      onMouseEnter={e => {
                        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const muscles = wd?.muscleGroups.join(', ') || '';
                        setTooltip({
                          lines: [
                            day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
                            wd ? `${wd.count} exercise${wd.count !== 1 ? 's' : ''} · ${wd.calories} cal` : 'Rest day',
                            ...(muscles ? [muscles] : []),
                          ],
                          x: r.left + r.width / 2,
                          y: r.top,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Vertical legend */}
        <div className="flex flex-col items-center shrink-0" style={{ gap: 3, paddingTop: 26 }}>
          <span style={{ fontSize: 10 }} className="text-darkgray/50 font-mono mb-1">More</span>
          {[...LEGEND_CALS].reverse().map((cal, i) => (
            <div
              key={i}
              style={{ width: 14, height: 14, backgroundColor: cellColor(cal, gender), borderRadius: 3 }}
              className="border border-darkgray/10"
            />
          ))}
          <span style={{ fontSize: 10 }} className="text-darkgray/50 font-mono mt-1">Less</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-darkgray px-3 py-2 font-mono text-white"
          style={{ left: tooltip.x, top: tooltip.y - 70, transform: 'translateX(-50%)', fontSize: 11, maxWidth: 240, borderRadius: 4 }}
        >
          {tooltip.lines.map((t, i) => (
            <p key={i} className={i === 0 ? 'font-bold' : 'text-white/80'} style={{ marginTop: i > 0 ? 2 : 0 }}>{t}</p>
          ))}
        </div>
      )}

      {/* Stats modal */}
      {showStats && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowStats(false)} />
          <div className="fixed inset-0 z-51 flex items-center justify-center pointer-events-none">
            <div className="bg-white border-2 border-darkgray w-full max-w-lg mx-4 pointer-events-auto" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b-2 border-darkgray">
                <h3 className="font-mono font-bold text-base">Workout Stats</h3>
                <button onClick={() => setShowStats(false)} className="p-1 hover:bg-lavender transition-all">
                  <X size={16} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-6">
                {/* Muscle groups */}
                <div>
                  <p className="font-mono text-xs font-bold text-darkgray/50 uppercase mb-3">Muscle Groups</p>
                  {stats.sortedMuscles.length === 0 ? (
                    <p className="font-mono text-xs text-darkgray/40">No data yet</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.sortedMuscles.map(([muscle, count]) => (
                        <div key={muscle} className="flex items-center gap-3">
                          <span className="font-mono text-xs w-32 shrink-0 capitalize">{muscle}</span>
                          <div className="flex-1 h-4 bg-darkgray/10 rounded-sm overflow-hidden">
                            <div
                              style={{ width: `${(count / stats.maxMuscle) * 100}%`, backgroundColor: accentMid, height: '100%' }}
                            />
                          </div>
                          <span className="font-mono text-xs text-darkgray/60 w-12 text-right">{count}×</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exercises */}
                <div>
                  <p className="font-mono text-xs font-bold text-darkgray/50 uppercase mb-3">Exercises</p>
                  {stats.sortedExercises.length === 0 ? (
                    <p className="font-mono text-xs text-darkgray/40">No data yet</p>
                  ) : (
                    <>
                      <p className="font-mono text-xs text-darkgray/50 mb-2">Most frequent</p>
                      <div className="space-y-1.5 mb-4">
                        {stats.sortedExercises.slice(0, 5).map(([ex, count]) => (
                          <div key={ex} className="flex items-center justify-between border border-darkgray/10 px-3 py-1.5">
                            <span className="font-mono text-xs">{ex}</span>
                            <span className="font-mono text-xs font-bold" style={{ color: accentDark }}>{count}×</span>
                          </div>
                        ))}
                      </div>
                      {stats.sortedExercises.length > 5 && (
                        <>
                          <p className="font-mono text-xs text-darkgray/50 mb-2">Least frequent</p>
                          <div className="space-y-1.5">
                            {[...stats.sortedExercises].slice(-5).reverse().map(([ex, count]) => (
                              <div key={ex} className="flex items-center justify-between border border-darkgray/10 px-3 py-1.5">
                                <span className="font-mono text-xs">{ex}</span>
                                <span className="font-mono text-xs text-darkgray/50">{count}×</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
