import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Upload, X, Users, Search, 
  Check, AudioLines, Video, Vote, ArrowRight, Image as ImageIcon 
} from 'lucide-react';
import { initialCreators, type Creator } from './ExploreView';

interface CreateDebateViewProps {
  onBack: () => void;
  onCreateDebate: (debateData: any) => void;
}

const CATEGORIES = [
  'Philosophy', 'Politics', 'Artificial Intelligence', 
  'Technology', 'Religion', 'History', 'Economics', 'Science'
];

const POPULAR_TAGS = [
  'UBI', 'Ethics', 'Space', 'Future', 'Society', 
  'Elections', 'AI Tech', 'Democracy', 'Climate', 'Crypto'
];

export function CreateDebateView({ onBack, onCreateDebate }: CreateDebateViewProps) {
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Philosophy');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Extra Features
  const [duration, setDuration] = useState('30 mins');
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [allowVoting, setAllowVoting] = useState(true);
  const [maxSpeakers, setMaxSpeakers] = useState(4);
  
  // Thumbnail State
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [presetBg] = useState<string>('bg-app-surface');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Invitation State
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedCreators, setInvitedCreators] = useState<Creator[]>([]);
  const [customInvitees, setCustomInvitees] = useState<string[]>([]);
  const [customInviteeInput, setCustomInviteeInput] = useState('');

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      setThumbnailUrl(url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setThumbnailUrl(url);
    }
  };

  // Tags Handler
  const handleAddTag = (tag: string) => {
    const cleanTag = tag.trim().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Creator Invitation Handlers
  const toggleInviteCreator = (creator: Creator) => {
    if (invitedCreators.some(c => c.id === creator.id)) {
      setInvitedCreators(invitedCreators.filter(c => c.id !== creator.id));
    } else {
      setInvitedCreators([...invitedCreators, creator]);
    }
  };

  const handleAddCustomInvitee = () => {
    const name = customInvitees.includes(customInviteeInput.trim());
    if (customInviteeInput.trim() && !name) {
      setCustomInvitees([...customInvitees, customInviteeInput.trim()]);
    }
    setCustomInviteeInput('');
  };

  const handleRemoveCustomInvitee = (nameToRemove: string) => {
    setCustomInvitees(customInvitees.filter(name => name !== nameToRemove));
  };

  // Filter creator matches
  const filteredCreators = initialCreators.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const debateData = {
      id: `custom_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category: selectedCategory,
      tags: tags.length > 0 ? tags : [selectedCategory],
      isLive: true,
      started: 'Live Now',
      watching: '1',
      thumbnailUrl: thumbnailUrl,
      presetBg: presetBg,
      duration: duration,
      isAudioOnly: isAudioOnly,
      allowVoting: allowVoting,
      maxSpeakers: maxSpeakers,
      invitedCreators: invitedCreators.map(c => c.name),
      customInvitees: customInvitees,
    };

    onCreateDebate(debateData);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-app-bg">
      {/* Header */}
      <header className="h-16 md:h-20 px-4 md:px-8 border-b border-app-border flex items-center gap-4 bg-app-bg shrink-0">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg bg-app-surface hover:bg-app-card text-app-text-secondary hover:text-app-text-primary transition-all active:scale-95 border border-app-border"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-app-text-primary tracking-tight">Create Debate</h1>
          <p className="text-xs text-app-text-muted mt-0.5 font-medium">Start a new live debate on the platform</p>
        </div>
      </header>

      {/* Main Form Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Form Fields (Takes 2 columns on lg) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Title & Description Card */}
            <div className="bg-app-card border border-app-border rounded-2xl p-6 md:p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-app-text-secondary">Debate Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Will automation completely break the capital labor division?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-app-surface border border-app-border hover:border-app-border-hover focus:border-white/20 focus:bg-app-surface transition-all rounded-xl py-3 px-4 text-app-text-primary placeholder:text-app-text-muted/60 text-sm md:text-base font-semibold tracking-tight outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-app-text-secondary">Description</label>
                <textarea 
                  rows={4}
                  placeholder="Introduce the debate's central conflict, background information, rules, or key arguments for both sides."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-app-surface border border-app-border hover:border-app-border-hover focus:border-white/20 focus:bg-app-surface transition-all rounded-xl py-3 px-4 text-app-text-primary placeholder:text-app-text-muted/60 text-sm leading-relaxed outline-none resize-none"
                />
              </div>
            </div>

            {/* Category & Tags Card */}
            <div className="bg-app-card border border-app-border rounded-2xl p-6 md:p-8 space-y-6">
              {/* Category selector */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-app-text-secondary block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-200 ${
                        selectedCategory === cat 
                          ? 'bg-white text-black border-white' 
                          : 'border-app-border text-app-text-secondary hover:text-app-text-primary hover:bg-app-surface'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags select & apply */}
              <div className="space-y-3 border-t border-app-border pt-6">
                <label className="text-xs font-semibold text-app-text-secondary block">Tags ({tags.length})</label>
                
                {/* Popular suggestions */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {POPULAR_TAGS.map((popTag) => {
                    const isSelected = tags.includes(popTag);
                    return (
                      <button
                        key={popTag}
                        type="button"
                        onClick={() => isSelected ? handleRemoveTag(popTag) : handleAddTag(popTag)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                          isSelected 
                            ? 'bg-app-surface border-app-border text-app-text-primary' 
                            : 'border-app-border/30 text-app-text-muted hover:text-app-text-secondary'
                        }`}
                      >
                        #{popTag}
                      </button>
                    );
                  })}
                </div>

                {/* Custom tags input */}
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Enter custom tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    className="flex-1 bg-app-surface border border-app-border rounded-xl py-2 px-3 text-app-text-primary placeholder:text-app-text-muted/60 text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    className="px-4 py-2 bg-app-surface border border-app-border hover:border-app-border-hover rounded-xl text-xs font-semibold text-app-text-primary transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Active Tags list */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2">
                    {tags.map((tag) => (
                      <span 
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-app-surface border border-app-border text-xs text-app-text-secondary font-medium"
                      >
                        #{tag}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveTag(tag)}
                          className="text-app-text-muted hover:text-app-text-primary transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Extra Structural Configurations */}
            <div className="bg-app-card border border-app-border rounded-2xl p-6 md:p-8 space-y-6">
              <h2 className="text-sm font-semibold text-app-text-primary">Debate Settings</h2>
              
              <div className="divide-y divide-app-border/40">
                {/* Participation mode */}
                <div className="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-app-text-primary">Participation Mode</h3>
                    <p className="text-[11px] text-app-text-muted mt-0.5">Stream video feed or host as audio-only broadcast</p>
                  </div>
                  <div className="bg-app-surface border border-app-border p-1 rounded-full flex gap-1 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsAudioOnly(false)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        !isAudioOnly 
                          ? 'bg-white/10 text-white' 
                          : 'text-app-text-muted hover:text-app-text-secondary'
                      }`}
                    >
                      Video + Audio
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAudioOnly(true)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isAudioOnly 
                          ? 'bg-white/10 text-white' 
                          : 'text-app-text-muted hover:text-app-text-secondary'
                      }`}
                    >
                      Audio-Only
                    </button>
                  </div>
                </div>

                {/* Format / Duration */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-app-text-primary">Duration Limit</h3>
                    <p className="text-[11px] text-app-text-muted mt-0.5">Maximum cap on active debate session duration</p>
                  </div>
                  <div className="bg-app-surface border border-app-border p-1 rounded-full flex gap-1 self-start sm:self-auto shrink-0 overflow-x-auto scrollbar-none">
                    {['15 mins', '30 mins', '60 mins', 'Open'].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setDuration(dur)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                          duration === dur 
                            ? 'bg-white/10 text-white' 
                            : 'text-app-text-muted hover:text-app-text-secondary'
                        }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speaker Limits */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-app-text-primary">Maximum Panelists</h3>
                    <p className="text-[11px] text-app-text-muted mt-0.5">Cap on simultaneous interactive speakers</p>
                  </div>
                  <div className="bg-app-surface border border-app-border p-1 rounded-full flex gap-1 self-start sm:self-auto shrink-0">
                    {[2, 4, 6, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMaxSpeakers(num)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                          maxSpeakers === num 
                            ? 'bg-white/10 text-white' 
                            : 'text-app-text-muted hover:text-app-text-secondary'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voting Toggle */}
                <div className="py-4 last:pb-0 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-app-text-primary">Audience Voting</h3>
                    <p className="text-[11px] text-app-text-muted mt-0.5">Enable real-time opinion polls and sentiment tracking</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowVoting(!allowVoting)}
                    className={`relative w-10 h-6 rounded-full transition-colors duration-200 outline-none flex items-center p-0.5 border shrink-0 ${
                      allowVoting 
                        ? 'bg-white/10 border-white/20 justify-end' 
                        : 'bg-neutral-900 border-white/5 justify-start'
                    }`}
                  >
                    <motion.div 
                      layout
                      className={`w-4 h-4 rounded-full transition-all ${
                        allowVoting ? 'bg-white' : 'bg-neutral-600'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Thumbnail & Invitation Controls */}
          <div className="space-y-6">
            
            {/* Thumbnail Uploader Card */}
            <div className="bg-app-card border border-app-border rounded-2xl p-6 md:p-8 space-y-4">
              <label className="text-xs font-semibold text-app-text-secondary block">Thumbnail</label>
              
              {/* Image Preview Box */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all ${
                  isDragging 
                    ? 'border-white bg-app-surface' 
                    : thumbnailUrl 
                      ? 'border-transparent' 
                      : 'border-app-border hover:border-app-border-hover bg-app-surface'
                }`}
              >
                {thumbnailUrl ? (
                  <>
                    <img 
                      src={thumbnailUrl} 
                      alt="Thumbnail preview" 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                      <p className="text-white text-xs font-semibold flex items-center gap-1.5">
                        <Upload size={14} /> Change Image
                      </p>
                    </div>
                  </>
                ) : (
                  /* If preset bg option is chosen */
                  <div className={`absolute inset-0 ${presetBg} flex flex-col items-center justify-center`}>
                    <ImageIcon size={24} className="text-app-text-muted mb-2" />
                    <p className="text-xs font-bold text-app-text-secondary">Drag & drop or click</p>
                    <p className="text-[10px] text-app-text-muted/60 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                )}
                
                {/* Invisible file input */}
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {thumbnailUrl && (
                <button
                  type="button"
                  onClick={() => setThumbnailUrl(null)}
                  className="w-full py-2 bg-app-surface hover:bg-app-card border border-app-border rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-400 transition-colors"
                >
                  Clear Custom Thumbnail
                </button>
              )}
            </div>

            {/* Invite Speakers Card */}
            <div className="bg-app-card border border-app-border rounded-2xl p-6 md:p-8 space-y-4">
              <label className="text-xs font-semibold text-app-text-secondary block">Invite speakers</label>
              
              {/* Creator Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" />
                <input 
                  type="text"
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-app-surface border border-app-border rounded-xl py-2 pl-9 pr-3 text-xs text-app-text-primary placeholder:text-app-text-muted/60 outline-none"
                />
              </div>

              {/* Creator Results list (Max 3 shown for elegance, scrollable) */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none">
                {filteredCreators.map((creator) => {
                  const isInvited = invitedCreators.some(c => c.id === creator.id);
                  return (
                    <div 
                      key={creator.id}
                      onClick={() => toggleInviteCreator(creator)}
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                        isInvited 
                          ? 'bg-app-surface border-white/10' 
                          : 'border-transparent bg-app-surface/20 hover:bg-app-surface/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-app-card border border-app-border flex items-center justify-center text-[10px] font-bold text-app-text-secondary shrink-0 overflow-hidden">
                          {creator.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-app-text-primary truncate">{creator.name}</p>
                          <p className="text-[10px] text-app-text-muted truncate">{creator.handle}</p>
                        </div>
                      </div>
                      
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isInvited 
                          ? 'bg-white border-white text-black' 
                          : 'border-app-border'
                      }`}>
                        {isInvited && <Check size={10} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Invitee Name adding */}
              <div className="space-y-2 border-t border-app-border pt-4">
                <span className="text-xs text-app-text-muted block">Invite external speaker by name</span>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="e.g. Professor Peterson"
                    value={customInviteeInput}
                    onChange={(e) => setCustomInviteeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomInvitee();
                      }
                    }}
                    className="flex-1 bg-app-surface border border-app-border rounded-xl py-2 px-3 text-xs text-app-text-primary placeholder:text-app-text-muted/60 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomInvitee}
                    className="px-3 py-2 bg-app-surface border border-app-border hover:border-app-border-hover rounded-xl text-xs font-bold text-app-text-primary transition-colors"
                  >
                    Invite
                  </button>
                </div>
              </div>

              {/* Combined Invitee summary */}
              {(invitedCreators.length > 0 || customInvitees.length > 0) && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs text-app-text-muted block">Pending invitations ({invitedCreators.length + customInvitees.length})</span>
                  <div className="flex flex-wrap gap-1">
                    {invitedCreators.map((c) => (
                      <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-surface border border-app-border text-[10px] text-app-text-secondary">
                        {c.name}
                        <button type="button" onClick={() => toggleInviteCreator(c)} className="hover:text-white">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    {customInvitees.map((name) => (
                      <span key={name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-surface border border-app-border text-[10px] text-app-text-secondary">
                        {name}
                        <button type="button" onClick={() => handleRemoveCustomInvitee(name)} className="hover:text-white">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action Block */}
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <span className="text-sm font-bold">Create Debate</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
