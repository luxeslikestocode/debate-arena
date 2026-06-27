import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BadgeCheck, MapPin, Youtube, Twitter, Facebook, Linkedin, 
  Plus, MessageSquare, History, Play, Calendar, UserPlus, User,
  ArrowUpRight, Share2, MoreVertical, Shield, X
} from 'lucide-react';
import { ConfirmationModal } from './ui/ConfirmationModal';

const socialLinks = [
  { icon: Youtube, label: 'YouTube' },
  { icon: Twitter, label: 'X (Twitter)' },
  { icon: Facebook, label: 'Facebook' },
  { icon: Linkedin, label: 'LinkedIn' }
];

const supportedTopics: { name: string; intensity: string }[] = [];

const discussedTopics: { name: string; count: number }[] = [];

const pastDebates: any[] = [];

export function ProfileView({ userProfile }: { userProfile?: any }) {
  const [activeTab, setActiveTab] = useState<'debates' | 'clips' | 'scheduled'>('debates');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const tabs = [
    { id: 'debates', label: 'Past Debates', icon: History },
    { id: 'clips', label: 'Clips', icon: Play },
    { id: 'scheduled', label: 'Scheduled', icon: Calendar },
  ];

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-app-bg scrollbar-none">
      {/* Banner */}
      <div className="relative w-full h-40 md:h-[280px]">
        <div className="absolute inset-0 bg-app-surface overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2000" 
            alt="Profile Banner"
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="absolute top-6 right-6 flex gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2.5 rounded-full bg-app-bg/40 backdrop-blur-md border border-app-border text-app-text-primary hover:bg-app-bg/60 transition-all"
            >
              <Share2 size={20} />
            </button>
            <AnimatePresence>
              {showShareMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-app-card border border-app-border rounded-2xl shadow-2xl overflow-hidden py-2 z-50"
                >
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors">
                    <ArrowUpRight size={14} />
                    <span>Copy Profile Link</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors">
                    <Youtube size={14} />
                    <span>Share on YouTube</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors">
                    <Twitter size={14} />
                    <span>Share on X</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2.5 rounded-full bg-app-bg/40 backdrop-blur-md border border-app-border text-app-text-primary hover:bg-app-bg/60 transition-all"
            >
              <MoreVertical size={20} />
            </button>
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-app-card border border-app-border rounded-2xl shadow-2xl overflow-hidden py-2 z-50"
                >
                  <button 
                    onClick={() => { setShowReportModal(true); setShowMoreMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/5 transition-colors"
                  >
                    <Shield size={14} />
                    <span>Report User</span>
                  </button>
                  <button 
                    onClick={() => { setShowBlockModal(true); setShowMoreMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/5 transition-colors"
                  >
                    <X size={14} />
                    <span>Block User</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Profile Info Container */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 relative">
        {/* Profile Picture (Floating) */}
        <div className="absolute -top-12 md:top-[-80px] left-4 md:left-8">
          <div className="relative">
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-3xl bg-app-surface border-[4px] md:border-[6px] border-app-bg flex items-center justify-center shadow-2xl overflow-hidden">
              <User size={32} className="md:w-16 md:h-16 text-app-text-muted" />
            </div>
            {userProfile?.isVerified && (
              <div className="absolute -bottom-1 md:bottom-[-8px] -right-1 md:right-[-8px] bg-app-bg rounded-full p-1 border border-app-border">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-app-text-primary/10 flex items-center justify-center text-app-text-primary">
                  <Shield size={12} className="md:w-4 md:h-4" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons (Top Right of Info) */}
        <div className="flex justify-end pt-4 md:pt-6 items-center gap-2 md:gap-4">
          <button 
            className="px-4 md:px-8 py-2 md:py-3 rounded-2xl font-bold text-xs md:text-sm bg-app-card border border-app-border text-app-text-primary hover:bg-app-surface transition-all"
          >
            Edit Profile
          </button>
        </div>

        {/* Basic Stats & Identity */}
        <div className="mt-8 md:mt-12">
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="text-2xl md:text-4xl font-black text-app-text-primary tracking-tighter">{userProfile?.name || 'Anonymous'}</h1>
            {userProfile?.isVerified && <BadgeCheck size={20} className="md:w-7 md:h-7 text-app-text-primary fill-app-text-primary/20" />}
          </div>
          <div className="text-base md:text-lg text-app-text-muted font-medium mb-4 md:mb-6">{userProfile?.username || '@user'}</div>

          <div className="flex items-center gap-4 md:gap-8 text-xs md:text-sm mb-6 md:mb-8 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
            <div className="flex items-center gap-2">
              <span className="text-app-text-primary font-bold text-base md:text-lg">0</span>
              <span className="text-app-text-muted font-medium tracking-tight">Followers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-app-text-primary font-bold text-base md:text-lg">0</span>
              <span className="text-app-text-muted font-medium tracking-tight">Following</span>
            </div>
            <div className="flex items-center gap-2 text-app-text-secondary">
              <MapPin size={14} className="md:w-4 md:h-4" />
              <span>San Francisco</span>
            </div>
          </div>

          {/* About Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 mt-8 md:mt-12 pb-20">
            {/* Left Column: Info & Lists */}
            <div className="lg:col-span-1 space-y-10">
              {/* Bio */}
              <div className="space-y-4">
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-app-text-muted">About Me</h3>
                <p className="text-app-text-secondary leading-relaxed font-medium">
                  {userProfile?.bio || 'New debater on Debate.com'}
                </p>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-app-text-muted">Connect</h3>
                <div className="grid grid-cols-2 gap-3">
                  {socialLinks.map((social, i) => (
                    <button key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-app-card border border-app-border hover:opacity-80 transition-all group">
                      <social.icon size={18} className={`text-app-text-primary transition-colors`} />
                      <span className="text-xs font-bold text-app-text-secondary group-hover:text-app-text-primary transition-colors">{social.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Supported Topics */}
              <div className="space-y-4">
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-app-text-muted">I Support</h3>
                <div className="space-y-2">
                  {supportedTopics.length === 0 ? (
                    <div className="text-sm text-app-text-muted">No supported topics yet.</div>
                  ) : supportedTopics.map((topic) => (
                    <div key={topic.name} className="flex items-center justify-between p-3.5 rounded-2xl bg-app-card border border-app-border">
                      <span className="text-sm font-bold text-app-text-primary tracking-tight">{topic.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discussed Topics */}
              <div className="space-y-4">
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-app-text-muted">Main Discussions</h3>
                <div className="flex flex-wrap gap-2">
                  {discussedTopics.length === 0 ? (
                     <div className="text-sm text-app-text-muted">No discussions started.</div>
                  ) : discussedTopics.map((topic, i) => (
                    <div key={i} className="px-4 py-2 rounded-xl bg-app-surface border border-app-border text-xs font-bold text-app-text-primary flex items-center gap-2">
                      {topic.name}
                      <span className="text-app-text-muted">{topic.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Activity Tabs */}
            <div className="lg:col-span-2">
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 bg-app-card p-1 rounded-xl md:rounded-2xl border border-app-border mb-6 md:mb-8 overflow-x-auto scrollbar-none">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 min-w-[100px] md:min-w-0 flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-lg md:rounded-xl text-[11px] md:text-sm font-bold transition-all ${
                      activeTab === tab.id 
                        ? 'bg-app-bg text-app-text-primary shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-app-border' 
                        : 'text-app-text-muted hover:text-app-text-secondary'
                    }`}
                  >
                    <tab.icon size={14} className="md:w-4 md:h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'debates' && (
                    <div className="space-y-4">
                      {pastDebates.length === 0 ? (
                        <div className="p-12 text-center text-app-text-muted border border-app-border rounded-2xl">
                           No past debates.
                        </div>
                      ) : pastDebates.map((debate, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-app-card border border-app-border flex items-center justify-between hover:opacity-80 transition-all cursor-pointer group">
                          <div>
                            <h4 className="text-app-text-primary font-bold text-lg tracking-tight mb-1">{debate.title}</h4>
                            <div className="text-sm text-app-text-muted font-medium">Vs. {debate.opponent} • {debate.date}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              debate.result === 'Victory' ? 'text-emerald-400 bg-emerald-400/10' : 'text-app-text-muted bg-app-surface'
                            }`}>
                              {debate.result}
                            </div>
                            <div className="text-app-text-muted hover:text-app-text-primary"><ArrowUpRight size={20} /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'clips' && (
                    <div className="grid grid-cols-2 gap-4">
                       <div className="col-span-2 p-12 text-center text-app-text-muted border border-app-border rounded-2xl">
                         No clips available.
                       </div>
                    </div>
                  )}

                  {activeTab === 'scheduled' && (
                    <div className="p-12 rounded-3xl bg-app-card border border-app-border border-dashed flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-14 h-14 rounded-full bg-app-surface flex items-center justify-center text-app-text-muted">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <h4 className="text-app-text-primary font-bold text-lg">No Debates Scheduled</h4>
                        <p className="text-app-text-muted text-sm mt-1">Updates will appear here when a new challenge is accepted.</p>
                      </div>
                      <button className="px-6 py-2.5 rounded-xl bg-app-text-primary text-app-bg text-sm font-bold hover:opacity-80 transition-all">
                        Schedule Debate
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onConfirm={() => {
          // In a real app, this would call an API
          console.log('Reported Alex Rivera');
        }}
        title="Report Alex Rivera?"
        description="If you believe this user's content or behavior violates our community guidelines, let us know. Our moderation team will review this profile."
        confirmLabel="Report User"
        confirmVariant="danger"
        icon="report"
      />

      <ConfirmationModal 
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={() => {
          // In a real app, this would call an API
          console.log('Blocked Alex Rivera');
        }}
        title="Block Alex Rivera?"
        description="They will no longer be able to message you, see your posts, or interact with your debates. You will also stop seeing their content."
        confirmLabel="Block User"
        confirmVariant="danger"
        icon="block"
      />
    </div>
  );
}
