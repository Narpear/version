'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { User, GymLog, WorkoutTemplate } from '@/types';
import { Dumbbell, Trash2, Save, ChevronLeft, ChevronRight, Star, X, Search, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

// Modal Component
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white border-4 border-darkgray max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-pixel">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-4 border-darkgray p-4 flex justify-between items-center">
          <h2 className="heading-pixel text-xl">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 border-2 border-darkgray bg-warning hover:bg-warning/70 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function GymPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [gymLogs, setGymLogs] = useState<GymLog[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<GymLog | null>(null);

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

  // Search state for templates
  const [templateSearch, setTemplateSearch] = useState('');

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
    setEditingWorkout(null);
  };

  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingWorkout) {
        // Update existing workout
        const { data, error } = await supabase
          .from('gym_logs')
          .update({
            exercise_name: exerciseName,
            sets: sets || null,
            reps: reps || null,
            weight_kg: weight || null,
            calories_burned: caloriesBurned,
            notes: notes || null,
          })
          .eq('id', editingWorkout.id)
          .select()
          .single();

        if (error) throw error;

        const updatedLogs = gymLogs.map(log => log.id === editingWorkout.id ? data : log);
        setGymLogs(updatedLogs);
        if (isToday) {
          await updateDailyTotals(user.id, updatedLogs);
        }
        toast('Updated!');
      } else {
        // Create new workout
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
        toast('Saved!');
      }
      
      resetForm();
      setShowAddModal(false);
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
      toast('Template saved!');
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
    setShowTemplatesModal(false);
    setShowAddModal(true);
  };

  const handleEditWorkout = (workout: GymLog) => {
    setExerciseName(workout.exercise_name);
    setSets(workout.sets || 0);
    setReps(workout.reps || 0);
    setWeight(workout.weight_kg || 0);
    setCaloriesBurned(workout.calories_burned);
    setNotes(workout.notes || '');
    setEditingWorkout(workout);
    setShowAddModal(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      await supabase
        .from('workout_templates')
        .delete()
        .eq('id', id);

      await loadTemplates(user!.id);
      toast('Template deleted');
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
      toast('Workout deleted');
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
      toast('Saved!');
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

  // Filter templates based on search
  const filteredTemplates = templates.filter(template => {
    const searchLower = templateSearch.toLowerCase();
    const nameLower = template.template_name.toLowerCase();
    const exerciseLower = template.exercise_name.toLowerCase();
    
    return nameLower.includes(searchLower) || 
           exerciseLower.includes(searchLower) ||
           template.calories_burned.toString().includes(searchLower);
  });

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
          <button onClick={() => changeDate(-1)} className="p-2 border-2 border-darkgray bg-white hover:bg-lavender">
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
            className={`p-2 border-2 border-darkgray ${isToday ? 'bg-gray-200 cursor-not-allowed' : 'bg-white hover:bg-lavender'}`}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Button onClick={() => setShowAddModal(true)}>
          + Add Exercise
        </Button>
      </div>

      {/* Workout Checklist - Only show for today */}
      {isToday && gymLogs.length > 0 && (
        <Card title="Today's Checklist" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => updateChecklist('warmup_done', !warmupDone)}
              className={`p-4 border-2 transition-all ${
                warmupDone ? 'bg-success border-success' : 'bg-white border-darkgray hover:bg-lavender'
              }`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-7 h-7 border-[3px] flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: warmupDone ? '#2d2d2d' : '#ffffff',
                    borderColor: warmupDone ? '#2d2d2d' : '#4A4A4A'
                  }}
                >
                  {warmupDone ? (
                    <span className="text-white text-2xl font-black leading-none">✓</span>
                  ) : null}
                </div>
                <span className="font-mono text-lg">5 min Warmup</span>
              </div>
            </button>

            <button
              onClick={() => updateChecklist('cooldown_done', !cooldownDone)}
              className={`p-4 border-2 transition-all ${
                cooldownDone ? 'bg-success border-success' : 'bg-white border-darkgray hover:bg-lavender'
              }`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-7 h-7 border-[3px] flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: cooldownDone ? '#2d2d2d' : '#ffffff',
                    borderColor: cooldownDone ? '#2d2d2d' : '#4A4A4A'
                  }}
                >
                  {cooldownDone ? (
                    <span className="text-white text-2xl font-black leading-none">✓</span>
                  ) : null}
                </div>
                <span className="font-mono text-lg">5 min Cooldown</span>
              </div>
            </button>

            <button
              onClick={() => updateChecklist('meditation_done', !meditationDone)}
              className={`p-4 border-2 transition-all ${
                meditationDone ? 'bg-success border-success' : 'bg-white border-darkgray hover:bg-lavender'
              }`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-7 h-7 border-[3px] flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: meditationDone ? '#2d2d2d' : '#ffffff',
                    borderColor: meditationDone ? '#2d2d2d' : '#4A4A4A'
                  }}
                >
                  {meditationDone ? (
                    <span className="text-white text-2xl font-black leading-none">✓</span>
                  ) : null}
                </div>
                <span className="font-mono text-lg">5 min Meditation</span>
              </div>
            </button>
          </div>
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
                className="p-4 border-2 border-darkgray bg-secondary/20"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-mono text-lg font-bold mb-2">{log.exercise_name}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-sm">
                      {log.sets && log.reps && (
                        <p>{log.sets} × {log.reps}</p>
                      )}
                      {log.weight_kg && (
                        <p>{log.weight_kg} kg</p>
                      )}
                      <p>{log.calories_burned} cal</p>
                    </div>
                    {log.notes && (
                      <p className="font-mono text-sm text-darkgray/70 mt-2">
                        {log.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditWorkout(log)}
                      className="p-2 border-2 border-darkgray bg-accent hover:bg-accent/70 transition-all"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteWorkout(log.id)}
                      className="p-2 border-2 border-darkgray bg-warning hover:bg-warning/70 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {gymLogs.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Dumbbell size={48} className="mx-auto mb-4 text-darkgray/30" />
            <p className="font-mono text-lg text-darkgray/70">No workouts logged for this day</p>
            <p className="font-mono text-sm text-darkgray/50 mt-2">Click "Add Exercise" to get started!</p>
          </div>
        </Card>
      )}

      {/* Add Exercise Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editingWorkout ? "Edit Exercise" : "Add Exercise"}>
        {/* Button to open templates */}
        {templates.length > 0 && !editingWorkout && (
          <div className="mb-6">
            <Button 
              onClick={() => { setShowTemplatesModal(true); }} 
              variant="secondary"
              className="w-full"
            >
              <Star size={16} className="inline mr-2" />
              Browse Templates ({templates.length})
            </Button>
          </div>
        )}

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
              {editingWorkout ? 'Update Exercise' : 'Add Exercise'}
            </Button>
            {!editingWorkout && (
              <Button type="button" onClick={handleSaveAsTemplate} variant="secondary">
                <Save size={16} className="inline mr-2" />
                Save as Template
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {/* Templates Modal */}
      <Modal isOpen={showTemplatesModal} onClose={() => { setShowTemplatesModal(false); setTemplateSearch(''); }} title="Workout Templates">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Search templates..."
              className="input-pixel w-full pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-darkgray/50 pointer-events-none" size={20} />
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <p className="font-mono text-sm text-darkgray/70 text-center py-4">
            {templateSearch ? 'No templates found matching your search' : 'No templates saved yet. Add an exercise and click "Save as Template"'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 border-2 border-darkgray bg-secondary/20 hover:bg-secondary/30 transition-all"
              >
                <div className="flex justify-between items-start gap-3">
                  <div 
                    className="flex-1 cursor-pointer" 
                    onClick={() => handleUseTemplate(template)}
                  >
                    <p className="font-mono text-base font-bold mb-1">{template.template_name}</p>
                    <p className="text-pixel-xs text-darkgray/70 mb-1">{template.exercise_name}</p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                      <p>{template.calories_burned} cal</p>
                      {template.sets && template.reps && <p>{template.sets}×{template.reps}</p>}
                      {template.weight_kg && <p>{template.weight_kg}kg</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 border-2 border-darkgray bg-warning hover:bg-warning/70"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}