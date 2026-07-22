import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Utensils, Save, RefreshCw, CheckCircle, Zap, Salad, Flame, Scale } from 'lucide-react';
import type { User } from 'firebase/auth';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DietPlan, DietStats } from '../types';

interface NutritionPageProps {
  user: User | null;
  openAuthModal: () => void;
  showToast: (msg: string) => void;
}

export const NutritionPage: React.FC<NutritionPageProps> = ({ user, openAuthModal, showToast }) => {
  const [height, setHeight] = useState<number | string>(175);
  const [weight, setWeight] = useState<number | string>(70);
  const [age, setAge] = useState<number | string>(25);
  const [gender, setGender] = useState('male');
  const [activity, setActivity] = useState('Moderately Active');
  const [goal, setGoal] = useState('Bulk');
  const [dietType, setDietType] = useState<'veg' | 'nonveg'>('veg');

  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<DietPlan | null>(null);
  const [currentStats, setCurrentStats] = useState<DietStats | null>(null);
  const [loadedDocId, setLoadedDocId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Check URL query parameters for ?id=planId
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('id');
    if (planId && user) {
      loadSavedDiet(user.uid, planId);
    }
  }, [user]);

  const loadSavedDiet = async (uid: string, docId: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'users', uid, 'diets', docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setCurrentPlan(data.plan);
        setCurrentStats(data.stats);
        if (data.stats?.dietType) {
          setDietType(data.stats.dietType);
        }
        setLoadedDocId(docId);
        showToast('Loaded saved diet plan from cloud! 🥗');
      } else {
        showToast('Saved diet plan not found.');
      }
    } catch (err) {
      console.error('Load diet error:', err);
      showToast('Failed to retrieve saved diet plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setLoadedDocId(null);

    const reqBody: DietStats = {
      height: Number(height),
      weight: Number(weight),
      age: Number(age),
      gender,
      activity,
      goal,
      dietType
    };

    try {
      const response = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data.plan || !data.plan.meals) {
        throw new Error('Invalid diet plan payload');
      }

      setCurrentPlan(data.plan);
      setCurrentStats(reqBody);
      showToast(`AI ${dietType === 'nonveg' ? 'Non-Veg' : 'Veg'} Diet Plan generated! 🥗`);
    } catch (err) {
      console.warn('AI diet generation failed, applying local calculation fallback:', err);
      showToast('Loaded offline calculated diet plan.');

      // BMR (Mifflin-St Jeor) calculation
      const bmr = gender === 'male'
        ? 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) + 5
        : 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) - 161;
      
      const multipliers: Record<string, number> = {
        'Sedentary': 1.2,
        'Lightly Active': 1.375,
        'Moderately Active': 1.55,
        'Very Active': 1.725,
        'Extremely Active': 1.9
      };
      const tdee = bmr * (multipliers[activity] || 1.55);
      let targetCals = goal === 'Bulk' ? tdee + 400 : (goal === 'Cut' ? tdee - 500 : tdee);
      targetCals = Math.round(targetCals);

      const pG = Math.round((targetCals * (goal === 'Cut' ? 0.4 : 0.3)) / 4);
      const cG = Math.round((targetCals * (goal === 'Bulk' ? 0.45 : 0.35)) / 4);
      const fG = Math.round((targetCals * 0.25) / 9);

      const fallbackPlan: DietPlan = {
        calories: targetCals,
        proteinG: pG,
        carbsG: cG,
        fatG: fG,
        goal,
        meals: [
          { type: '🌅 Breakfast', name: dietType === 'nonveg' ? 'Egg Omelette with Whole Wheat Toast & Berries' : 'Oatmeal with Whey/Soy Protein & Almonds', calories: Math.round(targetCals * 0.25), protein: Math.round(pG * 0.25), carbs: Math.round(cG * 0.25), fat: Math.round(fG * 0.25) },
          { type: '☀️ Lunch', name: dietType === 'nonveg' ? 'Grilled Chicken Breast with Brown Rice & Broccoli' : 'Grilled Paneer / Tofu with Brown Rice & Dal', calories: Math.round(targetCals * 0.35), protein: Math.round(pG * 0.35), carbs: Math.round(cG * 0.35), fat: Math.round(fG * 0.35) },
          { type: '🥜 Snacks', name: 'Greek Yogurt with Mixed Nuts & Honey', calories: Math.round(targetCals * 0.15), protein: Math.round(pG * 0.15), carbs: Math.round(cG * 0.15), fat: Math.round(fG * 0.15) },
          { type: '🌙 Dinner', name: dietType === 'nonveg' ? 'Baked Salmon / Turkey Fillet with Sweet Potato' : 'Lentil Curry (Dal) with Quinoa & Asparagus', calories: Math.round(targetCals * 0.25), protein: Math.round(pG * 0.25), carbs: Math.round(cG * 0.25), fat: Math.round(fG * 0.25) }
        ]
      };

      setCurrentPlan(fallbackPlan);
      setCurrentStats(reqBody);
    } finally {
      setLoading(false);
    }
  };

  // Trigger real-time re-query when user toggles Veg / Non-Veg
  const handleToggleDietType = (newType: 'veg' | 'nonveg') => {
    setDietType(newType);
    if (currentPlan && currentStats) {
      const updatedStats = { ...currentStats, dietType: newType };
      setCurrentStats(updatedStats);
      // Re-fetch AI diet plan with updated preference
      setTimeout(() => {
        handleGenerate();
      }, 50);
    }
  };

  const handleSaveToProfile = async () => {
    if (!currentPlan || !currentStats) return;
    if (!user) {
      showToast('Please sign in to save diet plans to your profile!');
      openAuthModal();
      return;
    }

    const defaultTitle = `Diet Plan — ${goal} (${dietType === 'nonveg' ? 'Non-Veg' : 'Veg'})`;
    const titleInput = prompt('Give your diet program a name:', defaultTitle);
    if (titleInput === null) return;
    const finalTitle = titleInput.trim() || defaultTitle;

    setSaving(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'diets'), {
        title: finalTitle,
        plan: currentPlan,
        stats: currentStats,
        savedAt: serverTimestamp()
      });
      showToast('Diet plan saved to your profile library! 💾');
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save diet plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">

      {/* Title Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs font-bold uppercase tracking-wider">
          <Utensils className="w-4 h-4" /> Sports Nutrition & Macro Engine
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
          AI Nutrition & Diet Generator
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          Calculate your exact Mifflin-St Jeor TDEE calorie targets and generate custom daily meal cards with instant Veg/Non-Veg preference swapping.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Col: Nutrition Assessment Form */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          
          {/* Veg / Non-Veg Toggle Header */}
          <div className="flex items-center justify-between bg-white/[0.04] p-2 rounded-2xl border border-white/10">
            <span className="text-xs font-bold text-gray-300 ml-2">Diet Preference:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleToggleDietType('veg')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dietType === 'veg' ? 'bg-[#39FF14] text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 'text-gray-400 hover:text-white'
                }`}
              >
                🥦 Veg
              </button>
              <button
                type="button"
                onClick={() => handleToggleDietType('nonveg')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dietType === 'nonveg' ? 'bg-[#39FF14] text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 'text-gray-400 hover:text-white'
                }`}
              >
                🍗 Non-Veg
              </button>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            
            {/* Height & Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Height (cm)</label>
                <input
                  type="number"
                  required
                  min={100}
                  max={230}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#39FF14]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  required
                  min={30}
                  max={250}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#39FF14]"
                />
              </div>
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Age</label>
                <input
                  type="number"
                  required
                  min={12}
                  max={90}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#39FF14]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Gender</label>
                <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                      gender === 'male' ? 'bg-[#39FF14] text-black' : 'text-gray-400'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                      gender === 'female' ? 'bg-[#39FF14] text-black' : 'text-gray-400'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Activity Level</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121216] border border-white/10 text-white text-sm focus:outline-none focus:border-[#39FF14]"
              >
                <option value="Sedentary">🛋️ Sedentary (Little or no exercise)</option>
                <option value="Lightly Active">🚶 Lightly Active (1-3 days/week)</option>
                <option value="Moderately Active">🏋️ Moderately Active (3-5 days/week)</option>
                <option value="Very Active">🔥 Very Active (6-7 days/week)</option>
                <option value="Extremely Active">⚡ Extremely Active (Athlete/Physical job)</option>
              </select>
            </div>

            {/* Nutrition Goal */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Nutrition Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121216] border border-white/10 text-white text-sm focus:outline-none focus:border-[#39FF14]"
              >
                <option value="Bulk">💪 Muscle Gain (Surplus +400 kcal)</option>
                <option value="Cut">🔥 Fat Loss (Deficit -500 kcal)</option>
                <option value="Maintain">⚖️ Weight Maintenance (TDEE)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#39FF14] text-black font-extrabold text-sm shadow-[0_0_25px_rgba(57,255,20,0.4)] hover:shadow-[0_0_35px_rgba(57,255,20,0.6)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling Diet Plan...</span>
                </>
              ) : (
                <>
                  <Salad className="w-4 h-4" />
                  <span>Calculate & Generate Diet Plan</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Right Col: Diet Plan Display */}
        <div className="lg:col-span-7 space-y-6">
          
          {loading ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-[#39FF14]/20 border-t-[#39FF14] animate-spin mx-auto"></div>
              <h3 className="text-xl font-bold text-white">Calculating Target Macros</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Gemini 3.1 Flash Lite is analyzing your BMR/TDEE targets and generating custom {dietType === 'nonveg' ? 'Non-Veg' : 'Veg'} meal cards...
              </p>
            </div>
          ) : currentPlan ? (
            <div className="space-y-6">

              {/* Header Controls */}
              <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-gray-400">Target Goal: </span>
                  <span className="text-sm font-bold text-[#39FF14]">{currentPlan.goal || goal}</span>
                  <span className="text-xs text-gray-500 mx-2">•</span>
                  <span className="text-xs font-semibold text-white">
                    {dietType === 'nonveg' ? '🍗 Non-Vegetarian' : '🥦 Vegetarian'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {loadedDocId ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Loaded from Cloud
                    </span>
                  ) : (
                    <button
                      onClick={handleSaveToProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#39FF14] text-black font-bold text-xs shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:scale-105 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save to Profile'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Macro Cards Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-panel p-4 rounded-2xl text-center border border-[#39FF14]/30 bg-[#39FF14]/5">
                  <div className="text-2xl font-black text-[#39FF14]">{currentPlan.calories}</div>
                  <div className="text-xs text-gray-400 font-medium uppercase mt-0.5">Daily Calories</div>
                </div>
                <div className="glass-panel p-4 rounded-2xl text-center border border-white/10">
                  <div className="text-2xl font-black text-white">{currentPlan.proteinG}g</div>
                  <div className="text-xs text-gray-400 font-medium uppercase mt-0.5">Protein</div>
                </div>
                <div className="glass-panel p-4 rounded-2xl text-center border border-white/10">
                  <div className="text-2xl font-black text-white">{currentPlan.carbsG}g</div>
                  <div className="text-xs text-gray-400 font-medium uppercase mt-0.5">Carbs</div>
                </div>
              </div>

              {/* Secondary Fat & Total Calorie Badges */}
              <div className="flex gap-4">
                <div className="flex-1 glass-card p-3 rounded-xl text-center">
                  <span className="text-xs text-gray-400">Fat Target: </span>
                  <span className="text-sm font-bold text-purple-400">{currentPlan.fatG}g</span>
                </div>
                <div className="flex-1 glass-card p-3 rounded-xl text-center">
                  <span className="text-xs text-gray-400">Calculated Energy: </span>
                  <span className="text-sm font-bold text-[#39FF14]">
                    {Math.round(currentPlan.proteinG * 4 + currentPlan.carbsG * 4 + currentPlan.fatG * 9)} kcal
                  </span>
                </div>
              </div>

              {/* Meal Cards List */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-[#39FF14]" /> Daily Meal Breakdown
                </h3>

                {currentPlan.meals && currentPlan.meals.map((m, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="glass-panel rounded-2xl p-5 border border-white/10 space-y-2 hover:border-[#39FF14]/30 transition-colors"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm font-bold text-white">{m.type}</span>
                      <span className="text-xs font-bold text-[#39FF14] px-2.5 py-1 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/20">
                        {m.calories} kcal
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-gray-200">{m.name}</div>

                    <div className="text-xs text-gray-400 flex items-center gap-3 pt-1 border-t border-white/5">
                      <span>🥩 P: <strong className="text-white">{m.protein}g</strong></span>
                      <span>🍞 C: <strong className="text-white">{m.carbs}g</strong></span>
                      <span>🥑 F: <strong className="text-white">{m.fat}g</strong></span>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#39FF14] mx-auto">
                <Utensils className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">No Diet Plan Calculated Yet</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Fill in your body stats on the left and click "Calculate & Generate Diet Plan" to build your custom nutrition menu.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
