import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isHost: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  isSpeaking: boolean;
  role: 'host' | 'speaker' | 'viewer';
}

interface DebateRoom {
  id: string;
  title: string;
  hostId: string;
  users: Map<string, User>;
  queue: User[];
  speakers: User[];
  maxSpeakers: number;
  isAudioOnly: boolean;
  timer: {
    duration: number; // in seconds
    remaining: number;
    isRunning: boolean;
    currentRound: string;
  };
  createdAt: number;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave' | 'user-joined' | 'user-left' | 'user-updated' | 'user-update' | 
        'queue-update' | 'speaker-update' | 'timer-update' | 'host-action' | 'chat' | 'reaction' | 'sync' | 'error';
  payload: any;
  from?: string;
  to?: string;
  roomId?: string;
}

const rooms = new Map<string, DebateRoom>();
const userConnections = new Map<string, { ws: WebSocket; roomId: string; userId: string }>();

// In-memory debate storage (shared across users)
interface DebateRecord {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  isLive: boolean;
  started?: string;
  watching?: string;
  creatorId?: string;
  createdAt?: number;
  isAudioOnly?: boolean;
  maxSpeakers?: number;
  allowVoting?: boolean;
  duration?: string;
}

const debates = new Map<string, DebateRecord>();

// Helper: parse URL path and body
function parseUrl(url: string | undefined): { path: string; query: Record<string, string> } {
  if (!url) return { path: '/', query: {} };
  const [path, qs] = url.split('?');
  const query: Record<string, string> = {};
  if (qs) {
    qs.split('&').forEach(p => {
      const [k, v] = p.split('=');
      query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  }
  return { path, query };
}

function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: string) => body += chunk);
    req.on('end', () => resolve(body));
  });
}

function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Create HTTP server for health checks + REST API
const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  const cors = corsHeaders(origin || undefined);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  const { path, query } = parseUrl(req.url);
  const headers = { 'Content-Type': 'application/json', ...cors };

  if (req.method === 'GET' && path === '/health') {
    res.writeHead(200, headers);
    res.end(JSON.stringify({ status: 'ok', rooms: rooms.size, debates: debates.size }));
    return;
  }

  // GET /api/debates — list all debates
  if (req.method === 'GET' && path === '/api/debates') {
    res.writeHead(200, headers);
    res.end(JSON.stringify(Array.from(debates.values())));
    return;
  }

  // POST /api/debates — create a debate
  if (req.method === 'POST' && path === '/api/debates') {
    const body = await readBody(req);
    try {
      const data = JSON.parse(body);
      if (!data.id) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: 'Debate must have an id' }));
        return;
      }
      const record: DebateRecord = {
        id: data.id,
        title: data.title || 'Untitled Debate',
        description: data.description,
        category: data.category,
        tags: data.tags || [],
        isLive: data.isLive !== false,
        started: data.started || 'Live Now',
        watching: data.watching || '1',
        creatorId: data.creatorId,
        createdAt: data.createdAt || Date.now(),
        isAudioOnly: data.isAudioOnly || false,
        maxSpeakers: data.maxSpeakers || 4,
        allowVoting: data.allowVoting !== false,
        duration: data.duration,
      };
      debates.set(data.id, record);
      res.writeHead(201, headers);
      res.end(JSON.stringify(record));
    } catch {
      res.writeHead(400, headers);
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
    return;
  }

  // GET /api/debates/:id — get a single debate
  const debateMatch = path.match(/^\/api\/debates\/(.+)$/);
  if (req.method === 'GET' && debateMatch) {
    const id = decodeURIComponent(debateMatch[1]);
    const debate = debates.get(id);
    if (!debate) {
      res.writeHead(404, headers);
      res.end(JSON.stringify({ error: 'Debate not found' }));
      return;
    }
    res.writeHead(200, headers);
    res.end(JSON.stringify(debate));
    return;
  }

  // DELETE /api/debates/:id — delete a debate
  if (req.method === 'DELETE' && debateMatch) {
    const id = decodeURIComponent(debateMatch[1]);
    debates.delete(id);
    res.writeHead(200, headers);
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // 404 for everything else
  res.writeHead(404, headers);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const wss = new WebSocketServer({ server });

function createRoom(roomId: string, title: string, hostId: string, hostName: string, hostUsername: string, options: any = {}): DebateRoom {
  const room: DebateRoom = {
    id: roomId,
    title,
    hostId,
    users: new Map(),
    queue: [],
    speakers: [],
    maxSpeakers: options.maxSpeakers || 4,
    isAudioOnly: options.isAudioOnly || false,
    timer: {
      duration: options.duration || 300, // 5 minutes default
      remaining: options.duration || 300,
      isRunning: false,
      currentRound: 'Opening Statements',
    },
    createdAt: Date.now(),
  };

  const host: User = {
    id: hostId,
    name: hostName,
    username: hostUsername,
    isHost: true,
    isMuted: false,
    isCameraOn: !options.isAudioOnly,
    isSpeaking: false,
    role: 'host',
  };

  room.users.set(hostId, host);
  room.speakers.push(host);
  rooms.set(roomId, room);

  return room;
}

function leaveRoom(roomId: string, userId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const user = room.users.get(userId);
  if (!user) return;

  // Remove from speakers if they were speaking
  room.speakers = room.speakers.filter(u => u.id !== userId);
  
  // Remove from queue
  room.queue = room.queue.filter(u => u.id !== userId);
  
  // Remove from users
  room.users.delete(userId);

  // Notify others
  broadcastToRoom(roomId, {
    type: 'user-left',
    payload: { userId },
  }, userId);

  // If host left, assign new host or close room
  if (user.isHost) {
    const remainingUsers = Array.from(room.users.values());
    if (remainingUsers.length > 0) {
      const newHost = remainingUsers[0];
      newHost.isHost = true;
      newHost.role = 'host';
      
      broadcastToRoom(roomId, {
        type: 'host-action',
        payload: { action: 'new-host', newHostId: newHost.id },
      });
    } else {
      // No users left, clean up room after delay
      setTimeout(() => {
        const r = rooms.get(roomId);
        if (r && r.users.size === 0) {
          rooms.delete(roomId);
        }
      }, 60000);
    }
  }

  // Clean up empty rooms
  if (room.users.size === 0) {
    rooms.delete(roomId);
  }
}

function broadcastToRoom(roomId: string, message: SignalingMessage, excludeUserId?: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const data = JSON.stringify(message);
  
  room.users.forEach((user, id) => {
    if (id !== excludeUserId) {
      const conn = userConnections.get(id);
      if (conn && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(data);
      }
    }
  });
}

function sendToUser(userId: string, message: SignalingMessage): void {
  const conn = userConnections.get(userId);
  if (conn && conn.ws.readyState === WebSocket.OPEN) {
    conn.ws.send(JSON.stringify(message));
  }
}

function handleJoin(ws: WebSocket, message: SignalingMessage): void {
  const { roomId, userId, user } = message.payload;
  
  if (!roomId || !userId || !user) {
    sendToUser(userId, { type: 'error', payload: { message: 'Invalid join payload' } });
    return;
  }

  let room = rooms.get(roomId);
  
  // Create room if it doesn't exist (for new debates)
  if (!room) {
    room = createRoom(roomId, 'New Debate', userId, user.name, user.username, {
      maxSpeakers: 4,
      isAudioOnly: false,
      duration: 300,
    });
  }

  // Check if user already in room
  const existingUser = room.users.get(userId);
  if (existingUser) {
    // Update existing user
    existingUser.name = user.name;
    existingUser.username = user.username;
    existingUser.avatar = user.avatar;
  } else {
    // Add new user
    const newUser: User = {
      id: userId,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      isHost: userId === room.hostId,
      isMuted: false,
      isCameraOn: !room.isAudioOnly,
      isSpeaking: false,
      role: userId === room.hostId ? 'host' : 'viewer',
    };
    room.users.set(userId, newUser);
  }

  // Store connection
  userConnections.set(userId, { ws, roomId, userId });

  // Send current room state to joining user
  const roomState = {
    roomId: room.id,
    title: room.title,
    hostId: room.hostId,
    users: Array.from(room.users.values()),
    queue: room.queue,
    speakers: room.speakers,
    maxSpeakers: room.maxSpeakers,
    isAudioOnly: room.isAudioOnly,
    timer: room.timer,
    yourUserId: userId,
  };

  sendToUser(userId, { type: 'sync', payload: roomState });

  // Notify others
  broadcastToRoom(roomId, {
    type: 'user-joined',
    payload: { user: room.users.get(userId) },
  }, userId);
}

function handleOffer(message: SignalingMessage): void {
  const { to, payload } = message;
  if (to) {
    sendToUser(to, { type: 'offer', payload, from: message.from });
  }
}

function handleAnswer(message: SignalingMessage): void {
  const { to, payload } = message;
  if (to) {
    sendToUser(to, { type: 'answer', payload, from: message.from });
  }
}

function handleCandidate(message: SignalingMessage): void {
  const { to, payload } = message;
  if (to) {
    sendToUser(to, { type: 'candidate', payload, from: message.from });
  }
}

function handleHostAction(ws: WebSocket, message: SignalingMessage): void {
  const { roomId, userId, action, targetUserId, data } = message.payload;
  const room = rooms.get(roomId);
  if (!room) return;

  // Actions that ANY user can take (not just host)
  if (action === 'request-to-speak' || action === 'cancel-request' || action === 'user-update') {
    switch (action) {
      case 'request-to-speak': {
        const requester = room.users.get(userId);
        if (requester && requester.role === 'viewer') {
          const inQueue = room.queue.some(u => u.id === userId);
          const isSpeaker = room.speakers.some(u => u.id === userId);
          
          if (!inQueue && !isSpeaker) {
            room.queue.push({ ...requester, role: 'viewer' });
            broadcastToRoom(roomId, {
              type: 'queue-update',
              payload: { queue: room.queue },
            });
          }
        }
        break;
      }
      case 'cancel-request': {
        room.queue = room.queue.filter(u => u.id !== userId);
        broadcastToRoom(roomId, {
          type: 'queue-update',
          payload: { queue: room.queue },
        });
        break;
      }
    }
    return;
  }

  const user = room.users.get(userId);
  if (!user || !user.isHost) {
    sendToUser(userId, { type: 'error', payload: { message: 'Not authorized' } });
    return;
  }

  switch (action) {
    case 'mute':
    case 'unmute': {
      const target = room.users.get(targetUserId);
      if (target) {
        target.isMuted = action === 'mute';
        broadcastToRoom(roomId, {
          type: 'user-updated',
          payload: { userId: targetUserId, isMuted: target.isMuted },
        });
      }
      break;
    }
    case 'remove-speaker': {
      const target = room.users.get(targetUserId);
      if (target) {
        target.role = 'viewer';
        target.isSpeaking = false;
        room.speakers = room.speakers.filter(u => u.id !== targetUserId);
        
        broadcastToRoom(roomId, {
          type: 'speaker-update',
          payload: { speakers: room.speakers },
        });
        broadcastToRoom(roomId, {
          type: 'user-updated',
          payload: { userId: targetUserId, role: 'viewer', isSpeaking: false },
        });
      }
      break;
    }
    case 'admit-from-queue': {
      const queueIndex = room.queue.findIndex(u => u.id === targetUserId);
      if (queueIndex !== -1 && room.speakers.length < room.maxSpeakers) {
        const [admitted] = room.queue.splice(queueIndex, 1);
        admitted.role = 'speaker';
        admitted.isSpeaking = false;
        room.speakers.push(admitted);
        room.users.set(targetUserId, admitted);
        
        broadcastToRoom(roomId, {
          type: 'queue-update',
          payload: { queue: room.queue },
        });
        broadcastToRoom(roomId, {
          type: 'speaker-update',
          payload: { speakers: room.speakers },
        });
        broadcastToRoom(roomId, {
          type: 'user-updated',
          payload: { userId: targetUserId, role: 'speaker' },
        });
      }
      break;
    }
    case 'remove-from-queue': {
      room.queue = room.queue.filter(u => u.id !== targetUserId);
      broadcastToRoom(roomId, {
        type: 'queue-update',
        payload: { queue: room.queue },
      });
      break;
    }
    case 'start-timer': {
      room.timer.isRunning = true;
      broadcastToRoom(roomId, {
        type: 'timer-update',
        payload: { timer: room.timer },
      });
      break;
    }
    case 'pause-timer': {
      room.timer.isRunning = false;
      broadcastToRoom(roomId, {
        type: 'timer-update',
        payload: { timer: room.timer },
      });
      break;
    }
    case 'reset-timer': {
      room.timer.remaining = room.timer.duration;
      room.timer.isRunning = false;
      broadcastToRoom(roomId, {
        type: 'timer-update',
        payload: { timer: room.timer },
      });
      break;
    }
    case 'set-timer': {
      room.timer.duration = data?.duration || 300;
      room.timer.remaining = data?.duration || 300;
      broadcastToRoom(roomId, {
        type: 'timer-update',
        payload: { timer: room.timer },
      });
      break;
    }
    case 'set-round': {
      room.timer.currentRound = data?.round || 'Opening Statements';
      broadcastToRoom(roomId, {
        type: 'timer-update',
        payload: { timer: room.timer },
      });
      break;
    }
    case 'end-debate': {
      broadcastToRoom(roomId, {
        type: 'host-action',
        payload: { action: 'end-debate' },
      });
      // Close room after delay
      setTimeout(() => {
        rooms.delete(roomId);
      }, 5000);
      break;
    }
  }
}

function handleChat(message: SignalingMessage): void {
  const { roomId, payload } = message;
  broadcastToRoom(roomId, {
    type: 'chat',
    payload: {
      ...payload,
      id: uuidv4(),
      timestamp: Date.now(),
    },
  });
}

function handleReaction(message: SignalingMessage): void {
  const { roomId, payload } = message;
  broadcastToRoom(roomId, {
    type: 'reaction',
    payload: {
      ...payload,
      id: uuidv4(),
      timestamp: Date.now(),
    },
  });
}

function handleUserUpdate(message: SignalingMessage): void {
  const roomId = message.roomId;
  const userId = message.payload?.userId;
  const payload = message.payload;
  const room = rooms.get(roomId);
  if (!room) return;

  const user = room.users.get(userId);
  if (!user) return;

  Object.assign(user, payload);
  
  // Update speakers array if needed
  if (user.role === 'speaker') {
    const speakerIndex = room.speakers.findIndex(u => u.id === userId);
    if (speakerIndex !== -1) {
      room.speakers[speakerIndex] = user;
    }
  }

  broadcastToRoom(roomId, {
    type: 'user-updated',
    payload: { userId, ...payload },
  }, userId);
}

wss.on('connection', (ws: WebSocket) => {
  console.log('New WebSocket connection');

  ws.on('message', (data: Buffer) => {
    try {
      const message: SignalingMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'join':
          handleJoin(ws, message);
          break;
        case 'offer':
          handleOffer(message);
          break;
        case 'answer':
          handleAnswer(message);
          break;
        case 'candidate':
          handleCandidate(message);
          break;
        case 'host-action':
          handleHostAction(ws, message);
          break;
        case 'chat':
          handleChat(message);
          break;
        case 'reaction':
          handleReaction(message);
          break;
        case 'user-update':
          handleUserUpdate(message);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    // Find and remove user connection
    for (const [userId, conn] of userConnections.entries()) {
      if (conn.ws === ws) {
        leaveRoom(conn.roomId, userId);
        userConnections.delete(userId);
        break;
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Timer tick
setInterval(() => {
  rooms.forEach((room) => {
    if (room.timer.isRunning && room.timer.remaining > 0) {
      room.timer.remaining--;
      
      // Broadcast timer update every second
      broadcastToRoom(room.id, {
        type: 'timer-update',
        payload: { timer: { ...room.timer } },
      });

      // Auto-switch rounds or end
      if (room.timer.remaining === 0) {
        room.timer.isRunning = false;
        broadcastToRoom(room.id, {
          type: 'timer-update',
          payload: { timer: { ...room.timer, isRunning: false } },
        });
      }
    }
  });
}, 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export { rooms, createRoom };