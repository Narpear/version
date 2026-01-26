'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Goal } from '@/types';

interface WeightDataPoint {
  date: string;
  weight: number;
  displayDate: string;
}

interface WeightChartProps {
  data: WeightDataPoint[];
  goal?: Goal | null;
}

export default function WeightChart({ data, goal }: WeightChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-mono text-sm text-darkgray/70">No weight data yet. Start tracking!</p>
      </div>
    );
  }

  const minWeight = Math.min(...data.map(d => d.weight)) - 2;
  const maxWeight = Math.max(...data.map(d => d.weight)) + 2;

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A4A4A" opacity={0.2} />
          <XAxis 
            dataKey="displayDate" 
            stroke="#4A4A4A"
            style={{ fontSize: '12px', fontFamily: 'VT323, monospace' }}
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
              border: '4px solid #4A4A4A',
              fontFamily: 'VT323, monospace',
              fontSize: '16px'
            }}
            formatter={(value: any) => [`${value} kg`, 'Weight']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          {goal && (
            <ReferenceLine 
              y={goal.goal_weight_kg} 
              stroke="#C1FBA4" 
              strokeWidth={3}
              strokeDasharray="5 5"
              label={{ 
                value: `Goal: ${goal.goal_weight_kg} kg`, 
                position: 'right',
                style: { fontFamily: 'VT323, monospace', fontSize: '14px', fill: '#2C7A2C' }
              }}
            />
          )}
          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke="#FFB5E8" 
            strokeWidth={3}
            dot={{ fill: '#FFB5E8', strokeWidth: 2, r: 5, stroke: '#4A4A4A' }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}