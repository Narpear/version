'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { User, FoodLog } from '@/types';
import { Utensils, Trash2 } from 'lucide-react';

export default function FoodPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fats, setFats] = useState(0);
  const [isHealthy, setIsHealthy] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadTodayFood(parsedUser.id);
  }, [router]);

  const loadTodayFood = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .order('created_at', { ascending: true });

      if (data) {
        setFoodLogs(data);
        // Update daily totals
        await updateDailyTotals(userId, data);
      }
    } catch (error) {
      console.log('No food logs for today');
    } finally {
      setLoading(false);
    }
  };

  const updateDailyTotals = async (userId: string, logs: FoodLog[]) => {
    const totalCaloriesIn = logs.reduce((sum, log) => sum + log.calories, 0);

    try {
      const { data: existing } = await supabase
        .from('daily_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
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
            date: today,
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
          date: today,
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
      await updateDailyTotals(user.id, updatedLogs);
      
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding food:', error);
      alert('Failed to add food');
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
      await updateDailyTotals(user.id, updatedLogs);
    } catch (error) {
      console.error('Error deleting food:', error);
      alert('Failed to delete food');
    }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="heading-pixel">Food Tracker</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Food'}
        </Button>
      </div>

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

            <Button type="submit" className="w-full mt-6">
              Add Food
            </Button>
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

      {foodLogs.length === 0 && !showAddForm && (
        <Card>
          <div className="text-center py-8">
            <Utensils size={48} className="mx-auto mb-4 text-darkgray/30" />
            <p className="font-mono text-lg text-darkgray/70">No meals logged today</p>
            <p className="font-mono text-sm text-darkgray/50 mt-2">Click "Add Food" to get started!</p>
          </div>
        </Card>
      )}
    </div>
  );
}