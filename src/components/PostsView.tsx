import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, User, MoreHorizontal, 
  Heart, Share2, Repeat2, BarChart3, Bookmark,
  BadgeCheck, ArrowUpRight, Play, X, Send, Shield, VolumeX
} from 'lucide-react';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { useAuth } from '../lib/auth';
import { generateId } from '../utils/helpers';

interface Comment {
  id: string;
  author: string;
  username: string;
  content: string;
  time: string;
}

interface Post {
  id: string;
  author: string;
  username: string;
  time: string;
  content: string;
  type?: string;
  likes: number;
  commentsCount: number;
  shares: number;
  views: string;
  isVerified: boolean;
  userId?: string;
  hasThread?: boolean;
  media?: {
    type: 'image' | 'video' | 'clip';
    url: string;
    caption?: string;
  };
  comments: Comment[];
}

function PostCard({ post }: { post: Post }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showMuteModal, setShowMuteModal] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReposted(!isReposted);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setNewComment('');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  return (
    <div className="p-4 md:p-6 hover:bg-app-surface transition-all cursor-pointer group relative border-b border-app-border">
      <div className="flex gap-4">
        {/* Left: Avatar & Connection Line */}
        <div className="flex flex-col items-center shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-app-surface flex items-center justify-center text-app-text-muted border border-app-border shrink-0 group-hover:border-app-text-primary/20 transition-colors">
            <User size={20} className="md:size-24" />
          </div>
          {post.hasThread && (
            <div className="w-0.5 grow mt-2 bg-app-border rounded-full mb-1"></div>
          )}
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="font-bold text-[15px] md:text-base text-app-text-primary truncate hover:underline">{post.author}</span>
              {post.isVerified && (
                <BadgeCheck size={16} className="text-app-text-primary fill-app-text-primary/20" stroke="black" />
              )}
              <span className="text-app-text-muted text-sm md:text-base truncate">{post.username}</span>
              <span className="text-app-text-muted/40">·</span>
              <span className="text-app-text-muted text-sm md:text-base">{post.time}</span>
            </div>
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}
                className="text-app-text-muted hover:text-app-text-primary transition-colors p-1.5 hover:bg-app-surface rounded-full"
              >
                <MoreHorizontal size={18} />
              </button>
              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-56 bg-app-card border border-app-border rounded-2xl shadow-2xl overflow-hidden py-2 z-50"
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowReportModal(true); setShowMoreMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/5 transition-colors"
                    >
                      <Shield size={14} />
                      <span>Report Post</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowMuteModal(true); setShowMoreMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors"
                    >
                      <VolumeX size={14} className="text-app-text-muted" />
                      <span>Mute {post.username}</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowBlockModal(true); setShowMoreMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/5 transition-colors"
                    >
                      <X size={14} />
                      <span>Block {post.username}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <p className="text-[15px] md:text-[17px] text-app-text-secondary leading-relaxed font-normal">
            {post.content}
          </p>

          {/* Media Content */}
          {post.media && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-app-border relative group/media">
              {post.media.type === 'clip' || post.media.type === 'video' ? (
                <div className="relative aspect-video bg-app-surface flex items-center justify-center">
                  <img 
                    src={post.media.url} 
                    className="w-full h-full object-cover opacity-60" 
                    alt="Clip thumbnail"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/media:bg-black/40 transition-all">
                    <div className="w-12 h-12 rounded-full bg-app-text-primary/10 backdrop-blur-md border border-app-text-primary/20 flex items-center justify-center text-app-text-primary scale-100 group-hover/media:scale-110 transition-transform">
                      <Play size={24} fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest text-white">
                    CLIP • 0:45
                  </div>
                </div>
              ) : (
                <img 
                  src={post.media.url} 
                  className="w-full h-auto object-cover max-h-[500px]" 
                  alt="Post media"
                />
              )}
              {post.media.caption && (
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs font-bold text-white tracking-tight">{post.media.caption}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions Row */}
          <div className="flex items-center justify-between pt-2 max-w-md text-app-text-muted">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(!isCommentsOpen); }}
              className="group/action flex items-center gap-2 hover:text-app-text-primary transition-all outline-none"
            >
               <div className="p-2 rounded-full group-hover/action:bg-app-surface">
                  <MessageSquare size={18} />
               </div>
               <span className="text-xs font-medium">{formatNumber(post.commentsCount)}</span>
            </button>
            <button 
              onClick={handleRepost}
              className={`group/action flex items-center gap-2 transition-all outline-none ${isReposted ? 'text-emerald-400' : 'hover:text-emerald-400'}`}
            >
               <div className={`p-2 rounded-full ${isReposted ? 'bg-emerald-400/10' : 'group-hover/action:bg-emerald-400/10'}`}>
                  <Repeat2 size={18} />
               </div>
               <span className="text-xs font-medium">{formatNumber(post.shares)}</span>
            </button>
            <button 
              onClick={handleLike}
              className={`group/action flex items-center gap-2 transition-all outline-none ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
            >
               <div className={`p-2 rounded-full ${isLiked ? 'bg-rose-500/10' : 'group-hover/action:bg-rose-500/10'}`}>
                  <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
               </div>
               <span className="text-xs font-medium">{formatNumber(post.likes)}</span>
            </button>
            <button className="group/action flex items-center gap-2 hover:opacity-80 transition-all outline-none text-app-text-muted">
               <div className="p-2 rounded-full group-hover/action:bg-app-surface">
                  <BarChart3 size={18} />
               </div>
               <span className="text-xs font-medium">{post.views}</span>
            </button>
            <div className="flex items-center relative gap-1">
               <button className="p-2 rounded-full hover:bg-app-surface hover:text-app-text-primary transition-all outline-none text-app-text-muted">
                  <Bookmark size={18} />
               </button>
               <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                  className="p-2 rounded-full hover:bg-app-surface hover:text-app-text-primary transition-all outline-none text-app-text-muted"
                >
                    <Share2 size={18} />
                </button>
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full right-0 mb-2 w-48 bg-app-card border border-app-border rounded-2xl shadow-2xl overflow-hidden py-2 z-50"
                    >
                      <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors">
                        <Send size={14} />
                        <span>Send via DM</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors">
                        <ArrowUpRight size={14} />
                        <span>Copy link</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors">
                        <Share2 size={14} />
                        <span>Share on X</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
               </div>
            </div>
          </div>

          {/* Interactive Comment Section */}
          <AnimatePresence>
            {isCommentsOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-app-surface rounded-2xl border border-app-border mt-4"
              >
                <div className="p-4 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-app-elevated flex items-center justify-center shrink-0">
                      <User size={14} className="text-app-text-muted" />
                    </div>
                    <div className="flex-1 relative">
                      <textarea 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Post your reply"
                        className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm py-1.5 resize-none placeholder:text-app-text-muted text-app-text-primary min-h-[40px]"
                        rows={1}
                        autoFocus
                      />
                      <div className="flex justify-end pt-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAddComment(); }}
                          disabled={!newComment.trim()}
                          className="px-4 py-1.5 rounded-full bg-app-text-primary text-app-bg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-all"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>

                  {post.comments && post.comments.length > 0 && (
                    <div className="pt-4 border-t border-app-border space-y-4">
                      {post.comments.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-app-elevated flex items-center justify-center shrink-0">
                            <User size={14} className="text-app-text-muted" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-app-text-primary">{comment.author}</span>
                              <span className="text-app-text-muted">{comment.username}</span>
                              <span className="text-app-text-muted/40">·</span>
                              <span className="text-app-text-muted/40">{comment.time}</span>
                            </div>
                            <p className="text-sm text-app-text-secondary mt-1">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onConfirm={() => {
          console.log(`Reported post from ${post.username}`);
        }}
        title="Report this post?"
        description="Help us keep Debate.com safe. If this post violates our community standards, our team will investigate."
        confirmLabel="Report"
        confirmVariant="danger"
        icon="report"
      />

      <ConfirmationModal 
        isOpen={showMuteModal}
        onClose={() => setShowMuteModal(false)}
        onConfirm={() => {
          console.log(`Muted ${post.username}`);
        }}
        title={`Mute ${post.username}?`}
        description={`You will no longer see posts or notifications from ${post.username}. You can unmute them later from your settings.`}
        confirmLabel="Mute"
        confirmVariant="danger"
        icon="warning"
      />

      <ConfirmationModal 
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={() => {
          console.log(`Blocked ${post.username}`);
        }}
        title={`Block ${post.username}?`}
        description={`This user will be blocked from your feed, messages, and debates. This action is reversible in settings.`}
        confirmLabel="Block"
        confirmVariant="danger"
        icon="block"
      />
    </div>
  );
}

export function PostsView() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');

  useEffect(() => {
    setPosts([]);
    setIsLoading(false);
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: generateId(),
      author: 'User',
      username: '@user',
      content: newPostContent,
      type: 'post',
      likes: 0,
      commentsCount: 0,
      shares: 0,
      views: "0",
      isVerified: false,
      time: 'Now',
      comments: []
    };

    setPosts(prev => [newPost, ...prev]);
    setNewPostContent('');
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-app-bg scrollbar-none">
      <div className="max-w-2xl mx-auto border-x border-app-border min-h-full">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-app-bg/80 backdrop-blur-xl border-b border-app-border py-4 px-6 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-app-text-primary">For You</h1>
            <div className="text-[10px] text-app-text-muted uppercase font-black mt-0.5 tracking-widest">Global Feed</div>
          </div>
          <div className="flex items-center gap-4">
             <button className="text-app-text-muted hover:text-app-text-primary transition-all p-2 rounded-full hover:bg-app-surface">
                <BarChart3 size={20} />
             </button>
          </div>
        </header>

        {/* Post Creation Area */}
        <div className="p-6 border-b border-app-border flex gap-4 transition-all duration-300 focus-within:bg-app-surface/40">
          <div className="w-12 h-12 rounded-full bg-app-surface border border-app-border flex items-center justify-center shrink-0">
            <User size={24} className="text-app-text-muted" />
          </div>
          <div className="flex-1 relative group/input">
            <textarea 
              id="main-post-textarea"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleCreatePost();
                }
              }}
              placeholder="What's happening?"
              className="w-full bg-transparent border-none focus:ring-0 outline-none text-xl font-medium placeholder:text-app-text-muted text-app-text-primary min-h-[100px] resize-none"
            />
            <div className="flex items-center justify-between pt-4 border-t border-app-border">
              <div className="flex gap-2">
                {[Play, MessageSquare, Heart, Share2].map((Icon, idx) => (
                  <button 
                    key={idx} 
                    className="p-2 rounded-full text-app-text-muted hover:bg-app-surface transition-colors"
                  >
                    <Icon size={18} />
                  </button>
                ))}
              </div>
              <button 
                onClick={handleCreatePost}
                disabled={!newPostContent.trim()}
                className="px-6 py-2 bg-white text-black font-black rounded-full text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="divide-y divide-app-border pb-32">
          {isLoading ? (
             <div className="p-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
             </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center text-app-text-muted">
              No posts yet. Be the first to start a discourse.
            </div>
          ) : (
            posts.map((post, i) => (
              <React.Fragment key={post.id}>
                <PostCard post={post} />
              </React.Fragment>
            ))
          )}
          
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-12 h-12 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-muted">
                <BarChart3 size={24} />
             </div>
             <div>
                <h3 className="text-app-text-primary font-bold">You're all caught up</h3>
                <p className="text-app-text-muted text-sm mt-1">Check back later for more insights from the future.</p>
             </div>
             <button 
              onClick={() => {
                const element = document.querySelector('.overflow-y-auto');
                element?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-sm font-bold text-app-text-primary hover:underline"
            >
               Back to top
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}


