import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Lock, Shield, Bell, CreditCard, 
  ChevronRight, Trash2, LogOut, Smartphone,
  Eye, EyeOff, Check, X, BadgeCheck, Camera,
  Settings
} from 'lucide-react';

type SettingsTab = 'account' | 'premium' | 'security' | 'notifications' | 'profile';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'content'>('list');

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: User, desc: 'Manage details and account status' },
    { id: 'premium' as const, label: 'Premium', icon: CreditCard, desc: 'Manage benefits' },
    { id: 'security' as const, label: 'Security & Privacy', icon: Shield, desc: 'Protect your identity' },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell, desc: 'Update preferences' },
    { id: 'profile' as const, label: 'Edit Profile', icon: BadgeCheck, desc: 'Update personality' },
  ];

  const handleTabClick = (id: SettingsTab) => {
    setActiveTab(id);
    setMobileView('content');
  };

  return (
    <div className="flex-1 h-screen overflow-hidden bg-app-bg flex flex-col md:flex-row">
      {/* Settings Navigation */}
      <div className={`w-full md:w-80 border-r border-app-border p-4 md:p-8 overflow-y-auto scrollbar-none ${mobileView === 'content' ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-2xl md:text-3xl font-black text-app-text-primary tracking-tighter mb-6 md:mb-8 px-2">Settings</h1>
        
        <div className="space-y-1 md:space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl transition-all text-left group ${
                  isActive 
                    ? 'bg-app-elevated text-app-text-primary' 
                    : 'text-app-text-muted hover:text-app-text-secondary hover:bg-app-surface'
                }`}
              >
                <div className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-colors ${isActive ? 'bg-app-text-primary text-app-bg' : 'bg-app-surface text-app-text-muted group-hover:text-app-text-secondary'}`}>
                  <Icon size={18} className="md:w-5 md:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] md:text-sm font-bold truncate">{tab.label}</div>
                  <div className="text-[9px] md:text-[10px] text-app-text-muted/60 font-medium truncate uppercase tracking-widest mt-0.5">
                    {tab.desc}
                  </div>
                </div>
                <ChevronRight size={16} className={`ml-auto transition-transform ${isActive ? 'rotate-90 text-app-text-primary' : 'text-app-text-muted/30'}`} />
              </button>
            );
          })}
        </div>

        <div className="mt-8 md:mt-12 pt-8 md:pt-12 border-t border-app-border space-y-4 px-2">
          <button className="flex items-center gap-3 text-xs md:text-sm font-bold text-app-text-muted hover:text-app-text-primary transition-colors">
            <LogOut size={16} className="md:w-[18px] md:h-[18px]" />
            Log Out
          </button>
          <div className="text-[9px] md:text-[10px] text-app-text-muted/40 font-black uppercase tracking-[0.2em]">
            v2.4.0-stable • debate.com
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className={`flex-1 overflow-y-auto p-6 md:p-12 scrollbar-none ${mobileView === 'list' ? 'hidden md:block' : 'block'}`}>
        {/* Mobile Back Button */}
        <button 
          onClick={() => setMobileView('list')}
          className="md:hidden flex items-center gap-2 text-app-text-muted hover:text-app-text-primary mb-6 font-bold text-xs uppercase tracking-widest"
        >
          <X size={16} /> Close
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab || 'empty'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-3xl"
          >
            {!activeTab ? (
              <div className="hidden md:flex flex-col items-center justify-center h-[50vh] text-center text-app-text-muted">
                <Settings size={48} className="mb-4 opacity-20" />
                <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Select a category</h3>
                <p className="text-xs font-medium mt-2">Choose a setting from the sidebar to modify your account.</p>
              </div>
            ) : (
              <>
                {activeTab === 'account' && <AccountSettings />}
                {activeTab === 'premium' && <PremiumSettings />}
                {activeTab === 'security' && <SecuritySettings />}
                {activeTab === 'notifications' && <NotificationSettings />}
                {activeTab === 'profile' && <ProfileSettings />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <h2 className="text-[11px] uppercase tracking-[0.2em] font-black text-app-text-muted mb-6">{title}</h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function SettingItem({ label, desc, action, danger }: { label: string; desc?: string; action?: React.ReactNode; danger?: boolean }) {
  return (
    <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-app-card border border-app-border flex flex-col sm:flex-row sm:items-center justify-between group hover:opacity-90 transition-all gap-4 shadow-sm">
      <div className="min-w-0 pr-0 md:pr-4">
        <div className={`text-[13px] md:text-sm font-bold mb-1 ${danger ? 'text-rose-500' : 'text-app-text-primary'}`}>{label}</div>
        {desc && <div className="text-[11px] md:text-xs text-app-text-muted font-medium leading-relaxed">{desc}</div>}
      </div>
      <div className="shrink-0 flex justify-end">
        {action}
      </div>
    </div>
  );
}

function AccountSettings() {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="space-y-2">
      <header className="mb-8 md:mb-12">
        <h1 className="text-2xl md:text-4xl font-black text-app-text-primary tracking-tighter mb-4">Account Settings</h1>
        <p className="text-app-text-muted text-sm md:text-base font-medium tracking-tight">Configure your personal information and account status.</p>
      </header>

      <Section title="Personal Information">
        <SettingItem 
          label="Email Address" 
          desc="mustafa.ejaz268@gmail.com" 
          action={
            <button className="text-xs font-bold text-app-text-muted hover:text-app-text-primary transition-colors">Change</button>
          } 
        />
        <SettingItem 
          label="Phone Number" 
          desc="No phone number linked" 
          action={
            <button className="text-xs font-bold text-app-text-muted hover:text-app-text-primary transition-colors">Add</button>
          } 
        />
      </Section>

      <Section title="Security">
        <SettingItem 
          label="Password" 
          desc="Last changed 3 months ago" 
          action={
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setShowPassword(!showPassword)}
                className="text-app-text-muted hover:text-app-text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
               <button className="px-4 py-1.5 rounded-full bg-app-text-primary/5 border border-app-border text-xs font-bold hover:bg-app-text-primary hover:text-app-bg transition-all">Change</button>
            </div>
          } 
        />
        <SettingItem 
          label="Two-factor Authentication" 
          desc="Not enabled" 
          action={
            <div className="w-12 h-6 rounded-full bg-app-surface border border-app-border flex items-center p-1 cursor-pointer hover:opacity-80 transition-all">
              <div className="w-4 h-4 rounded-full bg-app-text-muted/30"></div>
            </div>
          } 
        />
      </Section>

      <Section title="Danger Zone">
        <SettingItem 
          label="Deactivate Account" 
          desc="Temporarily disable your profile, debates, and comments." 
          danger
          action={
            <button className="px-4 py-1.5 rounded-full border border-rose-500/20 text-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all">Deactivate</button>
          } 
        />
        <SettingItem 
          label="Delete Account" 
          desc="Permanently remove your account and all associated data. This action cannot be undone." 
          danger
          action={
            <button className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors">
              <Trash2 size={20} />
            </button>
          } 
        />
      </Section>
    </div>
  );
}

function PremiumSettings() {
  return (
    <div className="space-y-2">
      <header className="mb-8 md:mb-12">
        <h1 className="text-2xl md:text-4xl font-black text-app-text-primary tracking-tighter mb-4">Debate Premium</h1>
        <p className="text-app-text-muted text-sm md:text-base font-medium tracking-tight">Support the platform and unlock advanced feature sets.</p>
      </header>

      <div className="relative p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] bg-app-card border border-amber-500/20 overflow-hidden mb-8 md:mb-12">
        <div className="absolute top-0 right-0 p-4 md:p-8">
           <BadgeCheck size={32} className="md:w-12 md:h-12 text-amber-400 opacity-20" />
        </div>
        
        <div className="relative z-10">
          <div className="px-2.5 py-1 rounded-full bg-amber-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-app-bg inline-block mb-4 md:mb-6">
            Current Tier: Free
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-app-text-primary tracking-tighter mb-3 md:mb-4">Elevate your discourse.</h2>
          <p className="text-app-text-secondary font-medium text-base md:text-lg leading-relaxed mb-6 md:mb-8 max-w-md">
            Join the elite circle of thinkers with advanced opinion intelligence, priority placement, and zero ads.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8">
            {[
              'Verified Gold Badge', 'Deep Research Reports', 
              'Zero Advertising', 'Priority Comment Placement',
              'Advanced Sentiment Analytics', 'Extended Post Length'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-app-text-secondary">
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                  <Check size={10} className="md:w-3 md:h-3 text-amber-400" />
                </div>
                <span className="text-xs md:text-sm font-bold tracking-tight">{feature}</span>
              </div>
            ))}
          </div>

          <button className="w-full py-3.5 md:py-4 rounded-2xl md:rounded-3xl bg-amber-500 text-app-bg font-black text-base md:text-lg hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/10">
            Go Premium — $9.99/mo
          </button>
        </div>
      </div>

      <Section title="Subscription Details">
        <SettingItem 
          label="Billing Cycle" 
          desc="Next billing date: N/A" 
          action={<span className="text-xs font-bold text-app-text-muted/50">None</span>}
        />
        <SettingItem 
          label="Payment Methods" 
          desc="No payment method on file" 
          action={
            <button className="text-xs font-bold text-app-text-muted hover:text-app-text-primary transition-colors">Add Card</button>
          }
        />
      </Section>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-2">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-app-text-primary tracking-tighter mb-4">Security & Privacy</h1>
        <p className="text-app-text-muted font-medium tracking-tight">Protect your digital identity and control your visibility.</p>
      </header>

      <Section title="Account Privacy">
        <SettingItem 
          label="Private Account" 
          desc="Only approved users can see your debates and activity." 
          action={
            <div className="w-12 h-6 rounded-full bg-app-surface border border-app-border flex items-center p-1 cursor-pointer hover:opacity-80 transition-all">
              <div className="w-4 h-4 rounded-full bg-app-text-muted/30"></div>
            </div>
          } 
        />
        <SettingItem 
          label="Direct Message Requests" 
          desc="Allow everyone to send you message requests." 
          action={
            <div className="w-12 h-6 rounded-full bg-app-text-primary/20 border border-app-text-primary/30 flex items-center justify-end p-1 cursor-pointer transition-colors">
              <div className="w-4 h-4 rounded-full bg-app-text-primary"></div>
            </div>
          } 
        />
      </Section>

      <Section title="Visibility">
        <SettingItem 
          label="Read Receipts" 
          desc="People will be able to see when you've read their messages." 
           action={
            <div className="w-12 h-6 rounded-full bg-app-text-primary/20 border border-app-text-primary/30 flex items-center justify-end p-1 cursor-pointer transition-colors">
              <div className="w-4 h-4 rounded-full bg-app-text-primary"></div>
            </div>
          } 
        />
        <SettingItem 
          label="Data Sharing" 
          desc="Allow your public debates to be indexed by search engines." 
           action={
            <div className="w-12 h-6 rounded-full bg-app-surface border border-app-border flex items-center p-1 cursor-pointer hover:opacity-80 transition-all">
              <div className="w-4 h-4 rounded-full bg-app-text-muted/30"></div>
            </div>
          } 
        />
      </Section>

      <Section title="Connected Apps">
        <SettingItem 
          label="Third-party Access" 
          desc="Manage which external applications have access to your account data." 
          action={
             <button className="px-4 py-1.5 rounded-full border border-app-border text-xs font-bold hover:bg-app-text-primary hover:text-app-bg transition-all">Manage</button>
          }
        />
      </Section>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-2">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-app-text-primary tracking-tighter mb-4">Notifications</h1>
        <p className="text-app-text-muted font-medium tracking-tight">Stay updated on the debates that matter to you.</p>
      </header>

      <Section title="Push Notifications">
        <SettingItem 
          label="Live Debates" 
          desc="Notify me when followed users go live." 
          action={
            <div className="w-12 h-6 rounded-full bg-app-text-primary/20 border border-app-text-primary/30 flex items-center justify-end p-1 cursor-pointer transition-colors">
              <div className="w-4 h-4 rounded-full bg-app-text-primary"></div>
            </div>
          } 
        />
        <SettingItem 
          label="Mentions & Replies" 
          desc="Be alerted when someone replies to your debates or mentions your handle." 
          action={
            <div className="w-12 h-6 rounded-full bg-app-text-primary/20 border border-app-text-primary/30 flex items-center justify-end p-1 cursor-pointer transition-colors">
              <div className="w-4 h-4 rounded-full bg-app-text-primary"></div>
            </div>
          } 
        />
      </Section>

      <Section title="Email Digests">
        <SettingItem 
          label="Weekly Trending" 
          desc="A summary of the most impactful debates of the week." 
          action={
            <div className="w-12 h-6 rounded-full bg-app-surface border border-app-border flex items-center p-1 cursor-pointer hover:opacity-80 transition-all">
              <div className="w-4 h-4 rounded-full bg-app-text-muted/30"></div>
            </div>
          } 
        />
        <SettingItem 
          label="Account Activity" 
          desc="Security alerts and major account change confirmations." 
          action={
            <div className="w-12 h-6 rounded-full bg-app-text-primary/20 border border-app-text-primary/30 flex items-center justify-end p-1 cursor-pointer transition-colors">
              <div className="w-4 h-4 rounded-full bg-app-text-primary"></div>
            </div>
          } 
        />
      </Section>
    </div>
  );
}

function ProfileSettings() {
  return (
    <div className="space-y-2">
      <header className="mb-8 md:mb-12">
        <h1 className="text-2xl md:text-4xl font-black text-app-text-primary tracking-tighter mb-4">Edit Profile</h1>
        <p className="text-app-text-muted text-sm md:text-base font-medium tracking-tight">Customize your appearance and bio on the platform.</p>
      </header>

      <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-10 mb-10 md:mb-12">
        <div className="relative group">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text-muted">
            <User size={32} className="md:w-12 md:h-12" />
          </div>
          <button className="absolute inset-0 bg-app-bg/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={20} className="md:w-6 md:h-6 text-app-text-primary" />
          </button>
        </div>
        <div className="text-center sm:text-left">
           <div className="text-lg md:text-xl font-bold text-app-text-primary mb-1">Your Profile Photo</div>
           <div className="text-xs md:text-sm text-app-text-muted mb-4 tracking-tight">Recommended: 400x400px. PNG or JPG.</div>
           <div className="flex justify-center sm:justify-start gap-3">
              <button className="px-4 py-2 rounded-xl bg-app-text-primary text-app-bg text-[11px] md:text-xs font-bold hover:opacity-80 transition-all">Upload New</button>
              <button className="px-4 py-2 rounded-xl border border-app-border text-app-text-muted text-[11px] md:text-xs font-bold hover:text-app-text-primary transition-all">Remove</button>
           </div>
        </div>
      </div>

      <Section title="Profile Information">
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] md:text-[11px] uppercase tracking-widest font-black text-app-text-muted ml-4">Display Name</label>
            <input 
              type="text" 
              defaultValue="Alex Rivera"
              className="w-full bg-app-card border border-app-border rounded-2xl md:rounded-3xl p-3.5 md:p-4 text-xs md:text-sm font-bold text-app-text-primary focus:outline-none focus:border-app-text-primary/20 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] md:text-[11px] uppercase tracking-widest font-black text-app-text-muted ml-4">Bio</label>
            <textarea 
              defaultValue="Deep tech enthusiast. Alignment ethics advocate. Exploring the intersection of AGI and human value systems."
              className="w-full bg-app-card border border-app-border rounded-2xl md:rounded-3xl p-3.5 md:p-4 text-xs md:text-sm font-bold text-app-text-primary focus:outline-none focus:border-app-text-primary/20 transition-colors h-32 md:h-32"
            ></textarea>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] md:text-[11px] uppercase tracking-widest font-black text-app-text-muted ml-4">Website</label>
            <input 
              type="text" 
              placeholder="https://yourpage.com"
              className="w-full bg-app-card border border-app-border rounded-2xl md:rounded-3xl p-3.5 md:p-4 text-xs md:text-sm font-bold text-app-text-primary focus:outline-none focus:border-app-text-primary/20 transition-colors"
            />
          </div>
        </div>
        
        <div className="pt-6 md:pt-8">
           <button className="w-full sm:w-auto px-10 py-3 rounded-2xl bg-app-text-primary text-app-bg font-black text-sm hover:opacity-80 transition-all shadow-lg active:scale-95">
             Save Changes
           </button>
        </div>
      </Section>
    </div>
  );
}
