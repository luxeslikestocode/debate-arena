import { useEffect, useRef, useState, useCallback } from 'react';
import { getSignalingUrl, getRoomId } from '../lib/api';
import { User } from '../lib/auth';

interface RemoteStream {
  userId: string;
  stream: MediaStream;
  userName: string;
  isMuted: boolean;
  isCameraOn: boolean;
  connectionState: RTCPeerConnectionState;
}

interface SignalingMessage {
  type: string;
  payload: any;
  from?: string;
  to?: string;
  roomId?: string;
}

interface UseWebRTCOptions {
  debateId: string;
  user: User;
  isHost: boolean;
  isSpeaker: boolean;
  onUserJoined: (user: any) => void;
  onUserLeft: (userId: string) => void;
  onUserUpdated: (userId: string, updates: any) => void;
  onSpeakerUpdate: (speakers: any[]) => void;
  onQueueUpdate: (queue: any[]) => void;
  onTimerUpdate: (timer: any) => void;
  onChatMessage: (message: any) => void;
  onReaction: (reaction: any) => void;
  onHostAction: (action: any) => void;
  onError: (error: string) => void;
}

export function useWebRTC({
  debateId,
  user,
  isHost,
  isSpeaker,
  onUserJoined,
  onUserLeft,
  onUserUpdated,
  onSpeakerUpdate,
  onQueueUpdate,
  onTimerUpdate,
  onChatMessage,
  onReaction,
  onHostAction,
  onError,
}: UseWebRTCOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Map<string, RemoteStream>>(new Map());
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: 'turn:openrelayproject.com:3478',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ]);

  // Initialize local media stream
  const startLocalStream = useCallback(async (withVideo: boolean = true) => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: withVideo ? { width: 640, height: 480, facingMode: 'user' } : false,
      });

      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('Failed to get local stream:', err);
      if (withVideo) {
        return startLocalStream(false);
      }
      onError('Could not access camera/microphone');
      return null;
    }
  }, [onError]);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((remoteUserId: string) => {
    const pc = new RTCPeerConnection({ iceServers });
    peerConnectionsRef.current.set(remoteUserId, pc);

    pc.onconnectionstatechange = () => {
      const stream = remoteStreamsRef.current.get(remoteUserId);
      if (stream) {
        remoteStreamsRef.current.set(remoteUserId, {
          ...stream,
          connectionState: pc.connectionState,
        });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'candidate',
          payload: event.candidate,
          to: remoteUserId,
          from: user.id,
          roomId: getRoomId(debateId),
        }));
      }
    };

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        const existing = remoteStreamsRef.current.get(remoteUserId);
        remoteStreamsRef.current.set(remoteUserId, {
          userId: remoteUserId,
          stream: event.streams[0],
          userName: '', // Will be updated when user info arrives
          isMuted: false,
          isCameraOn: true,
          connectionState: pc.connectionState,
        });
      }
    };

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    return pc;
  }, [debateId, user.id]);

  // Create offer
  const createOffer = useCallback(async (remoteUserId: string) => {
    const pc = peerConnectionsRef.current.get(remoteUserId) || createPeerConnection(remoteUserId);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          payload: offer,
          to: remoteUserId,
          from: user.id,
          roomId: getRoomId(debateId),
        }));
      }
    } catch (err) {
      console.error('Failed to create offer:', err);
    }
  }, [createPeerConnection, debateId, user.id]);

  // Handle incoming offer
  const handleOffer = useCallback(async (message: SignalingMessage) => {
    const { from, payload } = message;
    if (!from || from === user.id) return;

    let pc = peerConnectionsRef.current.get(from);
    if (!pc) {
      pc = createPeerConnection(from);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'answer',
          payload: answer,
          to: from,
          from: user.id,
          roomId: getRoomId(debateId),
        }));
      }
    } catch (err) {
      console.error('Failed to handle offer:', err);
    }
  }, [createPeerConnection, debateId, user.id]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (message: SignalingMessage) => {
    const { from, payload } = message;
    if (!from || from === user.id) return;

    const pc = peerConnectionsRef.current.get(from);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(payload));
    } catch (err) {
      console.error('Failed to handle answer:', err);
    }
  }, [user.id]);

  // Handle ICE candidate
  const handleCandidate = useCallback(async (message: SignalingMessage) => {
    const { from, payload } = message;
    if (!from || from === user.id) return;

    const pc = peerConnectionsRef.current.get(from);
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(payload));
    } catch (err) {
      console.error('Failed to add ICE candidate:', err);
    }
  }, [user.id]);

  // Connect to signaling server
  const connect = useCallback(() => {
    const roomId = getRoomId(debateId);
    const wsUrl = `${getSignalingUrl()}?room=${roomId}&userId=${user.id}&userName=${encodeURIComponent(user.name)}&userUsername=${encodeURIComponent(user.username)}&userAvatar=${encodeURIComponent(user.avatar || '')}`;
    
    setConnectionState('connecting');
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to signaling server');
      setConnectionState('connected');
      
      // Send join message
      ws.send(JSON.stringify({
        type: 'join',
        payload: {
          roomId,
          userId: user.id,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar: user.avatar,
          },
        },
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message: SignalingMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'sync': {
            const { users, queue, speakers, timer, hostId, maxSpeakers, isAudioOnly } = message.payload;
            users.forEach((u: any) => {
              if (u.id !== user.id) {
                onUserJoined(u);
                if (u.role === 'speaker') {
                  createOffer(u.id);
                }
              }
            });
            onQueueUpdate(queue);
            onSpeakerUpdate(speakers);
            onTimerUpdate(timer);
            break;
          }
          case 'user-joined': {
            onUserJoined(message.payload.user);
            if (message.payload.user.role === 'speaker' && isSpeaker) {
              createOffer(message.payload.user.id);
            }
            break;
          }
          case 'user-left': {
            onUserLeft(message.payload.userId);
            const pc = peerConnectionsRef.current.get(message.payload.userId);
            if (pc) {
              pc.close();
              peerConnectionsRef.current.delete(message.payload.userId);
            }
            remoteStreamsRef.current.delete(message.payload.userId);
            break;
          }
          case 'user-updated': {
            onUserUpdated(message.payload.userId, message.payload);
            const stream = remoteStreamsRef.current.get(message.payload.userId);
            if (stream) {
              remoteStreamsRef.current.set(message.payload.userId, {
                ...stream,
                isMuted: message.payload.isMuted ?? stream.isMuted,
                isCameraOn: message.payload.isCameraOn ?? stream.isCameraOn,
              });
            }
            break;
          }
          case 'speaker-update': {
            onSpeakerUpdate(message.payload.speakers);
            break;
          }
          case 'queue-update': {
            onQueueUpdate(message.payload.queue);
            break;
          }
          case 'timer-update': {
            onTimerUpdate(message.payload.timer);
            break;
          }
          case 'offer': {
            handleOffer(message);
            break;
          }
          case 'answer': {
            handleAnswer(message);
            break;
          }
          case 'candidate': {
            handleCandidate(message);
            break;
          }
          case 'chat': {
            onChatMessage(message.payload);
            break;
          }
          case 'reaction': {
            onReaction(message.payload);
            break;
          }
          case 'host-action': {
            onHostAction(message.payload);
            break;
          }
          case 'error': {
            onError(message.payload.message);
            break;
          }
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from signaling server');
      setConnectionState('disconnected');
      // Attempt reconnection after 3 seconds
      setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setConnectionState('error');
      onError('Connection error');
    };
  }, [debateId, user, isSpeaker, createOffer, handleOffer, handleAnswer, handleCandidate, onUserJoined, onUserLeft, onUserUpdated, onSpeakerUpdate, onQueueUpdate, onTimerUpdate, onChatMessage, onReaction, onHostAction, onError]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    
    stopLocalStream();
    setConnectionState('disconnected');
  }, [stopLocalStream]);

  // Send host action
  const sendHostAction = useCallback((action: string, targetUserId?: string, data?: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'host-action',
        payload: {
          roomId: getRoomId(debateId),
          userId: user.id,
          action,
          targetUserId,
          data,
        },
      }));
    }
  }, [debateId, user.id]);

  // Send chat message
  const sendChat = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        payload: {
          roomId: getRoomId(debateId),
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          text,
        },
      }));
    }
  }, [debateId, user]);

  // Send reaction
  const sendReaction = useCallback((emoji: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'reaction',
        payload: {
          roomId: getRoomId(debateId),
          userId: user.id,
          userName: user.name,
          emoji,
        },
      }));
    }
  }, [debateId, user]);

  // Update user state (mute, camera, etc.)
  const updateUserState = useCallback((updates: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'user-update',
        payload: {
          roomId: getRoomId(debateId),
          userId: user.id,
          ...updates,
        },
      }));
    }
  }, [debateId, user.id]);

  // Request to speak
  const requestToSpeak = useCallback(() => {
    sendHostAction('request-to-speak');
  }, [sendHostAction]);

  // Cancel speak request
  const cancelSpeakRequest = useCallback(() => {
    sendHostAction('cancel-request');
  }, [sendHostAction]);

  // Toggle local mute
  const toggleMute = useCallback(async () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const newMuted = !audioTracks[0]?.enabled;
      audioTracks.forEach(track => track.enabled = !newMuted);
      updateUserState({ isMuted: newMuted });
      return newMuted;
    }
    return false;
  }, [updateUserState]);

  // Toggle local camera
  const toggleCamera = useCallback(async () => {
    const newCameraOn = !localStreamRef.current?.getVideoTracks()[0]?.enabled;
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => track.enabled = newCameraOn);
    } else if (newCameraOn) {
      await startLocalStream(true);
    }
    updateUserState({ isCameraOn: newCameraOn });
    return newCameraOn;
  }, [startLocalStream, updateUserState]);

  // Initialize on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionState,
    localStream: localStreamRef.current,
    remoteStreams: Array.from(remoteStreamsRef.current.values()) as RemoteStream[],
    startLocalStream,
    stopLocalStream,
    toggleMute,
    toggleCamera,
    sendChat,
    sendReaction,
    sendHostAction,
    requestToSpeak,
    cancelSpeakRequest,
    updateUserState,
  };
}