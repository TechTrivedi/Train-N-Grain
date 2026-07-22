import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Utensils, Sparkles, Shield, ArrowRight, Zap, Send, CheckCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface HomePageProps {
  setActiveTab: (tab: string) => void;
  showToast: (msg: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setActiveTab, showToast }) => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      showToast('Please fill out all contact fields');
      return;
    }
    setContactSubmitting(true);
    try {
      await addDoc(collection(db, 'contacts'), {
        name: contactName.trim(),
        email: contactEmail.trim(),
        message: contactMessage.trim(),
        submittedAt: serverTimestamp()
      });
      showToast('Thank you! Your message has been sent. 🚀');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    } catch (err) {
      console.error('Contact submit error:', err);
      showToast('Failed to send message.');
    } finally {
      setContactSubmitting(false);
    }
  };

  const features = [
    {
      icon: Dumbbell,
      title: 'AI Workout Generator',
      desc: 'Custom split routines engineered in real-time by Gemini 3.1 Flash Lite based on your equipment, goals, warmups, and cardio preferences.',
      tab: 'fitness'
    },
    {
      icon: Utensils,
      title: 'AI Nutrition & Diet Planner',
      desc: 'Customized macro calculations and daily meal cards supporting instant Veg/Non-Veg toggles and BMR/TDEE math.',
      tab: 'nutrition'
    },
    {
      icon: Sparkles,
      title: '24/7 AI Coach Assistant',
      desc: 'Get instant answers to sports science, exercise form, and nutrition questions via our floating interactive assistant.',
      tab: 'chat'
    }
  ];

  return (
    <div className="space-y-20 relative">

      {/* Hero Section with 5-Slide Crossfade Background */}
      <section className="relative min-h-[85vh] flex items-center justify-center rounded-3xl overflow-hidden glass-panel border border-white/10 px-6 py-20 text-center">
        {/* 5-Slide Background */}
        <div className="hero-slideshow">
          <div className="slide" style={{ backgroundImage: "url('/assets/slide1.jpg')" }}></div>
          <div className="slide" style={{ backgroundImage: "url('/assets/slide2.jpg')" }}></div>
          <div className="slide" style={{ backgroundImage: "url('/assets/slide3.jpg')" }}></div>
          <div className="slide" style={{ backgroundImage: "url('/assets/slide4.jpg')" }}></div>
          <div className="slide" style={{ backgroundImage: "url('/assets/slide5.jpg')" }}></div>
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A3FF]/10 border border-[#00A3FF]/30 text-[#00A3FF] text-xs font-bold tracking-wider uppercase backdrop-blur-md"
          >
            <Zap className="w-3.5 h-3.5" /> Next-Gen AI Fitness & Sports Science
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-tight"
          >
            <div className="text-white">Train Hard.</div>
            <div className="text-[#00A3FF]">Eat Smart.</div>
            <div className="text-white">Live Strong.</div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Stop guessing your workouts and meal plans. Experience hyper-customized training routines and sports nutrition generated dynamically by Google Gemini.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => setActiveTab('fitness')}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#00A3FF] text-black font-extrabold text-base shadow-[0_0_30px_rgba(0, 163, 255,0.4)] hover:shadow-[0_0_45px_rgba(0, 163, 255,0.6)] hover:scale-[1.03] transition-all"
            >
              <Dumbbell className="w-5 h-5" />
              <span>Generate AI Workout</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('nutrition')}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/[0.06] border border-white/20 text-white font-bold text-base hover:bg-white/10 hover:border-[#00A3FF]/40 hover:scale-[1.03] transition-all backdrop-blur-md"
            >
              <Utensils className="w-5 h-5 text-[#00A3FF]" />
              <span>Build Diet Plan</span>
            </button>
          </motion.div>

          {/* Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 max-w-3xl mx-auto">
            <div className="glass-card p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-[#00A3FF]">500+</div>
              <div className="text-xs text-gray-400 mt-1">Exercises Handled</div>
            </div>
            <div className="glass-card p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-[#00A3FF]">100%</div>
              <div className="text-xs text-gray-400 mt-1">Customized AI Plans</div>
            </div>
            <div className="glass-card p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-[#00A3FF]">⚡ &lt; 2s</div>
              <div className="text-xs text-gray-400 mt-1">Generation Speed</div>
            </div>
            <div className="glass-card p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-[#00A3FF]">🔒 Firestore</div>
              <div className="text-xs text-gray-400 mt-1">Cloud Profile Sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Everything You Need To Transform
          </h2>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Unified fitness intelligence engineered with modern web technology and Google Gemini AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="glass-card p-8 rounded-3xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#00A3FF]/10 border border-[#00A3FF]/30 flex items-center justify-center text-[#00A3FF]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{feat.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>

                <button
                  onClick={() => setActiveTab(feat.tab)}
                  className="flex items-center gap-2 text-sm font-bold text-[#00A3FF] hover:underline pt-2"
                >
                  <span>Explore Feature</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Contact Us Form */}
      <section className="glass-panel rounded-3xl p-8 lg:p-12 border border-white/10 max-w-3xl mx-auto">
        <div className="text-center space-y-2 mb-8">
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">Have Questions or Suggestions?</h3>
          <p className="text-gray-400 text-sm">Send us a direct message and our team will get back to you!</p>
        </div>

        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Your Name</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3FF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3FF] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Message</label>
            <textarea
              required
              rows={4}
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="How can we help your fitness journey?"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3FF] text-sm resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={contactSubmitting}
            className="w-full py-3.5 rounded-xl bg-[#00A3FF] text-black font-extrabold text-sm shadow-[0_0_20px_rgba(0, 163, 255,0.3)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{contactSubmitting ? 'Sending...' : 'Send Message'}</span>
          </button>
        </form>
      </section>

    </div>
  );
};
