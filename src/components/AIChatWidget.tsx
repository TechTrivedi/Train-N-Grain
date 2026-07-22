import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Bot, Trash2 } from 'lucide-react';
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) throw new Error('API server returned error');

      const data = await response.json();
      const assistantReply = data.reply || "I'm having trouble processing that request right now.";

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: assistantReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      showToast('Offline or API connection error.');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "⚠️ Couldn't connect to AI coach server. Please check your connection or try again later.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
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
          className="relative group p-4 rounded-2xl bg-[#FF5C00] text-black shadow-[0_0_30px_rgba(255, 92, 0,0.5)] flex items-center justify-center font-bold"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5C00] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF5C00]"></span>
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
            className="w-[92vw] sm:w-[400px] h-[520px] glass-panel rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF5C00]/10 border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    AI Coach Assistant <Sparkles className="w-3.5 h-3.5 text-[#FF5C00]" />
                  </h4>
                  <span className="text-[10px] text-[#FF5C00] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00] animate-pulse"></span>
                    Online · Powered by Gemini
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  title="Clear Chat"
                  className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-white/5 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#FF5C00] text-black font-medium rounded-tr-none shadow-[0_0_15px_rgba(255, 92, 0,0.2)]'
                        : 'bg-white/[0.05] border border-white/10 text-gray-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.timestamp && (
                    <span className="text-[10px] text-gray-500 mt-1 px-1">{msg.timestamp}</span>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 text-gray-400 text-xs w-fit">
                  <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1 text-[#FF5C00]">Coach is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-white/[0.02] flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about workouts, nutrition, macros..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FF5C00]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-[#FF5C00] text-black font-bold disabled:opacity-40 hover:scale-105 transition-transform"
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
