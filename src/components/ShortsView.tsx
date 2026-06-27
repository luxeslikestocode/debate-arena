import React, { useState, useEffect, useRef, MouseEvent, TouchEvent, FormEvent } from 'react';
import { 
  Heart, 
  MessageCircle, 
  RotateCw, 
  Repeat,
  Bookmark, 
  MoreHorizontal, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  Send, 
  Check, 
  Copy, 
  AlertCircle,
  Subtitles,
  Twitter,
  Award,
  Zap,
  Flame,
  CheckCircle2,
  Lock,
  User,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmationModal } from './ui/ConfirmationModal';

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
};

// Thematic, super engaging shorts database keeping it completely in-bounds and realistic
interface ShortItem {
  id: number;
  title: string;
  duration: string;
  views: string;
  creator: string;
  handle: string;
  topic: string;
  likes: number;
  reposts: number;
  bookmarks: number;
  commentsCount: number;
  tags: string[];
  gradientFrom: string;
  gradientTo: string;
  captions: { time: number; text: string }[];
  comments: { id: number; author: string; handle: string; text: string; time: string; likes: number }[];
}

const SHORTS_DATA: ShortItem[] = [];

export function ShortsView({ 
  initialShortId,
  theme = 'dark',
  onBack 
}: { 
  initialShortId?: number;
  theme?: 'dark' | 'light';
  onBack?: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const variants = {
    enter: (dir: number) => ({ y: dir > 0 ? "100%" : "-100%" }),
    center: { y: 0 },
    exit: (dir: number) => ({ y: dir > 0 ? "-100%" : "100%" }),
  };
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showShareToast, setShowShareToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [repostSpinShortId, setRepostSpinShortId] = useState<number | null>(null);
  const [repostConfetti, setRepostConfetti] = useState<{ id: number; angle: number; distance: number; width: number; height: number }[]>([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showCaptions, setShowCaptions] = useState(true);
  const [autoScrollNext, setAutoScrollNext] = useState(true);

  // Reaction States per Short ID
  const [likedShorts, setLikedShorts] = useState<Record<number, boolean>>({});
  const [repostedShorts, setRepostedShorts] = useState<Record<number, boolean>>({});
  const [favoritedShorts, setFavoritedShorts] = useState<Record<number, boolean>>({});
  const [followedCreators, setFollowedCreators] = useState<Record<string, boolean>>({});
  const [shortLikes, setShortLikes] = useState<Record<number, number>>({});
  const [shortReposts, setShortReposts] = useState<Record<number, number>>({});
  const [shortBookmarks, setShortBookmarks] = useState<Record<number, number>>({});
  
  // Comments database state
  const [shortsComments, setShortsComments] = useState<Record<number, ShortItem['comments']>>({});

  // Dynamic heart taps array (for spawn double-tap hearts)
  const [doubleTapHearts, setDoubleTapHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  const activeShort = SHORTS_DATA[activeIndex] || null;

  // Sync to initial short index if provided
  useEffect(() => {
    if (initialShortId && SHORTS_DATA.length > 0) {
      const idx = SHORTS_DATA.findIndex(s => s.id === initialShortId);
      if (idx !== -1) {
        setActiveIndex(idx);
      }
    }
  }, [initialShortId]);

  // Audio equalizer bars
  const [waveformHeight, setWaveformHeight] = useState<number[]>(new Array(16).fill(15));

  // Initialize values
  useEffect(() => {
    // Populate counts based on database defaults
    const initialLikes: Record<number, number> = {};
    const initialReposts: Record<number, number> = {};
    const initialBookmarks: Record<number, number> = {};
    const initialComments: Record<number, ShortItem['comments']> = {};

    SHORTS_DATA.forEach(s => {
      initialLikes[s.id] = s.likes;
      initialReposts[s.id] = s.reposts;
      initialBookmarks[s.id] = s.bookmarks;
      initialComments[s.id] = s.comments;
    });

    setShortLikes(prev => ({ ...initialLikes, ...prev }));
    setShortReposts(prev => ({ ...initialReposts, ...prev }));
    setShortBookmarks(prev => ({ ...initialBookmarks, ...prev }));
    setShortsComments(prev => ({ ...initialComments, ...prev }));
  }, []);

  const lastWheelTimeRef = useRef<number>(0);

  // Keyboard navigation & space triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          setIsPlaying(prev => !prev);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  // Mouse wheel scrolling navigation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // If comments drawer or other panel is open, ignore wheel events inside it
      const commentsDrawer = document.querySelector('.comments-drawer');
      if (commentsDrawer && commentsDrawer.contains(e.target as Node)) {
        return; 
      }
      const optionsModal = document.querySelector('.options-modal');
      if (optionsModal && optionsModal.contains(e.target as Node)) {
        return;
      }

      const now = Date.now();
      if (now - lastWheelTimeRef.current < 700) {
        return; // 700ms cooldown threshold to avoid fast skips
      }

      if (Math.abs(e.deltaY) > 25) {
        if (e.deltaY > 0) {
          handleNext();
          lastWheelTimeRef.current = now;
        } else {
          handlePrev();
          lastWheelTimeRef.current = now;
        }
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activeIndex]);

  // Handle Play/Pause timing simulator
  const playerTimerRef = useRef<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Total parsed duration of working short
  const durationInSeconds = 45; // Simulated 45s for uniform control

  const handleScrub = (clientX: number) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const width = rect.width;
    const clickX = clientX - rect.left;
    let newProgress = (clickX / width) * 100;
    newProgress = Math.max(0, Math.min(100, newProgress));
    setProgress(newProgress);
  };

  const handleTimelineMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingProgress(true);
    handleScrub(e.clientX);
  };

  const handleTimelineTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingProgress(true);
    if (e.touches[0]) {
      handleScrub(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDraggingProgress) {
        handleScrub(e.clientX);
      }
    };

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (isDraggingProgress && e.touches[0]) {
        handleScrub(e.touches[0].clientX);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingProgress) {
        setIsDraggingProgress(false);
      }
    };

    if (isDraggingProgress) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingProgress]);

  useEffect(() => {
    if (isPlaying && !isDraggingProgress) {
      playerTimerRef.current = window.setInterval(() => {
        setProgress(prev => {
          const next = prev + (100 / (durationInSeconds * 10)); // updates 10 times a sec
          if (next >= 100) {
            handlePlaybackFinished();
            return 0;
          }
          return next;
        });

        // Set simulated audio waveform bouncing levels
        setWaveformHeight(() => 
          new Array(16).fill(0).map(() => Math.floor(Math.random() * 25) + 6)
        );
      }, 100);
    } else {
      if (playerTimerRef.current) {
        clearInterval(playerTimerRef.current);
      }
      setWaveformHeight(new Array(16).fill(8));
    }

    return () => {
      if (playerTimerRef.current) {
        clearInterval(playerTimerRef.current);
      }
    };
  }, [isPlaying, activeIndex, isDraggingProgress]);

  // Reset progress and timer state when activeIndex shifts
  useEffect(() => {
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
    setShowComments(false);
    setShowOptionsModal(false);
  }, [activeIndex]);

  // Convert progress percentage to actual display seconds
  useEffect(() => {
    const calculatedSecs = Math.floor((progress / 100) * durationInSeconds);
    setCurrentTime(calculatedSecs);
  }, [progress]);

  const handlePlaybackFinished = () => {
    if (autoScrollNext) {
      handleNext();
    } else {
      setProgress(0);
    }
  };

  const handleNext = () => {
    setDirection(1);
    if (activeIndex < SHORTS_DATA.length - 1) {
      setActiveIndex(prev => prev + 1);
    } else {
      // Loop back to start represent standard infinite scrolling
      setActiveIndex(0);
    }
  };

  const handlePrev = () => {
    setDirection(-1);
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    } else {
      setActiveIndex(SHORTS_DATA.length - 1);
    }
  };

  // Double tap to like feature
  const handlePlayerDoubleTap = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Spawn double tap heart asset
    const newHeartId = Date.now();
    setDoubleTapHearts(prev => [...prev, { id: newHeartId, x, y }]);

    // Trigger like
    const shortId = activeShort.id;
    if (!likedShorts[shortId]) {
      setLikedShorts(prev => ({ ...prev, [shortId]: true }));
      setShortLikes(prev => ({ ...prev, [shortId]: (prev[shortId] || 0) + 1 }));
    }

    // Auto cleanup heart item
    setTimeout(() => {
      setDoubleTapHearts(prev => prev.filter(h => h.id !== newHeartId));
    }, 1000);
  };

  const handleLikeToggle = () => {
    const shortId = activeShort.id;
    const hasLiked = likedShorts[shortId] || false;
    setLikedShorts(prev => ({ ...prev, [shortId]: !hasLiked }));
    setShortLikes(prev => ({
      ...prev,
      [shortId]: hasLiked ? (prev[shortId] || 1) - 1 : (prev[shortId] || 0) + 1
    }));
  };

  const spawnConfetti = () => {
    const particles = Array.from({ length: 8 }).map((_, i) => {
      const angle = i * 45; // 8 symmetric directions
      const distance = 25; // short distance out from the center
      return {
        id: Math.random() + i,
        angle,
        distance,
        width: 1.5,
        height: 6
      };
    });
    setRepostConfetti(particles);
    setTimeout(() => {
      setRepostConfetti([]);
    }, 600);
  };

  const handleRepostToggle = () => {
    const shortId = activeShort.id;
    const hasReposted = repostedShorts[shortId] || false;
    
    // Set active spin state so the button rotates
    setRepostSpinShortId(shortId);
    setTimeout(() => {
      setRepostSpinShortId(null);
    }, 600);

    if (!hasReposted) {
      spawnConfetti();
    }

    setRepostedShorts(prev => ({ ...prev, [shortId]: !hasReposted }));
    setShortReposts(prev => ({
      ...prev,
      [shortId]: hasReposted ? (prev[shortId] || 1) - 1 : (prev[shortId] || 0) + 1
    }));
  };

  const handleFavoriteToggle = () => {
    const shortId = activeShort.id;
    const isFav = favoritedShorts[shortId] || false;
    setFavoritedShorts(prev => ({ ...prev, [shortId]: !isFav }));
    setShortBookmarks(prev => ({
      ...prev,
      [shortId]: isFav ? (prev[shortId] || 1) - 1 : (prev[shortId] || 0) + 1
    }));
    triggerToast(isFav ? 'Removed from favorites' : 'Added to curated favorites');
  };

  const triggerToast = (msg: string) => {
    // Toast functionality removed
  };

  const handleCopyLink = () => {
    const url = `https://debate.com/shorts/${activeShort.id}`;
    navigator.clipboard.writeText(url).then(() => {
      // Toast removed
      setShowOptionsModal(false);
    });
  };

  const handleAddComment = (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const shortId = activeShort.id;
    const customUserComment = {
      id: Date.now(),
      author: 'Alex Rivera',
      handle: '@arivera_pro',
      text: newComment,
      time: 'Just now',
      likes: 0
    };

    setShortsComments(prev => ({
      ...prev,
      [shortId]: [customUserComment, ...(prev[shortId] || [])]
    }));
    setNewComment('');
  };

  // Find the matching captions for the active timestamp
  const getActiveCaptionText = () => {
    if (!showCaptions || !activeShort) return '';
    const items = activeShort.captions;
    let matchingText = items[0]?.text || '';
    for (let i = 0; i < items.length; i++) {
      if (currentTime >= items[i].time) {
        matchingText = items[i].text;
      }
    }
    return matchingText;
  };

  const activeComments = activeShort ? (shortsComments[activeShort.id] || []) : [];

  if (!activeShort) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative overflow-hidden px-4">
        <h2 className="text-xl font-bold text-app-text-primary mb-2">No Shorts Available</h2>
        <p className="text-app-text-muted">There are no shorts to display right now.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-app-bg relative overflow-hidden px-0 sm:px-4">
      
      {/* Header Back Link & Navigation top overlay */}
      <div className="absolute top-6 left-6 z-40 flex items-center gap-4">
      </div>

      {/* Vertical Arrows navigation assist right-next-to player for super accessibility */}
        <div className="absolute right-8 hidden xl:flex flex-col gap-4 z-30 top-1/2 -translate-y-1/2">
        <button 
          onClick={handlePrev}
          title="Previous short (Arrow Up)"
          className="w-12 h-12 rounded-full border border-app-border hover:border-app-text-muted bg-app-bg/60 hover:bg-app-card text-app-text-secondary hover:text-app-text-primary backdrop-blur-md shadow-lg transition-all flex items-center justify-center active:scale-90"
        >
          <ArrowUp size={22} />
        </button>
        <button 
          onClick={handleNext}
          title="Next short (Arrow Down)"
          className="w-12 h-12 rounded-full border border-app-border hover:border-app-text-muted bg-app-bg/60 hover:bg-app-card text-app-text-secondary hover:text-app-text-primary backdrop-blur-md shadow-lg transition-all flex items-center justify-center active:scale-90"
        >
          <ArrowDown size={22} />
        </button>
      </div>

      {/* Primary Vertical Short container - strictly honoring a beautiful 9:16 aspect constraint */}
      <div className="relative w-full sm:max-w-[420px] h-full sm:h-[calc(100vh-100px)] sm:max-h-[800px] flex items-center justify-center z-10">
        
        {/* The 9:16 Container itself */}
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", ease: "easeInOut", duration: 0.5 }}
            className="w-full h-full"
          >
            <div 
              onClick={(e) => {
                // Prevent toggles when interacting with action wrappers
                if ((e.target as HTMLElement).closest('.player-action-stop')) return;
                setIsPlaying(prev => !prev);
              }}
              onDoubleClick={handlePlayerDoubleTap}
              className="relative w-full h-full rounded-none sm:rounded-[2.5rem] overflow-hidden border-x sm:border border-app-border flex flex-col justify-between cursor-pointer select-none group bg-app-surface"
            >
          {/* Subtle noise pattern overlay - REMOVED */}

          {/* Double Tap Heart assets layer */}
          <div className="absolute inset-0 pointer-events-none z-[12] overflow-hidden">
            <AnimatePresence>
              {doubleTapHearts.map(heart => (
                <motion.div
                  key={heart.id}
                  initial={{ opacity: 0, scale: 0.3, x: heart.x, y: heart.y }}
                  animate={{ 
                    opacity: [0, 1, 1, 0], 
                    scale: [0.3, 1.6, 1.4, 0.8], 
                    y: heart.y - 120,
                    rotate: [-15, 15, -10, 0] 
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute pointer-events-none text-red-500 drop-shadow-lg"
                  style={{ transform: 'translate(-50%, -50%)' }}
                >
                  <Heart size={82} className="fill-red-500 stroke-red-600" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Player controls overlays (Play / Pause icons popping) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <AnimatePresence mode="wait">
              {!isPlaying && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  className="w-16 h-16 rounded-full bg-app-bg/40 backdrop-blur-md border border-app-border flex items-center justify-center text-app-text-primary"
                >
                  <Play size={28} className="fill-app-text-primary translate-x-0.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* TOP BUFFER OVERLAY */}
          <div className="relative z-10 w-full p-6" />

          {/* LOWER CONTENT & METADATA OVERLAYS */}
          <div className="relative z-10 w-full p-6 pb-6 pr-14 sm:pr-6 bg-transparent flex flex-col justify-end gap-3.5">
            
            {/* Live Interactive Captions Track Box - COMMETED OUT PER USER REQUEST */}
            {/*
            <AnimatePresence mode="wait">
              {showCaptions && (
                <motion.div
                  key={currentTime} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-4 py-2 rounded-xl bg-app-bg/60 shadow-lg pointer-events-none text-center mx-auto max-w-[90%] mb-1.5"
                >
                  <p className="text-app-text-primary text-[14px] md:text-[15px] font-semibold leading-relaxed tracking-wide select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                    {getActiveCaptionText()}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            */}

            {/* Profile Avatar / follow block */}
            <div className="flex items-center gap-3 player-action-stop">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-200 font-mono">
                  <User size={20} className="text-neutral-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border border-black flex items-center justify-center text-black">
                  <Check size={8} strokeWidth={4} />
                </div>
              </div>
              <div className="text-left flex-1 min-w-0">
                <h4 className="text-[14px] font-bold text-white flex items-center gap-1.5 select-none hover:underline">
                  {activeShort.creator}
                  <CheckCircle2 size={13} className="text-white fill-white/20" />
                </h4>
                <p className="text-[12px] text-neutral-400 tracking-wide font-mono select-all leading-none">{activeShort.handle}</p>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setFollowedCreators(prev => ({ 
                    ...prev, 
                    [activeShort.creator]: !prev[activeShort.creator] 
                  }));
                }}
                className={`px-3 py-1 font-bold uppercase tracking-wider rounded-md text-[10px] transition-colors ${
                  followedCreators[activeShort.creator] 
                    ? 'bg-white/10 text-neutral-300 border border-white/20' 
                    : 'bg-white text-black hover:bg-neutral-200'
                }`}
              >
                {followedCreators[activeShort.creator] ? 'Following' : 'Follow'}
              </button>
            </div>

            {/* Title text */}
            <div className="text-left">
              <p className="text-[14px] font-semibold text-white/95 leading-snug tracking-tight mb-2 select-text">
                {activeShort.title}
              </p>
              
              {/* Category tags */}
              <div className="flex flex-wrap gap-2 pt-1.5 player-action-stop">
                {activeShort.tags.map((tg, i) => (
                  <span 
                    key={i} 
                    className="text-[11px] font-medium text-white/70 hover:text-white transition-colors"
                  >
                    #{tg.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* SCRUB / PROGRESS PROGRESSIVE TIMELINE */}
            <div 
              ref={timelineRef}
              onMouseDown={handleTimelineMouseDown}
              onTouchStart={handleTimelineTouchStart}
              className="absolute bottom-0 inset-x-0 h-6 flex items-center group/scrub cursor-pointer z-35 player-action-stop select-none"
            >
              <div className="w-full h-[3px] bg-app-text-primary/20 rounded-full relative transition-all group-hover/scrub:h-[5px]">
                <div 
                  className="h-full bg-app-text-primary rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Circular handle knob on end of progress */}
                  <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-app-text-primary rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.5)] transition-transform scale-100 group-hover/scrub:scale-125 cursor-grab active:cursor-grabbing" />
                </div>
              </div>
            </div>

          </div>

        </div>

        </motion.div>
      </AnimatePresence>

        {/* FLOATING ACTION OVERRIDES (Like, Comment, Repost, Favorite, Share, options dots) - clean, naked right overlay rail */}
        <div className="absolute bottom-28 sm:bottom-16 right-4 sm:-right-[72px] flex flex-col items-center gap-6 z-40 player-action-stop bg-app-bg/10 sm:bg-transparent p-2 sm:p-0 rounded-2xl backdrop-blur-sm sm:backdrop-blur-none transition-all">
          
          {/* LIKES */}
          <div className="flex flex-col items-center cursor-pointer group/action">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleLikeToggle();
              }}
              className={`flex items-center justify-center transition-all duration-200 group-hover/action:scale-110 active:scale-95 ${
                likedShorts[activeShort.id] ? 'text-red-500' : 'text-white'
              }`}
            >
              <Heart size={30} className={likedShorts[activeShort.id] ? 'fill-red-500' : ''} />
            </button>
            <span className="text-[12px] font-semibold text-white mt-1 select-none">
              {formatCount(shortLikes[activeShort.id] || activeShort.likes)}
            </span>
          </div>

          {/* CURATED COMMENTS */}
          <div className="flex flex-col items-center cursor-pointer group/action">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(true);
              }}
              className="text-white hover:text-neutral-200 flex items-center justify-center transition-all duration-200 group-hover/action:scale-110 active:scale-95"
            >
              <MessageCircle size={30} />
            </button>
            <span className="text-[12px] font-semibold text-white mt-1 select-none">
              {formatCount(activeComments.length)}
            </span>
          </div>

          {/* REPOST */}
          <div className="flex flex-col items-center cursor-pointer group/action">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleRepostToggle();
              }}
              className="relative flex items-center justify-center transition-all duration-200 group-hover/action:scale-110 active:scale-95 text-white"
            >
              {/* Spinning wrapper */}
              <div                
                key={activeShort.id}
                className="relative flex items-center justify-center"
              >
                <Repeat size={30} />
                <AnimatePresence>
                  {repostedShorts[activeShort.id] && (
                    <motion.div 
                      key="checked"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Check size={11} strokeWidth={4.5} className="text-white translate-y-[0.5px]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* CONFETTI BURST EXPLOSION */}
              <AnimatePresence>
                {repostConfetti.map((particle) => {
                  const rad = (particle.angle * Math.PI) / 180;
                  const startX = Math.cos(rad) * 15;
                  const startY = Math.sin(rad) * 15;
                  const targetX = Math.cos(rad) * (15 + particle.distance);
                  const targetY = Math.sin(rad) * (15 + particle.distance);

                  return (
                    <motion.div
                      key={particle.id}
                      initial={{ 
                        x: startX, 
                        y: startY, 
                        scaleY: 0.5, 
                        opacity: 1 
                      }}
                      animate={{ 
                        x: targetX, 
                        y: targetY, 
                        scaleY: [0.5, 1, 0.2], 
                        opacity: [1, 1, 0] 
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="absolute pointer-events-none rounded-full bg-white"
                      style={{
                        width: particle.width,
                        height: particle.height,
                        left: `calc(50% - ${particle.width / 2}px)`,
                        top: `calc(50% - ${particle.height / 2}px)`,
                        transform: `rotate(${particle.angle + 90}deg)`,
                        transformOrigin: "center center",
                        boxShadow: "0 0 3px rgba(255, 255, 255, 0.9)",
                        zIndex: 50,
                      }}
                    />
                  );
                })}
              </AnimatePresence>
            </button>
            <span className="text-[12px] font-semibold text-white mt-1 select-none">
              {formatCount(shortReposts[activeShort.id] || activeShort.reposts)}
            </span>
          </div>

          {/* SHARE */}
          <div className="flex flex-col items-center cursor-pointer group/action">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowShareToast(true);
              }}
              className="text-white hover:text-neutral-200 flex items-center justify-center transition-all duration-200 group-hover/action:scale-110 active:scale-95"
              title="Share"
            >
              <Send size={28} className="-rotate-12 translate-x-[-1px] translate-y-[1px]" />
            </button>
          </div>

          {/* CURATED FAVORITES */}
          <div className="flex flex-col items-center cursor-pointer group/action">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleFavoriteToggle();
              }}
              className={`flex items-center justify-center transition-all duration-200 group-hover/action:scale-110 active:scale-95 ${
                favoritedShorts[activeShort.id] ? 'text-amber-400' : 'text-white'
              }`}
            >
              <Bookmark size={30} className={favoritedShorts[activeShort.id] ? 'fill-amber-400' : ''} />
            </button>
          </div>

          {/* MORE OPTIONS (Three dots) */}
          <div className="flex flex-col items-center cursor-pointer group/action">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowOptionsModal(true);
              }}
              className="text-white hover:text-neutral-200 flex items-center justify-center transition-all duration-200 group-hover/action:scale-110 active:scale-95"
            >
              <MoreHorizontal size={30} />
            </button>
          </div>

          {/* REALTIME ROTATING MUSIC LP RECORD */}
          <div className="flex flex-col items-center mt-1 select-none pointer-events-none">
            <div className={`w-9 h-9 rounded-full bg-neutral-950 border border-white/25 flex items-center justify-center shadow-lg overflow-hidden ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
              <div className="w-3.5 h-3.5 rounded-full bg-neutral-800 border border-black flex items-center justify-center text-neutral-400">
                <User size={10} />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* REACTION SIDE PANEL DRAWER FOR COMMENTS */}
      <AnimatePresence>
        {showComments && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center sm:relative sm:z-auto sm:items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowComments(false)}
              className="absolute inset-0 bg-app-bg/60 backdrop-blur-sm sm:hidden"
            />
            <motion.div 
              initial={{ y: "100%", x: 0 }}
              animate={{ y: 0, x: 0 }}
              exit={{ y: "100%", x: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[420px] h-[75vh] sm:h-full sm:max-w-none sm:w-[380px] sm:fixed sm:top-0 sm:right-0 sm:mt-0 bg-app-bg border-t sm:border-t-0 sm:border-l border-app-border rounded-t-[2.5rem] sm:rounded-none overflow-hidden z-[120] flex flex-col shadow-2xl"
            >
              {/* Comments Header */}
              <div className="p-6 border-b border-app-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-app-text-primary">Discourse</h3>
                  <span className="text-[10px] font-black bg-app-surface px-2 py-0.5 rounded text-app-text-muted uppercase tracking-widest">{activeComments.length}</span>
                </div>
                <button 
                  onClick={() => setShowComments(false)}
                  className="p-2 -mr-2 text-app-text-muted hover:text-app-text-primary transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 scrollbar-none">
                {activeComments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-muted mb-4">
                       <MessageCircle size={24} />
                    </div>
                    <p className="text-sm font-bold text-app-text-primary mb-1">No discourse yet</p>
                    <p className="text-xs text-app-text-muted">Be the first to challenge this perspective.</p>
                  </div>
                ) : (
                  activeComments.map((c) => (
                    <div key={c.id} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-app-text-secondary">{c.author}</span>
                        <span className="text-[10px] text-app-text-muted font-mono">{c.time}</span>
                      </div>
                      <p className="text-[13px] text-app-text-primary leading-relaxed">{c.text}</p>
                      <div className="flex items-center gap-4 mt-3">
                         <button className="flex items-center gap-1.5 text-[10px] font-bold text-app-text-muted hover:text-app-text-primary transition-colors">
                           <Heart size={12} /> {formatCount(c.likes)}
                         </button>
                         <button className="text-[10px] font-bold text-app-text-muted hover:text-app-text-primary transition-colors text-balance">Reply</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input Container */}
              <div className="p-6 border-t border-app-border bg-app-bg">
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Contribute to the discussion..." 
                    className="flex-1 bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text-primary focus:outline-none placeholder:text-app-text-muted transition-all focus:border-app-text-primary/20"
                  />
                  <button 
                    type="submit"
                    disabled={!newComment.trim()}
                    className="w-12 h-12 flex items-center justify-center bg-app-text-primary text-app-bg rounded-xl disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OPTIONS MODAL OVERLAY */}
      <AnimatePresence>
        {showOptionsModal && (
          <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOptionsModal(false)}
              className="absolute inset-0 bg-app-bg/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[320px] bg-app-card border border-app-border rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl p-2"
            >
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary rounded-2xl transition-colors">
                  <RotateCw size={18} />
                  <span>Not interested</span>
              </button>
              <button 
                onClick={() => { setShowReportModal(true); setShowOptionsModal(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-colors"
              >
                  <AlertCircle size={18} />
                  <span>Report content</span>
              </button>
              <button 
                onClick={() => { setShowBlockModal(true); setShowOptionsModal(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-colors"
              >
                  <X size={18} />
                  <span>Block {activeShort.creator}</span>
              </button>
              <div className="h-px bg-app-border my-1 mx-2" />
              <button 
                onClick={() => setShowOptionsModal(false)}
                className="w-full text-center py-3 text-sm font-bold text-app-text-primary hover:bg-app-surface rounded-2xl transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARE MODAL OVERLAY */}
      <AnimatePresence>
        {showShareToast && (
          <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareToast(false)}
              className="absolute inset-0 bg-app-bg/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-md bg-app-bg border-t sm:border border-app-border rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-app-text-primary">Share Debate</h3>
                  <button 
                    onClick={() => setShowShareToast(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-app-surface text-app-text-muted hover:text-app-text-primary transition-colors"
                  >
                    ✕
                  </button>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Copy Link', icon: Copy, action: handleCopyLink },
                    { label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-500' },
                    { label: 'Messages', icon: Send, color: 'text-blue-500' },
                    { label: 'X', icon: Twitter, color: 'text-app-text-primary' },
                  ].map((item, i) => (
                    <button 
                      key={i}
                      onClick={item.action || (() => setShowShareToast(false))}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-app-surface border border-app-border flex items-center justify-center group-hover:bg-app-card transition-all ${item.color || 'text-app-text-primary'}`}>
                        <item.icon size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-app-text-muted group-hover:text-app-text-primary transition-colors">{item.label}</span>
                    </button>
                  ))}
              </div>

              <div className="bg-app-surface border border-app-border p-4 rounded-2xl flex items-center justify-between">
                  <span className="text-xs text-app-text-muted truncate mr-4">debate.com/shorts/{activeShort.id}</span>
                  <button 
                    onClick={handleCopyLink}
                    className="text-xs font-bold text-app-text-primary whitespace-nowrap hover:underline"
                  >
                    Copy
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      <ConfirmationModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onConfirm={() => {
          console.log(`Reported content from ${activeShort.creator}`);
        }}
        title="Report this short?"
        description="Let us know why you're reporting this content. Our moderation team will review it within 24 hours."
        confirmLabel="Report"
        confirmVariant="danger"
        icon="report"
      />

      <ConfirmationModal 
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={() => {
          console.log(`Blocked ${activeShort.creator}`);
        }}
        title={`Block ${activeShort.creator}?`}
        description="You will stop seeing shorts and debates from this creator across the entire platform. This action is reversible in your profile settings."
        confirmLabel="Block"
        confirmVariant="danger"
        icon="block"
      />
    </div>
  );
}
