import { Search, ChevronDown, ChevronLeft, ChevronRight, Eye, User, Bell, LogOut, Settings, Menu, Share2, MoreHorizontal, MessageSquare, Play, Bookmark, Trash, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { MobileNav } from './components/MobileNav';
import { useRef, useState, MouseEvent, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, User as AppUser } from './lib/auth';
import { SignInButton, UserButton, SignIn, Show } from '@clerk/react';
import { createDebate, deleteDebate, fetchDebates } from './lib/api';
import { ExploreView, type Debate, type Creator, topicsData } from './components/ExploreView';
import { DebateArena } from './components/DebateArena';
import { NotificationsView } from './components/NotificationsView';
import { PostsView } from './components/PostsView';
import { ShortsView } from './components/ShortsView';
import { ChatView } from './components/ChatView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { AuthView } from './components/AuthView';
import { NotificationOverlay } from './components/NotificationOverlay';
import { CreateDebateView } from './components/CreateDebateView';
import { generateId } from './utils/helpers';

const activeCategories = [
  'Philosophy', 'Politics', 'Artificial Intelligence', 'Religion', 'History',
  'Technology', 'Economics', 'Science', 
  'Ethics', 'Climate Change', 'Education', 'Healthcare'
];

function Header({ onNavigate, onCreate, onToggleNotifications, showNotifications, activeView, searchQuery, onSearchChange, onPerformSearch, showSearchDropdown, setShowSearchDropdown, user, onLogout, allDebates = [], onDeleteDebate }: { 
  onNavigate?: (view: any) => void; 
  onCreate?: () => void; 
  onToggleNotifications?: () => void; 
  showNotifications: boolean; 
  activeView: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPerformSearch: (query: string) => void;
  showSearchDropdown: boolean;
  setShowSearchDropdown: (show: boolean) => void;
  user?: AppUser | null;
  onLogout?: () => void;
  allDebates?: any[];
  onDeleteDebate?: (id: string) => void;
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as any)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between border-b border-app-border bg-app-bg sticky top-0 z-40">
      <div ref={searchBarRef} className="flex-1 max-w-2xl relative group mr-4">
        <div className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-app-text-muted group-focus-within:text-app-text-primary transition-colors">
          <Search size={16} className="md:w-[18px] md:h-[18px]" />
        </div>
        <input 
          id="global-search-input"
          type="text" 
          placeholder="Search live debates, keywords, or channels..." 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onPerformSearch(searchQuery)}
          onFocus={() => setShowSearchDropdown(true)}
          className="w-full bg-app-card border border-app-border rounded-full py-1.5 md:py-2.5 pl-10 md:pl-12 pr-4 text-[13px] focus:outline-none focus:border-app-text-muted transition-all placeholder:text-app-text-muted text-app-text-primary font-medium"
        />

        <AnimatePresence>
          {showSearchDropdown && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-app-card border border-app-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 py-2"
            >
              <div className="px-4 py-2 text-[10px] font-black text-app-text-muted uppercase tracking-widest">Trending Keywords</div>
              <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-app-border">
                {[].map(tag => (
                  <button key={tag} onClick={() => onPerformSearch(tag)} className="px-3 py-1 bg-app-surface hover:bg-app-elevated border border-app-border rounded-full text-xs font-bold text-app-text-secondary transition-colors">#{tag}</button>
                ))}
              </div>
              <div className="px-4 py-2 text-[10px] font-black text-app-text-muted uppercase tracking-widest mt-1">Recommendations</div>
              <div className="px-2 pb-2 space-y-1">
                {(searchQuery.length > 0 ? allDebates.filter(d => d.title?.toLowerCase().includes(searchQuery.toLowerCase())) : allDebates).slice(0, 3).map((debate, i) => {
                  const idToUse = debate.id || debate.title?.toLowerCase().replace(/[^a-z0-9]/g, '-');
                  const isCreator = user && (debate.creatorId === user.id || debate.id?.includes('custom-'));
                  return (
                    <div key={i} onClick={() => { onNavigate?.('arena'); setShowSearchDropdown(false); }} className="flex items-center gap-3 p-2 rounded-xl hover:bg-app-surface cursor-pointer group transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-app-bg border border-app-border flex-shrink-0 flex items-center justify-center text-app-text-muted relative overflow-hidden"><Play size={16} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-app-text-primary truncate">{debate.title}</div>
                        <div className="text-[10px] text-app-text-muted font-medium">{debate.watching} watching</div>
                      </div>
                      {isCreator && (
                        <button onClick={(e) => { e.stopPropagation(); onDeleteDebate?.(idToUse); }} className="p-1.5 rounded-lg text-app-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"><Trash size={14} /></button>
                      )}
                      <div className="text-app-text-muted opacity-0 group-hover:opacity-100 transition-opacity pr-2"><MoreHorizontal size={14} /></div>
                    </div>
                  );
                })}
              </div>
              {searchQuery.length > 0 && (
                <button onClick={() => onPerformSearch(searchQuery)} className="w-full flex items-center gap-3 px-4 py-3 bg-app-surface hover:bg-app-elevated text-left transition-colors border-t border-app-border mt-1">
                  <Search size={16} className="text-app-text-primary" />
                  <span className="text-sm font-black text-app-text-primary">See all results for "{searchQuery}"</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <button onClick={onCreate} className="hidden md:block px-6 py-1.5 rounded-full border border-app-border text-sm font-bold text-app-text-primary hover:bg-app-text-primary hover:text-app-bg transition-all active:scale-95">Create</button>
        <div className="relative">
          <button onClick={onToggleNotifications} className={`relative text-app-text-secondary hover:text-app-text-primary transition-colors p-2 rounded-full ${showNotifications ? 'bg-app-elevated text-app-text-primary' : 'hover:bg-app-surface'}`}>
            <Bell size={20} className="md:w-[22px] md:h-[22px]" strokeWidth={2} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-app-bg"></span>
          </button>
          <NotificationOverlay isOpen={showNotifications} onClose={onToggleNotifications!} />
        </div>

        <div className="relative">
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: 'w-8 h-8 rounded-full border border-app-border',
                userButtonTrigger: 'focus:shadow-none',
              },
            }}
            afterSignOutUrl="/"
          />
        </div>
      </div>
    </header>
  );
}

const parseViewers = (watching: string) => {
  if (watching.includes('K')) return parseFloat(watching) * 1000;
  if (watching.includes('M')) return parseFloat(watching) * 1000000;
  return parseInt(watching) || 0;
};

export default function App() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('Philosophy');
  const [popularTopics, setPopularTopics] = useState(topicsData);

  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'All') {
      const exists = popularTopics.find(t => t.name.toLowerCase() === selectedCategory.toLowerCase());
      if (!exists) {
        const newTopic = {
          id: selectedCategory.toLowerCase().replace(/\s+/g, '-'),
          name: selectedCategory,
          description: `Discussions and debates related to ${selectedCategory}.`,
          count: '1 Active Debate',
          tags: [selectedCategory, 'Popular'],
          debates: []
        };
        setPopularTopics(prev => [newTopic, ...prev]);
      }
    }
  }, [selectedCategory]);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleDeleteDebate = async (debateId: string) => {
    if (window.confirm("Are you sure you want to delete this debate?")) {
      try {
        await deleteDebate(debateId);
        setAllDebates(prev => prev.filter(d => (d.id || d.title?.toLowerCase().replace(/[^a-z0-9]/g, '-')) !== debateId));
      } catch (err) {
        console.error("Error deleting debate", err);
      }
    }
    setActiveMenuId(null);
  };

  const DebateCardMenu = ({ debate }: { debate: any }) => {
    const isCreator = user && (debate.creatorId === user.id || debate.id?.includes('custom-'));
    const debateId = debate.id || debate.title?.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const isMenuOpen = activeMenuId === debateId;

    return (
      <div className="relative z-10 shrink-0">
        <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : debateId); }} className={`p-1.5 rounded-lg border transition-all ${isMenuOpen ? 'bg-app-elevated border-app-text-primary text-app-text-primary' : 'bg-black/60 border-white/10 text-app-text-secondary hover:text-app-text-primary hover:bg-black'}`}><Menu size={13} /></button>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-full mt-2 w-36 bg-app-card border border-app-border rounded-xl shadow-2xl py-1 z-50 text-left overflow-hidden">
              <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?debateId=${debateId}`); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors text-left"><Share2 size={12} /><span>Share</span></button>
              {isCreator && (
                <>
                  <div className="h-px bg-app-border my-1 mx-2" />
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteDebate(debateId); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-rose-500 hover:bg-app-surface transition-colors text-left"><Trash size={12} /><span>Delete</span></button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<{ debates: Debate[], creators: Creator[], query: string } | null>(null);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setShowSearchDropdown(true);
    } else {
      setShowSearchDropdown(false);
    }
  };

  const performSearch = (query: string) => {
    if (!query) return;
    const matchingDebates = allDebates.filter(d => 
      d.title.toLowerCase().includes(query.toLowerCase()) || 
      (d.tags && d.tags.some((t: string) => t.toLowerCase().includes(query.toLowerCase())))
    );
    const matchingCreators: any[] = [];
    setSearchResults({ debates: matchingDebates, creators: matchingCreators, query });
    setView('explore');
    setShowSearchDropdown(false);
  };

  const [view, setView] = useState<'home' | 'arena' | 'explore' | 'shorts' | 'messages' | 'notifications' | 'profile' | 'posts' | 'settings' | 'create-debate'>('home');
  const [customDebates, setCustomDebates] = useState<any[]>([]);
  const [allDebates, setAllDebates] = useState<any[]>([]);

  useEffect(() => {
    fetchDebates().then(debates => setAllDebates(debates)).catch(console.error);
  }, []);

  const [selectedShortId, setSelectedShortId] = useState<number | undefined>(undefined);
  const [activeDebate, setActiveDebate] = useState<any>(null);

  // URL Sharing / Direct Joins
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const debateId = params.get('debateId');
    if (debateId) {
      const found = allDebates.find(d => {
        const urlId = d.id || d.title?.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return urlId === debateId || d.title === debateId;
      });
      if (found) {
        setActiveDebate({ id: debateId, ...found });
        setView('arena');
      } else {
        // Still navigate to arena with a placeholder even if debate not in list
        setActiveDebate({ id: debateId, title: 'Live Debate', isLive: true, watching: '0' });
        setView('arena');
      }
    }
  }, [allDebates]);

  const handleDebateClick = (debate: any) => {
    setActiveDebate(debate);
    setView('arena');
  };

  useEffect(() => {
    if (view === 'arena' && activeDebate) {
      const idToUse = activeDebate.id || activeDebate.title?.toLowerCase().replace(/[^a-z0-9]/g, '-');
      if (idToUse) {
        window.history.pushState({}, '', `${window.location.origin}${window.location.pathname}?debateId=${encodeURIComponent(idToUse)}`);
      }
    } else if (window.location.search.includes('debateId=')) {
      window.history.pushState({}, '', window.location.pathname);
    }
  }, [view, activeDebate]);

  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextFeatured = useCallback(() => {
    if (allDebates.length === 0) return;
    setDirection(1);
    setFeaturedIndex((prev) => (prev + 1) % allDebates.length);
  }, [allDebates.length]);

  const prevFeatured = useCallback(() => {
    if (allDebates.length === 0) return;
    setDirection(-1);
    setFeaturedIndex((prev) => (prev - 1 + allDebates.length) % allDebates.length);
  }, [allDebates.length]);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') target.blur();
        return;
      }
      switch (e.key.toLowerCase()) {
        case '/': e.preventDefault(); document.getElementById('global-search-input')?.focus(); break;
        case 'escape': if (view === 'arena') setView('home'); else if (showNotifications) setShowNotifications(false); break;
        case 'h': setView('home'); break;
        case 'e': setView('explore'); break;
        case 's': setView('shorts'); break;
        case 'm': setView('messages'); break;
        case 'n': setView('notifications'); break;
        case 'p': setView('profile'); break;
        case 'arrowleft': if (view === 'home') { e.preventDefault(); prevFeatured(); } break;
        case 'arrowright': if (view === 'home') { e.preventDefault(); nextFeatured(); } break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, showNotifications, prevFeatured, nextFeatured]);

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0, position: 'absolute' as const }),
    center: { x: 0, opacity: 1, position: 'absolute' as const },
    exit: (d: number) => ({ x: d < 0 ? 40 : -40, opacity: 0, position: 'absolute' as const })
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1;
    if (Math.abs(walk) > 5) setDragMoved(true);
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const currentDebates = [
    ...allDebates.filter(d => d.category === selectedCategory || (d.tags && d.tags.some((t: string) => t.toLowerCase() === selectedCategory.toLowerCase())))
  ];
  const sortedDebates = [...currentDebates].sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    return parseViewers(b.watching) - parseViewers(a.watching);
  });

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-app-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-app-text-primary mb-2">Debate Arena</h1>
              <p className="text-app-text-secondary">Sign in to join or host live debates</p>
            </div>
            <SignIn routing="hash" signUpUrl="/sign-up" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-app-bg text-app-text-primary selection:bg-app-text-primary/20 overflow-x-hidden">
      <Sidebar collapsed={true} activeView={view} theme={theme} onToggleTheme={toggleTheme} userProfile={user} onLogout={handleLogout} onNavigate={(newView) => { setView(newView); setSearchResults(null); setSearchQuery(''); }} />
      
      <main className="flex-1 flex flex-col min-w-0 bg-app-bg h-screen overflow-hidden pb-16 md:pb-0">
        {view === 'arena' ? (
          <DebateArena debate={activeDebate} onBack={() => setView('home')} />
        ) : view === 'shorts' ? (
          <ShortsView initialShortId={selectedShortId} theme={theme} onBack={() => { setView('explore'); setSelectedShortId(undefined); }} />
        ) : view === 'messages' ? (
          <ChatView />
        ) : view === 'notifications' ? (
          <NotificationsView />
        ) : view === 'profile' ? (
          <ProfileView userProfile={user} />
        ) : view === 'settings' ? (
          <SettingsView />
        ) : view === 'create-debate' ? (
          <CreateDebateView 
            onBack={() => setView('home')}
            onCreateDebate={async (newDebate) => {
              const debateData = {
                ...newDebate,
                id: newDebate.id || `custom_${Date.now()}`,
                creatorId: user?.id || 'anonymous',
                createdAt: Date.now(),
                isLive: true,
                started: 'Live Now',
                watching: '1',
              };
              await createDebate(debateData);
              setCustomDebates(prev => [debateData, ...prev]);
              setAllDebates(prev => [debateData, ...prev]);
              setActiveDebate(debateData);
              setView('arena');
            }}
          />
        ) : view === 'explore' ? (
          <>
            <Header onNavigate={setView} onCreate={() => setView('create-debate')} onToggleNotifications={() => setShowNotifications(!showNotifications)} showNotifications={showNotifications} activeView={view} searchQuery={searchQuery} onSearchChange={handleSearchChange} onPerformSearch={performSearch} showSearchDropdown={showSearchDropdown} setShowSearchDropdown={setShowSearchDropdown} user={user} onLogout={handleLogout} allDebates={allDebates} onDeleteDebate={handleDeleteDebate} />
            <ExploreView onDebateClick={handleDebateClick} onClipClick={(clipId) => { setSelectedShortId(clipId); setView('shorts'); }} searchResults={searchResults} onClearSearch={() => { setSearchResults(null); setSearchQuery(''); }} allDebates={allDebates} popularTopics={popularTopics} />
          </>
        ) : (
          <>
            <Header onNavigate={setView} onCreate={() => setView('create-debate')} onToggleNotifications={() => setShowNotifications(!showNotifications)} showNotifications={showNotifications} activeView={view} searchQuery={searchQuery} onSearchChange={handleSearchChange} onPerformSearch={performSearch} showSearchDropdown={showSearchDropdown} setShowSearchDropdown={setShowSearchDropdown} user={user} onLogout={handleLogout} allDebates={allDebates} onDeleteDebate={handleDeleteDebate} />
            
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              {allDebates.length > 0 ? (
                <div onClick={() => handleDebateClick(allDebates[featuredIndex])} className="cursor-pointer relative rounded-2xl md:rounded-[2rem] bg-app-card mb-6 md:mb-8 h-[360px] md:h-[440px] flex flex-col justify-between overflow-hidden border border-app-border hover:border-app-text-muted transition-colors">
                  <div className="absolute inset-0 transition-all duration-500 bg-app-card" />
                  <div className="relative z-10 flex-1 w-full h-full p-10 flex flex-col justify-center">
                    <div className="relative w-full h-full">
                      <AnimatePresence initial={false} custom={direction}>
                        <motion.div key={featuredIndex} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: 'spring', stiffness: 350, damping: 35 }} className="w-full h-full flex flex-col justify-between">
                          <div className="flex justify-start">
                            {allDebates[featuredIndex]?.isLive ? (
                              <div className="px-3 py-1.5 text-xs font-bold tracking-wider bg-rose-600 text-white inline-flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white"></div>LIVE NOW</div>
                            ) : allDebates[featuredIndex]?.isScheduled ? (
                              <div className="px-3 py-1 text-xs font-semibold bg-app-bg/60 border border-app-border rounded text-app-text-primary inline-flex items-center gap-2 backdrop-blur-md"><div className="w-1.5 h-1.5 rounded-full bg-app-text-muted"></div>{allDebates[featuredIndex]?.started || 'Scheduled'}</div>
                            ) : null}
                          </div>
                          <div className="mt-auto pb-4">
                            <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-app-text-primary mb-4 leading-tight text-balance max-w-4xl">{allDebates[featuredIndex]?.title}</h1>
                            <h2 className="text-2xl text-app-text-secondary mb-8 font-medium tracking-wide">{allDebates[featuredIndex]?.subtitle || allDebates[featuredIndex]?.description || ''}</h2>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-app-bg/50 border border-app-border backdrop-blur-md shadow-sm"><Eye size={14} className="text-app-text-muted" /><span className="text-xs text-app-text-secondary font-medium tracking-wide">{allDebates[featuredIndex]?.watching || '0'}</span></div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <div className="absolute bottom-6 md:bottom-10 right-6 md:right-10 z-20 flex items-center gap-2 md:gap-3 text-app-text-primary">
                      <button onClick={(e) => { e.stopPropagation(); prevFeatured(); }} className="hover:opacity-80 text-app-text-secondary transition-all hover:scale-105 active:scale-95 bg-app-bg/50 p-2 md:p-3 rounded-full backdrop-blur-md border border-app-border"><ChevronLeft size={20} className="md:w-6 md:h-6" /></button>
                      <button onClick={(e) => { e.stopPropagation(); nextFeatured(); }} className="hover:opacity-80 text-app-text-secondary transition-all hover:scale-105 active:scale-95 bg-app-bg/50 p-2 md:p-3 rounded-full backdrop-blur-md border border-app-border"><ChevronRight size={20} className="md:w-6 md:h-6" /></button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[360px] md:h-[440px] bg-app-card rounded-[2rem] border border-app-border mb-8 text-center p-8">
                  <h2 className="text-2xl font-bold text-app-text-primary mb-2">Welcome to the Arena</h2>
                  <p className="text-app-text-secondary mb-6 max-w-md">There are no debates happening right now. Be the first to start a conversation.</p>
                  <button onClick={() => setView('create-debate')} className="px-6 py-2 bg-app-text-primary text-app-bg font-bold rounded-full text-sm uppercase tracking-widest hover:opacity-90">Start a Debate</button>
                </div>
              )}

              <div ref={scrollRef} onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} className={`flex items-center gap-2 md:gap-3 mb-6 md:mb-10 w-full overflow-x-auto pb-2 scrollbar-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
                {activeCategories.map((cat, i) => (
                  <button key={i} className={`px-8 md:px-12 py-2 md:py-2.5 rounded-full border text-xs md:text-sm transition-colors whitespace-nowrap ${selectedCategory === cat ? 'bg-app-text-primary text-app-bg border-app-text-primary font-semibold' : 'border-app-border text-app-text-secondary hover:bg-app-card hover:text-app-text-primary'}`} onClick={(e) => { if (dragMoved) e.preventDefault(); else setSelectedCategory(cat); }}>{cat}</button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedDebates.map((debate, i) => (
                  <div key={i} className="group cursor-pointer" onClick={() => handleDebateClick(debate)}>
                    <div className="w-full h-48 rounded-xl bg-app-card mb-4 relative overflow-hidden flex flex-col justify-between p-4 border border-app-border group-hover:border-app-text-muted transition-colors">
                      <div className="flex items-center justify-between w-full">
                        {debate.isLive ? <div className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-rose-600 text-white inline-flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-white"></div>LIVE NOW</div> : debate.isScheduled ? <div className="px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-app-bg/60 border border-app-border rounded text-app-text-primary inline-flex items-center gap-2 backdrop-blur-sm"><div className="w-1 h-1 rounded-full bg-app-text-muted"></div>{debate.started}</div> : <div />}
                      </div>
                      <div className="flex justify-start"><div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-app-bg/60 backdrop-blur-sm"><Eye size={12} className="text-app-text-muted" /><span className="text-xs text-app-text-secondary font-medium">{debate.watching} {debate.isScheduled ? 'waiting' : 'watching'}</span></div></div>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-lg leading-snug text-app-text-primary mb-1.5 tracking-tight group-hover:opacity-80 transition-opacity text-balance flex-1">{debate.title}</h3>
                      <DebateCardMenu debate={debate} />
                    </div>
                    <div className="text-[13px] text-app-text-muted mb-3.5 flex items-center gap-2 font-medium">
                      <span className={debate.isLive ? 'text-app-text-primary' : ''}>{debate.isScheduled ? 'Upcoming' : debate.started}</span>
                      <span className="text-app-text-muted/40">•</span>
                      <span>{debate.watching} {debate.isScheduled ? 'waiting' : 'watching'}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {debate.tags.map((tag, j) => (
                        <span key={j} className="text-[11px] font-medium tracking-wide text-app-text-muted px-3 py-1 rounded-full border border-app-border bg-app-surface">#{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
      
      {view === 'home' && (
        <div className="hidden lg:block">
          <RightSidebar userProfile={user} />
        </div>
      )}
      
      <MobileNav activeView={view} onNavigate={setView} onCreate={() => setView('create-debate')} userProfile={user} />
    </div>
  );
}