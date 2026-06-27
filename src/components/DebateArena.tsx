import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hand, Smile, Mic, MicOff, Send, 
  CheckCircle2, ChevronLeft, Eye, BadgeCheck, User, MessageSquare, Clock, Share2, X, Users, UserPlus, PlayCircle, ShieldCheck,
  Video, VideoOff, Bookmark, Menu, Trash, Volume2, VolumeX, Crown, Gavel, Timer, Pause, RotateCcw, Square, XCircle
} from 'lucide-react';
import { Speaker, User as AppUser } from '../types';
import { useAuth } from '../lib/auth';
import { useWebRTC } from '../hooks/useWebRTC';
import { formatTime } from '../utils/helpers';

const initialSpeakers: Speaker[] = [];

interface DebateArenaProps {
  debate: any;
  onBack: () => void;
}

function VideoStream({ stream, muted = false }: { stream: MediaStream; muted?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className="w-full h-full object-cover"
    />
  );
}

function AudioStream({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);
  
  return <audio ref={audioRef} autoPlay className="hidden" />;
}

export function DebateArena({ debate, onBack }: DebateArenaProps) {
  const { user, updateUser } = useAuth();
  const [activeMobileView, setActiveMobileView] = useState<'arena' | 'chat' | 'queue'>('arena');
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>(initialSpeakers);
  const [queue, setQueue] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [showQueuePanel, setShowQueuePanel] = useState(false);
  const [showMoreHeaderMenu, setShowMoreHeaderMenu] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  
  const [supportStats, setSupportStats] = useState({ with: 62, against: 38 });
  const [userSupport, setUserSupport] = useState<'with' | 'against' | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number; rot: number }[]>([]);
  const [nextEmojiId, setNextEmojiId] = useState(0);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [currentRound, setCurrentRound] = useState('Opening Statements');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(300);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const debateId = debate?.id || 'default_debate';
  const roomId = `debate_${debateId}`;

  // Determine if current user is a speaker
  const localUserIsSpeaker = speakers.some(s => s.uid && s.uid === user?.id);

  // WebRTC Hook
  const {
    connectionState,
    localStream,
    remoteStreams,
    startLocalStream,
    stopLocalStream,
    toggleMute,
    toggleCamera,
    sendChat,
    sendReaction,
    sendHostAction,
    requestToSpeak,
    cancelSpeakRequest,
    updateUserState,
  } = useWebRTC({
    debateId,
    user: user!,
    isHost,
    isSpeaker: localUserIsSpeaker,
    onUserJoined: (newUser) => {
      setSpeakers(prev => {
        if (prev.some(s => s.id === newUser.id)) return prev;
        return [...prev, { 
          id: newUser.id, 
          name: newUser.name, 
          role: newUser.role === 'host' ? 'Host' : newUser.role === 'speaker' ? 'Speaker' : 'Viewer',
          isSpeaking: false,
          uid: newUser.id,
          isMuted: newUser.isMuted,
          isCameraOn: newUser.isCameraOn,
        }];
      });
    },
    onUserLeft: (userId) => {
      setSpeakers(prev => prev.filter(s => s.id !== userId));
      setQueue(prev => prev.filter(u => u.id !== userId));
    },
    onUserUpdated: (userId, updates) => {
      setSpeakers(prev => prev.map(s => 
        s.id === userId ? { ...s, ...updates } : s
      ));
      setQueue(prev => prev.map(u => 
        u.id === userId ? { ...u, ...updates } : u
      ));
    },
    onSpeakerUpdate: (newSpeakers) => {
      setSpeakers(newSpeakers.map((s: any) => ({
        id: s.id,
        name: s.name,
        role: s.role === 'host' ? 'Host' : s.role === 'speaker' ? 'Speaker' : 'Viewer',
        isSpeaking: s.isSpeaking || false,
        uid: s.id,
        isMuted: s.isMuted,
        isCameraOn: s.isCameraOn,
      })));
    },
    onQueueUpdate: (newQueue) => {
      setQueue(newQueue);
      const userInQueue = newQueue.find((u: any) => u.id === user?.id);
      setIsInQueue(!!userInQueue);
    },
    onTimerUpdate: (timer) => {
      setTimeLeft(timer.remaining);
      setCurrentRound(timer.currentRound);
      setTimerRunning(timer.isRunning);
      setTimerDuration(timer.duration);
    },
    onChatMessage: (message) => {
      setChatMessages(prev => [...prev, message]);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
    onReaction: (reaction) => {
      triggerReaction(reaction.emoji);
    },
    onHostAction: (action) => {
      if (action.action === 'end-debate') {
        alert('Debate has ended!');
        onBack();
      }
    },
    onError: (error) => {
      console.error('WebRTC Error:', error);
    },
  });

  // Check if current user is host
  useEffect(() => {
    if (user && debate?.creatorId) {
      setIsHost(debate.creatorId === user.id);
    }
  }, [debate?.creatorId, user]);

  // Timer effect
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  // Start local stream when user becomes speaker
  useEffect(() => {
    if (localUserIsSpeaker && !localStream) {
      startLocalStream(!debate?.isAudioOnly);
    } else if (!localUserIsSpeaker && localStream) {
      stopLocalStream();
    }
  }, [localUserIsSpeaker, localStream, debate?.isAudioOnly, startLocalStream, stopLocalStream]);

  // Play remote audio streams
  useEffect(() => {
    remoteStreams.forEach(({ stream }) => {
      const audio = new Audio();
      audio.srcObject = stream;
      audio.play().catch(console.error);
    });
  }, [remoteStreams]);

  const handleSendMessage = useCallback(() => {
    if (!chatMessage.trim()) return;
    sendChat(chatMessage.trim());
    setChatMessage('');
  }, [chatMessage, sendChat]);

  const handleSupportVote = (type: 'with' | 'against') => {
    if (userSupport) return;
    setUserSupport(type);
    setHasVoted(true);
    setSupportStats(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const triggerReaction = (emoji: string) => {
    const newId = nextEmojiId;
    setNextEmojiId(prev => prev + 1);
    const newEmoji = {
      id: newId,
      emoji,
      x: Math.random() * 100 - 50,
      rot: Math.random() * 40 - 20,
    };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    sendReaction(emoji);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newId));
    }, 2500);
  };

  const handleShare = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?debateId=${debateId}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }).catch(err => {
      console.error("Could not copy link:", err);
    });
  };

  // Host controls
  const handleMuteUser = (targetUserId: string, mute: boolean) => {
    sendHostAction(mute ? 'mute' : 'unmute', targetUserId);
  };

  const handleRemoveSpeaker = (speakerId: string) => {
    if (window.confirm('Remove this speaker from the stage?')) {
      sendHostAction('remove-speaker', speakerId);
    }
  };

  const handleAdmitSpeaker = (userId: string) => {
    sendHostAction('admit-from-queue', userId);
  };

  const handleRemoveFromQueue = (userId: string) => {
    sendHostAction('remove-from-queue', userId);
  };

  const handleStartTimer = () => {
    sendHostAction('start-timer');
  };

  const handlePauseTimer = () => {
    sendHostAction('pause-timer');
  };

  const handleResetTimer = () => {
    sendHostAction('reset-timer');
  };

  const handleSetTimer = (duration: number) => {
    sendHostAction('set-timer', undefined, { duration });
  };

  const handleSetRound = (round: string) => {
    sendHostAction('set-round', undefined, { round });
  };

  const handleEndDebate = () => {
    if (window.confirm('Are you sure you want to end this debate? This will disconnect all participants.')) {
      sendHostAction('end-debate');
    }
  };

  const handleRequestToSpeak = () => {
    if (isInQueue) {
      cancelSpeakRequest();
      setIsHandRaised(false);
    } else {
      requestToSpeak();
      setIsHandRaised(true);
    }
  };

  const handleJoinAsSpeaker = async () => {
    if (!user) return;
    sendHostAction('request-to-speak');
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-app-bg text-app-text-primary overflow-hidden font-sans">
      
      {/* Main Arena Area */}
      <div className={`flex-1 flex flex-col relative border-r border-app-border ${activeMobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Arena Header */}
        <header className="h-16 md:h-20 border-b border-app-border flex items-center justify-between px-4 md:px-8 shrink-0 bg-app-bg z-20">
          <div className="flex items-center gap-3 truncate">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 rounded hover:bg-app-card text-app-text-secondary hover:text-app-text-primary transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="truncate">
              <h1 className="text-sm md:text-lg font-bold text-app-text-primary truncate">{debate?.title || 'Live Debate'}</h1>
              <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-app-text-muted mt-0.5 font-medium flex-wrap">
                <span className="px-1.5 py-0.5 bg-app-surface border border-app-border rounded text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-app-text-muted">
                  {debate?.category || 'General'}
                </span>
                {debate?.tags && debate.tags.map((tag: string, idx: number) => (
                  <span key={idx} className="hidden sm:inline-block px-1.5 py-0.5 bg-app-surface border border-app-subtle rounded text-[8px] md:text-[10px] font-medium text-app-text-secondary">
                    #{tag}
                  </span>
                ))}
                <span className="flex items-center gap-1"><Eye size={12} /> {debate?.watching || '0'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 relative">
            <div className="px-2 md:px-3 py-1 md:py-1.5 bg-[#FF001D] text-white text-[9px] md:text-xs font-black tracking-widest rounded-sm flex items-center gap-1.5 shrink-0">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
            
            <button 
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-app-surface text-app-text-secondary hover:text-app-text-primary border border-app-border hover:bg-app-card transition-all flex items-center gap-2 shrink-0"
              title="Copy Share Link"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Share</span>
            </button>

            <div className="relative shrink-0">
              <button 
                onClick={() => setShowMoreHeaderMenu(!showMoreHeaderMenu)}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${showMoreHeaderMenu ? 'bg-app-elevated border-app-text-primary text-app-text-primary' : 'bg-app-surface border-app-border text-app-text-secondary hover:text-app-text-primary hover:bg-app-card'}`}
                title="More Options"
              >
                <Menu size={16} />
              </button>

              <AnimatePresence>
                {showMoreHeaderMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-app-card border border-app-border rounded-xl shadow-2xl overflow-hidden py-1.5 z-50 text-left"
                  >
                    <button 
                      onClick={() => { handleShare(); setShowMoreHeaderMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors text-left"
                    >
                      <Share2 size={14} />
                      <span>Copy Debate Link</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowMoreHeaderMenu(false);
                        const inviteUrl = `${window.location.origin}${window.location.pathname}?debateId=${debateId}`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Live on Debate.com: "${debate?.title || 'Live Debate'}" Join here:`)}&url=${encodeURIComponent(inviteUrl)}`, '_blank');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors text-left"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      <span>Share on X</span>
                    </button>
                    <div className="h-px bg-app-border my-1 mx-2" />
                    <button 
                      onClick={() => { setShowMoreHeaderMenu(false); setShowShareToast(true); setTimeout(() => setShowShareToast(false), 2000); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors text-left"
                    >
                      <Bookmark size={14} />
                      <span>Save to Bookmarks</span>
                    </button>
                    <button 
                      onClick={() => { setShowMoreHeaderMenu(false); alert("Thank you for your report. Our community moderators will review this debate."); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-app-text-secondary hover:bg-app-surface transition-colors text-left"
                    >
                      <ShieldCheck size={14} />
                      <span>Report Debate</span>
                    </button>
                    {isHost && (
                      <>
                        <div className="h-px bg-app-border my-1 mx-2" />
                        <button 
                          onClick={async () => {
                            setShowMoreHeaderMenu(false);
                            if (window.confirm("Are you sure you want to delete this debate?")) {
                              try {
                                const { deleteDebate } = await import('../lib/api');
                                await deleteDebate(debateId);
                                onBack();
                              } catch (err) {
                                console.error("Error deleting debate", err);
                              }
                            }
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-app-surface transition-colors text-left"
                        >
                          <Trash size={14} />
                          <span>Delete Debate</span>
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setActiveMobileView('chat')}
              className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <MessageSquare size={18} />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-none pb-32">
          
          {/* Phase & Timer */}
          <div className="flex justify-center mb-6 md:mb-10">
            <div className="flex items-center gap-4 md:gap-8 bg-app-card border border-app-border px-6 md:px-10 py-2.5 md:py-3.5 rounded-full shadow-2xl">
              <div className="hidden sm:flex flex-col">
                <span className="text-[8px] md:text-[10px] text-app-text-muted font-black uppercase tracking-[0.2em] mb-0.5">Current Round</span>
                <span className="text-xs md:text-sm font-bold text-app-text-primary uppercase tracking-tight">{currentRound}</span>
              </div>
              <div className="hidden sm:block w-px h-8 bg-app-border" />
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 md:gap-3">
                  <Clock size={16} className={timeLeft < 60 ? 'text-rose-500' : 'text-app-text-muted'} />
                  <span className={`text-xl md:text-3xl font-mono tracking-tighter ${timeLeft < 60 ? 'text-rose-500 font-black' : 'text-app-text-primary font-bold'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
              
              {/* Host Timer Controls */}
              {isHost && (
                <div className="hidden sm:flex items-center gap-2 ml-4 border-l border-app-border pl-4">
                  {!timerRunning && timeLeft === timerDuration ? (
                    <button 
                      onClick={handleStartTimer}
                      className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors flex items-center gap-1"
                    >
                      <PlayCircle size={10} /> Start
                    </button>
                  ) : timerRunning ? (
                    <>
                      <button 
                        onClick={handlePauseTimer}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-colors flex items-center gap-1"
                      >
                        <Pause size={10} /> Pause
                      </button>
                      <button 
                        onClick={handleResetTimer}
                        className="px-3 py-1.5 bg-neutral-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-neutral-700 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw size={10} /> Reset
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleStartTimer}
                      className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors flex items-center gap-1"
                    >
                      <PlayCircle size={10} /> Resume
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Active WebRTC Remote Audio Streams */}
          {remoteStreams.map(({ userId, stream }) => {
            const isStillSpeaker = speakers.some(s => s.uid === userId);
            if (!isStillSpeaker) return null;
            return (
              <React.Fragment key={`audio-${userId}`}>
                <AudioStream stream={stream} />
              </React.Fragment>
            );
          })}

          {/* Speakers Grid */}
          <motion.div 
            layout
            className={`grid grid-cols-1 sm:grid-cols-2 ${speakers.length > 4 ? 'lg:grid-cols-3' : ''} gap-4 md:gap-6 mb-8 md:mb-12`}
          >
            <AnimatePresence mode="popLayout">
              {speakers.map((speaker, idx) => {
                const isMe = speaker.uid && speaker.uid === user?.id;
                const hasCamera = isMe ? (localStream && speaker.isCameraOn) : (speaker.isCameraOn && !!remoteStreams.find(s => s.userId === speaker.uid));
                const activeStream = isMe ? localStream : remoteStreams.find(s => s.userId === speaker.uid)?.stream;
                const isSpeakerMuted = speaker.isMuted;
                const peerState = remoteStreams.find(s => s.userId === speaker.uid)?.connectionState || 'connecting';

                return (
                  <motion.div 
                    key={speaker.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`relative aspect-video rounded-3xl overflow-hidden bg-app-card transition-all group ${speaker.isSpeaking ? 'ring-2 ring-emerald-500/50' : 'border border-app-border'}`}
                  >
                    {/* Camera Feed / Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                      {hasCamera && activeStream ? (
                        <VideoStream stream={activeStream} muted={isMe} />
                      ) : (
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-muted relative overflow-hidden">
                           <User size={idx < 2 ? 32 : 24} />
                           {speaker.isSpeaking && (
                             <motion.div 
                               animate={{ scale: [1, 1.2, 1] }} 
                               transition={{ repeat: Infinity, duration: 2 }}
                               className="absolute inset-0 border-4 border-emerald-500/30 rounded-full" 
                             />
                           )}
                        </div>
                      )}

                      {/* Device status indicators */}
                      <div className="absolute top-4 left-4 flex gap-1.5">
                        {isSpeakerMuted && (
                          <div className="bg-rose-500 text-white p-1.5 rounded-lg">
                            <MicOff size={10} />
                          </div>
                        )}
                        {!hasCamera && speaker.uid && (
                          <div className="bg-neutral-800 text-white p-1.5 rounded-lg">
                            <VideoOff size={10} />
                          </div>
                        )}
                      </div>

                      {/* WebRTC Peer Connection Status Badge */}
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#111111] border border-[#1a1a1a] px-2 py-1 rounded-lg">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          peerState === 'connected' ? 'bg-[#22c55e]' :
                          peerState === 'connecting' || peerState === 'new' ? 'bg-amber-500' :
                          'bg-[#FF001D]'
                        }`} />
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#a3a3a3]">
                          {peerState}
                        </span>
                      </div>
                    </div>
                    
                    <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                             <span className="text-xs md:text-sm font-bold text-white drop-shadow-md">
                               {speaker.name} {isMe && "(You)"}
                             </span>
                             <CheckCircle2 size={14} className="text-emerald-400 font-bold" />
                          </div>
                          <span className="text-[9px] md:text-[10px] font-black text-white/60 uppercase tracking-widest drop-shadow-md">
                            {speaker.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {speaker.isSpeaking && (
                            <div className="flex items-center gap-1 bg-emerald-500 px-2 py-1 rounded-lg">
                              <Mic size={10} className="text-white" />
                              <span className="text-[8px] font-black text-white uppercase tracking-tighter">Speaking</span>
                            </div>
                          )}
                          {(idx >= 3 || (isHost && !isMe)) && (
                            <button 
                              onClick={() => handleRemoveSpeaker(speaker.id)}
                              className="bg-black/40 hover:bg-rose-500 text-white p-1.5 rounded-lg backdrop-blur-md transition-colors"
                              title={isMe ? "Leave stage" : "Remove speaker"}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* About Section */}
          <div className="p-8 md:p-10 bg-app-card border border-app-border rounded-[2.5rem] mb-12 shadow-2xl">
            <h2 className="text-[10px] md:text-xs font-black text-app-text-muted uppercase tracking-[0.4em] mb-6">Arena Overview</h2>
            <p className="text-base md:text-lg text-app-text-secondary leading-relaxed max-w-4xl font-medium mb-8">
              {debate?.description || "This debate explores the central conflict with top experts from both sides clashing on resource prioritization and the future of our species."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-app-border/40 pt-8 mt-4">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-app-text-muted uppercase tracking-wider">Arena Configuration</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-app-surface border border-app-border rounded-lg text-xs font-semibold text-app-text-primary">
                    Duration: {debate?.duration || 'Open'}
                  </span>
                  <span className="px-3 py-1 bg-app-surface border border-app-border rounded-lg text-xs font-semibold text-app-text-primary">
                    Mode: {debate?.isAudioOnly ? 'Audio-Only' : 'Video + Audio'}
                  </span>
                  <span className="px-3 py-1 bg-app-surface border border-app-border rounded-lg text-xs font-semibold text-app-text-primary">
                    Max Panelists: {debate?.maxSpeakers || 4}
                  </span>
                  <span className="px-3 py-1 bg-app-surface border border-app-border rounded-lg text-xs font-semibold text-app-text-primary">
                    Live Voting: {debate?.allowVoting !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {((debate?.invitedCreators && debate.invitedCreators.length > 0) || (debate?.customInvitees && debate.customInvitees.length > 0)) && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-app-text-muted uppercase tracking-wider">Pending Panel Invitations</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {debate.invitedCreators?.map((name: string, i: number) => (
                      <span key={`ic-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1 bg-app-surface border border-app-border text-xs text-app-text-secondary rounded-full font-medium">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                        {name}
                      </span>
                    ))}
                    {debate.customInvitees?.map((name: string, i: number) => (
                      <span key={`ci-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1 bg-app-surface border border-app-border text-xs text-app-text-secondary rounded-full font-medium">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                        {name} (External)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Docked Controls */}
        <div 
          className="absolute bottom-0 left-0 w-full p-3 md:p-4 bg-app-bg/95 backdrop-blur-2xl border-t border-app-border z-40"
        >
          <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-8">
            
            {/* Integrated Support Pulse */}
            <div className="flex-1 w-full md:w-auto flex items-center gap-4 bg-app-surface border border-app-border px-4 py-2 rounded-2xl">
              {!hasVoted ? (
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Cast your vote to see live sentiment</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSupportVote('with')}
                      className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                    >
                      With
                    </button>
                    <button 
                      onClick={() => handleSupportVote('against')}
                      className="px-4 py-1.5 bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                    >
                      Against
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">{supportStats.with}%</span>
                    <button className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white">With</button>
                  </div>
                  
                  <div className="flex-1 h-1.5 bg-app-border rounded-full overflow-hidden flex items-center px-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${supportStats.with}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                    <div className="w-1" />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${supportStats.against}%` }}
                      className="h-full bg-rose-500 rounded-full"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-500 text-white">Against</button>
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">{supportStats.against}%</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={handleRequestToSpeak}
                className={`p-3 rounded-xl transition-all ${isHandRaised ? 'bg-app-text-primary text-app-bg font-bold' : 'bg-app-surface text-app-text-primary border border-app-border hover:bg-app-card'}`}
              >
                <Hand size={18} />
              </button>
              
              <div className="relative group">
                <button className="p-3 rounded-xl bg-app-surface text-app-text-primary border border-app-border hover:bg-app-card">
                  <Smile size={18} />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all">
                  <div className="bg-app-card border border-app-border p-1.5 rounded-2xl shadow-2xl flex gap-1 backdrop-blur-xl">
                    {['👏', '🔥', '🤔', '💯'].map(emoji => (
                      <button key={emoji} onClick={() => triggerReaction(emoji)} className="w-9 h-9 rounded-xl hover:bg-app-surface text-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-90">{emoji}</button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={async () => {
                  const muted = await toggleMute();
                  if (user) updateUser({ isMuted: muted });
                }}
                className={`p-3 rounded-xl transition-all ${connectionState === 'connected' ? (localStream?.getAudioTracks()[0]?.enabled === false ? 'bg-rose-600 text-white font-bold' : 'bg-app-surface text-app-text-primary border border-app-border hover:bg-app-card') : 'opacity-50'}`}
                title={localStream?.getAudioTracks()[0]?.enabled === false ? "Unmute Mic" : "Mute Mic"}
              >
                {localStream?.getAudioTracks()[0]?.enabled === false ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button 
                onClick={async () => {
                  const cameraOn = await toggleCamera();
                  if (user) updateUser({ isCameraOn: cameraOn });
                }}
                className={`p-3 rounded-xl transition-all ${localStream?.getVideoTracks()[0]?.enabled ? 'bg-white text-black font-bold' : 'bg-app-surface text-app-text-primary border border-app-border hover:bg-app-card'}`}
                title={localStream?.getVideoTracks()[0]?.enabled ? "Disable Camera" : "Enable Camera"}
              >
                {localStream?.getVideoTracks()[0]?.enabled ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              <div className="w-px h-6 bg-app-border mx-1" />

              <button 
                onClick={() => setShowQueuePanel(!showQueuePanel)}
                className={`p-3 rounded-xl transition-all relative ${showQueuePanel ? 'bg-app-text-primary text-app-bg font-bold' : 'bg-app-surface text-app-text-primary border border-app-border hover:bg-app-card'}`}
                title="View Speaker Queue"
              >
                <Users size={18} />
                <AnimatePresence>
                  {queue.length > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full text-[10px] flex items-center justify-center border-2 border-app-bg font-black pulse"
                    >
                      {queue.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {!localUserIsSpeaker && (
                <button 
                  onClick={handleJoinAsSpeaker}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-black uppercase tracking-widest text-[10px] min-w-[140px] justify-center ${isInQueue ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'}`}
                >
                  {isInQueue ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      In Queue
                    </>
                  ) : (
                    <>
                      <Hand size={14} />
                      Request to Speak
                    </>
                  )}
                </button>
              )}

              {!localUserIsSpeaker && (
                <button 
                  onClick={handleJoinAsSpeaker}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-black uppercase tracking-widest text-[10px]"
                >
                  <PlayCircle size={14} />
                  Go Live
                </button>
              )}

              <div className="w-px h-6 bg-app-border mx-1" />
            </div>
          </div>
        </div>

        {/* Reaction Spawner */}
        <div className="absolute bottom-32 right-6 md:right-12 w-28 h-80 pointer-events-none z-50 overflow-visible flex flex-col justify-end items-center">
          <AnimatePresence>
            {floatingEmojis.map(e => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 1, 0], y: -350, scale: [0.5, 1.4, 1.2], rotate: [0, e.rot, e.rot * 2] }}
                transition={{ duration: 2.8, ease: "easeOut" }}
                className="absolute bottom-0 text-5xl"
              >
                {e.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Share Toast */}
        <AnimatePresence>
          {showShareToast && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-app-bg border border-app-border px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest text-app-text-primary z-[100] shadow-2xl backdrop-blur-xl"
            >
              Link Copied to Clipboard
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Sidebar - Chat or Queue */}
      <aside className={`w-full md:w-[360px] lg:w-[440px] bg-app-surface flex flex-col shrink-0 border-l border-app-border ${activeMobileView === 'arena' ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Toggle between Chat and Queue Panels */}
        <div className="flex h-16 md:h-20 border-b border-app-border shrink-0">
          <button 
            onClick={() => setShowQueuePanel(false)}
            className={`flex-1 flex items-center justify-center gap-2 border-r border-app-border transition-colors ${!showQueuePanel ? 'bg-app-bg text-app-text-primary font-black' : 'text-app-text-muted hover:text-app-text-secondary'}`}
          >
            <MessageSquare size={16} />
            <span className="text-[10px] uppercase tracking-widest">Discourse</span>
          </button>
          <button 
            onClick={() => setShowQueuePanel(true)}
            className={`flex-1 flex items-center justify-center gap-2 transition-colors relative ${showQueuePanel ? 'bg-app-bg text-app-text-primary font-black' : 'text-app-text-muted hover:text-app-text-secondary'}`}
          >
            <Users size={16} />
            <span className="text-[10px] uppercase tracking-widest">Waitlist</span>
            {queue.length > 0 && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full ml-1" />}
          </button>
        </div>

        {showQueuePanel ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-app-border bg-app-card/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text-muted">Speaker Queue</h3>
                <span className="px-2 py-1 bg-app-surface border border-app-border rounded-md text-[10px] font-bold text-app-text-primary">
                  {queue.length} {queue.length === 1 ? 'Person' : 'People'} Waiting
                </span>
              </div>
              <p className="text-[11px] text-app-text-secondary leading-relaxed">
                Hosts can admit speakers from this list to join the live stage. Request to speak to share your perspective.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-4 scrollbar-none">
              {queue.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                  <Hand size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">No one in queue</p>
                  <p className="text-[10px] mt-2">Request to speak to join the debate</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {queue.map((user, idx) => (
                    <motion.div 
                      key={user.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-5 rounded-[2rem] bg-app-card border border-app-border group relative transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-muted shrink-0">
                            <User size={24} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <p className="text-xs font-bold text-app-text-primary truncate">{user.name}</p>
                              <CheckCircle2 size={12} className="text-emerald-400 font-bold shrink-0" />
                            </div>
                            <p className="text-[10px] text-app-text-muted truncate">{user.username}</p>
                          </div>
                        </div>
                        
                        {isHost && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleAdmitSpeaker(user.id)}
                              className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors"
                            >
                              Admit
                            </button>
                            <button 
                              onClick={() => handleRemoveFromQueue(user.id)}
                              className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 rounded-lg transition-colors"
                              title="Remove from queue"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-app-border bg-app-card/30">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text-muted">Live Discourse</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3 scrollbar-none">
              {chatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col max-w-[85%] ${msg.userId === user?.id ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.userId === user?.id 
                      ? 'bg-app-text-primary text-app-bg rounded-tr-none' 
                      : 'bg-app-card text-app-text-primary rounded-tl-none border border-app-border'
                  }`}>
                    <p className="font-medium text-xs text-app-text-secondary mb-0.5">{msg.userName}</p>
                    <p>{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-app-text-muted mt-0.5 font-mono uppercase tracking-widest px-1 opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-app-border bg-app-card/30">
              <div className="bg-app-card border border-app-border rounded-2xl p-2 flex items-end gap-2">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 transition-colors ${showEmojiPicker ? 'text-app-text-primary' : 'text-app-text-muted hover:text-app-text-primary'}`}
                >
                  <Smile size={20} />
                </button>
                <input 
                  type="text"
                  placeholder="Send a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-transparent py-2 text-sm focus:outline-none placeholder:text-app-text-muted/40 text-app-text-primary"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  className={`p-2 transition-colors ${chatMessage.trim() ? 'text-app-text-primary' : 'text-app-text-primary/20'}`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

export default DebateArena;