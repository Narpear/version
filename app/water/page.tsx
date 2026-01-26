'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { Droplet } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function WaterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [glasses, setGlasses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const maxGlasses = 8;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadTodayWater(parsedUser.id);
  }, [router]);

  const loadTodayWater = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('water_glasses')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (data) {
        setGlasses(data.water_glasses || 0);
      }
    } catch (error) {
      console.log('No water entry for today');
    } finally {
      setLoading(false);
    }
  };

  const updateWater = async (newGlasses: number) => {
    if (!user) return;
    setSaving(true);

    try {
      // Check if entry exists
      const { data: existing } = await supabase
        .from('daily_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (existing) {
        // Update existing entry
        await supabase
          .from('daily_entries')
          .update({ water_glasses: newGlasses })
          .eq('id', existing.id);
      } else {
        // Create new entry
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

  return (
    <div className="container-pixel">
      <h1 className="heading-pixel">Water Tracker</h1>
      <p className="font-mono text-lg mb-6">Goal: 8 glasses (2L) per day</p>

      <div className="max-w-2xl mx-auto">
        <Card>
          {/* Water Glass Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[...Array(maxGlasses)].map((_, i) => (
              <div
                key={i}
                className={`aspect-square border-2 border-darkgray flex items-center justify-center transition-all ${
                  i < glasses 
                    ? 'bg-secondary' 
                    : 'bg-white'
                }`}
              >
                <Droplet 
                  size={32} 
                  className={i < glasses ? 'fill-current text-darkgray' : 'text-darkgray/30'}
                />
              </div>
            ))}
          </div>

          {/* Progress Display */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="font-mono text-lg">
                {glasses} / {maxGlasses} glasses
              </p>
              <p className="font-mono text-lg">
                {(glasses * 0.25).toFixed(2)}L / 2L
              </p>
            </div>
            <div className="progress-pixel">
              <div 
                className="h-full border-r-2 border-darkgray transition-all"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: isComplete ? '#C1FBA4' : '#B5DEFF'
                }}
              />
            </div>
          </div>

          {/* Success Message */}
          {isComplete && (
            <div className="p-4 bg-success border-2 border-darkgray mb-6 text-center">
              <p className="text-pixel-sm">Daily goal complete</p>
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

          {/* Reset Button */}
          {glasses > 0 && (
            <Button 
              onClick={() => updateWater(0)} 
              disabled={saving}
              variant="secondary"
              className="w-full mt-4"
            >
              Reset Today
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}