import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import ChatInterface from '@/components/ChatInterface';
import VideoCall from '@/components/VideoCall';
import IncomingCallDialog from '@/components/IncomingCallDialog';
import SessionScheduler from '@/components/SessionScheduler';
import SessionHistory from '@/components/SessionHistory';
import StatusIndicator from '@/components/StatusIndicator';
import NotificationsPopover from '@/components/NotificationsPopover';
import DigitalPrescription from '@/components/DigitalPrescription';
import TranslationToggle from '@/components/TranslationToggle';
import AppointmentCalendar from '@/components/AppointmentCalendar';
import DoctorAvailabilityManager from '@/components/DoctorAvailabilityManager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, MessageSquare, Phone, Video, Calendar, History, User, FileText, Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';
import { Prescription } from '@/types';

// Mock patient data
const patients = [
  { id: 'p1', name: 'John Doe', age: 34, lastVisit: '2023-10-15', status: 'Active' },
  { id: 'p2', name: 'Alice Smith', age: 28, lastVisit: '2023-10-05', status: 'Follow-up' },
];

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const { activeCall, incomingCall, initiateCall, userStatuses } = useSocket();
  const [selectedPatient, setSelectedPatient] = useState(patients[0]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'video' | 'schedule' | 'history' | 'prescriptions' | 'calendar' | 'availability'>('dashboard');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
  };

  const handleInitiateCall = (patientId: string) => {
    if (activeCall) {
      toast({
        title: "Active Call",
        description: "Please end the current call before starting a new one",
      });
      return;
    }
    
    toast({
      title: "Initiating Call",
      description: `Calling ${selectedPatient.name}...`,
    });
    
    initiateCall(patientId);
    setActiveTab('video');
  };

  const handlePatientSelect = (patient: typeof patients[0]) => {
    setSelectedPatient(patient);
    setActiveTab('chat');
  };

  const handleTabChange = (value: 'dashboard' | 'chat' | 'video' | 'schedule' | 'history' | 'prescriptions' | 'calendar' | 'availability') => {
    if (activeCall && value !== 'video') {
      toast({
        title: "Active Call",
        description: "Please end the current call before switching tabs",
      });
      return;
    }
    
    setActiveTab(value);
  };

  const handlePrescriptionCreated = (prescription: Prescription) => {
    setPrescriptions(prev => [...prev, prescription]);
  };

  // Get patient statuses
  const patientStatuses = patients.map(patient => ({
    ...patient,
    onlineStatus: userStatuses[patient.id] || 'offline'
  }));

  return (
    <div className="min-h-screen bg-medilink-muted flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-subtle py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-medilink-dark">MediLink</h1>
          
          <div className="flex items-center space-x-3">
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
                  <p className="text-xs text-slate-500 ml-1">Doctor</p>
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
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => handleTabChange(value as any)} 
            className="mb-6"
          >
            <TabsList className="bg-white/70 backdrop-blur-sm">
              <TabsTrigger 
                value="dashboard" 
                className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
              >
                <User className="h-4 w-4 mr-2" />
                Patients
              </TabsTrigger>
              
              <TabsTrigger 
                value="calendar" 
                className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              
              <TabsTrigger 
                value="availability" 
                className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
              >
                <Clock className="h-4 w-4 mr-2" />
                Availability
              </TabsTrigger>
              
              {selectedPatient && (
                <>
                  <TabsTrigger 
                    value="chat" 
                    className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
                    disabled={!selectedPatient}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="video" 
                    className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
                    disabled={!selectedPatient}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video Call
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="schedule" 
                    className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
                    disabled={!selectedPatient}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="history" 
                    className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
                    disabled={!selectedPatient}
                  >
                    <History className="h-4 w-4 mr-2" />
                    History
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="prescriptions" 
                    className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
                    disabled={!selectedPatient}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Prescriptions
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </Tabs>
          
          <div className="h-[calc(100vh-16rem)]">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">Your Patients</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {patientStatuses.map((patient) => (
                      <Card 
                        key={patient.id} 
                        className="hover-lift p-4 border border-slate-100 bg-white/90 backdrop-blur-sm cursor-pointer"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-medilink-primary mb-1">Patient</div>
                            <h3 className="text-lg font-semibold mb-1">
                              <div className="flex items-center">
                                {patient.name}
                                <StatusIndicator status={patient.onlineStatus} className="ml-2" />
                              </div>
                            </h3>
                            <div className="text-sm text-slate-500 mb-3">Age: {patient.age} • Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</div>
                            
                            <div className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-medilink-secondary text-medilink-primary">
                              {patient.status}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePatientSelect(patient);
                              }}
                              className="h-8 w-8"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="default" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatient(patient);
                                handleInitiateCall(patient.id);
                              }}
                              className="h-8 w-8 bg-medilink-primary hover:bg-medilink-primary/90"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'calendar' && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-auto"
                >
                  <AppointmentCalendar />
                </motion.div>
              )}
              
              {activeTab === 'availability' && (
                <motion.div
                  key="availability"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-auto"
                >
                  <DoctorAvailabilityManager doctorId={user?.id || 'd1'} />
                </motion.div>
              )}
              
              {activeTab === 'chat' && selectedPatient && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                      <span>Chat with {selectedPatient.name}</span>
                      <StatusIndicator 
                        status={userStatuses[selectedPatient.id] || 'offline'}
                        className="ml-2"
                      />
                    </h2>
                    
                    <Button 
                      onClick={() => handleInitiateCall(selectedPatient.id)}
                      className="bg-medilink-primary hover:bg-medilink-primary/90"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      <span>Start Video Call</span>
                    </Button>
                  </div>
                  
                  <div className="h-[calc(100%-3rem)]">
                    <ChatInterface 
                      recipientId={selectedPatient.id} 
                      recipientName={selectedPatient.name} 
                    />
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'video' && (
                <motion.div
                  key="video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {activeCall ? (
                    <VideoCall 
                      callData={activeCall} 
                      onEndCall={() => setActiveTab('chat')} 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8">
                        <img 
                          src="https://cdn-icons-png.flaticon.com/512/1162/1162172.png" 
                          alt="Starting call" 
                          className="w-40 h-40 mx-auto mb-4 opacity-20"
                        />
                        <h3 className="text-xl font-medium text-slate-700 mb-2">
                          Initiating Video Call
                        </h3>
                        <p className="text-slate-500 mb-6">
                          Connecting with {selectedPatient?.name}...
                        </p>
                        <Button onClick={() => setActiveTab('chat')}>
                          Return to Chat
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              
              {activeTab === 'schedule' && selectedPatient && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-auto"
                >
                  <SessionScheduler 
                    recipientId={selectedPatient.id}
                    recipientName={selectedPatient.name}
                    onScheduled={() => {
                      toast({
                        title: "Session Scheduled",
                        description: "Your session has been scheduled successfully",
                      });
                    }}
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
                    recipientId={selectedPatient?.id} 
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
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">
                    Prescription for {selectedPatient.name}
                  </h2>
                  <DigitalPrescription 
                    patientId={selectedPatient.id}
                    patientName={selectedPatient.name}
                    onPrescriptionCreated={handlePrescriptionCreated}
                  />
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

export default DoctorDashboard;
