import React, { useState } from 'react';
import { Settings, Bell, Heart, Repeat, AtSign, UserPlus, Swords, BadgeCheck } from 'lucide-react';
import { User, AppNotification, NotificationType } from '../types';

const mockNotifications: AppNotification[] = [];

export function NotificationsView() {
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'mentions'>('all');

  const filteredNotifications = mockNotifications.filter(n => {
    if (activeTab === 'mentions') return n.type === 'mention';
    if (activeTab === 'verified') return n.actor.isVerified;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-app-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-app-bg/80 backdrop-blur-md border-b border-app-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-app-text-primary">Notifications</h1>
          <button className="p-2 rounded-full hover:bg-app-surface text-app-text-muted hover:text-app-text-primary transition-colors">
            <Settings size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex px-2">
          {['All', 'Verified', 'Mentions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase() as any)}
              className="flex-1 py-4 relative group"
            >
              <span className={`text-sm font-bold tracking-tight transition-colors ${
                activeTab === tab.toLowerCase() ? 'text-app-text-primary' : 'text-app-text-muted group-hover:text-app-text-secondary'
              }`}>
                {tab}
              </span>
              {activeTab === tab.toLowerCase() && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-app-text-primary rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-app-border">
            {filteredNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        ) : (
          <EmptyState tab={activeTab} />
        )}
      </div>
    </div>
  );
}

interface NotificationItemProps {
  notification: AppNotification;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'like': return <Heart size={24} className="text-[#f91880] fill-[#f91880]" />;
      case 'repost': return <Repeat size={24} className="text-[#00ba7c]" />;
      case 'mention': return <AtSign size={24} className="text-app-text-primary" />;
      case 'follow': return <UserPlus size={24} className="text-app-text-primary fill-app-text-primary" />;
      case 'debate_invite': return <Swords size={24} className="text-app-text-primary" />;
      default: return <Bell size={24} className="text-app-text-primary" />;
    }
  };

  return (
    <div className={`p-6 flex gap-4 transition-colors hover:bg-app-surface cursor-pointer ${!notification.isRead ? 'bg-app-text-primary/[0.02]' : ''}`}>
      <div className="shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-muted shadow-sm">
            <UserPlus size={14} />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-app-text-primary text-[15px]">{notification.actor.name}</span>
            {notification.actor.isVerified && <BadgeCheck size={14} className="text-app-text-primary" />}
            <span className="text-app-text-secondary text-sm">
              {notification.type === 'like' && 'liked your post'}
              {notification.type === 'repost' && 'reposted your debate'}
              {notification.type === 'mention' && 'mentioned you in a response'}
              {notification.type === 'follow' && 'followed you'}
              {notification.type === 'debate_invite' && 'invited you to a live arena debate'}
            </span>
          </div>
          <span className="text-[11px] text-app-text-muted font-mono ml-auto opacity-70">{notification.timestamp}</span>
        </div>
        
        {notification.targetContent && (
          <p className="text-[14px] text-app-text-secondary line-clamp-2 leading-relaxed tracking-tight pl-1 border-l border-app-border ml-4 py-1">
            {notification.targetContent}
          </p>
        )}

        {notification.type === 'debate_invite' && (
          <div className="mt-4">
            <button className="px-6 py-2.5 bg-app-text-primary text-app-bg text-[11px] font-black rounded-full hover:opacity-80 transition-all active:scale-95 uppercase tracking-[0.2em] shadow-xl">
              Join Arena
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-20 text-center">
      <div className="w-20 h-20 rounded-full bg-app-card border border-app-border flex items-center justify-center mb-8 text-app-text-muted shadow-2xl">
        <Bell size={36} strokeWidth={1} />
      </div>
      <h2 className="text-3xl font-black mb-3 tracking-tighter uppercase italic text-app-text-primary">Quiet in here</h2>
      <p className="text-app-text-muted text-sm max-w-[280px] leading-relaxed">
        {tab === 'mentions' 
          ? "When people mention you in their arguments or papers, you'll see it here."
          : tab === 'verified'
          ? "Stay tuned for updates from verified experts and top-tier debaters."
          : "You haven't received any notifications yet. Start a debate to get the conversation going."}
      </p>
    </div>
  );
}
