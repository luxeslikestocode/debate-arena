// API Client for Debate Arena
/// <reference types="vite/client" />
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'ws://localhost:3001';

export interface Debate {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  isLive: boolean;
  started: string;
  watching: string;
  thumbnailUrl?: string;
  presetBg?: string;
  duration?: string;
  isAudioOnly?: boolean;
  allowVoting?: boolean;
  maxSpeakers?: number;
  invitedCreators?: string[];
  customInvitees?: string[];
  creatorId?: string;
  createdAt?: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: number;
  type: 'msg' | 'system';
}

export interface Reaction {
  id: string;
  userId: string;
  userName: string;
  emoji: string;
  timestamp: number;
}

// Debate API
export async function fetchDebates(): Promise<Debate[]> {
  try {
    const response = await fetch(`${API_BASE}/api/debates`);
    if (!response.ok) throw new Error('Failed to fetch debates');
    return response.json();
  } catch {
    // Fallback to localStorage for demo
    const stored = localStorage.getItem('debates');
    return stored ? JSON.parse(stored) : [];
  }
}

export async function fetchDebate(id: string): Promise<Debate | null> {
  try {
    const response = await fetch(`${API_BASE}/api/debates/${id}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    const stored = localStorage.getItem('debates');
    const debates = stored ? JSON.parse(stored) : [];
    return debates.find((d: Debate) => d.id === id) || null;
  }
}

export async function createDebate(debate: Debate): Promise<Debate> {
  try {
    const response = await fetch(`${API_BASE}/api/debates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(debate),
    });
    if (!response.ok) throw new Error('Failed to create debate');
    return response.json();
  } catch {
    // Fallback to localStorage
    const stored = localStorage.getItem('debates');
    const debates = stored ? JSON.parse(stored) : [];
    debates.unshift(debate);
    localStorage.setItem('debates', JSON.stringify(debates));
    return debate;
  }
}

export async function deleteDebate(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/debates/${id}`, { method: 'DELETE' });
  } catch {
    const stored = localStorage.getItem('debates');
    const debates = stored ? JSON.parse(stored) : [];
    localStorage.setItem('debates', JSON.stringify(debates.filter((d: Debate) => d.id !== id)));
  }
}

// Signaling URL getter
export function getSignalingUrl(): string {
  return SIGNALING_URL;
}

// Generate room ID from debate ID
export function getRoomId(debateId: string): string {
  return `debate_${debateId}`;
}