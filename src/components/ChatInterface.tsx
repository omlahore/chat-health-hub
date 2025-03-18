
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, File, Image } from 'lucide-react';
import { motion } from 'framer-motion';
import FileShareButton from './FileShareButton';
import StatusIndicator from './StatusIndicator';
import { Message, Attachment } from '@/types';

interface ChatInterfaceProps {
  recipientId: string;
  recipientName: string;
}

const ChatInterface = ({ recipientId, recipientName }: ChatInterfaceProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { sendMessage, socket, userStatuses, chatHistory } = useSocket();
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
    
    // Filter chat history for this conversation
    const relevantMessages = chatHistory.filter(
      msg => (msg.from === recipientId && msg.to === user?.id) ||
             (msg.from === user?.id && msg.to === recipientId)
    );
    
    if (relevantMessages.length > 0) {
      // Merge with existing messages, avoiding duplicates
      const existingIds = new Set(messages.map(m => m.id));
      const newMessages = relevantMessages.filter(msg => !existingIds.has(msg.id));
      
      if (newMessages.length > 0) {
        setMessages(prev => [...prev, ...newMessages]);
      }
    }
  }, [socket, recipientId, user?.id, messages, chatHistory]);

  // Listen for real-time message updates
  useEffect(() => {
    if (!socket) return;
    
    const handleIncomingMessage = (data: any) => {
      // Only process messages that are meant for this conversation
      if ((data.from === recipientId && data.to === user?.id) || 
          (data.from === user?.id && data.to === recipientId)) {
        
        // Check if the message already exists in our array
        const messageExists = messages.some(msg => msg.id === data.id);
        
        if (!messageExists) {
          setMessages(prev => [
            ...prev, 
            {
              id: data.id || `msg-${Date.now()}-${Math.random()}`,
              from: data.from,
              to: data.to,
              message: data.message,
              timestamp: data.timestamp,
              fromSelf: data.from === user?.id,
              attachments: data.attachments
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

  // Get recipient status
  const recipientStatus = userStatuses[recipientId] || 'offline';

  // Render attachment
  const renderAttachment = (attachment: Attachment) => {
    if (attachment.type === 'image') {
      return (
        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
          <img 
            src={attachment.url} 
            alt={attachment.name} 
            className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
          />
          <div className="text-xs mt-1 opacity-80">{attachment.name}</div>
        </a>
      );
    } else {
      return (
        <a 
          href={attachment.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center mt-2 bg-slate-100 dark:bg-slate-700 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <File className="h-5 w-5 mr-2 flex-shrink-0" />
          <div className="overflow-hidden">
            <div className="text-sm font-medium truncate">{attachment.name}</div>
            {attachment.size && (
              <div className="text-xs opacity-70">
                {(attachment.size / 1024).toFixed(1)} KB
              </div>
            )}
          </div>
        </a>
      );
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
            <StatusIndicator status={recipientStatus} size="sm" showTooltip={false} />
            <span className="text-xs text-slate-500 ml-2 capitalize">{recipientStatus}</span>
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
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={isFromSelf ? 'text-white' : 'text-slate-800'}>
                      {msg.attachments.map(attachment => (
                        <div key={attachment.id}>
                          {renderAttachment(attachment)}
                        </div>
                      ))}
                    </div>
                  )}
                  
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
          <FileShareButton recipientId={recipientId} />
          
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
