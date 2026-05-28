'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type DayWorkout = { count: number; calories: number };

function cellColor(calories: number): string {
  if (calories === 0) return '#DDDDE8';
  if (calories < 100) return '#FFD6F0';
  if (calories < 250) return '#FFB5E8';
  if (calories < 450) return '#C9B1FF';
  return '#9B5DE5';
}

export default function GymHeatmap({ userId }: { userId: string }) {
  const [workouts, setWorkouts] = useState<Map<string, DayWorkout>>(new Map());
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ lines: string[]; x: number; y: number } | null>(null);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split('T')[0];
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);

      const { data } = await supabase
        .from('gym_logs')
        .select('date, calories_burned')
        .eq('user_id', userId)
        .gte('date', yearAgo.toISOString().split('T')[0])
        .lte('date', today);

      const map = new Map<string, DayWorkout>();
      for (const row of data || []) {
        const e = map.get(row.date) ?? { count: 0, calories: 0 };
        e.count++;
        e.calories += row.calories_burned ?? 0;
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
        monthLabels.push({
          label: monday.toLocaleDateString('en-US', { month: 'short' }),
          col: weeks.length,
        });
        lastMonth = monday.getMonth();
      }
      weeks.push(week);
    }

    return { weeks, monthLabels };
  }, []);

  if (loading) return <p className="font-mono text-xs text-darkgray/50">Loading workout history...</p>;

  const totalDays = workouts.size;
  const totalCals = [...workouts.values()].reduce((s, d) => s + d.calories, 0);

  const CELL = 13;
  const GAP = 3;
  const ROW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
  const LEGEND_CALS = [0, 60, 200, 380, 540];

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="font-mono text-sm text-darkgray/70">
          <strong>{totalDays}</strong> workout days &nbsp;·&nbsp; <strong>{totalCals.toLocaleString()}</strong> cal burned in the last year
        </p>
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 9 }} className="text-darkgray/50">Less</span>
          {LEGEND_CALS.map((cal, i) => (
            <div
              key={i}
              style={{ width: CELL, height: CELL, backgroundColor: cellColor(cal), borderRadius: 2 }}
              className="border border-darkgray/10"
            />
          ))}
          <span style={{ fontSize: 9 }} className="text-darkgray/50">More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div style={{ display: 'flex', gap: GAP, alignItems: 'flex-start' }}>
          {/* Day-of-week labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingTop: 22, minWidth: 26 }}>
            {ROW_LABELS.map((lbl, i) => (
              <div
                key={i}
                style={{ height: CELL, fontSize: 9, lineHeight: `${CELL}px`, color: '#9ca3af', textAlign: 'right', paddingRight: 3 }}
              >
                {lbl}
              </div>
            ))}
          </div>

          <div>
            {/* Month labels */}
            <div style={{ display: 'flex', gap: GAP, height: 20, marginBottom: 2 }}>
              {weeks.map((_, wi) => {
                const ml = monthLabels.find(m => m.col === wi);
                return (
                  <div
                    key={wi}
                    style={{ width: CELL, fontSize: 9, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'visible' }}
                  >
                    {ml?.label ?? ''}
                  </div>
                );
              })}
            </div>

            {/* Week columns */}
            <div style={{ display: 'flex', gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                  {week.map((day, di) => {
                    if (!day) return <div key={di} style={{ width: CELL, height: CELL }} />;
                    const ds = day.toISOString().split('T')[0];
                    const wd = workouts.get(ds);
                    const cal = wd?.calories ?? 0;
                    return (
                      <div
                        key={di}
                        style={{
                          width: CELL,
                          height: CELL,
                          backgroundColor: cellColor(cal),
                          borderRadius: 2,
                          cursor: 'default',
                          transition: 'transform 0.1s',
                        }}
                        className="border border-darkgray/10 hover:scale-125"
                        onMouseEnter={e => {
                          const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                          setTooltip({
                            lines: [
                              day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
                              wd
                                ? `${wd.count} exercise${wd.count !== 1 ? 's' : ''} · ${wd.calories} cal burned`
                                : 'Rest day',
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
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-darkgray border-2 border-darkgray px-2 py-1 font-mono text-white"
          style={{ left: tooltip.x, top: tooltip.y - 56, transform: 'translateX(-50%)', fontSize: 11 }}
        >
          {tooltip.lines.map((t, i) => (
            <p key={i} className={i === 0 ? 'font-bold' : ''}>{t}</p>
          ))}
        </div>
      )}
    </div>
  );
}
