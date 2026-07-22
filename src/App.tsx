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

  // Update browser history state on tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const newPath = tab === 'home' ? '/' : `/${tab}`;
    window.history.pushState({}, '', newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="min-h-screen bg-[#0A0A0C] text-gray-100 flex flex-col justify-between selection:bg-[#FF5C00] selection:text-black">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        user={user}
        openAuthModal={() => setAuthModalOpen(true)}
        showToast={showToast}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'home' && (
              <HomePage setActiveTab={handleTabChange} showToast={showToast} />
            )}
            {activeTab === 'fitness' && (
              <FitnessPage user={user} openAuthModal={() => setAuthModalOpen(true)} showToast={showToast} />
            )}
            {activeTab === 'nutrition' && (
              <NutritionPage user={user} openAuthModal={() => setAuthModalOpen(true)} showToast={showToast} />
            )}
            {activeTab === 'profile' && (
              <ProfilePage user={user} setActiveTab={handleTabChange} openAuthModal={() => setAuthModalOpen(true)} showToast={showToast} />
            )}
          </motion.div>
        </AnimatePresence>
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
              className="pointer-events-auto glass-panel px-4 py-3 rounded-2xl border border-[#FF5C00]/40 text-[#FF5C00] text-xs font-semibold shadow-[0_0_20px_rgba(255, 92, 0,0.25)] flex items-center gap-2.5 backdrop-blur-xl"
            >
              <Sparkles className="w-4 h-4 text-[#FF5C00] flex-shrink-0 animate-pulse" />
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}

export default App;
