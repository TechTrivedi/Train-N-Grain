import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './config/firebase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { AIChatWidget } from './components/AIChatWidget';
import { HomePage } from './pages/HomePage';
import { FitnessPage } from './pages/FitnessPage';
import { NutritionPage } from './pages/NutritionPage';
import { ProfilePage } from './pages/ProfilePage';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastState {
  id: number;
  message: string;
}

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  // Sync tab with URL pathname on initial load
  useEffect(() => {
    const path = window.location.pathname.replace('/', '').toLowerCase();
    if (path === 'fitness' || path === 'nutrition' || path === 'profile') {
      setActiveTab(path);
    }
  }, []);

  // Update browser history state on tab change and scroll smooth
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const newPath = tab === 'home' ? '/' : `/${tab}`;
    window.history.pushState({}, '', newPath);
    
    if (tab === 'profile') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const targetElem = document.getElementById(tab);
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-gray-100 flex flex-col justify-between selection:bg-[#E4E4E7] selection:text-black relative overflow-x-hidden">
      
      {/* Fixed Full-Screen Ultra-Clear Dark Statue Background Layer (No Text) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/assets/hero-bg.jpg"
          alt="Train N Grain Dark Statue Background"
          className="w-full h-full object-cover opacity-90 scale-100 brightness-[0.85] contrast-[1.15]"
        />
        {/* Sleek dark gradient for high text contrast while keeping statue ultra sharp */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/50 via-[#050508]/30 to-[#050508]/75 z-[1]" />
      </div>

      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        user={user}
        openAuthModal={() => setAuthModalOpen(true)}
        showToast={showToast}
      />

      {/* Main Content Area: Stacked Single-Page Continuous Scroll */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-24">
        {activeTab === 'profile' ? (
          <ProfilePage user={user} setActiveTab={handleTabChange} openAuthModal={() => setAuthModalOpen(true)} showToast={showToast} />
        ) : (
          <>
            {/* 1. Home Dashboard Hero & Overview */}
            <div id="home">
              <HomePage setActiveTab={handleTabChange} showToast={showToast} />
            </div>

            {/* 2. AI Workout Generator (Stacked Directly Below Home) */}
            <div id="fitness" className="pt-12 border-t border-white/10">
              <FitnessPage user={user} openAuthModal={() => setAuthModalOpen(true)} showToast={showToast} />
            </div>

            {/* 3. AI Nutrition & Diet Generator (Stacked Directly Below Workouts) */}
            <div id="nutrition" className="pt-12 border-t border-white/10">
              <NutritionPage user={user} openAuthModal={() => setAuthModalOpen(true)} showToast={showToast} />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer setActiveTab={handleTabChange} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        showToast={showToast}
      />

      {/* Floating AI Assistant Chat Widget */}
      <AIChatWidget showToast={showToast} />

      {/* Floating Toast Notification Stack */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="pointer-events-auto glass-panel px-4 py-3 rounded-2xl border border-[#00A3FF]/40 text-[#00A3FF] text-xs font-semibold shadow-[0_0_20px_rgba(0, 163, 255,0.25)] flex items-center gap-2.5 backdrop-blur-xl"
            >
              <Sparkles className="w-4 h-4 text-[#00A3FF] flex-shrink-0 animate-pulse" />
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}

export default App;
