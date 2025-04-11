import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from "@/hooks/use-toast";
import { Message, Session, Attachment, CallData } from '@/types';

// Create a real Socket.IO connection to your server
const createRealSocket = (): Socket => {
  return io('http://localhost:3000', {
    transports: ['websocket'] // Optional: specify transport options if needed
  });
};

interface SocketContextType {
  socket: any; // Add socket property
  isConnected: boolean;
  sendMessage: (to: string, message: string, attachments?: Attachment[]) => boolean;
  initiateCall: (to: string) => string | null;
  acceptCall: (callId: string) => boolean;
  rejectCall: (callId: string) => boolean;
  endCall: () => boolean;
  scheduleSession: (session: Session) => boolean;
  updateSessionStatus: (sessionId: string, status: Session['status']) => boolean;
  shareFile: (to: string, file: File) => Promise<boolean>;
  setDoctorAvailability: (doctorId: string, availability: Record<string, any>) => boolean;
  activeCall: CallData | null;
  incomingCall: CallData | null;
  userStatuses: Record<string, 'online' | 'offline' | 'busy'>;
  sessionHistory: Session[];
  chatHistory: Message[];
  notifications: { id: string; title: string; message: string; read: boolean; timestamp: string }[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeCall, setActiveCall] = useState<CallData | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [userStatuses, setUserStatuses] = useState<Record<string, 'online' | 'offline' | 'busy'>>({});
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; read: boolean; timestamp: string }[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize with mock session data for demo purposes
  useEffect(() => {
    if (user) {
      setSessionHistory([
        {
          id: 'session-1',
          doctorId: 'd1',
          patientId: 'p1',
          doctorName: 'Dr. Jane Wilson',
          patientName: 'John Doe',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // tomorrow
          duration: 30,
          status: 'scheduled',
          type: 'video'
        },
        {
          id: 'session-2',
          doctorId: 'd1',
          patientId: 'p1',
          doctorName: 'Dr. Jane Wilson',
          patientName: 'John Doe',
          scheduledAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
          duration: 45,
          status: 'completed',
          type: 'chat',
          notes: 'Followup consultation regarding medication.'
        }
      ]);

      setUserStatuses({
        'd1': 'online',
        'p1': 'online',
        'p2': 'offline'
      });
    }
  }, [user]);

  useEffect(() => {
    let socketInstance: Socket;

    if (user) {
      // Connect to the real Socket.IO server
      socketInstance = createRealSocket();

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);

        // Join a common room (e.g., "chat_room")
        socketInstance.emit('joinRoom', 'chat_room');

        // Update local user status and broadcast it
        if (user.id) {
          setUserStatuses(prev => ({
            ...prev,
            [user.id]: 'online'
          }));
        }
        socketInstance.emit('user:status', { userId: user.id, status: 'online' });
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
        if (user.id) {
          setUserStatuses(prev => ({
            ...prev,
            [user.id]: 'offline'
          }));
        }
      });

      socketInstance.on('message', (data) => {
        console.log('Message received:', data);
        setChatHistory(prev => [
          ...prev.filter(msg => msg.id !== data.id), // remove duplicates if any
          { ...data, fromSelf: data.from === user.id }
        ]);

        if (data.from !== user.id) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Message', {
              body: data.message,
              icon: '/favicon.ico'
            });
          }

          toast({
            title: "New Message",
            description: `${data.fromName || 'Someone'}: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`,
          });

          const notificationId = `notification-${Date.now()}`;
          setNotifications(prev => [
            {
              id: notificationId,
              title: 'New Message',
              message: `${data.fromName || 'Someone'}: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`,
              read: false,
              timestamp: new Date().toISOString()
            },
            ...prev
          ]);

          playNotificationSound();
        }
      });

      socketInstance.on('user:status', (data) => {
        console.log('User status update:', data);
        setUserStatuses(prev => ({
          ...prev,
          [data.userId]: data.status
        }));
      });

      socketInstance.on('file:shared', (data) => {
        console.log('File shared:', data);
        setChatHistory(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            from: data.from,
            to: data.to,
            message: `Shared file: ${data.file.name}`,
            timestamp: new Date().toISOString(),
            fromSelf: data.from === user.id,
            attachments: [{
              id: data.fileId,
              type: data.file.type.startsWith('image/') ? 'image' : 'document',
              url: data.file.url,
              name: data.file.name,
              size: data.file.size
            }]
          }
        ]);

        if (data.from !== user.id) {
          toast({
            title: "File Received",
            description: `${data.fromName || 'Someone'} shared a file: ${data.file.name}`,
          });

          const notificationId = `notification-${Date.now()}`;
          setNotifications(prev => [
            {
              id: notificationId,
              title: 'File Received',
              message: `${data.fromName || 'Someone'} shared a file: ${data.file.name}`,
              read: false,
              timestamp: new Date().toISOString()
            },
            ...prev
          ]);

          playNotificationSound();
        }
      });

      socketInstance.on('session:scheduled', (data) => {
        console.log('Session scheduled:', data);
        const sessionExists = sessionHistory.some(session => session.id === data.id);
        if (!sessionExists) {
          setSessionHistory(prev => [...prev, data]);
          if (data.doctorId === user.id || data.patientId === user.id) {
            const otherName = data.doctorId === user.id ? data.patientName : data.doctorName;
            toast({
              title: "New Session Scheduled",
              description: `A new ${data.type} session has been scheduled with ${otherName}`,
            });
            const notificationId = `notification-${Date.now()}`;
            setNotifications(prev => [
              {
                id: notificationId,
                title: 'New Session Scheduled',
                message: `A new ${data.type} session has been scheduled with ${otherName}`,
                read: false,
                timestamp: new Date().toISOString()
              },
              ...prev
            ]);
            playNotificationSound();
          }
        }
      });

      socketInstance.on('session:error', (data) => {
        console.log('Session error:', data);
        toast({
          variant: "destructive",
          title: "Booking Error",
          description: data.error,
        });

        const notificationId = `notification-${Date.now()}`;
        setNotifications(prev => [
          {
            id: notificationId,
            title: 'Booking Error',
            message: data.error,
            read: false,
            timestamp: new Date().toISOString()
          },
          ...prev
        ]);

        playNotificationSound();
      });

      socketInstance.on('session:updated', (data) => {
        console.log('Session updated:', data);
        setSessionHistory(prev => 
          prev.map(session => session.id === data.id ? { ...session, ...data } : session)
        );

        if (data.doctorId === user.id || data.patientId === user.id) {
          const otherName = data.doctorId === user.id ? data.patientName : data.doctorName;
          toast({
            title: "Session Updated",
            description: `Your session with ${otherName} has been updated to ${data.status}`,
          });
          const notificationId = `notification-${Date.now()}`;
          setNotifications(prev => [
            {
              id: notificationId,
              title: 'Session Updated',
              message: `Your session with ${otherName} has been updated to ${data.status}`,
              read: false,
              timestamp: new Date().toISOString()
            },
            ...prev
          ]);
          playNotificationSound();
        }
      });

      socketInstance.on('call:incoming', (callData) => {
        console.log('Incoming call:', callData);
        setIncomingCall(callData);
        if (user.id) {
          setUserStatuses(prev => ({
            ...prev,
            [user.id]: 'busy'
          }));
        }
        toast({
          title: "Incoming Call",
          description: `Call from ${callData.caller.name}`,
        });
        playNotificationSound();
      });

      socketInstance.on('call:accepted', (callData) => {
        console.log('Call accepted:', callData);
        setActiveCall(callData);
        setIncomingCall(null);
        if (user.id) {
          setUserStatuses(prev => ({
            ...prev,
            [user.id]: 'busy'
          }));
        }
        toast({
          title: "Call Connected",
          description: `You are now connected with ${callData.receiver.name}`,
        });
      });

      socketInstance.on('call:rejected', (callData) => {
        console.log('Call rejected:', callData);
        setActiveCall(null);
        setIncomingCall(null);
        if (user.id) {
          setUserStatuses(prev => ({
            ...prev,
            [user.id]: 'online'
          }));
        }
        toast({
          title: "Call Rejected",
          description: `${callData.receiver.name} is unavailable at the moment`,
        });
      });

      socketInstance.on('call:ended', () => {
        console.log('Call ended');
        setActiveCall(null);
        setIncomingCall(null);
        if (user.id) {
          setUserStatuses(prev => ({
            ...prev,
            [user.id]: 'online'
          }));
        }
        toast({
          title: "Call Ended",
          description: "The call has ended",
        });
      });

      socketInstance.on('availability:updated', (data) => {
        console.log('Availability updated:', data);
        
        // If this is for this doctor, update slots
        if (data.doctorId === user.id) {
          setAvailableSlots(data.slots);
          
          toast({
            title: "Availability Updated",
            description: "Your availability settings have been updated",
          });
          
          const notificationId = `notification-${Date.now()}`;
          setNotifications(prev => [
            {
              id: notificationId,
              title: 'Availability Updated',
              message: "Your availability settings have been updated",
              read: false,
              timestamp: new Date().toISOString()
            },
            ...prev
          ]);
        }
      });

      setSocket(socketInstance);
      requestNotificationPermission();
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user, toast]);

  // Request notification permission from the user.
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  // Play a notification sound.
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play();
    } catch (error) {
      console.log('Could not play notification sound');
    }
  };

  const sendMessage = (to: string, message: string, attachments?: Attachment[]) => {
    if (socket && isConnected && user) {
      const messageId = `msg-${Date.now()}-${Math.random()}`;
      const messageData: Message & { room: string } = {
        id: messageId,
        from: user.id,
        to,
        message,
        timestamp: new Date().toISOString(),
        fromSelf: true,
        attachments,
        room: 'chat_room'
      };
      
      // Immediately update local chat history.
      setChatHistory(prev => [...prev, messageData]);
      
      // Emit the message so it gets broadcast to all sockets in the room.
      socket.emit('message', {
        ...messageData,
        fromName: user.name
      });
      
      return true;
    }
    return false;
  };

  const initiateCall = (to: string) => {
    if (socket && isConnected && user) {
      const callData: CallData = {
        callId: `call-${Date.now()}`,
        caller: { id: user.id, name: user.name, role: user.role },
        receiver: { id: to, name: '', role: user.role === 'doctor' ? 'patient' : 'doctor' },
        timestamp: new Date().toISOString()
      };
      
      socket.emit('call:initiate', callData);
      setUserStatuses(prev => ({
        ...prev,
        [user.id]: 'busy'
      }));
      
      setActiveCall({ ...callData, status: 'calling' });
      
      // Simulate call acceptance after 2 seconds for demo purposes.
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
      if (user?.id) {
        setUserStatuses(prev => ({ ...prev, [user.id]: 'busy' }));
      }
      setActiveCall({ ...incomingCall, status: 'active' });
      setIncomingCall(null);
      return true;
    }
    return false;
  };

  const rejectCall = (callId: string) => {
    if (socket && isConnected && incomingCall && incomingCall.callId === callId) {
      socket.emit('call:reject', { callId });
      setIncomingCall(null);
      if (user?.id) {
        setUserStatuses(prev => ({ ...prev, [user.id]: 'online' }));
      }
      return true;
    }
    return false;
  };

  const endCall = () => {
    if (socket && isConnected && activeCall) {
      socket.emit('call:end', { callId: activeCall.callId });
      setActiveCall(null);
      if (user?.id) {
        setUserStatuses(prev => ({ ...prev, [user.id]: 'online' }));
      }
      return true;
    }
    return false;
  };

  const scheduleSession = (session: Session) => {
    if (socket && isConnected && user) {
      // Do not add session to history yet, we'll wait for server confirmation
      socket.emit('session:schedule', session);
      return true;
    }
    return false;
  };

  const updateSessionStatus = (sessionId: string, status: Session['status']) => {
    if (socket && isConnected && user) {
      setSessionHistory(prev => prev.map(session => session.id === sessionId ? { ...session, status } : session));
      socket.emit('session:update', { sessionId, status });
      return true;
    }
    return false;
  };

  const shareFile = async (to: string, file: File): Promise<boolean> => {
    if (socket && isConnected && user) {
      const fileId = `file-${Date.now()}`;
      const fileUrl = URL.createObjectURL(file);
      const fileData = {
        fileId,
        from: user.id,
        to,
        fromName: user.name,
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
          url: fileUrl
        },
        timestamp: new Date().toISOString()
      };
      
      socket.emit('file:share', fileData);
      
      const attachment: Attachment = {
        id: fileId,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        url: fileUrl,
        name: file.name,
        size: file.size
      };
      
      sendMessage(to, `Shared file: ${file.name}`, [attachment]);
      return true;
    }
    return false;
  };

  const setDoctorAvailability = (doctorId: string, availability: Record<string, any>) => {
    if (socket && isConnected && user) {
      socket.emit('availability:set', {
        doctorId,
        availability
      });
      return true;
    }
    return false;
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(notification => notification.id === id ? { ...notification, read: true } : notification));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };

  const contextValue: SocketContextType = {
    socket,
    isConnected,
    sendMessage,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    scheduleSession,
    updateSessionStatus,
    shareFile,
    setDoctorAvailability,
    activeCall,
    incomingCall,
    userStatuses,
    sessionHistory,
    chatHistory,
    notifications,
    markNotificationRead,
    markAllNotificationsRead
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
