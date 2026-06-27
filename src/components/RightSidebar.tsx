import { MoreHorizontal, BadgeCheck, User } from 'lucide-react';

const trendingDebates: any[] = [];

const creators: any[] = [];

export function RightSidebar() {
  return (
    <div className="w-[320px] flex-shrink-0 flex flex-col h-screen overflow-y-auto border-l border-app-border bg-app-bg p-6 sticky top-0 hidden lg:flex">
      
      {/* Trending Debates Panel */}
      <div className="mb-10 mt-14">
        <h2 className="text-xl font-bold tracking-tight mb-6">Trending Debates</h2>
        
        <div className="space-y-6">
          {trendingDebates.length === 0 ? (
             <div className="text-sm text-app-text-muted py-4">No trending debates at the moment.</div>
          ) : trendingDebates.map((debate, i) => (
            <div key={i} className="flex items-start justify-between group cursor-pointer">
              <div>
                <div className="text-xs text-app-text-muted mb-1 flex items-center gap-1.5">
                  {debate.category} · {debate.status}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold group-hover:text-app-text-primary transition-colors text-app-text-primary/90">
                    {debate.title}
                  </h3>
                  {debate.isLive && (
                     <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">LIVE</span>
                  )}
                </div>
                <div className="text-xs text-app-text-muted">
                  {debate.subtitle}
                </div>
              </div>
              <button className="text-app-text-muted hover:text-app-text-primary transition-colors pt-2">
                <MoreHorizontal size={16} />
              </button>
            </div>
          ))}
          
          <button className="text-sm text-app-text-secondary hover:text-app-text-primary transition-colors pt-2 block w-full text-left font-medium">
            Show more
          </button>
        </div>
      </div>

      <div className="h-px bg-app-border w-full mb-8" />

      {/* Who to follow */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-6 text-app-text-primary">Who to follow</h2>
        
        <div className="space-y-5">
          {creators.length === 0 ? (
            <div className="text-sm text-app-text-muted py-4">No creators to show right now.</div>
          ) : creators.map((creator) => (
            <div key={creator.handle} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-secondary shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-app-text-primary flex items-center gap-1">
                    {creator.name}
                    {creator.verified && (
                      <BadgeCheck size={14} className="text-app-text-primary fill-app-text-primary/20" stroke="currentColor" />
                    )}
                  </div>
                  <div className="text-xs text-app-text-muted">{creator.handle}</div>
                </div>
              </div>
              <button className="px-4 py-1.5 rounded-full bg-app-text-primary text-app-bg text-sm font-bold hover:bg-app-text-secondary hover:text-app-bg transition-colors">
                Follow
              </button>
            </div>
          ))}
          
          <button className="text-sm text-app-text-secondary hover:text-app-text-primary transition-colors pt-3 block w-full text-left font-medium">
            Show more
          </button>
        </div>
      </div>

    </div>
  );
}
