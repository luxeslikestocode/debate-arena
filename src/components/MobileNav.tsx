import React from 'react';
import { Home, Compass, Play, MessageSquare, User, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface MobileNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onCreate: () => void;
  userProfile?: any;
}

export function MobileNav({ activeView, onNavigate, onCreate, userProfile }: MobileNavProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'explore', icon: Compass, label: 'Explore' },
    { id: 'create', icon: Plus, label: 'Create', special: true },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-app-bg/90 backdrop-blur-md border-t border-app-border px-4 flex items-center justify-between z-50 pb-safe">
      {navItems.map((item) => {
        const isActive = activeView === item.id;
        if (item.special) {
          return (
            <button
              key={item.id}
              onClick={onCreate}
              className="flex flex-col items-center justify-center flex-1 h-full"
            >
              <div className="w-10 h-10 rounded-full bg-app-text-primary text-app-bg flex items-center justify-center active:scale-90 transition-transform shadow-lg">
                <item.icon size={20} strokeWidth={3} />
              </div>
            </button>
          );
        }


        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex flex-col items-center justify-center flex-1 h-full relative"
          >
            <item.icon 
              size={22} 
              className={`transition-colors duration-200 ${isActive ? 'text-app-text-primary' : 'text-app-text-muted'}`}
              strokeWidth={isActive ? 2.5 : 2}
            />
            {isActive && (
              <motion.div 
                layoutId="mobileNavActive"
                className="absolute bottom-1 w-1 h-1 rounded-full bg-app-text-primary"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
