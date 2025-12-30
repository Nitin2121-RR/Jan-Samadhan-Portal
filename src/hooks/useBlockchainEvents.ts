import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Event types matching backend
export interface BlockchainGrievanceRegisteredEvent {
  hash: string;
  grievanceId: string;
  submitter: string;
  timestamp: number;
  transactionHash: string;
  blockNumber: number;
}

export interface BlockchainStatusUpdatedEvent {
  hash: string;
  oldStatus: string;
  newStatus: string;
  updater: string;
  timestamp: number;
  message: string;
  transactionHash: string;
  blockNumber: number;
}

export interface GrievanceConfirmedEvent {
  grievanceId: string;
  blockchainHash: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

interface UseBlockchainEventsOptions {
  autoConnect?: boolean;
  onGrievanceRegistered?: (event: BlockchainGrievanceRegisteredEvent) => void;
  onStatusUpdated?: (event: BlockchainStatusUpdatedEvent) => void;
  onGrievanceConfirmed?: (event: GrievanceConfirmedEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useBlockchainEvents(options: UseBlockchainEventsOptions = {}) {
  const {
    autoConnect = true,
    onGrievanceRegistered,
    onStatusUpdated,
    onGrievanceConfirmed,
    onConnect,
    onDisconnect,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<BlockchainGrievanceRegisteredEvent | BlockchainStatusUpdatedEvent | null>(null);
  const [recentEvents, setRecentEvents] = useState<(BlockchainGrievanceRegisteredEvent | BlockchainStatusUpdatedEvent)[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const subscribedGrievancesRef = useRef<Set<string>>(new Set());

  // Get WebSocket URL from API URL
  const getSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    // Extract base URL without /api
    return apiUrl.replace('/api', '');
  };

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

    const socketUrl = getSocketUrl();
    console.log('Connecting to WebSocket:', socketUrl);

    socketRef.current = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setIsConnected(true);

      // Subscribe to blockchain events
      socket.emit('subscribe:blockchain');

      // Re-subscribe to any previously subscribed grievances
      subscribedGrievancesRef.current.forEach((grievanceId) => {
        socket.emit('subscribe:grievance', grievanceId);
      });

      onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Listen for blockchain events
    socket.on('blockchain:grievanceRegistered', (event: BlockchainGrievanceRegisteredEvent) => {
      console.log('Received grievanceRegistered event:', event);
      setLastEvent(event);
      setRecentEvents((prev) => [event, ...prev].slice(0, 50)); // Keep last 50 events
      onGrievanceRegistered?.(event);
    });

    socket.on('blockchain:statusUpdated', (event: BlockchainStatusUpdatedEvent) => {
      console.log('Received statusUpdated event:', event);
      setLastEvent(event);
      setRecentEvents((prev) => [event, ...prev].slice(0, 50));
      onStatusUpdated?.(event);
    });

    // Listen for specific grievance confirmations
    socket.on('grievance:confirmed', (event: GrievanceConfirmedEvent) => {
      console.log('Received grievance confirmation:', event);
      onGrievanceConfirmed?.(event);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect]);

  // Update callbacks when they change
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Remove old listeners and add new ones
    socket.off('blockchain:grievanceRegistered');
    socket.off('blockchain:statusUpdated');
    socket.off('grievance:confirmed');

    socket.on('blockchain:grievanceRegistered', (event: BlockchainGrievanceRegisteredEvent) => {
      setLastEvent(event);
      setRecentEvents((prev) => [event, ...prev].slice(0, 50));
      onGrievanceRegistered?.(event);
    });

    socket.on('blockchain:statusUpdated', (event: BlockchainStatusUpdatedEvent) => {
      setLastEvent(event);
      setRecentEvents((prev) => [event, ...prev].slice(0, 50));
      onStatusUpdated?.(event);
    });

    socket.on('grievance:confirmed', (event: GrievanceConfirmedEvent) => {
      onGrievanceConfirmed?.(event);
    });
  }, [onGrievanceRegistered, onStatusUpdated, onGrievanceConfirmed]);

  // Subscribe to specific grievance updates
  const subscribeToGrievance = useCallback((grievanceId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:grievance', grievanceId);
    }
    subscribedGrievancesRef.current.add(grievanceId);
  }, []);

  // Unsubscribe from specific grievance updates
  const unsubscribeFromGrievance = useCallback((grievanceId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe:grievance', grievanceId);
    }
    subscribedGrievancesRef.current.delete(grievanceId);
  }, []);

  // Clear recent events
  const clearRecentEvents = useCallback(() => {
    setRecentEvents([]);
    setLastEvent(null);
  }, []);

  return {
    isConnected,
    lastEvent,
    recentEvents,
    subscribeToGrievance,
    unsubscribeFromGrievance,
    clearRecentEvents,
  };
}

export default useBlockchainEvents;
