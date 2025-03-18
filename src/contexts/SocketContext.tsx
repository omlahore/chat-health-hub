import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from "@/components/ui/use-toast";

// Mock socket.io client functionality without a real server
class MockSocket {
  private listeners: { [event: string]: Function[] } = {};
  private connected = false;
  
  constructor() {
    // Simulate connection delay
    setTimeout(() => {
      this.connected = true;
      this.emit('connect');
    }, 500);
  }
  
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // For immediate connect status
    if (event === 'connect' && this.connected) {
      callback();
    }
    
    return this;
  }
  
  off(event: string, callback?: Function) {
    if (!callback) {
      delete this.listeners[event];
    } else if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    return this;
  }
  
  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        callback(...args);
      });
    }
    return this;
  }
  
  connect() {
    if (!this.connected) {
      this.connected = true;
      this.emit('connect');
    }
    return this;
  }
  
  disconnect() {
    if (this.connected) {
      this.connected = false;
      this.emit('disconnect');
    }
    return this;
  }
}

// We'll use a mock socket for demonstration
// In a real app, use: io('your-server-url')
const createMockSocket = () => new MockSocket() as unknown as Socket;

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (to: string, message: string) => void;
  initiateCall: (to: string) => void;
  acceptCall: (callId: string) => void;
  rejectCall: (callId: string) => void;
  endCall: () => void;
  activeCall: any | null;
  incomingCall: any | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeCall, setActiveCall] = useState<any | null>(null);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    let socketInstance: Socket;

    if (user) {
      // In a real app, connect to your actual Socket.io server
      socketInstance = createMockSocket();
      
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        
        // Join room with user ID
        socketInstance.emit('join', { userId: user.id, userRole: user.role });
      });
      
      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });
      
      socketInstance.on('message', (data) => {
        console.log('Message received:', data);
        // This would be handled by the chat component
      });
      
      socketInstance.on('call:incoming', (callData) => {
        console.log('Incoming call:', callData);
        setIncomingCall(callData);
        
        toast({
          title: "Incoming Call",
          description: `Call from ${callData.caller.name}`,
        });
      });
      
      socketInstance.on('call:accepted', (callData) => {
        console.log('Call accepted:', callData);
        setActiveCall(callData);
        setIncomingCall(null);
        
        toast({
          title: "Call Connected",
          description: `You are now connected with ${callData.receiver.name}`,
        });
      });
      
      socketInstance.on('call:rejected', (callData) => {
        console.log('Call rejected:', callData);
        setActiveCall(null);
        setIncomingCall(null);
        
        toast({
          title: "Call Rejected",
          description: `${callData.receiver.name} is unavailable at the moment`,
        });
      });
      
      socketInstance.on('call:ended', () => {
        console.log('Call ended');
        setActiveCall(null);
        setIncomingCall(null);
        
        toast({
          title: "Call Ended",
          description: "The call has ended",
        });
      });
      
      setSocket(socketInstance);
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user, toast]);

  const sendMessage = (to: string, message: string) => {
    if (socket && isConnected) {
      const messageId = `msg-${Date.now()}-${Math.random()}`;
      
      const messageData = {
        id: messageId,
        from: user?.id,
        to,
        message,
        timestamp: new Date().toISOString()
      };
      
      // Send the actual message to the recipient
      socket.emit('message', messageData);
      
      // No need to emit to self anymore as we're handling this in the ChatInterface
      
      return true;
    }
    return false;
  };

  const initiateCall = (to: string) => {
    if (socket && isConnected && user) {
      const callData = {
        callId: `call-${Date.now()}`,
        caller: {
          id: user.id,
          name: user.name,
          role: user.role
        },
        receiver: { id: to },
        timestamp: new Date().toISOString()
      };
      
      socket.emit('call:initiate', callData);
      
      // For mock behavior
      setActiveCall({
        ...callData,
        status: 'calling'
      });
      
      // Simulate call acceptance after 2 seconds for demo
      setTimeout(() => {
        socket.emit('call:accepted', {
          ...callData,
          status: 'active',
          receiver: {
            id: to,
            name: user.role === 'doctor' ? 'John Doe' : 'Dr. Jane Wilson',
            role: user.role === 'doctor' ? 'patient' : 'doctor'
          }
        });
      }, 2000);
      
      return callData.callId;
    }
    return null;
  };

  const acceptCall = (callId: string) => {
    if (socket && isConnected && incomingCall && incomingCall.callId === callId) {
      socket.emit('call:accept', { callId });
      
      // For mock behavior
      setActiveCall({
        ...incomingCall,
        status: 'active'
      });
      setIncomingCall(null);
      
      return true;
    }
    return false;
  };

  const rejectCall = (callId: string) => {
    if (socket && isConnected && incomingCall && incomingCall.callId === callId) {
      socket.emit('call:reject', { callId });
      setIncomingCall(null);
      return true;
    }
    return false;
  };

  const endCall = () => {
    if (socket && isConnected && activeCall) {
      socket.emit('call:end', { callId: activeCall.callId });
      setActiveCall(null);
      return true;
    }
    return false;
  };

  const value = {
    socket,
    isConnected,
    sendMessage,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    activeCall,
    incomingCall
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
