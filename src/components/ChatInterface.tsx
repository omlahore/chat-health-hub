
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip, Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  fromSelf?: boolean;
}

interface ChatInterfaceProps {
  recipientId: string;
  recipientName: string;
}

const ChatInterface = ({ recipientId, recipientName }: ChatInterfaceProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { sendMessage, socket } = useSocket();
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initial mock messages
  useEffect(() => {
    // Clear messages when recipient changes
    setMessages([]);
    
    // Add mock messages with a slight delay to simulate loading
    const timer = setTimeout(() => {
      const mockMessages: Message[] = [
        {
          id: '1',
          from: recipientId,
          to: user?.id || '',
          message: `Hello! How can I help you today?`,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      
      setMessages(mockMessages);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [recipientId, user?.id]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;
    
    const handleIncomingMessage = (data: any) => {
      // Only process messages that are meant for this conversation
      // and avoid duplicates with the fromSelf flag
      if ((data.from === recipientId && data.to === user?.id) || 
          (data.from === user?.id && data.to === recipientId && data.fromSelf)) {
        
        // Check if the message already exists in our array
        const messageExists = messages.some(msg => 
          msg.id === data.id || 
          (msg.message === data.message && 
           msg.timestamp === data.timestamp && 
           msg.from === data.from && 
           msg.to === data.to)
        );
        
        if (!messageExists) {
          setMessages(prev => [
            ...prev, 
            {
              id: data.id || `msg-${Date.now()}-${Math.random()}`,
              from: data.from,
              to: data.to,
              message: data.message,
              timestamp: data.timestamp,
              fromSelf: data.from === user?.id
            }
          ]);
        }
      }
    };
    
    socket.on('message', handleIncomingMessage);
    
    return () => {
      socket.off('message', handleIncomingMessage);
    };
  }, [socket, recipientId, user?.id, messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !user) return;
    
    const newMessageData = {
      id: `msg-${Date.now()}-${Math.random()}`,
      from: user.id,
      to: recipientId,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      fromSelf: true
    };
    
    // Add message to state immediately
    setMessages(prev => [...prev, newMessageData]);
    
    // Send message through socket
    sendMessage(recipientId, message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-subtle border border-slate-100 overflow-hidden">
      {/* Chat header */}
      <div className="p-4 border-b border-slate-100 flex items-center">
        <div className="w-10 h-10 rounded-full bg-medilink-secondary flex items-center justify-center text-medilink-primary font-medium">
          {recipientName.charAt(0)}
        </div>
        <div className="ml-3">
          <h3 className="font-medium">{recipientName}</h3>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-xs text-slate-500">Online</span>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg, index) => {
            const isFromSelf = msg.fromSelf || msg.from === user?.id;
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${isFromSelf ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    isFromSelf 
                      ? 'bg-medilink-primary text-white rounded-tr-none' 
                      : 'bg-medilink-secondary text-slate-800 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <div className={`text-xs mt-1 ${isFromSelf ? 'text-blue-100' : 'text-slate-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {messages.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              No messages yet. Start the conversation!
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Message input */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-10 w-10 flex-shrink-0"
            type="button"
          >
            <Paperclip className="h-5 w-5 text-slate-500" />
          </Button>
          
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="h-10 rounded-full border-slate-200"
          />
          
          <Button 
            onClick={handleSendMessage}
            className="rounded-full h-10 w-10 p-0 flex-shrink-0 bg-medilink-primary hover:bg-medilink-primary/90"
            disabled={!message.trim()}
            type="button"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
