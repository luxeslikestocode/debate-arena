import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'primary';
  icon?: 'report' | 'block' | 'warning';
}

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmLabel,
  confirmVariant = 'primary',
  icon = 'warning'
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-app-card border border-app-border rounded-[2.5rem] p-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-app-surface text-app-text-muted hover:text-app-text-primary transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${
                confirmVariant === 'danger' ? 'bg-rose-600/10 text-rose-600' : 'bg-app-text-primary/10 text-app-text-primary'
              }`}>
                {icon === 'report' && <Shield size={32} />}
                {icon === 'block' && <X size={32} />}
                {icon === 'warning' && <AlertTriangle size={32} />}
              </div>

              <h3 className="text-2xl font-black text-app-text-primary tracking-tighter mb-3">{title}</h3>
              <p className="text-app-text-secondary font-medium leading-relaxed mb-8">
                {description}
              </p>

              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => { onConfirm(); onClose(); }}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all ${
                    confirmVariant === 'danger' 
                      ? 'bg-rose-600 text-white hover:opacity-90' 
                      : 'bg-app-text-primary text-app-bg hover:opacity-80'
                  }`}
                >
                  {confirmLabel}
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl font-bold text-sm text-app-text-muted hover:text-app-text-primary transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
