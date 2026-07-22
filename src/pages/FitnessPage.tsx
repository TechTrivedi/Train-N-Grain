import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Flame, Save, RefreshCw, CheckCircle, Zap, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import type { User } from 'firebase/auth';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { WorkoutDay, WorkoutStats } from '../types';

interface FitnessPageProps {
  user: User | null;
  openAuthModal: () => void;
  showToast: (msg: string) => void;
}

export const FitnessPage: React.FC<FitnessPageProps> = ({ user, openAuthModal, showToast }) => {
  const [age, setAge] = useState<number | string>(25);
  const [gender, setGender] = useState('male');
  const [goal, setGoal] = useState('Strength');
  const [level, setLevel] = useState('Intermediate');
  const [equipment, setEquipment] = useState('Dumbbells');
  const [includeWarmup, setIncludeWarmup] = useState(true);
  const [cardioPref, setCardioPref] = useState('none');

  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<WorkoutDay[] | null>(null);
  const [currentStats, setCurrentStats] = useState<WorkoutStats | null>(null);
  const [loadedDocId, setLoadedDocId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Check URL query parameters for ?id=planId
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('id');
    if (planId && user) {
      loadSavedWorkout(user.uid, planId);
    }
  }, [user]);

  const loadSavedWorkout = async (uid: string, docId: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'users', uid, 'workouts', docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setCurrentPlan(data.plan);
        setCurrentStats(data.stats);
        setLoadedDocId(docId);
        showToast('Loaded saved workout program from cloud! ☁️');
      } else {
        showToast('Saved workout program not found.');
      }
    } catch (err) {
      console.error('Load workout error:', err);
      showToast('Failed to retrieve saved workout.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadedDocId(null);

    const reqBody: WorkoutStats = {
      age: Number(age),
      gender,
      goal,
      level,
      equipment,
      includeWarmup,
      cardioPref
    };

    try {
      const response = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data.plan || !Array.isArray(data.plan)) {
        throw new Error('Invalid plan payload');
      }

      setCurrentPlan(data.plan);
      setCurrentStats(reqBody);
      showToast('AI Workout Plan generated successfully! 💪');
    } catch (err) {
      console.warn('AI generation failed, applying static safety backup:', err);
      showToast('Loaded standard training routine. 🔌');
      // Static fallback sample
      setCurrentPlan([
        {
          day: 'Day 1: Upper Body Strength & Core',
          exercises: [
            { name: 'Warm-up: Arm Circles & Jumping Jacks', sets: 2, reps: '45s each', instruction: 'Get blood flowing and mobilize shoulder joints.' },
            { name: 'Push-ups / Dumbbell Press', sets: 4, reps: '10-12 reps', instruction: 'Keep core tight, brace torso, and lower chest under control.' },
            { name: 'Dumbbell Rows / Bodyweight Rows', sets: 4, reps: '10-12 reps', instruction: 'Pull elbows back toward hip pockets to engage lats.' },
            { name: 'Plank Hold', sets: 3, reps: '60 seconds', instruction: 'Maintain straight line from shoulders to heels.' }
          ]
        },
        {
          day: 'Day 2: Lower Body & Cardio Finisher',
          exercises: [
            { name: 'Warm-up: Bodyweight Squats & Leg Swings', sets: 2, reps: '15 reps', instruction: 'Activate glutes and open hip flexors.' },
            { name: 'Goblet Squats / Dumbbell Squats', sets: 4, reps: '12 reps', instruction: 'Keep chest upright, drive knees outward, and push through heels.' },
            { name: 'Romanian Deadlifts', sets: 3, reps: '12 reps', instruction: 'Hinge at hips, maintain flat spine, and feel hamstrings stretch.' },
            { name: 'Cardio Finisher: High Knees HIIT', sets: 4, reps: '30s work / 15s rest', instruction: 'Keep pace fast to elevate metabolic conditioning.' }
          ]
        }
      ]);
      setCurrentStats(reqBody);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProfile = async () => {
    if (!currentPlan || !currentStats) return;
    if (!user) {
      showToast('Please sign in to save plans to your profile!');
      openAuthModal();
      return;
    }

    const defaultTitle = `Workout — ${goal} (${level})`;
    const titleInput = prompt('Give your workout program a name:', defaultTitle);
    if (titleInput === null) return;
    const finalTitle = titleInput.trim() || defaultTitle;

    setSaving(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'workouts'), {
        title: finalTitle,
        plan: currentPlan,
        stats: currentStats,
        savedAt: serverTimestamp()
      });
      showToast('Program saved to your profile library! 💾');
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save program.');
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
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                AI Workout Generator
              </h1>
              <p className="text-gray-400 text-xs">
                Custom routines compiled dynamically by Gemini 3.1 Flash Lite
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A3FF]/10 border border-[#00A3FF]/30 text-[#00A3FF] text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" /> Instant AI Routine Engine
          </div>
        </div>

        {/* Compact Parameters Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
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

            {/* Goal */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Fitness Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121216] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00A3FF]"
              >
                <option value="Strength">💥 Hypertrophy & Strength</option>
                <option value="Fat Loss">🔥 Fat Loss & Conditioning</option>
                <option value="Endurance">🏃 Endurance & Cardio</option>
                <option value="General Fitness">⚡ General Athletic Fitness</option>
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Experience Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121216] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00A3FF]"
              >
                <option value="Beginner">🟢 Beginner (0 - 6 mo)</option>
                <option value="Intermediate">🟡 Intermediate (6+ mo)</option>
                <option value="Advanced">🔴 Advanced (2+ yrs)</option>
              </select>
            </div>

            {/* Equipment */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Available Equipment</label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121216] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00A3FF]"
              >
                <option value="No Equipment">🤸 Bodyweight Only</option>
                <option value="Dumbbells">🏋️ Dumbbells</option>
                <option value="Resistance Bands">🎗️ Resistance Bands</option>
                <option value="Both (Dumbbells + Bands)">⚡ Dumbbells + Bands</option>
              </select>
            </div>

          </div>

          {/* Bottom Controls Row & CTA Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWarmup}
                  onChange={(e) => setIncludeWarmup(e.target.checked)}
                  className="rounded bg-white/10 border-white/20 text-[#00A3FF] focus:ring-0 w-3.5 h-3.5 accent-[#00A3FF]"
                />
                <span>Include Warm-ups & Finishers</span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Cardio:</span>
                <select
                  value={cardioPref}
                  onChange={(e) => setCardioPref(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#121216] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00A3FF]"
                >
                  <option value="none">None</option>
                  <option value="walking">🚶 Walking</option>
                  <option value="running">🏃 Running</option>
                </select>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-2xl bg-[#00A3FF] text-black font-extrabold text-sm shadow-[0_0_25px_rgba(0,163,255,0.4)] hover:shadow-[0_0_35px_rgba(0,163,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling Routine...</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4" />
                  <span>Generate AI Workout Plan</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* Workout Plan Results Display Area */}
      <div className="space-y-6">
        {loading ? (
          <div className="glass-panel-dark rounded-3xl p-12 text-center border border-white/10 space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-[#00A3FF]/20 border-t-[#00A3FF] animate-spin mx-auto"></div>
            <h3 className="text-xl font-bold text-white">Compiling AI Training Routine</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Gemini 3.1 Flash Lite is designing a custom weekly split based on your parameters...
            </p>
          </div>
        ) : currentPlan ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >

            {/* Plan Header Controls */}
            <div className="glass-panel-dark rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-400">Goal: </span>
                <span className="text-sm font-bold text-[#00A3FF]">{currentStats?.goal}</span>
                <span className="text-xs text-gray-500 mx-2">•</span>
                <span className="text-xs text-gray-400">Level: </span>
                <span className="text-sm font-semibold text-white">{currentStats?.level}</span>
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

            {/* Workout Days Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPlan.map((dayObj, dayIdx) => (
                <motion.div
                  key={dayIdx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: dayIdx * 0.1 }}
                  className="glass-panel-dark rounded-3xl p-6 border border-white/10 space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                      <Activity className="w-5 h-5 text-[#00A3FF]" />
                      <span>{dayObj.day}</span>
                    </h3>

                    <div className="space-y-3">
                      {dayObj.exercises.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="glass-card-dark p-3.5 rounded-2xl space-y-1"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-bold text-white text-xs">{ex.name}</span>
                            <span className="text-[11px] font-semibold text-[#00A3FF] px-2 py-0.5 rounded-full bg-[#00A3FF]/10 border border-[#00A3FF]/20">
                              {ex.sets} × {ex.reps}
                            </span>
                          </div>
                          {ex.instruction && (
                            <p className="text-[11px] text-gray-400 leading-relaxed pt-0.5">
                              💡 <span className="italic">{ex.instruction}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </motion.div>
        ) : (
          <div className="glass-panel-dark rounded-3xl p-10 text-center border border-white/10 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#00A3FF] mx-auto">
              <Dumbbell className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No Program Generated Yet</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Adjust your parameters in the top bar above and click "Generate AI Workout Plan" to build your custom routine.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
