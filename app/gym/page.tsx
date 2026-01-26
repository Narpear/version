'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { User, GymLog, WorkoutTemplate } from '@/types';
import { Dumbbell, Trash2, Save, ChevronLeft, ChevronRight, Star } from 'lucide-react';

export default function GymPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gymLogs, setGymLogs] = useState<GymLog[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Date state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Form state
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState(0);
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [notes, setNotes] = useState('');
  const [warmupDone, setWarmupDone] = useState(false);
  const [cooldownDone, setCooldownDone] = useState(false);
  const [meditationDone, setMeditationDone] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadWorkoutData(parsedUser.id, selectedDate);
    loadTemplates(parsedUser.id);
  }, [router, selectedDate]);

  const loadWorkoutData = async (userId: string, date: string) => {
    try {
      const { data, error } = await supabase
        .from('gym_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (data) {
        setGymLogs(data);
        // Update daily totals only if it's today
        if (date === today) {
          await updateDailyTotals(userId, data);
        }
      }
    } catch (error) {
      console.log('No gym logs for this date');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('user_id', userId)
        .order('template_name');

      if (data) {
        setTemplates(data);
      }
    } catch (error) {
      console.log('No templates found');
    }
  };

  const updateDailyTotals = async (userId: string, logs: GymLog[]) => {
    const totalCaloriesOut = logs.reduce((sum, log) => sum + log.calories_burned, 0);

    try {
      const { data: existing } = await supabase
        .from('daily_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('date', selectedDate)
        .single();

      if (existing) {
        await supabase
          .from('daily_entries')
          .update({ total_calories_out: totalCaloriesOut })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('daily_entries')
          .insert({
            user_id: userId,
            date: selectedDate,
            total_calories_in: 0,
            total_calories_out: totalCaloriesOut,
            water_glasses: 0,
          });
      }
    } catch (error) {
      console.error('Error updating daily totals:', error);
    }
  };

  const resetForm = () => {
    setExerciseName('');
    setSets(0);
    setReps(0);
    setWeight(0);
    setCaloriesBurned(0);
    setNotes('');
  };

  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('gym_logs')
        .insert({
          user_id: user.id,
          date: selectedDate,
          exercise_name: exerciseName,
          sets: sets || null,
          reps: reps || null,
          weight_kg: weight || null,
          calories_burned: caloriesBurned,
          notes: notes || null,
          warmup_done: warmupDone,
          cooldown_done: cooldownDone,
          meditation_done: meditationDone,
        })
        .select()
        .single();

      if (error) throw error;

      const updatedLogs = [...gymLogs, data];
      setGymLogs(updatedLogs);
      if (isToday) {
        await updateDailyTotals(user.id, updatedLogs);
      }
      
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding workout:', error);
      alert('Failed to add workout');
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!user || !exerciseName) {
      alert('Please fill in exercise details first');
      return;
    }

    const templateName = prompt('Enter template name:', exerciseName);
    if (!templateName) return;

    try {
      await supabase
        .from('workout_templates')
        .insert({
          user_id: user.id,
          template_name: templateName,
          exercise_name: exerciseName,
          sets: sets || null,
          reps: reps || null,
          weight_kg: weight || null,
          calories_burned: caloriesBurned,
          notes: notes || null,
        });

      await loadTemplates(user.id);
      alert('Template saved! ⭐');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleUseTemplate = (template: WorkoutTemplate) => {
    setExerciseName(template.exercise_name);
    setSets(template.sets || 0);
    setReps(template.reps || 0);
    setWeight(template.weight_kg || 0);
    setCaloriesBurned(template.calories_burned);
    setNotes(template.notes || '');
    setShowTemplates(false);
    setShowAddForm(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      await supabase
        .from('workout_templates')
        .delete()
        .eq('id', id);

      await loadTemplates(user!.id);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('gym_logs')
        .delete()
        .eq('id', id);

      const updatedLogs = gymLogs.filter(log => log.id !== id);
      setGymLogs(updatedLogs);
      if (isToday) {
        await updateDailyTotals(user.id, updatedLogs);
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('Failed to delete workout');
    }
  };

  const updateChecklist = async (field: 'warmup_done' | 'cooldown_done' | 'meditation_done', value: boolean) => {
    if (!user || gymLogs.length === 0) return;

    try {
      const firstLog = gymLogs[0];
      await supabase
        .from('gym_logs')
        .update({ [field]: value })
        .eq('id', firstLog.id);

      setGymLogs(gymLogs.map(log => 
        log.id === firstLog.id ? { ...log, [field]: value } : log
      ));

      if (field === 'warmup_done') setWarmupDone(value);
      if (field === 'cooldown_done') setCooldownDone(value);
      if (field === 'meditation_done') setMeditationDone(value);
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  useEffect(() => {
    if (gymLogs.length > 0) {
      const firstLog = gymLogs[0];
      setWarmupDone(firstLog.warmup_done);
      setCooldownDone(firstLog.cooldown_done);
      setMeditationDone(firstLog.meditation_done);
    }
  }, [gymLogs]);

  if (loading) {
    return (
      <div className="container-pixel">
        <p className="font-mono text-lg">Loading...</p>
      </div>
    );
  }

  const totalCaloriesBurned = gymLogs.reduce((sum, log) => sum + log.calories_burned, 0);
  const totalExercises = gymLogs.length;

  return (
    <div className="container-pixel">
      {/* Date Navigation */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="heading-pixel">Gym Tracker</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => changeDate(-1)} className="p-2 border-4 border-darkgray bg-white hover:bg-lavender">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <p className="font-mono text-lg">
              {selectedDate === today ? 'Today' : new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={today}
              className="text-pixel-xs border-2 border-darkgray p-1 mt-1"
            />
          </div>
          <button 
            onClick={() => changeDate(1)} 
            disabled={isToday}
            className={`p-2 border-4 border-darkgray ${isToday ? 'bg-gray-200 cursor-not-allowed' : 'bg-white hover:bg-lavender'}`}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Button onClick={() => { setShowAddForm(!showAddForm); setShowTemplates(false); }}>
          {showAddForm ? 'Cancel' : '+ Add Exercise'}
        </Button>
        <Button onClick={() => { setShowTemplates(!showTemplates); setShowAddForm(false); }} variant="secondary">
          <Star size={16} className="inline mr-2" />
          Templates ({templates.length})
        </Button>
      </div>

      {/* Workout Checklist - Only show for today */}
      {isToday && gymLogs.length > 0 && (
        <Card title="Today's Checklist" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => updateChecklist('warmup_done', !warmupDone)}
              className={`p-4 border-4 border-darkgray transition-all ${
                warmupDone ? 'bg-success' : 'bg-white hover:bg-lavender'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 border-4 border-darkgray flex items-center justify-center ${
                  warmupDone ? 'bg-darkgray' : 'bg-white'
                }`}>
                  {warmupDone && <span className="text-white text-lg">✓</span>}
                </div>
                <span className="font-mono text-lg">5 min Warmup</span>
              </div>
            </button>

            <button
              onClick={() => updateChecklist('cooldown_done', !cooldownDone)}
              className={`p-4 border-4 border-darkgray transition-all ${
                cooldownDone ? 'bg-success' : 'bg-white hover:bg-lavender'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 border-4 border-darkgray flex items-center justify-center ${
                  cooldownDone ? 'bg-darkgray' : 'bg-white'
                }`}>
                  {cooldownDone && <span className="text-white text-lg">✓</span>}
                </div>
                <span className="font-mono text-lg">5 min Cooldown</span>
              </div>
            </button>

            <button
              onClick={() => updateChecklist('meditation_done', !meditationDone)}
              className={`p-4 border-4 border-darkgray transition-all ${
                meditationDone ? 'bg-success' : 'bg-white hover:bg-lavender'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 border-4 border-darkgray flex items-center justify-center ${
                  meditationDone ? 'bg-darkgray' : 'bg-white'
                }`}>
                  {meditationDone && <span className="text-white text-lg">✓</span>}
                </div>
                <span className="font-mono text-lg">5 min Meditation</span>
              </div>
            </button>
          </div>
        </Card>
      )}

      {/* Templates List */}
      {showTemplates && (
        <Card title="Your Workout Templates" className="mb-6">
          {templates.length === 0 ? (
            <p className="font-mono text-sm text-darkgray/70">No templates saved yet. Add an exercise and click "Save as Template"</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border-4 border-darkgray bg-secondary/20 flex justify-between items-center"
                >
                  <div className="flex-1 cursor-pointer" onClick={() => handleUseTemplate(template)}>
                    <p className="font-mono text-sm font-bold">{template.template_name}</p>
                    <p className="text-pixel-xs text-darkgray/70">
                      {template.exercise_name} • {template.calories_burned} cal
                      {template.sets && template.reps && ` • ${template.sets}×${template.reps}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 border-2 border-darkgray bg-warning hover:bg-warning/70"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Add Exercise Form */}
      {showAddForm && (
        <Card title="Add Exercise" className="mb-6">
          <form onSubmit={handleAddWorkout}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                label="Exercise Name"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="e.g., Squats"
                required
              />

              <Input
                type="number"
                label="Calories Burned"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(parseFloat(e.target.value))}
                placeholder="150"
                required
                min={0}
              />

              <Input
                type="number"
                label="Sets"
                value={sets}
                onChange={(e) => setSets(parseFloat(e.target.value))}
                placeholder="3"
                min={0}
              />

              <Input
                type="number"
                label="Reps"
                value={reps}
                onChange={(e) => setReps(parseFloat(e.target.value))}
                placeholder="12"
                min={0}
              />

              <Input
                type="number"
                label="Weight (kg)"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
                placeholder="20"
                step={0.5}
                min={0}
              />

              <div className="md:col-span-2">
                <Input
                  type="text"
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button type="submit" className="flex-1">
                Add Exercise
              </Button>
              <Button type="button" onClick={handleSaveAsTemplate} variant="secondary">
                <Save size={16} className="inline mr-2" />
                Save as Template
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Daily Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <p className="text-pixel-sm text-darkgray/70 mb-1">Total Calories Burned</p>
          <p className="font-mono text-3xl">{totalCaloriesBurned}</p>
        </Card>
        <Card>
          <p className="text-pixel-sm text-darkgray/70 mb-1">Exercises Completed</p>
          <p className="font-mono text-3xl">{totalExercises}</p>
        </Card>
      </div>

      {/* Workouts List */}
      {gymLogs.length > 0 && (
        <Card title={`${isToday ? 'Today\'s' : 'Day\'s'} Workouts`} className="mb-6">
          <div className="space-y-3">
            {gymLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 border-4 border-darkgray bg-secondary/20"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-mono text-lg font-bold mb-2">{log.exercise_name}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-sm">
                      {log.sets && log.reps && (
                        <p>📊 {log.sets} × {log.reps}</p>
                      )}
                      {log.weight_kg && (
                        <p>⚖️ {log.weight_kg} kg</p>
                      )}
                      <p>🔥 {log.calories_burned} cal</p>
                    </div>
                    {log.notes && (
                      <p className="font-mono text-sm text-darkgray/70 mt-2">
                        📝 {log.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteWorkout(log.id)}
                    className="p-2 border-2 border-darkgray bg-warning hover:bg-warning/70 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {gymLogs.length === 0 && !showAddForm && !showTemplates && (
        <Card>
          <div className="text-center py-8">
            <Dumbbell size={48} className="mx-auto mb-4 text-darkgray/30" />
            <p className="font-mono text-lg text-darkgray/70">No workouts logged for this day</p>
            <p className="font-mono text-sm text-darkgray/50 mt-2">Click "Add Exercise" to get started!</p>
          </div>
        </Card>
      )}
    </div>
  );
}