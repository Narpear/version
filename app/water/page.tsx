'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { Droplet, TrendingUp, Sparkles, Info, Brain, Zap, Heart, Target, Activity, Smile } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface DailyWater {
  date: string;
  water_glasses: number;
}

export default function WaterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [glasses, setGlasses] = useState(0);
  const [weeklyData, setWeeklyData] = useState<DailyWater[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const maxGlasses = 8;

  const hydrationFacts = [
    { 
      icon: Brain, 
      title: 'Brain Power', 
      fact: 'Your brain is 75% water. Even mild dehydration can affect your mood and concentration!',
      color: '#FFB5E8'
    },
    { 
      icon: Activity, 
      title: 'Performance Boost', 
      fact: 'Proper hydration can improve physical performance by up to 20%.',
      color: '#B5DEFF'
    },
    { 
      icon: Sparkles, 
      title: 'Skin Health', 
      fact: 'Staying hydrated helps maintain skin elasticity and can reduce signs of aging.',
      color: '#C1FBA4'
    },
    { 
      icon: Zap, 
      title: 'Energy Levels', 
      fact: 'Dehydration is one of the most common causes of daytime fatigue.',
      color: '#FFFFB5'
    },
    { 
      icon: Target, 
      title: 'Weight Management', 
      fact: 'Drinking water before meals can help reduce appetite and support weight loss.',
      color: '#FFB5E8'
    },
    { 
      icon: Heart, 
      title: 'Muscle Function', 
      fact: 'Water helps transport nutrients to your muscles and removes waste products.',
      color: '#B5DEFF'
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
    loadWaterData(parsedUser.id);
  }, [router]);

  const loadWaterData = async (userId: string) => {
    try {
      // Get today's water
      const { data: todayData } = await supabase
        .from('daily_entries')
        .select('water_glasses')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (todayData) {
        setGlasses(todayData.water_glasses || 0);
      }

      // Get last 7 days for the chart
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];

      const { data: weekData } = await supabase
        .from('daily_entries')
        .select('date, water_glasses')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', today)
        .order('date', { ascending: true });

      if (weekData) {
        // Fill in missing days with 0
        const allDays: DailyWater[] = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const dateStr = date.toISOString().split('T')[0];
          const existing = weekData.find(d => d.date === dateStr);
          allDays.push({
            date: dateStr,
            water_glasses: existing?.water_glasses || 0
          });
        }
        setWeeklyData(allDays);
      }
    } catch (error) {
      console.log('Error loading water data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateWater = async (newGlasses: number) => {
    if (!user) return;
    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from('daily_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (existing) {
        await supabase
          .from('daily_entries')
          .update({ water_glasses: newGlasses })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('daily_entries')
          .insert({
            user_id: user.id,
            date: today,
            water_glasses: newGlasses,
            total_calories_in: 0,
            total_calories_out: 0,
          });
      }

      setGlasses(newGlasses);
      // Update weekly data
      setWeeklyData(prev => 
        prev.map(d => d.date === today ? { ...d, water_glasses: newGlasses } : d)
      );
      toast('Saved!');
    } catch (error) {
      console.error('Error updating water:', error);
      alert('Failed to update water intake');
    } finally {
      setSaving(false);
    }
  };

  const addGlass = () => {
    if (glasses < maxGlasses) {
      updateWater(glasses + 1);
    }
  };

  const removeGlass = () => {
    if (glasses > 0) {
      updateWater(glasses - 1);
    }
  };

  if (loading) {
    return (
      <div className="container-pixel">
        <p className="font-mono text-lg">Loading...</p>
      </div>
    );
  }

  const percentage = (glasses / maxGlasses) * 100;
  const isComplete = glasses >= maxGlasses;
  const weeklyAverage = weeklyData.length > 0 
    ? (weeklyData.reduce((sum, d) => sum + d.water_glasses, 0) / weeklyData.length).toFixed(1)
    : '0';

  return (
    <div className="container-pixel">
      <h1 className="heading-pixel">Water Tracker</h1>
      <p className="font-mono text-lg mb-6">Goal: 8 glasses (2L) per day · Stay hydrated, stay healthy</p>

      {/* Main Tracker Card */}
      <Card title="Today's Intake" className="mb-6">
        {/* Water Drops in a Row - Smaller and Cuter */}
        <div className="mb-8">
          <div className="flex justify-center items-center gap-2 flex-wrap">
            {[...Array(maxGlasses)].map((_, i) => (
              <button
                key={i}
                onClick={() => i < glasses ? updateWater(i) : updateWater(i + 1)}
                className={`relative w-14 h-16 border-2 border-darkgray flex items-center justify-center transition-all group ${
                  i < glasses 
                    ? 'bg-[#B5DEFF] hover:bg-[#9CCFFF]' 
                    : 'bg-white hover:bg-lavender'
                }`}
                style={{ 
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)'
                }}
              >
                <Droplet 
                  size={28} 
                  className={`transition-all ${
                    i < glasses 
                      ? 'fill-current text-[#4A9FD8] group-hover:scale-110' 
                      : 'text-darkgray/30 group-hover:text-darkgray/50'
                  }`}
                  style={{ transform: 'rotate(45deg)' }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="progress-pixel h-6">
            <div 
              className="h-full transition-all"
              style={{ 
                width: `${percentage}%`,
                backgroundColor: isComplete ? '#C1FBA4' : '#B5DEFF',
                borderRight: percentage > 0 ? '2px solid #4A4A4A' : 'none'
              }}
            />
          </div>
        </div>

        {/* Success Message */}
        {isComplete && (
          <div className="mb-6 text-center">
            <p className="font-mono text-lg text-success font-bold">Daily goal complete!</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-4">
          <Button 
            onClick={removeGlass} 
            disabled={glasses === 0 || saving}
            variant="secondary"
            className="flex-1"
          >
            - Glass
          </Button>
          <Button 
            onClick={addGlass} 
            disabled={glasses >= maxGlasses || saving}
            className="flex-1"
          >
            + Glass
          </Button>
        </div>
      </Card>

      {/* Stats Row - More rectangular and compact */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card title="Today's Progress">
          <div className="text-center py-2">
            <p className="text-4xl font-bold font-mono" style={{ color: isComplete ? '#C1FBA4' : '#B5DEFF' }}>
              {glasses}
            </p>
            <p className="text-sm font-mono text-darkgray/70 mt-1">of {maxGlasses} glasses</p>
            <p className="text-sm font-mono text-darkgray/70">
              {(glasses * 0.25).toFixed(2)}L of 2L
            </p>
          </div>
        </Card>

        <Card title="7-Day Average">
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp size={24} className="text-secondary" />
              <p className="text-4xl font-bold font-mono text-secondary">
                {weeklyAverage}
              </p>
            </div>
            <p className="text-sm font-mono text-darkgray/70 mt-1">glasses per day</p>
          </div>
        </Card>

        <Card title="Hydration Status">
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Droplet size={32} className={isComplete ? 'fill-current text-success' : 'text-secondary'} />
            </div>
            <p className={`text-lg font-bold font-mono ${isComplete ? 'text-success' : 'text-secondary'}`}>
              {isComplete ? 'Fully Hydrated' : `${Math.round(percentage)}% Complete`}
            </p>
          </div>
        </Card>
      </div>

      {/* Weekly Trend Chart */}
      <Card title="Weekly Trend" className="mb-6">
        <div className="flex items-end justify-between gap-2 h-48 mb-4">
          {weeklyData.map((day) => {
            const dayHeight = (day.water_glasses / maxGlasses) * 100;
            const isToday = day.date === today;
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-center mb-1">
                  <p className="text-pixel-xs font-bold">{day.water_glasses}</p>
                </div>
                <div 
                  className="w-full border-2 border-darkgray relative transition-all hover:opacity-80"
                  style={{ 
                    height: `${Math.max(dayHeight, 10)}%`,
                    backgroundColor: isToday ? '#FFB5E8' : day.water_glasses >= maxGlasses ? '#C1FBA4' : '#B5DEFF'
                  }}
                >
                  {day.water_glasses > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Droplet size={16} className="fill-current text-darkgray/30" />
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
            <span>Goal met</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#B5DEFF] border border-darkgray"></div>
            <span>In progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#FFB5E8] border border-darkgray"></div>
            <span>Today</span>
          </div>
        </div>
      </Card>

      {/* Fun Hydration Facts */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={24} className="text-primary" />
          <h2 className="text-pixel-lg">Hydration Facts</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hydrationFacts.map((fact, i) => {
            const IconComponent = fact.icon;
            return (
              <Card key={i} className="hover:shadow-lg transition-all">
                <div className="flex flex-col items-center text-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-3 border-2 border-darkgray"
                    style={{ backgroundColor: fact.color }}
                  >
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

      {/* Hydration Tips */}
      <Card className="bg-lavender/30">
        <div className="flex gap-4">
          <Info size={32} className="text-primary shrink-0 mt-1" />
          <div>
            <h3 className="font-mono font-bold text-lg mb-3">Tips for Staying Hydrated</h3>
            <ul className="text-pixel-sm space-y-2 text-darkgray/90">
              <li>• Start your day with a glass of water to kickstart your metabolism</li>
              <li>• Keep a water bottle with you throughout the day</li>
              <li>• Drink a glass before each meal to aid digestion</li>
              <li>• Set hourly reminders on your phone if you often forget</li>
              <li>• Eat water-rich foods like cucumbers, watermelon, and oranges</li>
              <li>• Drink extra water when exercising or in hot weather</li>
              <li>• Your urine should be pale yellow - darker means you need more water</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}