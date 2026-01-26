'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { User, FoodLog, FoodTemplate } from '@/types';
import { Utensils, Trash2, Save, ChevronLeft, ChevronRight, Star } from 'lucide-react';

export default function FoodPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [templates, setTemplates] = useState<FoodTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Date state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Form state
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fats, setFats] = useState(0);
  const [isHealthy, setIsHealthy] = useState(true);

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
    loadFoodData(parsedUser.id, selectedDate);
    loadTemplates(parsedUser.id);
  }, [router, selectedDate]);

  const loadFoodData = async (userId: string, date: string) => {
    try {
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (data) {
        setFoodLogs(data);
        // Update daily totals only if it's today
        if (date === today) {
          await updateDailyTotals(userId, data);
        }
      }
    } catch (error) {
      console.log('No food logs for this date');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('food_templates')
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

  const updateDailyTotals = async (userId: string, logs: FoodLog[]) => {
    const totalCaloriesIn = logs.reduce((sum, log) => sum + log.calories, 0);

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
          .update({ total_calories_in: totalCaloriesIn })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('daily_entries')
          .insert({
            user_id: userId,
            date: selectedDate,
            total_calories_in: totalCaloriesIn,
            total_calories_out: 0,
            water_glasses: 0,
          });
      }
    } catch (error) {
      console.error('Error updating daily totals:', error);
    }
  };

  const resetForm = () => {
    setMealName('');
    setMealType('breakfast');
    setCalories(0);
    setProtein(0);
    setCarbs(0);
    setFats(0);
    setIsHealthy(true);
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || calories <= 0) return;

    try {
      const { data, error } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          date: selectedDate,
          meal_name: mealName,
          meal_type: mealType,
          calories: calories,
          protein_g: protein,
          carbs_g: carbs,
          fats_g: fats,
          is_healthy: isHealthy,
        })
        .select()
        .single();

      if (error) throw error;

      const updatedLogs = [...foodLogs, data];
      setFoodLogs(updatedLogs);
      if (isToday) {
        await updateDailyTotals(user.id, updatedLogs);
      }
      
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding food:', error);
      alert('Failed to add food');
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!user || !mealName || calories <= 0) {
      alert('Please fill in meal details first');
      return;
    }

    try {
      await supabase
        .from('food_templates')
        .insert({
          user_id: user.id,
          template_name: mealName,
          meal_type: mealType,
          calories: calories,
          protein_g: protein,
          carbs_g: carbs,
          fats_g: fats,
          is_healthy: isHealthy,
        });

      await loadTemplates(user.id);
      alert('Template saved! ⭐');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleUseTemplate = (template: FoodTemplate) => {
    setMealName(template.template_name);
    setMealType(template.meal_type || 'breakfast');
    setCalories(template.calories);
    setProtein(template.protein_g);
    setCarbs(template.carbs_g);
    setFats(template.fats_g);
    setIsHealthy(template.is_healthy);
    setShowTemplates(false);
    setShowAddForm(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      await supabase
        .from('food_templates')
        .delete()
        .eq('id', id);

      await loadTemplates(user!.id);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDeleteFood = async (id: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('food_logs')
        .delete()
        .eq('id', id);

      const updatedLogs = foodLogs.filter(log => log.id !== id);
      setFoodLogs(updatedLogs);
      if (isToday) {
        await updateDailyTotals(user.id, updatedLogs);
      }
    } catch (error) {
      console.error('Error deleting food:', error);
      alert('Failed to delete food');
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="container-pixel">
        <p className="font-mono text-lg">Loading...</p>
      </div>
    );
  }

  // Calculate totals
  const totalCalories = foodLogs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = foodLogs.reduce((sum, log) => sum + log.protein_g, 0);
  const totalCarbs = foodLogs.reduce((sum, log) => sum + log.carbs_g, 0);
  const totalFats = foodLogs.reduce((sum, log) => sum + log.fats_g, 0);
  const healthyMeals = foodLogs.filter(log => log.is_healthy).length;

  // Group by meal type
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
  const groupedMeals = mealTypes.map(type => ({
    type,
    meals: foodLogs.filter(log => log.meal_type === type),
    icon: type === 'breakfast' ? '🌅' : type === 'lunch' ? '☀️' : type === 'dinner' ? '🌙' : '🍎'
  }));

  return (
    <div className="container-pixel">
      {/* Date Navigation */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="heading-pixel">Food Tracker</h1>
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
          {showAddForm ? 'Cancel' : '+ Add Food'}
        </Button>
        <Button onClick={() => { setShowTemplates(!showTemplates); setShowAddForm(false); }} variant="secondary">
          <Star size={16} className="inline mr-2" />
          Templates ({templates.length})
        </Button>
      </div>

      {/* Templates List */}
      {showTemplates && (
        <Card title="Your Food Templates" className="mb-6">
          {templates.length === 0 ? (
            <p className="font-mono text-sm text-darkgray/70">No templates saved yet. Add food and click "Save as Template"</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border-4 border-darkgray bg-accent/20 flex justify-between items-center"
                >
                  <div className="flex-1 cursor-pointer" onClick={() => handleUseTemplate(template)}>
                    <p className="font-mono text-sm font-bold">{template.template_name}</p>
                    <p className="text-pixel-xs text-darkgray/70">
                      {template.calories} cal • {template.protein_g}g protein
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

      {/* Add Food Form */}
      {showAddForm && (
        <Card title="Add Food" className="mb-6">
          <form onSubmit={handleAddFood}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                label="Meal Name"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="e.g., Oatmeal with berries"
                required
              />

              <div>
                <label className="block text-pixel-sm mb-2">
                  Meal Type <span className="text-warning">*</span>
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as any)}
                  className="input-pixel w-full"
                  required
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <Input
                type="number"
                label="Calories"
                value={calories}
                onChange={(e) => setCalories(parseFloat(e.target.value))}
                placeholder="400"
                required
                min={0}
              />

              <Input
                type="number"
                label="Protein (g)"
                value={protein}
                onChange={(e) => setProtein(parseFloat(e.target.value))}
                placeholder="20"
                step={0.1}
                min={0}
              />

              <Input
                type="number"
                label="Carbs (g)"
                value={carbs}
                onChange={(e) => setCarbs(parseFloat(e.target.value))}
                placeholder="50"
                step={0.1}
                min={0}
              />

              <Input
                type="number"
                label="Fats (g)"
                value={fats}
                onChange={(e) => setFats(parseFloat(e.target.value))}
                placeholder="10"
                step={0.1}
                min={0}
              />
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHealthy}
                  onChange={(e) => setIsHealthy(e.target.checked)}
                  className="w-6 h-6 border-4 border-darkgray"
                />
                <span className="font-mono text-lg">Mark as healthy meal</span>
              </label>
            </div>

            <div className="flex gap-4 mt-6">
              <Button type="submit" className="flex-1">
                Add Food
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <p className="text-pixel-sm text-darkgray/70 mb-1">Total Calories</p>
          <p className="font-mono text-2xl">{totalCalories}</p>
        </Card>
        <Card>
          <p className="text-pixel-sm text-darkgray/70 mb-1">Protein</p>
          <p className="font-mono text-2xl">{totalProtein.toFixed(1)}g</p>
        </Card>
        <Card>
          <p className="text-pixel-sm text-darkgray/70 mb-1">Carbs</p>
          <p className="font-mono text-2xl">{totalCarbs.toFixed(1)}g</p>
        </Card>
        <Card>
          <p className="text-pixel-sm text-darkgray/70 mb-1">Fats</p>
          <p className="font-mono text-2xl">{totalFats.toFixed(1)}g</p>
        </Card>
        <Card>
          <p className="text-pixel-sm text-darkgray/70 mb-1">Healthy Meals</p>
          <p className="font-mono text-2xl">{healthyMeals}/{foodLogs.length}</p>
        </Card>
      </div>

      {/* Meals by Type */}
      {groupedMeals.map(({ type, meals, icon }) => (
        meals.length > 0 && (
          <Card key={type} title={`${icon} ${type.charAt(0).toUpperCase() + type.slice(1)}`} className="mb-6">
            <div className="space-y-3">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className={`p-4 border-4 border-darkgray ${
                    meal.is_healthy ? 'bg-success/20' : 'bg-warning/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-mono text-lg font-bold">{meal.meal_name}</p>
                        {meal.is_healthy && <span className="text-sm">✅</span>}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-sm">
                        <p>🔥 {meal.calories} cal</p>
                        {meal.protein_g > 0 && <p>🥩 {meal.protein_g}g protein</p>}
                        {meal.carbs_g > 0 && <p>🍞 {meal.carbs_g}g carbs</p>}
                        {meal.fats_g > 0 && <p>🥑 {meal.fats_g}g fats</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFood(meal.id)}
                      className="p-2 border-2 border-darkgray bg-warning hover:bg-warning/70 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      ))}

      {foodLogs.length === 0 && !showAddForm && !showTemplates && (
        <Card>
          <div className="text-center py-8">
            <Utensils size={48} className="mx-auto mb-4 text-darkgray/30" />
            <p className="font-mono text-lg text-darkgray/70">No meals logged for this day</p>
            <p className="font-mono text-sm text-darkgray/50 mt-2">Click "Add Food" to get started!</p>
          </div>
        </Card>
      )}
    </div>
  );
}