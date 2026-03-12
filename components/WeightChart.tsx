'use client';

import { useState, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Goal } from '@/types';

interface WeightDataPoint {
  date: string;
  weight: number;
  displayDate: string;
}

type ViewMode = '30d' | '90d' | 'weekly_year' | 'monthly_year' | 'monthly_all';

interface WeightChartProps {
  data: WeightDataPoint[];
  goal?: Goal | null;
}

const VIEW_LABELS: Record<ViewMode, string> = {
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  'weekly_year': 'Weekly (Last Year)',
  'monthly_year': 'Monthly (Last Year)',
  'monthly_all': 'Monthly (All Time)',
};

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function aggregateData(data: WeightDataPoint[], mode: ViewMode) {
  const now = new Date();

  if (mode === '30d' || mode === '90d') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (mode === '90d' ? 90 : 30));
    return data
      .filter(d => new Date(d.date) >= cutoff)
      .map(d => ({ ...d, displayDate: d.displayDate }));
  }

  if (mode === 'weekly_year') {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    const filtered = data.filter(d => new Date(d.date) >= cutoff);

    const groups: Record<string, number[]> = {};
    filtered.forEach(d => {
      const key = getISOWeek(new Date(d.date));
      if (!groups[key]) groups[key] = [];
      groups[key].push(d.weight);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, weights]) => {
        const avg = weights.reduce((s, w) => s + w, 0) / weights.length;
        const [year, week] = key.split('-W');
        return {
          date: key,
          weight: parseFloat(avg.toFixed(2)),
          displayDate: `W${week} '${year.slice(2)}`,
        };
      });
  }

  if (mode === 'monthly_year' || mode === 'monthly_all') {
    let filtered = data;
    if (mode === 'monthly_year') {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      filtered = data.filter(d => new Date(d.date) >= cutoff);
    }

    const groups: Record<string, number[]> = {};
    filtered.forEach(d => {
      const key = d.date.slice(0, 7); // YYYY-MM
      if (!groups[key]) groups[key] = [];
      groups[key].push(d.weight);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, weights]) => {
        const avg = weights.reduce((s, w) => s + w, 0) / weights.length;
        const [year, month] = key.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
        return {
          date: key,
          weight: parseFloat(avg.toFixed(2)),
          displayDate: `${monthName} '${year.slice(2)}`,
        };
      });
  }

  return data;
}

export default function WeightChart({ data, goal }: WeightChartProps) {
  const [view, setView] = useState<ViewMode>('30d');

  const chartData = useMemo(() => aggregateData(data, view), [data, view]);

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-mono text-sm text-darkgray/70">No weight data yet. Start tracking!</p>
      </div>
    );
  }

  const minWeight = Math.min(...chartData.map(d => d.weight)) - 1;
  const maxWeight = Math.max(...chartData.map(d => d.weight)) + 1;

  const isAveraged = view !== '30d' && view !== '90d';

  return (
    <div>
      {/* View Toggle */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(VIEW_LABELS) as ViewMode[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 font-mono text-xs border-2 border-darkgray transition-all ${
              view === v ? 'bg-secondary' : 'bg-white hover:bg-lavender'
            }`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {isAveraged && (
        <p className="font-mono text-xs text-darkgray/50 mb-3">Showing average weight per {view.startsWith('weekly') ? 'week' : 'month'}</p>
      )}

      <div className="w-full h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFB5E8" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#FFB5E8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A4A4A" opacity={0.15} />
            <XAxis
              dataKey="displayDate"
              stroke="#4A4A4A"
              tick={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minWeight, maxWeight]}
              stroke="#4A4A4A"
              style={{ fontSize: '12px', fontFamily: 'VT323, monospace' }}
              label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fontFamily: 'VT323, monospace' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFF9F0',
                border: '2px solid #4A4A4A',
                fontFamily: 'VT323, monospace',
                fontSize: '16px',
              }}
              formatter={(value: any) => [`${value} kg`, isAveraged ? 'Avg Weight' : 'Weight']}
              labelFormatter={(label) => `${isAveraged ? 'Period' : 'Date'}: ${label}`}
            />
            {goal && (
              <ReferenceLine
                y={goal.goal_weight_kg}
                stroke="#C1FBA4"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: `Goal: ${goal.goal_weight_kg} kg`,
                  position: 'right',
                  style: { fontFamily: 'VT323, monospace', fontSize: '14px', fill: '#2C7A2C' },
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="weight"
              stroke="#FFB5E8"
              strokeWidth={2}
              fill="url(#weightFill)"
              dot={{ fill: '#FFB5E8', strokeWidth: 2, r: 4, stroke: '#4A4A4A' }}
              activeDot={{ r: 7 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}