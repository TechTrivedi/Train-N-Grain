import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Bot, RotateCcw, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';

interface AIChatWidgetProps {
  showToast: (msg: string) => void;
}

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({ showToast }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: "👋 Hi! I'm your Train N Grain AI Fitness & Nutrition Assistant. Ask me anything about workout routines, meal prep, or sports science!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // AI Knowledge Engine fallback for instant interactive responses
  const generateAICoachResponse = (query: string): string => {
    const q = query.toLowerCase().trim();

    if (/^(hi+|hello|hey+|sup|namaste|good\s(morning|evening|afternoon)|greetings)/i.test(q)) {
      return "👋 Hello champion! Ready to level up your training or nutrition today?\n\nTell me your primary goal (Muscle Hypertrophy, Fat Loss, Strength, or Diet Plan) and I'll guide you step-by-step!";
    }

    if (q.includes('chest') || q.includes('bench') || q.includes('pushup') || q.includes('push up') || q.includes('pec')) {
      return "💪 **Chest Hypertrophy Blueprint:**\n\n1. **Primary Lifts**: Incline Dumbbell Press (3-4 sets × 8-12 reps) for upper chest shelf.\n2. **Mechanical Tension**: Pause 1 second at full stretch at the bottom of each press.\n3. **Isolation**: Cable Flyes or Dumbbell Flyes (3 sets × 12-15 reps).\n4. **Frequency**: Hit chest 2 times per week with 48 hours rest between sessions.";
    }

    if (q.includes('fat loss') || q.includes('cut') || q.includes('weight loss') || q.includes('belly') || q.includes('lose weight')) {
      return "🔥 **Precision Fat Loss Strategy:**\n\n1. **Calorie Deficit**: Aim for 300 - 500 kcal deficit below your Maintenance TDEE.\n2. **High Protein**: Target 1.8g - 2.2g of protein per kg of bodyweight to preserve muscle.\n3. **NEAT & Cardio**: Aim for 8,000-10,000 daily steps + 20 mins post-workout incline walking.\n4. Use our **AI Nutrition Generator** tab to compile your custom deficit meal plan!";
    }

    if (q.includes('bulk') || q.includes('muscle') || q.includes('gain') || q.includes('hypertrophy') || q.includes('mass')) {
      return "⚡ **Lean Muscle Bulking Rules:**\n\n1. **Clean Calorie Surplus**: Eat 250 - 400 calories over your daily maintenance TDEE.\n2. **Progressive Overload**: Focus on adding weight or reps every 1-2 weeks.\n3. **Recovery**: Sleep 7.5 - 9 hours per night; muscle grows during deep sleep, not in the gym!\n4. Check out the **AI Workout Generator** tab to compile your split!";
    }

    if (q.includes('protein') || q.includes('diet') || q.includes('eat') || q.includes('food') || q.includes('creatine') || q.includes('veg')) {
      return "🥗 **Nutrition & Macro Breakdown:**\n\n• **Protein Sources**: Chicken breast, eggs, fish, cottage cheese / paneer, whey protein, tofu, lentils.\n• **Creatine Monohydrate**: Take 3g-5g daily consistently for boosted power output & muscle fullness.\n• **Pre-Workout Fuel**: Fast-digesting carbs (banana, oats, rice cake) 45-60 mins before lifting.";
    }

    if (q.includes('arm') || q.includes('bicep') || q.includes('tricep')) {
      return "🏋️ **Arm Growth Masterclass:**\n\n• **Triceps (66% of arm size)**: Heavy Overhead Extensions + Cable Pushdowns (focused on lateral head).\n• **Biceps**: Incline Dumbbell Curls (long head stretch) + Hammer Curls (brachialis thickness).\n• Train arms after compound pulling/pushing or on a dedicated Arms/Shoulders day!";
    }

    if (q.includes('abs') || q.includes('core') || q.includes('six pack')) {
      return "🍫 **Abs & Core Science:**\n\n1. **Abs are built in the gym, revealed in the kitchen**: Six-pack visibility requires low body fat (<12% for men, <20% for women).\n2. **Weighted Abs Training**: Cable Woodchoppers & Hanging Leg Raises (3 sets × 12-15 reps) build abdominal wall thickness.";
    }

    return `⚡ **Train N Grain AI Assistant**:
Regarding "${query}":

Key principle: Consistency in progressive overload + proper macro intake drives 90% of your results.

• For a custom workout split, head over to the **AI Workout Generator** tab.
• For exact calorie & protein targets, open the **AI Nutrition** tab!

What specific goal are you aiming for today?`;
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || loading) return;

    const newMsg: ChatMessage = {
      role: 'user',
      text: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      // Attempt backend API if available
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              text: data.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.log('Using built-in AI Coach engine fallback');
    }

    // Interactive AI Coach engine response
    setTimeout(() => {
      const coachReply = generateAICoachResponse(userMessage);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: coachReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setLoading(false);
    }, 500);
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        text: "Conversation cleared. How else can I help your fitness journey?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative group p-4 rounded-2xl bg-[#E4E4E7] text-black shadow-[0_0_20px_rgba(228,228,231,0.3)] flex items-center justify-center font-bold"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E4E4E7]"></span>
          </span>
        </motion.button>
      )}

      {/* Expandable Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[92vw] sm:w-[400px] h-[520px] bg-[#0B0B12] rounded-3xl border border-white/20 shadow-[0_10px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#12121A]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#E4E4E7]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    AI Coach Assistant <Sparkles className="w-3.5 h-3.5 text-[#E4E4E7]" />
                  </h4>
                  <span className="text-[10px] text-[#E4E4E7] flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E4E4E7] animate-pulse"></span>
                    Online · Powered by Gemini
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  title="Clear Chat"
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0B0B12]">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#E4E4E7] text-black font-semibold rounded-br-none shadow-md'
                        : 'bg-[#181824] text-gray-100 border border-white/10 rounded-bl-none shadow-md'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span
                      className={`block text-[9px] mt-1.5 ${
                        msg.role === 'user' ? 'text-black/70 font-medium' : 'text-gray-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#181824] text-gray-400 border border-white/10 rounded-2xl rounded-bl-none px-4 py-3 text-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E4E4E7]" />
                    <span>AI Coach is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-[#12121A] flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about workouts, macros, form..."
                className="flex-1 bg-[#0B0B12] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-[#E4E4E7] text-black hover:scale-105 active:scale-95 disabled:opacity-50 transition-all font-bold"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
