import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/react';

export interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isVerified?: boolean;
  isMuted?: boolean;
  isCameraOn?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (name: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

interface LocalUserRecord {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isVerified?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clerkUserToAppUser(clerkUser: any): User {
  const name = clerkUser.fullName || clerkUser.username || clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';
  const username = clerkUser.username ? `@${clerkUser.username}` : `@${name.toLowerCase().replace(/\s+/g, '_')}`;
  return {
    id: clerkUser.id,
    name,
    username,
    avatar: clerkUser.imageUrl,
    isVerified: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isSignedIn } = useUser();
  const { signOut } = useClerkAuth();

  const adaptUser = (): User | null => {
    if (!isSignedIn || !clerkUser) return null;
    const storedRaw = localStorage.getItem('debate_arena_local_user');
    if (storedRaw) {
      try {
        const localUser = JSON.parse(storedRaw) as LocalUserRecord;
        if (localUser.id === clerkUser.id) {
          return { ...localUser, isMuted: false, isCameraOn: true };
        }
      } catch {}
    }
    return clerkUserToAppUser(clerkUser);
  };

  const [user, setUser] = useState<User | null>(adaptUser);

  useEffect(() => {
    setUser(adaptUser());
  }, [clerkUser, isSignedIn]);

  const login = useCallback((_name: string) => {
    window.location.href = '/login';
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('debate_arena_local_user');
    signOut();
  }, [signOut]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('debate_arena_local_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!isSignedIn, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
