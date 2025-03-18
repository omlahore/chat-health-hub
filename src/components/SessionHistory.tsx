
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Download, 
  FileText, 
  MessageSquare, 
  Video 
} from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { Session, Message } from '@/types';
import { motion } from 'framer-motion';

interface SessionHistoryProps {
  userId: string;
  recipientId?: string;
}

const SessionHistory = ({ userId, recipientId }: SessionHistoryProps) => {
  const { sessionHistory, chatHistory } = useSocket();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Filter sessions if recipientId is provided
  const filteredSessions = recipientId 
    ? sessionHistory.filter(session => 
        (session.doctorId === userId && session.patientId === recipientId) || 
        (session.patientId === userId && session.doctorId === recipientId)
      )
    : sessionHistory.filter(session => 
        session.doctorId === userId || session.patientId === userId
      );
  
  // Get chat messages for a specific session
  const getSessionMessages = (sessionId: string): Message[] => {
    return chatHistory.filter(message => message.sessionId === sessionId);
  };
  
  const handleExportSession = (session: Session) => {
    const messages = getSessionMessages(session.id);
    
    // Create export data
    const exportData = {
      session,
      messages: messages.map(({ id, from, to, message, timestamp }) => ({
        from,
        to,
        message,
        timestamp
      }))
    };
    
    // Create file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${session.id}-${format(parseISO(session.scheduledAt), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // No sessions yet
  if (filteredSessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Sessions Yet</h3>
        <p className="text-slate-500">There are no scheduled or past sessions to display.</p>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-medium">Session History</h3>
      
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        
        {['upcoming', 'past', 'all'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {filteredSessions
              .filter(session => {
                const sessionDate = parseISO(session.scheduledAt);
                const now = new Date();
                
                if (tabValue === 'upcoming') {
                  return sessionDate > now && session.status !== 'cancelled';
                } else if (tabValue === 'past') {
                  return sessionDate < now || session.status === 'completed';
                }
                return true; // 'all' tab
              })
              .sort((a, b) => parseISO(b.scheduledAt).getTime() - parseISO(a.scheduledAt).getTime())
              .map((session) => (
                <Card key={session.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        {session.type === 'video' 
                          ? <Video className="h-4 w-4 mr-2 text-medilink-primary" /> 
                          : <MessageSquare className="h-4 w-4 mr-2 text-medilink-primary" />
                        }
                        <span className="font-medium">
                          {session.type === 'video' ? 'Video Call' : 'Chat Session'} with {
                            session.doctorId === userId ? session.patientName : session.doctorName
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-slate-500 mb-2">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="mr-3">{format(parseISO(session.scheduledAt), 'PPP')}</span>
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{format(parseISO(session.scheduledAt), 'p')}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          session.status === 'scheduled' 
                            ? 'bg-blue-100 text-blue-800' 
                            : session.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">{session.duration} min</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8"
                            onClick={() => setSelectedSessionId(session.id)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Session Details</DialogTitle>
                          </DialogHeader>
                          
                          {selectedSessionId === session.id && (
                            <div className="space-y-4 mt-2">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="font-medium">Session Type:</div>
                                <div>{session.type === 'video' ? 'Video Call' : 'Chat Session'}</div>
                                
                                <div className="font-medium">With:</div>
                                <div>{session.doctorId === userId ? session.patientName : session.doctorName}</div>
                                
                                <div className="font-medium">Date & Time:</div>
                                <div>{format(parseISO(session.scheduledAt), 'PPP')} at {format(parseISO(session.scheduledAt), 'p')}</div>
                                
                                <div className="font-medium">Duration:</div>
                                <div>{session.duration} minutes</div>
                                
                                <div className="font-medium">Status:</div>
                                <div className="capitalize">{session.status}</div>
                              </div>
                              
                              {session.notes && (
                                <div>
                                  <div className="font-medium mb-1">Notes:</div>
                                  <p className="text-sm bg-slate-50 p-2 rounded">{session.notes}</p>
                                </div>
                              )}
                              
                              <div className="flex justify-end pt-2">
                                <DialogClose asChild>
                                  <Button variant="outline" size="sm" className="mr-2">Close</Button>
                                </DialogClose>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleExportSession(session)}
                                  className="bg-medilink-primary hover:bg-medilink-primary/90"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Export
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 bg-medilink-primary hover:bg-medilink-primary/90"
                        onClick={() => handleExportSession(session)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
            {filteredSessions.filter(session => {
              const sessionDate = parseISO(session.scheduledAt);
              const now = new Date();
              
              if (tabValue === 'upcoming') {
                return sessionDate > now && session.status !== 'cancelled';
              } else if (tabValue === 'past') {
                return sessionDate < now || session.status === 'completed';
              }
              return true; // 'all' tab
            }).length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500">No {tabValue} sessions to display.</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
};

export default SessionHistory;
