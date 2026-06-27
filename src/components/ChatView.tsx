import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Mail, Plus, MoreHorizontal, Settings, Send, Image as ImageIcon, Smile, BadgeCheck, MessageCircle, User as UserIcon, Shield, X, VolumeX } from 'lucide-react';
import { User, Conversation, Message } from '../types';
import { ConfirmationModal } from './ui/ConfirmationModal';

const mockUsers: User[] = [];

const initialConversations: Conversation[] = [];

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
  '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
  '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
  '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
  '🤗', '🤔', '🫣', '🤭', '🫢', '🫡', '🤫', '🫠', '🤥', '😶',
  '🫥', '😐', '🫤', '😑', '🫨', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😮‍💨', '😵', '😵‍💫', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈'
];

function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const filteredEmojis = EMOJIS.filter(e => e.includes(search) || search === '');
  
  return (
    <div className="absolute bottom-full mb-4 left-4 w-72 bg-app-card border border-app-border rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] p-4 z-50 flex flex-col gap-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted/50" />
        <input 
          type="text" 
          placeholder="Search emojis" 
          className="w-full bg-app-surface border border-app-border rounded-2xl py-2.5 pl-9 pr-3 text-sm text-app-text-primary focus:outline-none focus:border-app-text-primary/10 transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-[0.2em] pl-1">Smiley & people</p>
        <div className="grid grid-cols-8 gap-1 h-52 overflow-y-auto pr-1 scrollbar-none">
          {filteredEmojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => onSelect(emoji)}
              className="w-7.5 h-7.5 flex items-center justify-center text-lg hover:bg-app-surface rounded-xl transition-all hover:scale-110 active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatView() {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<Record<string, Message[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversationId, conversationMessages]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const currentMessages = selectedConversationId ? (conversationMessages[selectedConversationId] || []) : [];

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversationId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'self',
      text: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true
    };

    setConversationMessages(prev => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] || []), newMessage]
    }));

    setConversations(prev => prev.map(c => 
      c.id === selectedConversationId 
        ? { ...c, lastMessage: newMessage, unreadCount: 0 }
        : c
    ));

    setMessageInput('');
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };

  const handleVote = (messageId: string, optionIndex: number) => {
    if (!selectedConversationId) return;

    setConversationMessages(prev => {
      const messages = [...(prev[selectedConversationId] || [])];
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1 || !messages[messageIndex].poll) return prev;

      const message = { ...messages[messageIndex] };
      const poll = { ...message.poll! };

      if (poll.votedOption !== undefined) return prev;

      poll.votedOption = optionIndex;
      poll.options = poll.options.map((opt, i) => 
        i === optionIndex ? { ...opt, votes: opt.votes + 1 } : opt
      );
      poll.totalVotes += 1;
      message.poll = poll;

      messages[messageIndex] = message;
      return { ...prev, [selectedConversationId]: messages };
    });
  };

  return (
    <div className="flex h-full bg-app-bg">
      {/* Sidebar - Conversation List */}
      <div className="w-[360px] border-r border-app-border flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-app-text-primary">Chat</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-app-surface border border-app-border rounded-full px-3 py-1 text-xs font-medium text-app-text-muted cursor-pointer hover:text-app-text-primary transition-colors">
                All <ChevronDown size={14} />
              </div>
              <button className="p-2 rounded-full hover:bg-app-surface transition-colors text-app-text-muted hover:text-app-text-primary">
                <Mail size={18} />
              </button>
              <button className="p-2 rounded-full hover:bg-app-surface transition-colors text-app-text-muted hover:text-app-text-primary">
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={16} className="text-app-text-muted/50" />
            </div>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-app-surface border border-app-border rounded-full py-2.5 pl-11 pr-4 text-sm text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-text-primary/10 placeholder:text-app-text-muted/40 transition-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1 scrollbar-none">
          {conversations.map((conv) => {
            const user = conv.participants[0];
            const isSelected = selectedConversationId === conv.id;
            return (
              <button
                key={conv.id}
                id={`chat-item-${conv.id}`}
                onClick={() => setSelectedConversationId(conv.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 group ${
                  isSelected ? 'bg-app-card shadow-lg scale-[1.02] z-10' : 'hover:bg-app-surface'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full border border-app-border bg-app-surface flex items-center justify-center text-app-text-muted transition-colors ${isSelected ? 'text-app-text-primary border-app-text-primary/20' : ''}`}>
                    <UserIcon size={24} />
                  </div>
                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-app-success rounded-full border-2 border-app-bg" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-[14.5px] font-semibold truncate transition-colors ${isSelected ? 'text-app-text-primary' : 'text-app-text-secondary'}`}>
                        {user.name}
                      </span>
                      {user.isVerified && <BadgeCheck size={14} className="text-app-text-primary shrink-0" />}
                    </div>
                    <span className="text-[10px] text-app-text-muted/60 font-mono shrink-0 uppercase tracking-tighter">
                      {conv.lastMessage?.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[13px] truncate transition-colors ${isSelected ? 'text-app-text-secondary' : 'text-app-text-muted'}`}>
                      {conv.lastMessage?.senderId === 'self' && <span className="text-app-text-muted/60 mr-1 uppercase text-[10px] font-bold tracking-widest">You:</span>}
                      {conv.lastMessage?.text}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {selectedConversation ? (
          <div 
            key={selectedConversation.id}
            className="flex-1 flex flex-col h-full bg-app-bg"
          >
            {/* Chat Header */}
            <div className="h-20 px-8 flex items-center justify-between border-b border-app-border">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border border-app-border bg-app-surface flex items-center justify-center text-app-text-muted">
                    <UserIcon size={20} />
                  </div>
                  {selectedConversation.participants[0].isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-app-success rounded-full border-2 border-app-bg" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-app-text-primary">
                    {selectedConversation.participants[0].name}
                    {selectedConversation.participants[0].isVerified && <BadgeCheck size={16} className="text-app-text-primary fill-app-text-primary/20" />}
                  </div>
                  <p className="text-xs text-app-text-muted font-medium">@{selectedConversation.participants[0].username}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button 
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="text-app-text-muted hover:text-app-text-primary transition-colors p-1.5 hover:bg-app-surface rounded-full"
                  >
                    <MoreHorizontal size={20} />
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
                          onClick={() => { setShowReportModal(true); setShowMoreMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/5 transition-colors"
                        >
                          <Shield size={14} />
                          <span>Report @{selectedConversation.participants[0].username}</span>
                        </button>
                        <button 
                          onClick={() => { setShowMuteModal(true); setShowMoreMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors"
                        >
                          <VolumeX size={14} className="text-app-text-muted" />
                          <span>Mute Conversation</span>
                        </button>
                        <button 
                          onClick={() => { setShowBlockModal(true); setShowMoreMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/5 transition-colors"
                        >
                          <X size={14} />
                          <span>Block User</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button className="text-app-text-muted hover:text-app-text-primary transition-colors">
                  <Settings size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col scrollbar-none">
              <div className="flex flex-col items-center mb-10 shrink-0">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full mb-4 border border-app-border bg-app-surface flex items-center justify-center text-app-text-muted">
                    <UserIcon size={48} />
                  </div>
                  {selectedConversation.participants[0].isOnline && (
                    <div className="absolute bottom-4 right-1 w-5 h-5 bg-app-success rounded-full border-[3px] border-app-bg" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-app-text-primary">{selectedConversation.participants[0].name}</h2>
                <p className="text-sm text-app-text-muted">@{selectedConversation.participants[0].username}</p>
                <p className="text-xs text-app-text-secondary mt-2 max-w-xs text-center leading-relaxed">
                  Joined in January 2024 • 12.4K Followers
                </p>
              </div>

              {currentMessages.map((msg) => {
                const isSelf = msg.senderId === 'self';
                const isMod = msg.senderId === 'mod';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[80%] ${isSelf ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    <div className={`px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed tracking-tight shadow-sm ${
                      isSelf 
                        ? 'bg-app-text-primary text-app-bg rounded-tr-none' 
                        : isMod
                          ? 'bg-app-bg border border-app-border text-app-text-primary rounded-tl-none font-medium'
                          : 'bg-app-surface text-app-text-primary rounded-tl-none font-medium'
                    }`}>
                      <p className={msg.poll ? 'mb-4' : ''}>
                        {msg.text}
                      </p>

                      {msg.poll && (
                        <div className="flex flex-col gap-2 mt-2 min-w-[240px]">
                          <p className="text-xs font-black uppercase tracking-[0.2em] mb-2 text-app-text-muted/50">{msg.poll.question}</p>
                          {msg.poll.options.map((option, idx) => {
                            const percentage = Math.round((option.votes / msg.poll!.totalVotes) * 100);
                            const hasVoted = msg.poll!.votedOption !== undefined;
                            const isVoted = msg.poll!.votedOption === idx;
                            
                            return (
                              <button
                                key={idx}
                                disabled={hasVoted}
                                onClick={() => handleVote(msg.id, idx)}
                                className={`relative h-11 w-full rounded-xl border transition-all overflow-hidden font-bold flex items-center px-4 ${
                                  hasVoted 
                                    ? 'border-app-border cursor-default' 
                                    : 'border-app-text-primary/20 hover:border-app-text-primary/40 active:scale-[0.98]'
                                }`}
                              >
                                {hasVoted && (
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    className={`absolute inset-0 bg-app-text-primary shadow-[0_0_15px_rgba(255,255,255,0.1)] ${isVoted ? 'opacity-100' : 'opacity-10'}`}
                                  />
                                )}
                                <div className={`relative flex items-center justify-between w-full text-xs uppercase tracking-widest z-10 ${hasVoted && isVoted ? 'text-app-bg font-black' : 'text-app-text-primary'}`}>
                                  <span>{option.text}</span>
                                  {hasVoted && <span className="font-mono">{percentage}%</span>}
                                </div>
                              </button>
                            );
                          })}
                          <div className="flex justify-between items-center mt-2">
                             <span className="text-[9px] text-app-text-muted font-bold uppercase tracking-widest">{msg.poll.totalVotes} votes cast</span>
                             {msg.poll.votedOption !== undefined && (
                               <span className="text-[9px] text-app-text-primary font-black uppercase tracking-widest flex items-center gap-1">
                                 <div className="w-1 h-1 rounded-full bg-app-text-primary animate-pulse"></div>
                                 Support Locked
                               </span>
                             )}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-app-text-muted mt-1.5 font-mono uppercase tracking-widest px-1 opacity-70">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-6 pt-0 relative">
              {showEmojiPicker && (
                <EmojiPicker 
                  onSelect={handleEmojiSelect} 
                  onClose={() => setShowEmojiPicker(false)} 
                />
              )}
              <div className="bg-app-card border border-app-border rounded-3xl p-2 relative flex items-end gap-2 px-4 shadow-sm focus-within:border-app-text-primary/10 transition-colors">
                <button className="p-2.5 text-app-text-muted hover:text-app-text-primary mb-0.5">
                  <ImageIcon size={20} />
                </button>
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2.5 transition-colors mb-0.5 ${showEmojiPicker ? 'text-app-text-primary' : 'text-app-text-muted hover:text-app-text-primary'}`}
                >
                  <Smile size={20} />
                </button>
                <textarea 
                  placeholder="Start a message"
                  rows={1}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 bg-transparent py-3 text-sm focus:outline-none resize-none placeholder:text-app-text-muted/40 min-h-[44px] text-app-text-primary"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className={`p-2.5 transition-colors mb-0.5 ${messageInput.trim() ? 'text-app-text-primary' : 'text-app-text-primary/20'}`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-app-bg"
          >
            <div className="w-20 h-20 rounded-full bg-app-card border border-app-border flex items-center justify-center mb-6 text-app-text-muted shadow-xl">
               <MessageCircle size={36} strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-3 text-app-text-primary">Start Conversation</h2>
            <p className="text-app-text-muted text-sm max-w-sm mb-10 leading-relaxed">
              Choose from your existing conversations, or start a new one to connect with other thinkers and debaters.
            </p>
            <button className="px-8 py-3.5 bg-app-text-primary text-app-bg font-bold rounded-full hover:opacity-80 active:scale-95 shadow-md">
              New chat
            </button>
          </div>
        )}
      </div>

      {selectedConversation && (
        <>
          <ConfirmationModal 
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            onConfirm={() => {
              console.log(`Reported user from chat: ${selectedConversation.participants[0].username}`);
            }}
            title={`Report @${selectedConversation.participants[0].username}?`}
            description="If this conversation contains harassment, threats, or other violations, report it here. Our safety team will review the chat history."
            confirmLabel="Report"
            confirmVariant="danger"
            icon="report"
          />

          <ConfirmationModal 
            isOpen={showMuteModal}
            onClose={() => setShowMuteModal(false)}
            onConfirm={() => {
              console.log(`Muted chat with ${selectedConversation.participants[0].username}`);
            }}
            title="Mute this conversation?"
            description="You will stop receiving notifications for new messages in this chat. You can still see the messages if you open the conversation."
            confirmLabel="Mute"
            confirmVariant="danger"
            icon="warning"
          />

          <ConfirmationModal 
            isOpen={showBlockModal}
            onClose={() => setShowBlockModal(false)}
            onConfirm={() => {
              console.log(`Blocked user from chat: ${selectedConversation.participants[0].username}`);
            }}
            title={`Block @${selectedConversation.participants[0].username}?`}
            description="This will end the conversation and prevent this user from sending you further messages or interacting with your profile."
            confirmLabel="Block"
            confirmVariant="danger"
            icon="block"
          />
        </>
      )}
    </div>
  );
}

function ChevronDown({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
