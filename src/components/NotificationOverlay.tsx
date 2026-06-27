import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, User, MessageSquare, Heart, ArrowRight, Repeat2 } from 'lucide-react';

interface NotificationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockNotifications: any[] = [];

export function NotificationOverlay({ isOpen, onClose }: NotificationOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute top-full right-[-12px] mt-2 z-[100]">
          {/* Backdrop to close - covers the content area but let header clicks pass if needed? 
              Actually, usually we want a full screen invisible backdrop for dropdowns */}
          <div 
            className="fixed inset-0 z-[-1]" 
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-screen sm:w-[360px] bg-[#111111] border border-[#1a1a1a] rounded-none sm:rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              <button className="text-[10px] font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-widest">
                Mark all as read
              </button>
            </div>

            <div className="max-h-[440px] overflow-y-auto scrollbar-none">
              {mockNotifications.length > 0 ? (
                <div className="divide-y divide-[#1a1a1a]">
                  {mockNotifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className="p-4 flex gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <div className={`mt-0.5 shrink-0 ${notif.color}`}>
                        <notif.icon size={18} fill={notif.type === 'like' ? 'currentColor' : 'none'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-sm font-bold text-white truncate">{notif.user}</span>
                          <span className="text-[11px] text-neutral-600 shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-[13px] text-neutral-400 leading-snug">
                          {notif.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                    <Bell size={20} className="text-neutral-600" />
                  </div>
                  <p className="text-sm font-medium text-white mb-1">No notifications yet</p>
                  <p className="text-xs text-neutral-500">When you interact with the community, you'll see it here.</p>
                </div>
              )}
            </div>

            <button className="w-full p-4 text-center hover:bg-white/[0.02] transition-colors group border-t border-[#1a1a1a]">
              <span className="text-[11px] font-bold text-neutral-500 group-hover:text-white transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                Show all notifications <ArrowRight size={12} />
              </span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
