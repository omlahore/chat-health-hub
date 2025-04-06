
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import ChatInterface from '@/components/ChatInterface';
import VideoCall from '@/components/VideoCall';
import IncomingCallDialog from '@/components/IncomingCallDialog';
import SessionScheduler from '@/components/SessionScheduler';
import SessionHistory from '@/components/SessionHistory';
import StatusIndicator from '@/components/StatusIndicator';
import NotificationsPopover from '@/components/NotificationsPopover';
import TranslationToggle from '@/components/TranslationToggle';
import EmergencyButton from '@/components/EmergencyButton';
import AppointmentReminders from '@/components/AppointmentReminders';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LogOut, MessageSquare, Video, Calendar, History, FileText } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from 'framer-motion';
import { Session } from '@/types';

// Mock sessions for demo
const mockSessions: Session[] = [
  {
    id: 's1',
    doctorId: 'd1',
    patientId: 'p1',
    doctorName: 'Dr. Jane Wilson',
    patientName: 'John Doe',
    scheduledAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(), // 25 minutes from now
    duration: 30,
    status: 'scheduled',
    type: 'video'
  },
  {
    id: 's2',
    doctorId: 'd1',
    patientId: 'p1',
    doctorName: 'Dr. Jane Wilson',
    patientName: 'John Doe',
    scheduledAt: new Date(Date.now() + 120 * 60 * 1000).toISOString(), // 2 hours from now
    duration: 15,
    status: 'scheduled',
    type: 'chat'
  }
];

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const { activeCall, incomingCall, userStatuses } = useSocket();
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const { toast } = useToast();

  // Hard-coded doctor for the demo
  const doctor = {
    id: 'd1',
    name: 'Dr. Jane Wilson', 
  };

  const handleLogout = () => {
    logout();
  };

  const handleTabChange = (value: string) => {
    if (activeCall && value !== 'video') {
      toast({
        title: "Active Call",
        description: "Please end the current call before switching tabs",
      });
      return;
    }
    
    setActiveTab(value);
  };

  // Get doctor status
  const doctorStatus = userStatuses[doctor.id] || 'offline';

  const handleSessionScheduled = (newSession: Session) => {
    setSessions(prevSessions => [...prevSessions, newSession]);
    toast({
      title: "Session Scheduled",
      description: "Your session has been scheduled successfully",
    });
  };

  return (
    <div className="min-h-screen bg-medilink-muted flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-subtle py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-medilink-dark">MediLink</h1>
          
          <div className="flex items-center space-x-3">
            <EmergencyButton />
            <TranslationToggle />
            <NotificationsPopover />
            
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-medilink-secondary flex items-center justify-center text-medilink-primary font-medium mr-3">
                {user?.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-slate-800">{user?.name}</p>
                <div className="flex items-center">
                  <StatusIndicator status="online" size="sm" showTooltip={false} />
                  <p className="text-xs text-slate-500 ml-1">Patient</p>
                </div>
              </div>
            </div>
            
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-slate-800 mr-3">
                Your Healthcare Portal
              </h2>
              
              <div className="flex items-center px-3 py-1 bg-white rounded-full text-sm">
                <StatusIndicator status={doctorStatus} size="sm" />
                <span className="ml-2">Dr. Jane Wilson is {doctorStatus}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <div className="lg:col-span-3">
              <AppointmentReminders 
                sessions={sessions} 
                patientId={user?.id || ''} 
                className="h-full"
              />
            </div>
            <div className="lg:col-span-1">
              {/* Empty space for future widget */}
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
            <TabsList className="bg-white/70 backdrop-blur-sm">
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger 
                value="video" 
                className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
              >
                <Video className="h-4 w-4 mr-2" />
                Video Call
              </TabsTrigger>
              <TabsTrigger 
                value="schedule" 
                className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
              >
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger 
                value="prescriptions" 
                className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Prescriptions
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="h-[calc(100vh-14rem)] bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-subtle">
            <AnimatePresence mode="wait">
              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <ChatInterface 
                    recipientId={doctor.id} 
                    recipientName={doctor.name} 
                  />
                </motion.div>
              )}
              
              {activeTab === 'video' && (
                <motion.div
                  key="video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex items-center justify-center"
                >
                  {activeCall ? (
                    <VideoCall 
                      callData={activeCall} 
                      onEndCall={() => setActiveTab('chat')} 
                    />
                  ) : (
                    <div className="text-center p-8">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/512/1162/1162172.png" 
                        alt="Waiting for call" 
                        className="w-40 h-40 mx-auto mb-4 opacity-20"
                      />
                      <h3 className="text-xl font-medium text-slate-700 mb-2">
                        Ready for Video Consultation
                      </h3>
                      <p className="text-slate-500 mb-6">
                        Your doctor will initiate the video call. Please ensure your camera and microphone are working.
                      </p>
                      <Button onClick={() => setActiveTab('chat')}>
                        Return to Chat
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
              
              {activeTab === 'schedule' && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-auto"
                >
                  <SessionScheduler 
                    recipientId={doctor.id}
                    recipientName={doctor.name}
                    onScheduled={handleSessionScheduled}
                  />
                </motion.div>
              )}
              
              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-auto"
                >
                  <SessionHistory 
                    userId={user?.id || ''} 
                    recipientId={doctor.id} 
                  />
                </motion.div>
              )}
              
              {activeTab === 'prescriptions' && (
                <motion.div
                  key="prescriptions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-auto"
                >
                  <div className="text-center p-8">
                    <img 
                      src="https://cdn-icons-png.flaticon.com/512/867/867860.png" 
                      alt="Prescriptions" 
                      className="w-40 h-40 mx-auto mb-4 opacity-20"
                    />
                    <h3 className="text-xl font-medium text-slate-700 mb-2">
                      Your Prescriptions
                    </h3>
                    <p className="text-slate-500 mb-6">
                      You don't have any prescriptions yet. Your doctor will add them here when they're available.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      {/* Incoming call dialog */}
      {incomingCall && (
        <IncomingCallDialog
          isOpen={!!incomingCall}
          caller={incomingCall.caller}
          callId={incomingCall.callId}
        />
      )}
    </div>
  );
};

export default PatientDashboard;
