import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { User } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Dumbbell, Utensils, Trash2, ExternalLink, User as UserIcon, ShieldCheck, RefreshCw, Calendar, Flame } from 'lucide-react';
import { db } from '../config/firebase';
import { SavedWorkoutDoc, SavedDietDoc } from '../types';

interface ProfilePageProps {
  user: User | null;
  setActiveTab: (tab: string) => void;
  openAuthModal: () => void;
  showToast: (msg: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  setActiveTab,
  openAuthModal,
  showToast
}) => {
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkoutDoc[]>([]);
  const [savedDiets, setSavedDiets] = useState<SavedDietDoc[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [loadingDiets, setLoadingDiets] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserSavedLibrary();
    }
  }, [user]);

  const fetchUserSavedLibrary = async () => {
    if (!user) return;

    // Fetch Workouts Subcollection
    setLoadingWorkouts(true);
    try {
      const wQuery = query(collection(db, 'users', user.uid, 'workouts'), orderBy('savedAt', 'desc'));
      const wSnap = await getDocs(wQuery);
      const wDocs: SavedWorkoutDoc[] = [];
      wSnap.forEach((d: any) => {
        wDocs.push({ id: d.id, ...d.data() } as SavedWorkoutDoc);
      });
      setSavedWorkouts(wDocs);
    } catch (err) {
      console.error('Fetch workouts error:', err);
    } finally {
      setLoadingWorkouts(false);
    }

    // Fetch Diets Subcollection
    setLoadingDiets(true);
    try {
      const dQuery = query(collection(db, 'users', user.uid, 'diets'), orderBy('savedAt', 'desc'));
      const dSnap = await getDocs(dQuery);
      const dDocs: SavedDietDoc[] = [];
      dSnap.forEach((d: any) => {
        dDocs.push({ id: d.id, ...d.data() } as SavedDietDoc);
      });
      setSavedDiets(dDocs);
    } catch (err) {
      console.error('Fetch diets error:', err);
    } finally {
      setLoadingDiets(false);
    }
  };

  const handleDeleteWorkout = async (docId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this workout program?')) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'workouts', docId));
      setSavedWorkouts(prev => prev.filter(item => item.id !== docId));
      showToast('Workout program deleted from your profile library.');
    } catch (err) {
      console.error('Delete workout error:', err);
      showToast('Failed to delete workout.');
    }
  };

  const handleDeleteDiet = async (docId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this diet plan?')) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'diets', docId));
      setSavedDiets(prev => prev.filter(item => item.id !== docId));
      showToast('Diet plan deleted from your profile library.');
    } catch (err) {
      console.error('Delete diet error:', err);
      showToast('Failed to delete diet plan.');
    }
  };

  if (!user) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 space-y-6 max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center text-[#E4E4E7] mx-auto">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white">Sign In to Access Your Library</h2>
        <p className="text-gray-300 text-sm">
          Save custom AI workout programs and nutrition plans directly to your profile.
        </p>
        <button
          onClick={openAuthModal}
          className="px-8 py-3.5 rounded-2xl bg-[#E4E4E7] text-black font-extrabold text-sm shadow-[0_0_20px_rgba(228,228,231,0.25)] hover:scale-105 transition-all"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto">

      {/* User Dashboard Banner */}
      <div className="glass-panel-dark rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {user.displayName || user.email?.split('@')[0]}
              <ShieldCheck className="w-5 h-5 text-[#E4E4E7]" />
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-[10px] text-gray-400 font-mono">
              UID: {user.uid}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-card-dark p-3 rounded-2xl text-center px-5">
            <div className="text-xl font-bold text-[#E4E4E7]">{savedWorkouts.length}</div>
            <div className="text-[11px] text-gray-400 font-medium">Workouts</div>
          </div>
          <div className="glass-card-dark p-3 rounded-2xl text-center px-5">
            <div className="text-xl font-bold text-[#E4E4E7]">{savedDiets.length}</div>
            <div className="text-[11px] text-gray-400 font-medium">Diet Plans</div>
          </div>
        </div>
      </div>

      {/* Saved Workouts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-[#E4E4E7]" /> Saved Workout Programs
          </h3>
          <button
            onClick={() => setActiveTab('fitness')}
            className="text-xs font-bold text-[#E4E4E7] hover:underline flex items-center gap-1"
          >
            + Create New Workout
          </button>
        </div>

        {loadingWorkouts ? (
          <div className="glass-panel-dark rounded-2xl p-8 text-center border border-white/10">
            <RefreshCw className="w-6 h-6 text-[#00A3FF] animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-400">Loading saved workout library...</p>
          </div>
        ) : savedWorkouts.length === 0 ? (
          <div className="glass-panel-dark rounded-2xl p-8 text-center border border-white/10 space-y-3">
            <p className="text-sm text-gray-400">No workout programs saved to your library yet.</p>
            <button
              onClick={() => setActiveTab('fitness')}
              className="px-4 py-2 rounded-xl bg-[#00A3FF]/10 border border-[#00A3FF]/30 text-[#00A3FF] text-xs font-bold hover:bg-[#00A3FF]/20 transition-all"
            >
              Generate Your First Workout
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedWorkouts.map((w) => (
              <motion.div
                key={w.id}
                whileHover={{ y: -3 }}
                className="glass-card-dark p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="font-bold text-white text-base truncate">{w.title}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#00A3FF] px-2 py-0.5 rounded-full bg-[#00A3FF]/10 border border-[#00A3FF]/20">
                      {w.stats?.goal || 'Workout'}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Level: <strong className="text-gray-200">{w.stats?.level || 'N/A'}</strong></p>
                    <p>Equipment: <strong className="text-gray-200">{w.stats?.equipment || 'N/A'}</strong></p>
                    <p>Days Count: <strong className="text-[#00A3FF]">{w.plan?.length || 0} Days</strong></p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-2">
                  <button
                    onClick={() => {
                      setActiveTab('fitness');
                      window.history.pushState({}, '', `/fitness?id=${w.id}`);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#00A3FF] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Workout Portal</span>
                  </button>

                  <button
                    onClick={() => handleDeleteWorkout(w.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete Workout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Diets Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-[#00A3FF]" /> Saved Diet Plans
          </h3>
          <button
            onClick={() => setActiveTab('nutrition')}
            className="text-xs font-bold text-[#00A3FF] hover:underline flex items-center gap-1"
          >
            + Create New Diet Plan
          </button>
        </div>

        {loadingDiets ? (
          <div className="glass-panel rounded-2xl p-8 text-center border border-white/10">
            <RefreshCw className="w-6 h-6 text-[#00A3FF] animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-400">Loading saved diet library...</p>
          </div>
        ) : savedDiets.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center border border-white/10 space-y-3">
            <p className="text-sm text-gray-400">No diet plans saved to your library yet.</p>
            <button
              onClick={() => setActiveTab('nutrition')}
              className="px-4 py-2 rounded-xl bg-[#00A3FF]/10 border border-[#00A3FF]/30 text-[#00A3FF] text-xs font-bold hover:bg-[#00A3FF]/20 transition-all"
            >
              Generate Your First Diet Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedDiets.map((d) => (
              <motion.div
                key={d.id}
                whileHover={{ y: -3 }}
                className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3 hover:border-[#00A3FF]/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="font-bold text-white text-base truncate">{d.title}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#00A3FF] px-2 py-0.5 rounded-full bg-[#00A3FF]/10 border border-[#00A3FF]/20">
                      {d.stats?.dietType === 'nonveg' ? '🍗 Non-Veg' : '🥦 Veg'}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Daily Target: <strong className="text-[#00A3FF]">{d.plan?.calories || 0} kcal</strong></p>
                    <p>Protein: <strong className="text-gray-200">{d.plan?.proteinG || 0}g</strong> · Carbs: <strong className="text-gray-200">{d.plan?.carbsG || 0}g</strong></p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-2">
                  <button
                    onClick={() => {
                      setActiveTab('nutrition');
                      window.history.pushState({}, '', `/nutrition?id=${d.id}`);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#00A3FF] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Nutrition Portal</span>
                  </button>

                  <button
                    onClick={() => handleDeleteDiet(d.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete Diet Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
