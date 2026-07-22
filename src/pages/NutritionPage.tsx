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
    <div className="space-y-6 max-w-7xl mx-auto pt-0">

      {/* Top Assessment Control Bar */}
      <div className="glass-panel-dark rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
        
        {/* Inline Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00A3FF]/10 border border-[#00A3FF]/30 flex items-center justify-center text-[#00A3FF] shadow-[0_0_15px_rgba(0,163,255,0.2)]">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                AI Nutrition & Diet Generator
              </h1>
              <p className="text-gray-400 text-xs">
                Calculate TDEE and generate custom meal cards with instant Veg/Non-Veg swapping
              </p>
            </div>
          </div>

          {/* Veg / Non-Veg Toggle Header */}
          <div className="flex items-center gap-2 bg-white/[0.04] p-1.5 rounded-2xl border border-white/10">
            <span className="text-xs font-bold text-gray-300 px-2">Preference:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleToggleDietType('veg')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  dietType === 'veg' ? 'bg-[#00A3FF] text-black shadow-[0_0_12px_rgba(0,163,255,0.4)]' : 'text-gray-400 hover:text-white'
                }`}
              >
                🥦 Veg
              </button>
              <button
                type="button"
                onClick={() => handleToggleDietType('nonveg')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  dietType === 'nonveg' ? 'bg-[#00A3FF] text-black shadow-[0_0_12px_rgba(0,163,255,0.4)]' : 'text-gray-400 hover:text-white'
                }`}
              >
                🍗 Non-Veg
              </button>
            </div>
          </div>
        </div>

        {/* Compact Parameters Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Height & Weight */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Height & Weight</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  required
                  min={100}
                  max={250}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Height (cm)"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00A3FF]"
                />
                <input
                  type="number"
                  required
                  min={30}
                  max={250}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Weight (kg)"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00A3FF]"
                />
              </div>
            </div>

            {/* Age & Gender */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Age & Gender</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  required
                  min={12}
                  max={90}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00A3FF]"
                />
                <div className="flex bg-white/[0.04] p-0.5 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      gender === 'male' ? 'bg-[#00A3FF] text-black shadow-[0_0_10px_rgba(0,163,255,0.4)]' : 'text-gray-400'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      gender === 'female' ? 'bg-[#00A3FF] text-black shadow-[0_0_10px_rgba(0,163,255,0.4)]' : 'text-gray-400'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
            </div>

            {/* Target Goal */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Target Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121216] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00A3FF]"
              >
                <option value="Fat Loss">🔥 Fat Loss (-500 kcal)</option>
                <option value="Muscle Gain">💪 Muscle Gain (+300 kcal)</option>
                <option value="Maintenance">⚡ Weight Maintenance</option>
              </select>
            </div>

            {/* Daily Activity Level */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Daily Activity Level</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121216] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00A3FF]"
              >
                <option value="1.2">😴 Sedentary (Desk Job)</option>
                <option value="1.375">🚶 Lightly Active (1-3 days)</option>
                <option value="1.55">🏃 Moderately Active (3-5 days)</option>
                <option value="1.725">🏋️ Very Active (6-7 days)</option>
              </select>
            </div>

            {/* CTA Button Column */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#00A3FF] text-black font-extrabold text-xs shadow-[0_0_20px_rgba(0,163,255,0.4)] hover:shadow-[0_0_30px_rgba(0,163,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Calculate & Generate</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      </div>

      {/* Nutrition Plan Results Display Area */}
      <div className="space-y-6">
        {loading ? (
          <div className="glass-panel-dark rounded-3xl p-12 text-center border border-white/10 space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-[#00A3FF]/20 border-t-[#00A3FF] animate-spin mx-auto"></div>
            <h3 className="text-xl font-bold text-white">Calculating Target Macros</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Gemini 3.1 Flash Lite is analyzing your BMR/TDEE targets and generating custom {dietType === 'nonveg' ? 'Non-Veg' : 'Veg'} meal cards...
            </p>
          </div>
        ) : currentPlan ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >

            {/* Header Controls */}
            <div className="glass-panel-dark rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-400">Target Goal: </span>
                <span className="text-sm font-bold text-[#00A3FF]">{currentPlan.goal || goal}</span>
                <span className="text-xs text-gray-500 mx-2">•</span>
                <span className="text-xs font-semibold text-white">
                  {dietType === 'nonveg' ? '🍗 Non-Vegetarian' : '🥦 Vegetarian'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {loadedDocId ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#00A3FF]/10 border border-[#00A3FF]/30 text-[#00A3FF] text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Loaded from Cloud
                  </span>
                ) : (
                  <button
                    onClick={handleSaveToProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00A3FF] text-black font-bold text-xs shadow-[0_0_15px_rgba(0,163,255,0.3)] hover:scale-105 active:scale-95 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save to Profile'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Macro Cards Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card-dark p-4 rounded-2xl text-center border border-[#00A3FF]/30 bg-[#00A3FF]/5">
                <div className="text-2xl font-black text-[#00A3FF]">{currentPlan.calories}</div>
                <div className="text-xs text-gray-400 font-medium uppercase mt-0.5">Daily Calories</div>
              </div>
              <div className="glass-card-dark p-4 rounded-2xl text-center">
                <div className="text-2xl font-black text-white">{currentPlan.proteinG}g</div>
                <div className="text-xs text-gray-400 font-medium uppercase mt-0.5">Protein</div>
              </div>
              <div className="glass-card-dark p-4 rounded-2xl text-center">
                <div className="text-2xl font-black text-white">{currentPlan.carbsG}g</div>
                <div className="text-xs text-gray-400 font-medium uppercase mt-0.5">Carbs</div>
              </div>
            </div>

            {/* Secondary Fat & Total Calorie Badges */}
            <div className="flex gap-4">
              <div className="flex-1 glass-card-dark p-3 rounded-xl text-center">
                <span className="text-xs text-gray-400">Fat Target: </span>
                <span className="text-sm font-bold text-purple-400">{currentPlan.fatG}g</span>
              </div>
              <div className="flex-1 glass-card-dark p-3 rounded-xl text-center">
                <span className="text-xs text-gray-400">Calculated Energy: </span>
                <span className="text-sm font-bold text-[#00A3FF]">
                  {Math.round(currentPlan.proteinG * 4 + currentPlan.carbsG * 4 + currentPlan.fatG * 9)} kcal
                </span>
              </div>
            </div>

            {/* Meal Cards Grid */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#00A3FF]" /> Daily Meal Breakdown
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentPlan.meals && currentPlan.meals.map((m, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="glass-card-dark rounded-2xl p-5 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                        <span className="text-xs font-bold text-white uppercase">{m.type}</span>
                        <span className="text-[11px] font-bold text-[#00A3FF] px-2 py-0.5 rounded-full bg-[#00A3FF]/10 border border-[#00A3FF]/20">
                          {m.calories} kcal
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-gray-200">{m.name}</div>
                    </div>

                    <div className="text-[11px] text-gray-400 flex items-center gap-2 pt-2 border-t border-white/5">
                      <span>🥩 {m.protein}g P</span>
                      <span>•</span>
                      <span>🍞 {m.carbs}g C</span>
                      <span>•</span>
                      <span>🥑 {m.fat}g F</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </motion.div>
        ) : (
          <div className="glass-panel-dark rounded-3xl p-10 text-center border border-white/10 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#00A3FF] mx-auto">
              <Utensils className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No Diet Plan Calculated Yet</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Adjust your parameters in the top bar above and click "Calculate & Generate" to build your custom nutrition menu.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
