'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { calculateGoalEnergyNeeded, calculateDailyTargetKcal } from '@/lib/calculations';

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Personal Info
  const [height, setHeight] = useState(0);
  const [age, setAge] = useState(0);
  const [gender, setGender] = useState('female');

  // Step 2: Goal (Optional)
  const [wantsGoal, setWantsGoal] = useState<boolean | null>(null);
  const [goalType, setGoalType] = useState<'loss' | 'gain' | 'maintenance'>('loss');
  const [startWeight, setStartWeight] = useState(0);
  const [goalWeight, setGoalWeight] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update user with personal info
      await supabase
        .from('users')
        .update({
          height_cm: height,
          age: age,
          gender: gender,
        })
        .eq('id', user.id);

      // Update localStorage
      const updatedUser = { ...user, height_cm: height, age: age, gender: gender };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setStep(2);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to save info');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (wantsGoal && startWeight > 0 && goalWeight > 0) {
        // Validate weights based on goal type
        if (goalType === 'loss' && goalWeight >= startWeight) {
          alert('For weight loss, goal weight must be less than current weight');
          setLoading(false);
          return;
        }
        if (goalType === 'gain' && goalWeight <= startWeight) {
          alert('For weight gain, goal weight must be greater than current weight');
          setLoading(false);
          return;
        }
        if (goalType === 'maintenance' && Math.abs(startWeight - goalWeight) > 2) {
          alert('For maintenance, goal weight should be close to current weight (±2kg)');
          setLoading(false);
          return;
        }

        // Calculate goal energy needed and daily target
        const totalEnergyNeeded = calculateGoalEnergyNeeded(startWeight, goalWeight, goalType);
        const dailyTarget = calculateDailyTargetKcal(goalType);

        // Create goal
        await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            goal_type: goalType,
            start_date: new Date().toISOString().split('T')[0],
            start_weight_kg: startWeight,
            goal_weight_kg: goalWeight,
            daily_target_kcal: dailyTarget,
            total_energy_kcal_needed: totalEnergyNeeded,
            current_weight_kg: startWeight,
            is_active: true,
          });
      }

      // Clear onboarding flag
      localStorage.removeItem('needsOnboarding');
      
      // Redirect to dashboard
      router.push('/');
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <h1 className="heading-pixel text-center mb-4">Welcome, {user.name}! 👋</h1>
        <p className="text-center font-mono text-lg mb-6">
          Let's set up your profile
        </p>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-6">
          <div className={`flex-1 h-2 border-2 border-darkgray ${step >= 1 ? 'bg-primary' : 'bg-white'}`} />
          <div className={`flex-1 h-2 border-2 border-darkgray ${step >= 2 ? 'bg-primary' : 'bg-white'}`} />
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1Submit}>
            <p className="font-mono text-sm mb-4 text-darkgray/70">
              Tell us about yourself (used for BMR calculations)
            </p>

            <Input
              type="number"
              label="Height (cm)"
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value))}
              placeholder="160"
              required
              step={0.1}
              min={100}
              max={250}
            />

            <Input
              type="number"
              label="Age"
              value={age}
              onChange={(e) => setAge(parseFloat(e.target.value))}
              placeholder="25"
              required
              min={13}
              max={120}
            />

            <div className="mb-4">
              <label className="block text-pixel-sm mb-2">
                Gender <span className="text-warning">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="input-pixel w-full"
                required
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
              <p className="text-pixel-xs text-darkgray/50 mt-1">
                (Used for BMR calculation only)
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Next'}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit}>
            <p className="font-mono text-sm mb-4 text-darkgray/70">
              Would you like to set a goal? (You can skip and set this later)
            </p>

            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => setWantsGoal(false)}
                className={`w-full p-4 border-2 border-darkgray text-left transition-all ${
                  wantsGoal === false ? 'bg-primary' : 'bg-white hover:bg-lavender'
                }`}
              >
                <p className="font-mono text-sm font-bold">Skip for now</p>
                <p className="font-mono text-xs text-darkgray/70">I'll set my goal later</p>
              </button>

              <button
                type="button"
                onClick={() => setWantsGoal(true)}
                className={`w-full p-4 border-2 border-darkgray text-left transition-all ${
                  wantsGoal === true ? 'bg-primary' : 'bg-white hover:bg-lavender'
                }`}
              >
                <p className="font-mono text-sm font-bold">Set goal now</p>
                <p className="font-mono text-xs text-darkgray/70">Track my progress from day 1</p>
              </button>
            </div>

            {wantsGoal && (
              <div className="space-y-4 mb-6 p-4 border-2 border-darkgray bg-accent/10">
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

                <Input
                  type="number"
                  label="Current Weight (kg)"
                  value={startWeight}
                  onChange={(e) => setStartWeight(parseFloat(e.target.value))}
                  placeholder="60"
                  step={0.1}
                  min={20}
                  required={wantsGoal}
                />

                <Input
                  type="number"
                  label="Goal Weight (kg)"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(parseFloat(e.target.value))}
                  placeholder={goalType === 'loss' ? '55' : goalType === 'gain' ? '65' : '60'}
                  step={0.1}
                  min={20}
                  required={wantsGoal}
                />

                {startWeight > 0 && goalWeight > 0 && (
                  <div className="p-3 bg-success/20 border-2 border-darkgray">
                    <p className="text-pixel-sm">
                      Goal: {goalType === 'loss' ? 'Lose' : goalType === 'gain' ? 'Gain' : 'Maintain'}{' '}
                      {Math.abs(startWeight - goalWeight).toFixed(1)} kg
                    </p>
                    <p className="text-pixel-xs text-darkgray/70 mt-1">
                      Daily target: {goalType === 'loss' ? '-300' : goalType === 'gain' ? '+300' : '0'} kcal
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="button" onClick={() => setStep(1)} variant="secondary" className="flex-1">
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={
                  loading || 
                  (wantsGoal === true && (
                    startWeight <= 0 || 
                    goalWeight <= 0 ||
                    (goalType === 'loss' && goalWeight >= startWeight) ||
                    (goalType === 'gain' && goalWeight <= startWeight) ||
                    (goalType === 'maintenance' && Math.abs(startWeight - goalWeight) > 2)
                  ))
                } 
                className="flex-1"
              >
                {loading ? 'Saving...' : wantsGoal ? 'Finish' : 'Skip & Start'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}