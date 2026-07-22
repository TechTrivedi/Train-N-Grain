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
    <div className="space-y-12 max-w-6xl mx-auto">

      {/* Title Header (Crisp High Readability) */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/25 text-[#E4E4E7] text-xs font-bold uppercase tracking-wider shadow-md">
          <Dumbbell className="w-4 h-4" /> AI Training Routine Compiler
        </div>
        <h1 className="font-consistency text-4xl sm:text-6xl font-extrabold text-white uppercase tracking-wider drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
          AI Workout Generator
        </h1>
        <p className="text-gray-100 font-medium text-sm sm:text-base max-w-xl mx-auto drop-shadow-md leading-relaxed">
          Specify your equipment, training goals, warmups, and cardio preferences to generate a custom routine powered by Gemini 3.1 Flash Lite.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Col: Assessment Form Card (Crisp Non-Transparent Card Base) */}
        <div className="bg-[#0B0B12]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6 shadow-2xl">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2 border-b border-white/10 pb-4">
            <Zap className="w-5 h-5 text-[#E4E4E7]" /> Assessment Stats
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            
            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-100 mb-1.5">Age</label>
                <input
                  type="number"
                  required
                  min={12}
                  max={90}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.07] border border-white/20 text-white font-medium text-sm focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-100 mb-1.5">Gender</label>
                <div className="flex bg-white/[0.07] p-1 rounded-xl border border-white/20">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      gender === 'male' ? 'bg-[#E4E4E7] text-black shadow-md' : 'text-gray-300'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      gender === 'female' ? 'bg-[#E4E4E7] text-black shadow-md' : 'text-gray-300'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
            </div>

            {/* Goal */}
            <div>
              <label className="block text-xs font-semibold text-gray-100 mb-1.5">Primary Fitness Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0B0B12] border border-white/20 text-white font-medium text-sm focus:outline-none focus:border-white/40"
              >
                <option value="Strength">💥 Hypertrophy & Strength</option>
                <option value="Fat Loss">🔥 Fat Loss & Conditioning</option>
                <option value="Endurance">🏃 Endurance & Cardio</option>
                <option value="General Fitness">⚡ General Athletic Fitness</option>
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-semibold text-gray-100 mb-1.5">Experience Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0B0B12] border border-white/20 text-white font-medium text-sm focus:outline-none focus:border-white/40"
              >
                <option value="Beginner">🟢 Beginner (0 - 6 months)</option>
                <option value="Intermediate">🟡 Intermediate (6+ months)</option>
                <option value="Advanced">🔴 Advanced (2+ years)</option>
              </select>
            </div>

            {/* Equipment */}
            <div>
              <label className="block text-xs font-semibold text-gray-100 mb-1.5">Available Equipment</label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0B0B12] border border-white/20 text-white font-medium text-sm focus:outline-none focus:border-white/40"
              >
                <option value="No Equipment">🤸 Bodyweight Only (No Equipment)</option>
                <option value="Dumbbells">🏋️ Dumbbells</option>
                <option value="Resistance Bands">🎗️ Resistance Bands</option>
                <option value="Both (Dumbbells + Bands)">⚡ Full Setup (Dumbbells + Bands)</option>
              </select>
            </div>

            {/* Cardio & Warmups Section */}
            <div className="pt-3 border-t border-white/15 space-y-3">
              <label className="block text-xs font-extrabold text-[#E4E4E7] uppercase tracking-wider">
                Cardio & Warm-Up Settings
              </label>

              <label className="flex items-center gap-2.5 text-xs text-gray-200 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={includeWarmup}
                  onChange={(e) => setIncludeWarmup(e.target.checked)}
                  className="rounded bg-white/10 border-white/20 text-[#E4E4E7] focus:ring-0 w-4 h-4 accent-[#E4E4E7]"
                />
                <span>Include Daily Warm-ups & Cardio Finishers</span>
              </label>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Active Rest Cardio Preference</label>
                <select
                  value={cardioPref}
                  onChange={(e) => setCardioPref(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-[#0B0B12] border border-white/20 text-white font-medium text-xs focus:outline-none focus:border-white/40"
                >
                  <option value="none">None (Standard Rest)</option>
                  <option value="walking">🚶 Walking (Low Intensity Steady State)</option>
                  <option value="running">🏃 Running / Jogging (High Intensity)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#E4E4E7] text-black font-extrabold text-sm shadow-[0_0_20px_rgba(228,228,231,0.25)] hover:shadow-[0_0_30px_rgba(228,228,231,0.4)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

          </form>
        </div>

        {/* Right Col: Workout Plan Display */}
        <div className="lg:col-span-7 space-y-6">
          
          {loading ? (
            <div className="bg-[#0B0B12]/85 rounded-3xl p-12 text-center border border-white/15 space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-[#E4E4E7] animate-spin mx-auto"></div>
              <h3 className="text-xl font-bold text-white">Compiling AI Training Routine</h3>
              <p className="text-sm text-gray-300 max-w-sm mx-auto">
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
              <div className="bg-[#0B0B12]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/15 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                <div>
                  <span className="text-xs text-gray-300">Goal: </span>
                  <span className="text-sm font-bold text-[#E4E4E7]">{currentStats?.goal}</span>
                  <span className="text-xs text-gray-500 mx-2">•</span>
                  <span className="text-xs text-gray-300">Level: </span>
                  <span className="text-sm font-semibold text-white">{currentStats?.level}</span>
                </div>

                <div className="flex items-center gap-2">
                  {loadedDocId ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-[#E4E4E7] text-xs font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Loaded from Cloud
                    </span>
                  ) : (
                    <button
                      onClick={handleSaveToProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E4E4E7] text-black font-extrabold text-xs shadow-md hover:scale-105 active:scale-95 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save to Profile'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Workout Days List */}
              <div className="space-y-6">
                {currentPlan.map((dayObj, dayIdx) => (
                  <motion.div
                    key={dayIdx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dayIdx * 0.1 }}
                    className="bg-[#0B0B12]/85 backdrop-blur-xl rounded-3xl p-6 border border-white/15 space-y-4 shadow-xl"
                  >
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                      <Activity className="w-5 h-5 text-[#E4E4E7]" />
                      <span>{dayObj.day}</span>
                    </h3>

                    <div className="space-y-3">
                      {dayObj.exercises.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="bg-white/[0.05] p-4 rounded-2xl space-y-1.5 border border-white/10"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-bold text-white text-sm">{ex.name}</span>
                            <span className="text-xs font-bold text-[#E4E4E7] px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
                              {ex.sets} sets × {ex.reps}
                            </span>
                          </div>
                          {ex.instruction && (
                            <p className="text-xs text-gray-300 leading-relaxed pt-1">
                              💡 <span className="italic">{ex.instruction}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

            </motion.div>
          ) : (
            <div className="bg-[#0B0B12]/85 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/15 space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.05] border border-white/15 flex items-center justify-center text-[#E4E4E7] mx-auto">
                <Dumbbell className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">No Program Generated Yet</h3>
              <p className="text-sm text-gray-300 max-w-sm mx-auto">
                Fill in your fitness parameters on the left and click "Generate AI Workout Plan" to build your personalized routine.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
