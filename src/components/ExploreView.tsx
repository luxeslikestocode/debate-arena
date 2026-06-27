import { useState, useEffect, useRef } from 'react';
import { Eye, Play, ArrowLeft, Plus, Check, Award, Users, MoreVertical, User, Search, X, Share2, Bookmark, Menu, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth';

export interface Debate {
  title: string;
  started: string;
  watching: string;
  tags: string[];
  isLive: boolean;
  isScheduled?: boolean;
}

export interface Creator {
  id: number;
  name: string;
  handle: string;
  followers: string;
  bio: string;
  verified: boolean;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  count: string;
  tags: string[];
  debates: Debate[];
}

interface ExploreViewProps {
  onDebateClick: (debate: Debate) => void;
  onClipClick?: (clipId: number) => void;
  searchResults?: { debates: Debate[], creators: Creator[], query: string } | null;
  onClearSearch?: () => void;
  allDebates?: Debate[];
  popularTopics?: Topic[];
}

export const recommendedDebates: Debate[] = [];
export const topicsData: Topic[] = [
  {
    id: 'agi',
    name: 'Artificial General Intelligence',
    description: 'Debating timelines, alignment protocols, existential risk, and the future of machine mind.',
    count: '0 Active Debates',
    tags: ['AI Tech', 'Future Science', 'Cognitive'],
    debates: []
  },
  {
    id: 'bioethics',
    name: 'Bio-Engineering Frontiers',
    description: 'Splicing active genes, biological longevity therapies, and human cyborg integration safety.',
    count: '0 Active Debates',
    tags: ['Biotech', 'Ethics', 'Genetics'],
    debates: []
  },
  {
    id: 'climate-macro',
    name: 'Climate Strategy & Energy',
    description: 'Transitioning to nuclear fusion gridpower, carbon tax economics, and geo-engineering risks.',
    count: '0 Active Debates',
    tags: ['Climate', 'Energy', 'Sustain'],
    debates: []
  },
  {
    id: 'macro-econ',
    name: 'Socio-Economic Systems',
    description: 'Reforming taxation models, structural welfare, capital consolidation, and automated labor.',
    count: '0 Active Debates',
    tags: ['Economics', 'Policy', 'Sociology'],
    debates: []
  },
];
export const initialCreators: Creator[] = [];

export function ExploreView({ onDebateClick, onClipClick, searchResults, onClearSearch, allDebates = [], popularTopics = topicsData }: ExploreViewProps) {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [followingStates, setFollowingStates] = useState<Record<number, boolean>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const displayRecommended = allDebates.slice(0, 3);

  const handleDeleteDebate = async (debateId: string) => {
    if (window.confirm("Are you sure you want to delete this debate?")) {
      try {
        const { deleteDebate } = await import('../lib/api');
        await deleteDebate(debateId);
      } catch (err) {
        console.error("Error deleting debate", err);
      }
    }
    setActiveMenuId(null);
  };

  const toggleFollow = (id: number) => {
    setFollowingStates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const DebateCardMenu = ({ debate }: { debate: any }) => {
    const isCreator = false;
    const debateId = debate.id || debate.title?.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const isMenuOpen = activeMenuId === debateId;

    return (
      <div className="relative z-10 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuId(isMenuOpen ? null : debateId);
          }}
          className={`p-1.5 rounded-lg border transition-all ${isMenuOpen ? 'bg-app-elevated border-app-text-primary text-app-text-primary' : 'bg-black/60 border-white/10 text-app-text-secondary hover:text-app-text-primary hover:bg-black'}`}
        >
          <Menu size={13} />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-36 bg-app-card border border-app-border rounded-xl shadow-2xl py-1 z-50 text-left overflow-hidden"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(null);
                  const inviteUrl = `${window.location.origin}${window.location.pathname}?debateId=${debateId}`;
                  navigator.clipboard.writeText(inviteUrl).then(() => {
                    alert("Debate link copied to clipboard!");
                  });
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors text-left"
              >
                <Share2 size={12} />
                <span>Share</span>
              </button>
              {isCreator && (
                <>
                  <div className="h-px bg-app-border my-1 mx-2" />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDebate(debateId);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-rose-500 hover:bg-app-surface transition-colors text-left"
                  >
                    <Trash size={12} />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Search Results View
  if (searchResults) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-app-bg text-app-text-primary">
        <div className="max-w-screen-xl mx-auto">
          <button 
            onClick={onClearSearch}
            className="group flex items-center gap-2 text-app-text-muted hover:text-app-text-primary mb-8 transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Explore
          </button>

          <header className="mb-12">
             <h1 className="text-3xl font-black text-app-text-primary tracking-tighter mb-2">Results for "{searchResults.query}"</h1>
             <p className="text-app-text-muted text-sm font-medium">Found {searchResults.debates.length} debates and {searchResults.creators.length} channels matching your search.</p>
          </header>

          {/* Channels Row */}
          {searchResults.creators.length > 0 && (
            <section className="mb-16">
              <h2 className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.4em] mb-8">Matching Channels</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                {searchResults.creators.map((creator) => {
                  const isFollowing = followingStates[creator.id] || false;
                  return (
                    <div 
                      key={creator.id}
                      className="min-w-[280px] bg-app-card border border-app-border p-6 rounded-[2rem] hover:opacity-80 transition-all group flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-muted shrink-0">
                        <User size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-app-text-primary font-bold text-sm truncate">{creator.name}</h4>
                        <p className="text-app-text-muted text-xs font-mono truncate">{creator.handle}</p>
                      </div>
                      <button 
                        onClick={() => toggleFollow(creator.id)}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                          isFollowing 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-app-text-primary text-app-bg hover:scale-105 active:scale-95'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Debates Grid */}
          <section>
            <h2 className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.4em] mb-8">Conversations</h2>
            {searchResults.debates.length === 0 ? (
              <div className="p-20 rounded-[2.5rem] bg-app-card border border-app-border text-center">
                <p className="text-app-text-muted font-bold mb-1">No debates found</p>
                <p className="text-app-text-muted/60 text-xs">Try searching for broader keywords like "AI", "Climate" or "Policy".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {searchResults.debates.map((debate, i) => (
                  <div 
                    key={i} 
                    className="group cursor-pointer" 
                    onClick={() => onDebateClick(debate)}
                  >
                    <div className="w-full h-56 rounded-[2rem] bg-app-card mb-4 relative overflow-hidden flex flex-col justify-between p-6 border border-app-border group-hover:border-app-text-muted/30 transition-all">
                       <div className="flex justify-between items-start w-full">
                         {debate.isLive ? (
                           <div className="px-3 py-1 text-[10px] font-black tracking-widest bg-rose-600 text-white flex items-center gap-2 rounded-md">
                             <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                             LIVE
                           </div>
                         ) : (
                           <div className="px-3 py-1 text-[10px] font-bold tracking-widest bg-app-surface text-app-text-muted md:opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                             {debate.started.toUpperCase()}
                           </div>
                         )}
                         <DebateCardMenu debate={debate} />
                       </div>
                       <div className="flex justify-start">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-app-bg/40 backdrop-blur-md">
                            <Eye size={12} className="text-app-text-muted" />
                            <span className="text-[11px] text-app-text-secondary font-bold tracking-tight">
                              {debate.watching}
                            </span>
                          </div>
                       </div>
                    </div>
                    
                    <h3 className="font-bold text-lg md:text-xl leading-tight text-app-text-primary mb-2 tracking-tighter group-hover:opacity-80 transition-opacity">
                      {debate.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {debate.tags.map((tag, j) => (
                        <span key={j} className="text-[10px] font-bold text-app-text-muted bg-app-surface px-2.5 py-1 rounded-md border border-app-border">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  // Topic Detail Screen when topic card is clicked
  if (selectedTopic) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-app-bg text-app-text-primary">
        <div className="max-w-screen-xl mx-auto">
          {/* Topic Header section */}
          <div className="mb-6 md:mb-8">
            <button 
              onClick={() => setSelectedTopic(null)}
              className="group flex items-center gap-2 text-app-text-muted hover:text-app-text-primary mb-6 transition-colors font-medium text-sm"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Explore
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 rounded-2xl md:rounded-[2rem] bg-app-card border border-app-border relative overflow-hidden">
               <div className="absolute top-0 right-0 w-80 h-80 bg-app-text-primary/[0.01] rounded-full blur-3xl pointer-events-none"></div>
               <div className="relative z-10 flex-1">
                 <div className="flex items-center gap-4 mb-3">
                   <span className="text-xs font-semibold tracking-wider bg-app-surface border border-app-border px-3 py-1 rounded text-app-text-secondary">
                     TOPIC FRONTIER
                   </span>
                  <span className="text-xs text-app-text-muted flex items-center gap-1.5 bg-app-bg py-1 px-3.5 rounded">
                    <Users size={12} />
                    {selectedTopic.count}
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-app-text-primary mb-3">
                  {selectedTopic.name}
                </h1>
                <p className="text-app-text-secondary max-w-2xl text-[15px] leading-relaxed">
                  {selectedTopic.description}
                </p>
              </div>
            </div>
          </div>

          {/* List of debates in this topic */}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-app-text-primary mb-6">
              Active Debates in {selectedTopic.name}
            </h2>

            {selectedTopic.debates.length === 0 ? (
              <div className="p-12 rounded-2xl bg-app-card border border-app-border text-center text-app-text-muted">
                No debates active on this topic right now. Check back shortly!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedTopic.debates.map((debate, i) => (
                  <div 
                    key={i} 
                    className="group cursor-pointer" 
                    onClick={() => onDebateClick(debate)}
                  >
                    <div className="w-full h-48 rounded-xl bg-app-card mb-4 relative overflow-hidden flex flex-col justify-between p-4 border border-app-border group-hover:border-app-text-muted/30 transition-all duration-300">
                       <div className="flex justify-between items-start w-full">
                         {debate.isLive ? (
                           <div className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-rose-600 text-white inline-flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 bg-white"></div>
                             LIVE NOW
                           </div>
                         ) : debate.isScheduled ? (
                           <div className="px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-app-bg/60 border border-app-border rounded text-app-text-secondary inline-flex items-center gap-1.5 backdrop-blur-sm">
                             <div className="w-1.5 h-1.5 rounded-full bg-app-text-muted"></div>
                             {debate.started}
                           </div>
                         ) : <div />}
                         <DebateCardMenu debate={debate} />
                       </div>
                       <div className="flex justify-start">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-app-bg/60 backdrop-blur-sm">
                            <Eye size={12} className="text-app-text-muted" />
                            <span className="text-xs text-app-text-secondary font-medium">
                              {debate.watching} {debate.isScheduled ? 'waiting' : 'watching'}
                            </span>
                          </div>
                       </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg leading-snug text-app-text-primary mb-1.5 tracking-tight group-hover:opacity-80 transition-opacity text-balance">
                      {debate.title}
                    </h3>
                    <div className="text-[13px] text-app-text-muted mb-3.5 flex items-center gap-2 font-medium">
                      <span className={debate.isLive ? 'text-app-text-primary' : ''}>
                        {debate.isScheduled ? 'Upcoming' : debate.started}
                      </span>
                      <span className="text-app-text-muted/40">•</span>
                      <span>{debate.watching} {debate.isScheduled ? 'waiting' : 'watching'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {debate.tags.map((tag, j) => (
                        <span key={j} className="text-[11px] font-medium tracking-wide text-app-text-muted px-3 py-1 rounded-full border border-app-border bg-app-surface">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-app-bg text-app-text-primary">
      <div className="max-w-screen-xl mx-auto">
        
        {/* Search Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-app-text-primary mb-2">Explore Arena</h1>
              <p className="text-app-text-muted text-sm font-medium">Discover popular topics, live arguments, and short highlights.</p>
            </div>
          </div>
        </div>

        {/* Recommended debates matches home page details perfectly */}
        <div className="mb-14">
          <h2 className="text-xl font-bold tracking-tight text-app-text-primary mb-6">Recommended Debates</h2>
          {displayRecommended.length === 0 ? (
            <div className="p-8 text-center border border-app-border bg-app-card rounded-xl text-app-text-muted text-sm font-medium">No recommended debates right now. Check back later.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayRecommended.map((debate, i) => (
                <div 
                  key={i} 
                  className="group cursor-pointer" 
                  onClick={() => onDebateClick(debate)}
                >
                  <div className="w-full h-48 rounded-xl bg-app-card mb-4 relative overflow-hidden flex flex-col justify-between p-4 border border-app-border group-hover:border-app-text-muted/30 transition-all duration-300">
                     <div className="flex items-center justify-between w-full">
                       {debate.isLive ? (
                         <div className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-rose-600 text-white inline-flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 bg-white"></div>
                           LIVE NOW
                         </div>
                       ) : debate.isScheduled ? (
                         <div className="px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-app-bg/60 border border-app-border rounded text-app-text-secondary inline-flex items-center gap-1.5 backdrop-blur-sm">
                           <div className="w-1.5 h-1.5 bg-white"></div>
                           {debate.started}
                         </div>
                       ) : <div />}
                       <DebateCardMenu debate={debate} />
                     </div>
                     <div className="flex justify-start">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-app-bg/60 backdrop-blur-sm">
                          <Eye size={12} className="text-app-text-muted" />
                          <span className="text-xs text-app-text-secondary font-medium">{debate.watching} {debate.isScheduled ? 'waiting' : 'watching'}</span>
                        </div>
                     </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg leading-snug text-app-text-primary mb-1.5 tracking-tight group-hover:opacity-80 transition-opacity text-balance">
                    {debate.title}
                  </h3>
                  <div className="text-[13px] text-app-text-muted mb-3.5 flex items-center gap-2 font-medium">
                    <span className={debate.isLive ? 'text-app-text-primary' : ''}>
                      {debate.isScheduled ? 'Upcoming' : debate.started}
                    </span>
                    <span className="text-app-text-muted/40">•</span>
                    <span>{debate.watching} {debate.isScheduled ? 'waiting' : 'watching'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {debate.tags.map((tag, j) => (
                      <span key={j} className="text-[11px] font-medium tracking-wide text-app-text-muted px-3 py-1 rounded-full border border-app-border bg-app-surface">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2) Twitch Game-Boxes style Popular Debate Topics */}
        <div className="mb-10 md:mb-14">
          <h2 className="text-xl font-bold tracking-tight text-app-text-primary mb-2">Popular Debate Topics</h2>
          <p className="text-app-text-muted text-xs md:text-sm mb-6">Select a category to view a full scope of live arguments.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {popularTopics.map((topic) => (
              <div 
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className="cursor-pointer group flex flex-col w-full"
              >
                {/* Aspect ratio 3:4 rounded vertical poster card with solid elegant initials */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-app-card border border-app-border group-hover:border-app-text-muted transition-all duration-300 mb-3 flex flex-col items-center justify-center p-6 shadow-inner">
                  
                  {/* User Icon as the fallback */}
                  <div className="text-app-text-muted group-hover:scale-105 transition-transform duration-300 select-none">
                    <User size={48} />
                  </div>

                  {/* Explorer overlay trigger */}
                  <div className="absolute inset-0 bg-app-bg/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 rounded-xl">
                    <div className="px-3.5 py-1.5 bg-app-text-primary text-app-bg text-[11px] font-bold uppercase rounded-md tracking-wider flex items-center gap-1 shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                      Explore Topic <span>→</span>
                    </div>
                  </div>
                </div>

                {/* Category info layout below */}
                <div className="flex items-start justify-between min-w-0 pr-0.5 gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[15px] leading-tight text-app-text-primary mb-1 group-hover:opacity-80 transition-opacity truncate">
                      {topic.name}
                    </h3>
                    <div className="text-[13px] text-app-text-muted font-medium mb-2">
                      {topic.count}
                    </div>
                  </div>
                  <button className="text-app-text-muted hover:text-app-text-primary transition-colors pt-0.5 shrink-0">
                    <MoreVertical size={16} />
                  </button>
                </div>

                {/* Clean neutral category tag pills */}
                <div className="flex items-center gap-1 flex-wrap">
                  {topic.tags.map((tag, j) => (
                    <span 
                      key={j} 
                      className="text-[11px] font-medium text-app-text-muted bg-app-surface border border-app-border px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* 4) Clean channels follow module */}
        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight text-app-text-primary mb-1.5">Top Channels to Follow</h2>
          <p className="text-app-text-muted text-sm mb-6">Connect with certified elite minds, authors, and political guides.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {initialCreators.length === 0 ? (
               <div className="col-span-full p-8 text-center border border-app-border bg-app-card rounded-xl text-app-text-muted text-sm font-medium">No channels found.</div>
            ) : initialCreators.map((creator) => {
              const isFollowing = followingStates[creator.id] || false;
              return (
                <div 
                  key={creator.id}
                  className="bg-app-card border border-app-border rounded-2xl p-5 hover:opacity-90 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
                >
                  <div className="w-16 h-16 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-secondary mb-4 ring-2 ring-app-border shrink-0">
                    <User size={32} />
                  </div>
                  
                  <h4 className="text-app-text-primary font-bold text-base leading-tight flex items-center justify-center gap-1">
                    {creator.name}
                    {creator.verified && (
                      <Award size={14} className="text-app-text-primary" />
                    )}
                  </h4>
                  <span className="text-xs text-app-text-muted font-mono mb-2">{creator.handle}</span>
                  
                  <p className="text-xs text-app-text-secondary min-h-[44px] line-clamp-3 leading-relaxed px-1 mb-4">
                    {creator.bio}
                  </p>

                  <div className="w-full pt-3 border-t border-app-border flex items-center justify-between mt-auto">
                    <span className="text-[11px] text-app-text-muted font-medium">
                      {creator.followers}
                    </span>
                    
                    <button 
                      onClick={() => toggleFollow(creator.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-1.5 ${
                        isFollowing 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-app-text-primary text-app-bg hover:opacity-80'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <Check size={12} strokeWidth={3} />
                          Following
                        </>
                      ) : (
                        <>
                          <Plus size={12} strokeWidth={3} />
                          Follow
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
