'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { User, FoodLog, FoodTemplate } from '@/types';
import { Utensils, Trash2, Save, ChevronLeft, ChevronRight, Star, X, Search, Edit, Camera } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { recalculateGoalCumulatives } from '@/lib/goalUtils';
import dynamic from 'next/dynamic';

// Dynamically import BarcodeScanner (client-side only)
const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), {
  ssr: false,
});

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

export default function FoodPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [templates, setTemplates] = useState<FoodTemplate[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<FoodTemplate[]>([]);
  const [templateTab, setTemplateTab] = useState<'saved' | 'general'>('saved');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodLog | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<FoodTemplate | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);

  // Date state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Form state
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fats, setFats] = useState(0);
  const [isHealthy, setIsHealthy] = useState(true);
  const [quantity, setQuantity] = useState(1);

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
        // Always update daily totals when data changes, regardless of date
        await updateDailyTotals(userId, data);
      }
    } catch (error) {
      console.log('No food logs for this date');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async (userId: string) => {
    try {
      // Load user's personal templates
      const { data: userTemplates } = await supabase
        .from('food_templates')
        .select('*')
        .eq('user_id', userId)
        .order('template_name');

      // Load public templates
      const { data: publicTemplatesData } = await supabase
        .from('public_food_templates')
        .select('*')
        .order('template_name');

      if (userTemplates) setTemplates(userTemplates);
      if (publicTemplatesData) setPublicTemplates(publicTemplatesData);
    } catch (error) {
      console.log('Error loading templates');
    }
  };

  const updateDailyTotals = async (userId: string, logs: FoodLog[]) => {
    const totalCaloriesIn = logs.reduce((sum, log) => sum + log.calories, 0);

    try {
      const { data: existing } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', selectedDate)
        .single();

      if (existing) {
        // Recalculate apparent deficit with new food data
        const bmr = existing.bmr || 0;
        const caloriesOut = existing.total_calories_out || 0;
        const netIntake = totalCaloriesIn - caloriesOut;
        const apparentDeficit = bmr > 0 ? bmr - netIntake : null;
        
        await supabase
          .from('daily_entries')
          .update({ 
            total_calories_in: totalCaloriesIn,
            net_intake: netIntake,
            apparent_deficit: apparentDeficit
          })
          .eq('id', existing.id);
          
        // Recalculate cumulative deficits for the goal
        await recalculateGoalCumulatives(userId);
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
    setQuantity(1);
    setEditingFood(null);
    setEditingTemplate(null);
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || calories <= 0) return;
    
    // Validate quantity
    const finalQuantity = quantity > 0 ? quantity : 1;

    try {
      if (editingFood) {
        // Update existing food log
        const { data, error } = await supabase
          .from('food_logs')
          .update({
            meal_name: mealName,
            meal_type: mealType,
            calories: Math.round(calories * finalQuantity),
            protein_g: protein * finalQuantity,
            carbs_g: carbs * finalQuantity,
            fats_g: fats * finalQuantity,
            is_healthy: isHealthy,
          })
          .eq('id', editingFood.id)
          .select()
          .single();

        if (error) throw error;

        const updatedLogs = foodLogs.map(log => log.id === editingFood.id ? data : log);
        setFoodLogs(updatedLogs);
        await updateDailyTotals(user.id, updatedLogs);
        toast('Updated!');
      } else {
        // Create new food log
        const { data, error } = await supabase
          .from('food_logs')
          .insert({
            user_id: user.id,
            date: selectedDate,
            meal_name: mealName,
            meal_type: mealType,
            calories: Math.round(calories * finalQuantity),
            protein_g: protein * finalQuantity,
            carbs_g: carbs * finalQuantity,
            fats_g: fats * finalQuantity,
            is_healthy: isHealthy,
          })
          .select()
          .single();

        if (error) throw error;

        const updatedLogs = [...foodLogs, data];
        setFoodLogs(updatedLogs);
        await updateDailyTotals(user.id, updatedLogs);
        toast('Saved!');
      }
      
      resetForm();
      setShowAddModal(false);
      setEditingFood(null);
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
      if (editingTemplate) {
        // Update existing template
        await supabase
          .from('food_templates')
          .update({
            template_name: mealName,
            meal_type: mealType,
            calories: calories,
            protein_g: protein,
            carbs_g: carbs,
            fats_g: fats,
            is_healthy: isHealthy,
          })
          .eq('id', editingTemplate.id);

        toast('Template updated!');
      } else {
        // Create new template
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

        toast('Template saved!');
      }

      await loadTemplates(user.id);
      setEditingTemplate(null);
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
    setQuantity(1);
    setShowTemplatesModal(false);
    setShowAddModal(true);
  };

  const handleEditFood = (food: FoodLog) => {
    setMealName(food.meal_name);
    setMealType(food.meal_type || 'breakfast');
    setCalories(food.calories);
    setProtein(food.protein_g);
    setCarbs(food.carbs_g);
    setFats(food.fats_g);
    setIsHealthy(food.is_healthy);
    setQuantity(1);
    setEditingFood(food);
    setShowAddModal(true);
  };

  const handleEditTemplate = (template: FoodTemplate) => {
    setMealName(template.template_name);
    setMealType(template.meal_type || 'breakfast');
    setCalories(template.calories);
    setProtein(template.protein_g);
    setCarbs(template.carbs_g);
    setFats(template.fats_g);
    setIsHealthy(template.is_healthy);
    setQuantity(1);
    setEditingTemplate(template);
    setShowTemplatesModal(false);
    setShowAddModal(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      await supabase
        .from('food_templates')
        .delete()
        .eq('id', id);

      await loadTemplates(user!.id);
      toast('Template deleted');
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
      await updateDailyTotals(user.id, updatedLogs);
      toast('Food deleted');
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

  // Filter templates based on search (partial match on multiple fields)
  const filteredTemplates = templates.filter(template => {
    const searchLower = templateSearch.toLowerCase();
    const nameLower = template.template_name.toLowerCase();
    const mealTypeLower = (template.meal_type || '').toLowerCase();
    
    // Check if any part of the search term appears in name or meal type
    return nameLower.includes(searchLower) || 
           mealTypeLower.includes(searchLower) ||
           template.calories.toString().includes(searchLower);
  });

  // Filter public templates based on search
  const filteredPublicTemplates = publicTemplates.filter(template => {
    const searchLower = templateSearch.toLowerCase();
    const nameLower = template.template_name.toLowerCase();
    const mealTypeLower = (template.meal_type || '').toLowerCase();
    
    return nameLower.includes(searchLower) || 
           mealTypeLower.includes(searchLower) ||
           template.calories.toString().includes(searchLower);
  });

  if (loading) {
    return (
      <div className="container-pixel">
        <p className="font-mono text-lg">Loading...</p>
      </div>
    );
  }

  const fetchProductData = async (barcode: string) => {
    setFetchingProduct(true);
    setShowBarcodeScanner(false);

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutriments = product.nutriments;

        // Try to get serving size
        const servingSize = product.serving_quantity || 100; // Default to 100g if no serving size
        const servingSizeUnit = product.serving_quantity_unit || 'g';
        
        // Prefer per-serving data if available, otherwise use per-100g
        let calories, protein, carbs, fats;
        
        if (nutriments['energy-kcal_serving']) {
          // Per-serving data is available
          calories = Math.round(nutriments['energy-kcal_serving'] || 0);
          protein = parseFloat((nutriments.proteins_serving || 0).toFixed(1));
          carbs = parseFloat((nutriments.carbohydrates_serving || 0).toFixed(1));
          fats = parseFloat((nutriments.fat_serving || 0).toFixed(1));
        } else {
          // Fall back to per-100g data
          calories = Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0);
          protein = parseFloat((nutriments.proteins_100g || nutriments.proteins || 0).toFixed(1));
          carbs = parseFloat((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0).toFixed(1));
          fats = parseFloat((nutriments.fat_100g || nutriments.fat || 0).toFixed(1));
        }

        // Auto-fill the form
        setMealName(product.product_name || 'Unknown Product');
        setCalories(calories);
        setProtein(protein);
        setCarbs(carbs);
        setFats(fats);
        setQuantity(1); // Default to 1 serving
        setShowAddModal(true);

        // Show helpful message with serving size info
        const servingInfo = nutriments['energy-kcal_serving'] 
          ? `per serving (${servingSize}${servingSizeUnit})`
          : `per 100g`;
        
        toast(`Product found! Values are ${servingInfo}. Adjust quantity as needed.`);
      } else {
        alert('Product not found in database. Please enter manually.');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to fetch product data. Please try again.');
    } finally {
      setFetchingProduct(false);
    }
  };

  // Calculate totals
  const totalCalories = foodLogs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = foodLogs.reduce((sum, log) => sum + log.protein_g, 0);
  const totalCarbs = foodLogs.reduce((sum, log) => sum + log.carbs_g, 0);
  const totalFats = foodLogs.reduce((sum, log) => sum + log.fats_g, 0);
  const healthyMeals = foodLogs.filter(log => log.is_healthy).length;

  // Group by meal type
  const mealTypes = ['breakfast', 'brunch', 'lunch', 'dinner', 'snack'] as const;
  const groupedMeals = mealTypes.map(type => ({
    type,
    meals: foodLogs.filter(log => log.meal_type === type),
  }));

  return (
    <div className="container-pixel">
      {/* Date Navigation */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="heading-pixel">Food Tracker</h1>
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
          + Add Food
        </Button>
      </div>

      {/* Daily Summary */}
      <Card className="mb-6 bg-success/10" title="Daily Summary">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white">
            <p className="text-pixel-sm text-darkgray/70 mb-1">Total Calories</p>
            <p className="font-mono text-2xl">{totalCalories}</p>
          </Card>
          <Card className="bg-white">
            <p className="text-pixel-sm text-darkgray/70 mb-1">Protein</p>
            <p className="font-mono text-2xl">{totalProtein.toFixed(1)}g</p>
          </Card>
          <Card className="bg-white">
            <p className="text-pixel-sm text-darkgray/70 mb-1">Carbs</p>
            <p className="font-mono text-2xl">{totalCarbs.toFixed(1)}g</p>
          </Card>
          <Card className="bg-white">
            <p className="text-pixel-sm text-darkgray/70 mb-1">Fats</p>
            <p className="font-mono text-2xl">{totalFats.toFixed(1)}g</p>
          </Card>
          <Card className="bg-white">
            <p className="text-pixel-sm text-darkgray/70 mb-1">Healthy Meals</p>
            <p className="font-mono text-2xl">{healthyMeals}/{foodLogs.length}</p>
          </Card>
        </div>
      </Card>

      {/* Meals by Type */}
      {groupedMeals.map(({ type, meals }) => (
        meals.length > 0 && (
          <Card key={type} title={`${type.charAt(0).toUpperCase() + type.slice(1)}`} className="mb-6">
            <div className="space-y-3">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className={`p-4 border-2 border-darkgray ${
                    meal.is_healthy ? 'bg-success/20' : 'bg-warning/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-mono text-lg font-bold">{meal.meal_name}</p>
                        {meal.is_healthy && <span className="text-sm">✓ Healthy</span>}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-sm">
                        <p>{meal.calories} cal</p>
                        {meal.protein_g > 0 && <p>{meal.protein_g}g protein</p>}
                        {meal.carbs_g > 0 && <p>{meal.carbs_g}g carbs</p>}
                        {meal.fats_g > 0 && <p>{meal.fats_g}g fats</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditFood(meal)}
                        className="p-2 border-2 border-darkgray bg-accent hover:bg-accent/70 transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteFood(meal.id)}
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
        )
      ))}

      {foodLogs.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Utensils size={48} className="mx-auto mb-4 text-darkgray/30" />
            <p className="font-mono text-lg text-darkgray/70">No meals logged for this day</p>
            <p className="font-mono text-sm text-darkgray/50 mt-2">Click "Add Food" to get started!</p>
          </div>
        </Card>
      )}

      {/* Add Food Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editingFood ? "Edit Food" : editingTemplate ? "Edit Template" : "Add Food"}>
        {/* Buttons to open templates and barcode scanner */}
        {!editingFood && !editingTemplate && (
          <div className="mb-6 space-y-3">
            <Button 
              onClick={() => setShowBarcodeScanner(true)}
              variant="primary"
              className="w-full"
              disabled={fetchingProduct}
            >
              <Camera size={20} className="inline mr-2" />
              {fetchingProduct ? 'Loading...' : 'Scan Barcode'}
            </Button>
            
            {templates.length > 0 && (
              <Button 
                onClick={() => { setShowTemplatesModal(true); }} 
                variant="secondary"
                className="w-full"
              >
                <Star size={16} className="inline mr-2" />
                Browse Templates ({templates.length})
              </Button>
            )}
          </div>
        )}

        <hr></hr>
        <br></br>

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
                <option value="brunch">Brunch</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <Input
              type="number"
              label="Calories (per serving)"
              value={calories}
              onChange={(e) => setCalories(parseFloat(e.target.value))}
              placeholder="400"
              required
              min={0}
            />

            <Input
              type="number"
              label="Quantity/Servings"
              value={quantity === 0 ? '' : quantity}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || val === '.') {
                  setQuantity(0);
                } else {
                  const parsed = parseFloat(val);
                  if (!isNaN(parsed)) {
                    setQuantity(parsed);
                  }
                }
              }}
              placeholder="1"
              step={0.1}
              min={0.1}
            />

            <Input
              type="number"
              label="Protein (g per serving)"
              value={protein}
              onChange={(e) => setProtein(parseFloat(e.target.value))}
              placeholder="20"
              step={0.1}
              min={0}
            />

            <Input
              type="number"
              label="Carbs (g per serving)"
              value={carbs}
              onChange={(e) => setCarbs(parseFloat(e.target.value))}
              placeholder="50"
              step={0.1}
              min={0}
            />

            <Input
              type="number"
              label="Fats (g per serving)"
              value={fats}
              onChange={(e) => setFats(parseFloat(e.target.value))}
              placeholder="10"
              step={0.1}
              min={0}
            />
          </div>

          {/* Show calculated totals if quantity != 1 */}
          {quantity !== 1 && quantity > 0 && (
            <div className="mt-4 p-3 border-2 border-darkgray bg-accent/20">
              <p className="font-mono text-sm font-bold mb-2">Total for {quantity} serving(s):</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-sm">
                <p>{Math.round(calories * quantity)} cal</p>
                <p>{(protein * quantity).toFixed(1)}g protein</p>
                <p>{(carbs * quantity).toFixed(1)}g carbs</p>
                <p>{(fats * quantity).toFixed(1)}g fats</p>
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isHealthy}
                onChange={(e) => setIsHealthy(e.target.checked)}
                className="w-6 h-6 border-2 border-darkgray"
              />
              <span className="font-mono text-lg">Mark as healthy meal</span>
            </label>
          </div>

          <div className="flex gap-4 mt-6">
            <Button type="submit" className="flex-1">
              {editingFood ? 'Update Food' : editingTemplate ? 'Update Template' : 'Add Food'}
            </Button>
            {!editingFood && !editingTemplate && (
              <Button type="button" onClick={handleSaveAsTemplate} variant="secondary">
                <Save size={16} className="inline mr-2" />
                Save as Template
              </Button>
            )}
            {editingTemplate && (
              <Button type="button" onClick={handleSaveAsTemplate} variant="secondary">
                <Save size={16} className="inline mr-2" />
                Update Template
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {/* Templates Modal */}
      <Modal isOpen={showTemplatesModal} onClose={() => { setShowTemplatesModal(false); setTemplateSearch(''); }} title="Food Templates">
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4 border-b-2 border-darkgray">
          <button
            onClick={() => setTemplateTab('saved')}
            className={`px-4 py-2 font-mono transition-all ${
              templateTab === 'saved' 
                ? 'bg-accent border-2 border-darkgray border-b-0 -mb-0.5' 
                : 'bg-white hover:bg-accent/30'
            }`}
          >
            My Foods ({templates.length})
          </button>
          <button
            onClick={() => setTemplateTab('general')}
            className={`px-4 py-2 font-mono transition-all ${
              templateTab === 'general' 
                ? 'bg-accent border-2 border-darkgray border-b-0 -mb-0.5' 
                : 'bg-white hover:bg-accent/30'
            }`}
          >
            General ({publicTemplates.length})
          </button>
        </div>

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

        {/* Scrollable Template List */}
        <div className="max-h-96 overflow-y-auto pr-2">
          {templateTab === 'saved' ? (
            // User's saved templates
            filteredTemplates.length === 0 ? (
              <p className="font-mono text-sm text-darkgray/70 text-center py-4">
                {templateSearch ? 'No templates found matching your search' : 'No templates saved yet. Add food and click "Save as Template"'}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border-2 border-darkgray bg-accent/20 hover:bg-accent/30 transition-all"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div 
                        className="flex-1 cursor-pointer" 
                        onClick={() => handleUseTemplate(template)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-mono text-base font-bold">{template.template_name}</p>
                          {template.is_healthy && <span className="text-xs">✓</span>}
                        </div>
                        <p className="text-pixel-xs text-darkgray/70 mb-1">
                          {template.meal_type && `${template.meal_type.charAt(0).toUpperCase() + template.meal_type.slice(1)}`}
                        </p>
                        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                          <p>{template.calories} cal</p>
                          {template.protein_g > 0 && <p>{template.protein_g}g protein</p>}
                          {template.carbs_g > 0 && <p>{template.carbs_g}g carbs</p>}
                          {template.fats_g > 0 && <p>{template.fats_g}g fats</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="p-2 border-2 border-darkgray bg-accent hover:bg-accent/70"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-2 border-2 border-darkgray bg-warning hover:bg-warning/70"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Public/General templates
            filteredPublicTemplates.length === 0 ? (
              <p className="font-mono text-sm text-darkgray/70 text-center py-4">
                No general templates found matching your search
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredPublicTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border-2 border-darkgray bg-success/20 hover:bg-success/30 transition-all cursor-pointer"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono text-base font-bold">{template.template_name}</p>
                      {template.is_healthy && <span className="text-xs">✓</span>}
                    </div>
                    <p className="text-pixel-xs text-darkgray/70 mb-1">
                      {template.meal_type && `${template.meal_type.charAt(0).toUpperCase() + template.meal_type.slice(1)}`}
                    </p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                      <p>{template.calories} cal</p>
                      {template.protein_g > 0 && <p>{template.protein_g}g protein</p>}
                      {template.carbs_g > 0 && <p>{template.carbs_g}g carbs</p>}
                      {template.fats_g > 0 && <p>{template.fats_g}g fats</p>}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </Modal>

      {/* Barcode Scanner */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScanSuccess={fetchProductData}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  );
}