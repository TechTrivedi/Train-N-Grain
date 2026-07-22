import React from 'react';
import { Flame, Heart, Shield, Sparkles } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="w-full glass-panel border-t border-white/10 mt-20 py-12 px-4 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        
        {/* Col 1: Brand Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neon-dim border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14]">
              <Flame className="w-5 h-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              TRAIN <span className="text-[#39FF14]">N</span> GRAIN
            </span>
          </div>
          <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
            Your unified AI-powered platform for hyper-personalized workout engineering and precision sports nutrition routines. Powered by Google Gemini.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20">
              <Sparkles className="w-3.5 h-3.5" /> Gemini 3.1 Flash Lite Engine
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Shield className="w-3.5 h-3.5" /> Firebase Auth
            </span>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Portals</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li>
              <button onClick={() => setActiveTab('home')} className="hover:text-[#39FF14] transition-colors">
                Home Dashboard
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('fitness')} className="hover:text-[#39FF14] transition-colors">
                AI Workout Generator
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('nutrition')} className="hover:text-[#39FF14] transition-colors">
                AI Nutrition & Diet Generator
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('profile')} className="hover:text-[#39FF14] transition-colors">
                Saved Programs Library
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Tech Stack */}
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Built With</h4>
          <ul className="space-y-2 text-xs text-gray-400">
            <li>⚡ React 19 & TypeScript</li>
            <li>🎨 Tailwind CSS & Framer Motion</li>
            <li>✨ Lucide React Icons</li>
            <li>🔒 Firebase Cloud Firestore</li>
            <li>🚀 Vite HMR Engine</li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <p>© {new Date().getFullYear()} Train N Grain. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Designed with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> for fitness enthusiasts worldwide.
        </p>
      </div>
    </footer>
  );
};
