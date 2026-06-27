import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, ArrowRight, MessageSquare } from 'lucide-react';

interface AuthViewProps {
  onLogin: (name: string) => void;
}

export function AuthView({ onLogin }: AuthViewProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    onLogin(name.trim());
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 md:p-12">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <MessageSquare size={32} className="text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter">
              Join Debate Arena
            </h1>
            <p className="text-neutral-500 text-sm font-medium mt-2 text-center">
              Choose a display name to enter the live debate
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-white transition-colors pointer-events-none">
                <User size={17} />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your display name"
                required
                minLength={2}
                maxLength={30}
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20 transition-all text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enter the Arena</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 flex justify-center gap-6 text-[11px] font-semibold uppercase tracking-widest text-neutral-700">
          <a href="#" className="hover:text-neutral-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-neutral-400 transition-colors">Terms</a>
          <a href="#" className="hover:text-neutral-400 transition-colors">Community</a>
        </div>
      </motion.div>
    </div>
  );
}