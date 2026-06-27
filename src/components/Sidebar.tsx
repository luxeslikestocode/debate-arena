import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Compass,
  Play,
  Mail,
  Bell,
  User,
  Settings,
  ChevronDown,
  BadgeCheck,
  MoreHorizontal,
  MessageSquare,
  CreditCard,
  BarChart3,
  Bookmark,
  LogOut,
  Plus
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', active: true },
  { icon: Compass, label: 'Explore' },
  { icon: Bell, label: 'Notifications' },
  { icon: User, label: 'Profile' },
  { icon: Settings, label: 'Settings' },
];

export function Sidebar({ 
  collapsed: initialCollapsed,
  onNavigate,
  activeView = 'home',
  theme,
  onToggleTheme,
  userProfile,
  onLogout
}: { 
  collapsed?: boolean;
  onNavigate?: (view: 'home' | 'arena' | 'explore' | 'shorts' | 'messages' | 'notifications' | 'profile' | 'posts' | 'settings') => void;
  activeView?: 'home' | 'arena' | 'explore' | 'shorts' | 'messages' | 'notifications' | 'profile' | 'posts' | 'settings' | string;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  userProfile?: any;
  onLogout?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const collapsed = initialCollapsed && !isHovered && !showMoreMenu && !showProfileMenu;

  return (
    <div className={`hidden md:block flex-shrink-0 h-screen transition-[width] duration-300 ${initialCollapsed ? 'w-[80px]' : 'w-[280px]'}`}>
      <div 
        className={`fixed top-0 left-0 h-screen overflow-y-auto border-r border-app-border bg-app-bg p-4 pb-6 z-50 flex flex-col transition-[width] duration-300 ${collapsed ? 'w-[80px]' : 'w-[280px]'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowMoreMenu(false);
          setShowProfileMenu(false);
        }}
      >
        {/* Logo */}
        <div 
          onClick={() => onNavigate?.('home')}
          className="flex items-center gap-3 mb-8 pt-2 h-10 w-full px-2 overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img 
            src="https://i.postimg.cc/fTnpsTgf/Logo.png" 
            alt="Debate.com Logo" 
            className={`w-8 h-8 object-contain shrink-0 transition-all duration-300 ${theme === 'light' ? 'brightness-0' : ''}`} 
          />
        </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.label === 'Home' 
            ? activeView === 'home' 
            : item.label === 'Explore'
              ? activeView === 'explore'
              : item.label === 'Posts'
                ? activeView === 'posts'
                : item.label === 'Shorts'
                  ? activeView === 'shorts'
                  : item.label === 'Messages'
                    ? activeView === 'messages'
                    : item.label === 'Notifications'
                      ? activeView === 'notifications'
                      : item.label === 'Profile'
                        ? activeView === 'profile'
                        : item.label === 'Settings'
                          ? activeView === 'settings'
                          : false;
          return (
            <a
              key={item.label}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) {
                  if (item.label === 'Home') {
                    onNavigate('home');
                  } else if (item.label === 'Explore') {
                    onNavigate('explore');
                  } else if (item.label === 'Posts') {
                    onNavigate('posts');
                  } else if (item.label === 'Shorts') {
                    onNavigate('shorts');
                  } else if (item.label === 'Messages') {
                    onNavigate('messages');
                  } else if (item.label === 'Notifications') {
                    onNavigate('notifications');
                  } else if (item.label === 'Profile') {
                    onNavigate('profile');
                  } else if (item.label === 'Settings') {
                    onNavigate('settings');
                  }
                }
              }}
              className={`flex items-center justify-between py-3 px-3 rounded-2xl transition-colors duration-300 h-12 w-full ${
                isActive
                  ? 'bg-app-elevated text-app-text-primary font-medium'
                  : 'text-app-text-secondary hover:text-app-text-primary hover:bg-app-card'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <Icon size={20} className={`shrink-0 ${isActive ? 'text-app-text-primary' : ''}`} />
                <span className={`text-[15px] font-normal tracking-wide transition-all duration-300 origin-left overflow-hidden whitespace-nowrap select-none ${
                  collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'
                }`}>
                  {item.label}
                </span>
              </div>
              <span className={`bg-app-surface text-app-text-muted text-xs px-2 py-0.5 rounded-full font-medium transition-all duration-300 overflow-hidden whitespace-nowrap select-none ${
                (collapsed || !(item as any).badge) ? 'max-w-0 opacity-0 px-0 ml-0 pointer-events-none' : 'max-w-[40px] opacity-100 ml-2'
              }`}>
                {(item as any).badge}
              </span>
            </a>
          );
        })}

        {/* More Button */}
        <div className="relative mt-1">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex items-center gap-4 py-3 px-3 rounded-2xl transition-colors duration-300 h-12 w-full ${
              showMoreMenu ? 'bg-app-elevated text-app-text-primary' : 'text-app-text-secondary hover:text-app-text-primary hover:bg-app-card'
            }`}
          >
            <MoreHorizontal size={20} className="shrink-0" />
            {!collapsed && <span className="text-[15px] font-normal tracking-wide">More</span>}
          </button>

          <AnimatePresence>
            {showMoreMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-2 w-64 bg-app-card border border-app-border rounded-2xl shadow-2xl overflow-hidden py-2 z-[60]"
              >
                <button 
                  onClick={() => onToggleTheme?.()}
                  className="w-full flex items-center justify-between px-4 py-3 text-[14px] font-medium text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                    )}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-neutral-800' : 'bg-app-text-primary'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-0.5' : 'left-4.5'}`} />
                  </div>
                </button>
                <div className="h-px bg-app-border my-1 mx-2" />
                <button 
                  onClick={() => { onNavigate?.('settings'); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors"
                >
                  <CreditCard size={18} className="text-amber-500" />
                  <div className="text-left">
                    <div className="font-bold text-amber-500">Debate Premium</div>
                    <div className="text-[10px] text-amber-500/60 font-bold uppercase tracking-widest mt-0.5">Scale Your Influence</div>
                  </div>
                </button>
                <div className="h-px bg-app-border my-1 mx-2" />
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors">
                  <BarChart3 size={18} />
                  <span>Analytics</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors">
                  <Bookmark size={18} />
                  <span>Bookmarks</span>
                </button>
                <div className="h-px bg-app-border my-1 mx-2" />
                <button 
                  onClick={() => { onNavigate?.('settings'); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors"
                >
                  <Settings size={18} />
                  <span>Settings & Privacy</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Bottom Profile */}
      <div className="pt-4 mt-4 border-t border-app-border w-full px-1 relative">
        <AnimatePresence>
          {showProfileMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-1 mb-2 w-64 bg-app-card border border-app-border rounded-2xl shadow-2xl overflow-hidden py-2 z-[60]"
            >
              <button 
                onClick={() => { onNavigate?.('settings'); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors"
              >
                <Settings size={18} />
                <span className="font-bold">Settings & Privacy</span>
              </button>
              <button 
                onClick={() => { onNavigate?.('home'); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors"
              >
                <Plus size={18} />
                <span className="font-bold">Add an existing account</span>
              </button>
              <div className="h-px bg-app-border my-1 mx-2" />
              <button 
                onClick={() => { onLogout?.(); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-500 hover:bg-rose-500/5 hover:text-rose-500 transition-colors"
              >
                <LogOut size={18} />
                <span className="font-bold">Log out {userProfile?.username || '@user'}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className={`flex items-center justify-between py-2 px-1 rounded-2xl transition-all duration-300 w-full h-14 overflow-hidden ${showProfileMenu ? 'bg-app-elevated' : 'hover:bg-app-card'}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-secondary shrink-0 overflow-hidden">
              <User size={18} className="text-app-text-muted" />
            </div>
            <div className={`text-left transition-all duration-300 origin-left overflow-hidden whitespace-nowrap ${
              collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'
            }`}>
              <div className="text-sm font-medium text-app-text-primary flex items-center gap-1.5 leading-none mb-1">
                {userProfile?.name || 'Anonymous'} {userProfile?.isVerified && <BadgeCheck size={14} className="text-app-text-primary fill-app-text-primary/20 shrink-0" />}
              </div>
              <div className="text-xs text-app-text-muted leading-none">{userProfile?.username || '@user'}</div>
            </div>
          </div>
          <ChevronDown size={16} className={`text-app-text-muted transition-all duration-300 shrink-0 ${
            collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[20px] opacity-100'
          } ${showProfileMenu ? 'rotate-180' : ''}`} />
        </button>
      </div>
      </div>
    </div>
  );
}
