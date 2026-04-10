'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { User, Goal } from '@/types';
import { calculateGoalEnergyNeeded, calculateDailyTargetKcal, calculateProgress, getProgressColor } from '@/lib/calculations';
import { useToast } from '@/components/ui/ToastProvider';
import { Edit, X, Check } from 'lucide-react';
import TrackerPicker from '@/components/TrackerPicker';
import { useBgTheme } from '@/lib/useTheme';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { bgTheme, applyBgTheme } = useBgTheme();
  const [user, setUser] = useState<User | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [selectedTrackers, setSelectedTrackers] = useState<string[]>(['food', 'gym', 'progress']);
  const [savingTrackers, setSavingTrackers] = useState(false);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState(0);
  const [editHeight, setEditHeight] = useState(0);
  const [editGender, setEditGender] = useState<'male' | 'female' | 'non-binary'>('female');

  // Goal form state
  const [goalType, setGoalType] = useState<'loss' | 'gain' | 'maintenance'>('loss');
  const [startWeight, setStartWeight] = useState(0);
  const [goalWeight, setGoalWeight] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setEditName(parsedUser.name || '');
    setEditAge(parsedUser.age || 0);
    setEditHeight(parsedUser.height_cm || 0);
    setEditGender(parsedUser.gender || 'female');
    setSelectedTrackers(parsedUser.selected_trackers || ['food', 'gym', 'progress']);
    loadGoal(parsedUser.id);
    loadCurrentWeight(parsedUser.id);
  }, [router]);

  const loadGoal = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (data) {
        const { data: allEntries } = await supabase
          .from('daily_entries')
          .select('apparent_deficit, actual_deficit')
          .eq('user_id', userId)
          .gte('date', data.start_date)
          .not('apparent_deficit', 'is', null);
          
        if (allEntries) {
          const cumulativeApparent = allEntries.reduce((sum, e) => sum + (e.apparent_deficit || 0), 0);
          const cumulativeActual = allEntries.reduce((sum, e) => sum + (e.actual_deficit || 0), 0);
          await supabase.from('goals').update({
            cumulative_apparent_deficit: cumulativeApparent,
            cumulative_actual_deficit: cumulativeActual
          }).eq('id', data.id);
          data.cumulative_apparent_deficit = cumulativeApparent;
          data.cumulative_actual_deficit = cumulativeActual;
        }
        
        setActiveGoal(data);
        setGoalType(data.goal_type);
        setStartWeight(data.start_weight_kg);
        setGoalWeight(data.goal_weight_kg);
        setStartDate(data.start_date);
      }
    } catch (error) {
      console.log('No active goal found');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentWeight = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('daily_entries')
        .select('weight_kg')
        .eq('user_id', userId)
        .not('weight_kg', 'is', null)
        .order('date', { ascending: false })
        .limit(1)
        .single();
      if (data?.weight_kg) setCurrentWeight(data.weight_kg);
    } catch (error) {
      console.log('No weight entries found');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editName,
          age: editAge,
          height_cm: editHeight,
          gender: editGender,
        })
        .eq('id', user.id);

      if (error) throw error;

      const updatedUser = { ...user, name: editName, age: editAge, height_cm: editHeight, gender: editGender };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setEditingProfile(false);
      toast('Profile updated!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    if (!user) return;
    setEditName(user.name || '');
    setEditAge(user.age || 0);
    setEditHeight(user.height_cm || 0);
    setEditGender(user.gender || 'female');
    setEditingProfile(false);
  };

  const handleSaveGoal = async () => {
    if (!user) return;
    if (goalType === 'loss' && goalWeight >= startWeight) {
      alert('For weight loss, goal weight must be less than start weight');
      return;
    }
    if (goalType === 'gain' && goalWeight <= startWeight) {
      alert('For weight gain, goal weight must be greater than start weight');
      return;
    }
    if (goalType === 'maintenance' && Math.abs(startWeight - goalWeight) > 2) {
      alert('For maintenance, goal weight should be close to start weight (±2kg)');
      return;
    }
    setSaving(true);
    try {
      const totalEnergyNeeded = calculateGoalEnergyNeeded(startWeight, goalWeight, goalType);
      const dailyTarget = calculateDailyTargetKcal(goalType);
      if (activeGoal) {
        await supabase.from('goals').update({ is_active: false }).eq('id', activeGoal.id);
      }
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          goal_type: goalType,
          start_date: startDate,
          start_weight_kg: startWeight,
          goal_weight_kg: goalWeight,
          daily_target_kcal: dailyTarget,
          total_energy_kcal_needed: totalEnergyNeeded,
          current_weight_kg: startWeight,
          cumulative_apparent_deficit: 0,
          cumulative_actual_deficit: 0,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      setActiveGoal(data);
      toast('Saved!');
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTrackers = async () => {
    if (!user) return;
    setSavingTrackers(true);
    try {
      const res = await fetch('/api/user/trackers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, selected_trackers: selectedTrackers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const updatedUser = { ...user, selected_trackers: data.selected_trackers };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('trackersupdated'));
      toast('Trackers updated!');
    } catch (error) {
      console.error('Error saving trackers:', error);
      toast('Failed to save trackers');
    } finally {
      setSavingTrackers(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('needsOnboarding');
    router.push('/login');
  };

  if (loading) {
    return <div className="container-pixel"><p className="font-mono text-lg">Loading...</p></div>;
  }

  if (!user) return null;

  const weightDiff = Math.abs(startWeight - goalWeight);
  const totalEnergyNeeded = calculateGoalEnergyNeeded(startWeight, goalWeight, goalType);
  const dailyTarget = calculateDailyTargetKcal(goalType);
  const progress = activeGoal && activeGoal.total_energy_kcal_needed
    ? calculateProgress(activeGoal.cumulative_actual_deficit || 0, activeGoal.total_energy_kcal_needed, activeGoal.goal_type)
    : 0;
  const progressPercent = Math.min(progress * 100, 100);
  const progressColor = getProgressColor(progress);
  const bmi = user?.height_cm && (currentWeight || activeGoal?.start_weight_kg)
    ? (Number(currentWeight || activeGoal?.start_weight_kg) / Math.pow(Number(user.height_cm) / 100, 2))
    : null;
  const bmiLabel = (value: number) => {
    if (value < 18.5) return 'Underweight';
    if (value < 25) return 'Normal';
    if (value < 30) return 'Overweight';
    return 'Obese';
  };

  return (
    <div className="container-pixel">
      <h1 className="heading-pixel">Profile & Goals</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info Card */}
        <Card title="Personal Info">
          {!editingProfile ? (
            // View mode
            <>
              <div className="space-y-3 mb-6">
                {[
                  { label: 'Name', value: user.name },
                  { label: 'Email', value: user.email },
                  { label: 'Height', value: `${user.height_cm} cm` },
                  { label: 'Age', value: `${user.age} years` },
                  { label: 'Gender', value: user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-pixel-sm text-darkgray/70">{label}</p>
                    <p className="font-mono text-lg">{value}</p>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setEditingProfile(true)}
                variant="secondary"
                className="w-full mb-3"
              >
                <Edit size={14} className="inline mr-2" />
                Edit Profile
              </Button>
              <Button onClick={handleLogout} variant="secondary" className="w-full">
                Logout
              </Button>

              <p className="text-center font-mono text-xs mt-4 text-darkgray/50">
                View the{' '}
                <a href="/privacy" className="text-primary underline">Privacy Policy</a>
              </p>
            </>
          ) : (
            // Edit mode
            <>
              <div className="space-y-3 mb-4">
                <Input
                  label="Name"
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your name"
                />
                <Input
                  label="Age"
                  type="number"
                  value={editAge}
                  onChange={e => setEditAge(parseInt(e.target.value) || 0)}
                  min={10}
                  max={120}
                />
                <Input
                  label="Height (cm)"
                  type="number"
                  value={editHeight}
                  onChange={e => setEditHeight(parseFloat(e.target.value) || 0)}
                  step={0.5}
                  min={50}
                  max={300}
                />
                <div>
                  <label className="block text-pixel-sm mb-2">Gender</label>
                  <select
                    value={editGender}
                    onChange={e => setEditGender(e.target.value as 'male' | 'female' | 'non-binary')}
                    className="input-pixel w-full"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                  </select>
                </div>
                <p className="font-mono text-xs text-darkgray/50">
                  Email cannot be changed
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1"
                >
                  <Check size={14} className="inline mr-2" />
                  {savingProfile ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="secondary"
                  className="flex-1"
                >
                  <X size={14} className="inline mr-2" />
                  Cancel
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Goal Settings Card */}
        <Card title="Goal Settings">
          <div className="space-y-4">
            <div>
              <label className="block text-pixel-sm mb-2">Goal Type</label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as 'loss' | 'gain' | 'maintenance')}
                className="input-pixel w-full"
              >
                <option value="loss">Weight Loss</option>
                <option value="gain">Weight Gain</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <Input type="date" label="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="number" label="Start Weight (kg)" value={startWeight} onChange={(e) => setStartWeight(parseFloat(e.target.value))} step={0.1} required />
            <Input
              type="number"
              label="Goal Weight (kg)"
              value={goalWeight}
              onChange={(e) => setGoalWeight(parseFloat(e.target.value))}
              placeholder={goalType === 'loss' ? '55' : goalType === 'gain' ? '65' : '60'}
              step={0.1}
              required
            />
            {startWeight > 0 && goalWeight > 0 && (
              <div className="p-4 bg-accent/30 border-2 border-darkgray mt-4">
                <p className="text-pixel-sm mb-2">Goal Summary:</p>
                <p className="font-mono text-sm">
                  {goalType === 'loss' ? 'Lose' : goalType === 'gain' ? 'Gain' : 'Maintain'}{' '}
                  {weightDiff.toFixed(1)} kg
                </p>
                {totalEnergyNeeded !== null && (
                  <p className="font-mono text-sm">
                    {goalType === 'loss' ? 'Total Deficit Needed' : 'Total Surplus Needed'}: {totalEnergyNeeded.toLocaleString()} calories
                  </p>
                )}
                <p className="font-mono text-sm">
                  Daily Goal: {dailyTarget} kcal {goalType === 'loss' ? 'deficit' : goalType === 'gain' ? 'surplus' : 'balance'}
                </p>
                {bmi !== null && (
                  <p className="font-mono text-sm mt-2">BMI: {bmi.toFixed(1)} ({bmiLabel(bmi)})</p>
                )}
              </div>
            )}
            <Button onClick={handleSaveGoal} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Goal'}
            </Button>
          </div>
        </Card>
      </div>

      {/* My Trackers Card */}
      <Card title="My Trackers" className="mt-6">
        <p className="font-mono text-sm mb-4 text-darkgray/70">
          Choose which trackers appear in your navigation.
        </p>
        <TrackerPicker selected={selectedTrackers} onChange={setSelectedTrackers} />
        <Button onClick={handleSaveTrackers} disabled={savingTrackers} className="w-full mt-4">
          {savingTrackers ? 'Saving...' : 'Save Trackers'}
        </Button>
      </Card>

      {/* Background Theme Card */}
      <Card title="Background Theme" className="mt-6">
        <p className="font-mono text-sm mb-4 text-darkgray/70">
          Choose the background image style across all pages.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { value: 'feminine',       label: 'Feminine' },
            { value: 'masculine',      label: 'Masculine' },
            { value: 'gender-neutral', label: 'Neutral' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => applyBgTheme(value)}
              className={`p-3 border-2 border-darkgray font-mono text-sm transition-all ${
                bgTheme === value ? 'bg-primary' : 'bg-white hover:bg-lavender'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Current Goal Display */}
      {activeGoal && (
        <Card title="Current Active Goal" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Type', value: activeGoal.goal_type.charAt(0).toUpperCase() + activeGoal.goal_type.slice(1) },
              { label: 'Start Weight', value: `${activeGoal.start_weight_kg} kg` },
              { label: 'Current Weight', value: currentWeight ? `${currentWeight} kg` : 'Not tracked yet' },
              { label: 'Goal Weight', value: `${activeGoal.goal_weight_kg} kg` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-pixel-sm text-darkgray/70">{label}</p>
                <p className="font-mono text-lg">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-pixel-sm text-darkgray/70">
                {activeGoal.goal_type === 'maintenance' ? 'Daily Target' : activeGoal.goal_type === 'loss' ? 'Total Deficit Needed' : 'Total Surplus Needed'}
              </p>
              <p className="font-mono text-lg">
                {activeGoal.goal_type === 'maintenance'
                  ? `${activeGoal.daily_target_kcal > 0 ? '+' : ''}${activeGoal.daily_target_kcal} kcal/day`
                  : `${activeGoal.total_energy_kcal_needed?.toLocaleString() || 0} cal`}
              </p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70">Apparent (Food/Gym)</p>
              <p className="font-mono text-lg">{activeGoal.cumulative_apparent_deficit?.toLocaleString() || '0'} cal</p>
            </div>
            <div>
              <p className="text-pixel-sm text-darkgray/70">Actual (Weight Change)</p>
              <p className="font-mono text-lg font-bold">{activeGoal.cumulative_actual_deficit?.toLocaleString() || '0'} cal</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-pixel-sm">Progress</p>
              <p className="text-pixel-sm">{progressPercent.toFixed(1)}%</p>
            </div>
            <div className="progress-pixel">
              <div className="progress-pixel-fill" style={{ width: `${progressPercent}%`, backgroundColor: progressColor }} />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}