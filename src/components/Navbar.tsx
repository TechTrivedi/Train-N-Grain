import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Utensils, User as UserIcon, LogIn, LogOut, Menu, X, Flame } from 'lucide-react';
import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../config/firebase';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  openAuthModal: () => void;
  showToast: (msg: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  openAuthModal,
  showToast
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out successfully! 👋');
      setActiveTab('home');
    } catch (err) {
      showToast('Failed to sign out');
    }
  };

  const navLinks = [
    { id: 'home', label: 'Home', icon: Flame },
    { id: 'fitness', label: 'Workouts', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils },
    ...(user ? [{ id: 'profile', label: 'Profile', icon: UserIcon }] : []),
  ];

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 lg:px-8 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 group text-left focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-neon-dim border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00] shadow-[0_0_15px_rgba(255, 92, 0,0.2)] group-hover:scale-105 transition-transform duration-300">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-white group-hover:text-[#FF5C00] transition-colors">
              TRAIN <span className="text-[#FF5C00]">N</span> GRAIN
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-gray-400 font-medium -mt-1">
              AI Fitness Platform
            </span>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/10 p-1.5 rounded-2xl backdrop-blur-md">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? 'text-black font-semibold' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-[#FF5C00] rounded-xl shadow-[0_0_20px_rgba(255, 92, 0,0.4)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                <span className="relative z-10">{link.label}</span>
              </button>
            );
          })}
        </div>

        {/* Auth CTA / User Avatar */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#FF5C00]/40 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#FF5C00]/20 border border-[#FF5C00] flex items-center justify-center text-[#FF5C00] text-xs font-bold">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-200 max-w-[120px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5C00] text-black font-bold text-sm shadow-[0_0_20px_rgba(255, 92, 0,0.3)] hover:shadow-[0_0_30px_rgba(255, 92, 0,0.5)] hover:scale-[1.02] transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:text-[#FF5C00]"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-3 pt-3 border-t border-white/10 overflow-hidden"
          >
            <div className="flex flex-col gap-2 pb-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => {
                      setActiveTab(link.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                      isActive ? 'bg-[#FF5C00] text-black font-semibold' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </button>
                );
              })}

              <div className="pt-2 border-t border-white/10 mt-1">
                {user ? (
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out ({user.email})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      openAuthModal();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#FF5C00] text-black font-bold text-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Account</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
