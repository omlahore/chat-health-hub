
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import ChatInterface from '@/components/ChatInterface';
import VideoCall from '@/components/VideoCall';
import IncomingCallDialog from '@/components/IncomingCallDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, MessageSquare, Phone, Video } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

// Mock patient data
const patients = [
  { id: 'p1', name: 'John Doe', age: 34, lastVisit: '2023-10-15', status: 'Active' },
  { id: 'p2', name: 'Alice Smith', age: 28, lastVisit: '2023-10-05', status: 'Follow-up' },
];

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const { activeCall, incomingCall, initiateCall } = useSocket();
  const [selectedPatient, setSelectedPatient] = useState(patients[0]);
  const [activeView, setActiveView] = useState<'patients' | 'chat' | 'video'>('patients');
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
    setActiveView('video');
  };

  const handlePatientSelect = (patient: typeof patients[0]) => {
    setSelectedPatient(patient);
    setActiveView('chat');
  };

  return (
    <div className="min-h-screen bg-medilink-muted flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-subtle py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-medilink-dark">MediLink</h1>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-medilink-secondary flex items-center justify-center text-medilink-primary font-medium mr-3">
                {user?.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">Doctor</p>
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
          <Tabs defaultValue="dashboard" className="mb-6">
            <TabsList className="bg-white/70 backdrop-blur-sm">
              <TabsTrigger 
                value="dashboard" 
                onClick={() => setActiveView('patients')}
                className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
              >
                Patient Dashboard
              </TabsTrigger>
              {selectedPatient && (
                <>
                  <TabsTrigger 
                    value="chat" 
                    onClick={() => setActiveView('chat')}
                    className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
                    disabled={!selectedPatient}
                  >
                    Chat
                  </TabsTrigger>
                  <TabsTrigger 
                    value="video" 
                    onClick={() => activeCall ? setActiveView('video') : handleInitiateCall(selectedPatient.id)}
                    className="data-[state=active]:bg-medilink-primary data-[state=active]:text-white"
                    disabled={!selectedPatient}
                  >
                    Video Call
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </Tabs>
          
          <div className="h-[calc(100vh-16rem)]">
            <AnimatePresence mode="wait">
              {activeView === 'patients' && (
                <motion.div
                  key="patients"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">Your Patients</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {patients.map((patient) => (
                      <Card 
                        key={patient.id} 
                        className="hover-lift p-4 border border-slate-100 bg-white/90 backdrop-blur-sm cursor-pointer"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-medilink-primary mb-1">Patient</div>
                            <h3 className="text-lg font-semibold mb-1">{patient.name}</h3>
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
              
              {activeView === 'chat' && selectedPatient && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-800">
                      Chat with {selectedPatient.name}
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
              
              {activeView === 'video' && (
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
                      onEndCall={() => setActiveView('chat')} 
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
                        <Button onClick={() => setActiveView('chat')}>
                          Return to Chat
                        </Button>
                      </div>
                    </div>
                  )}
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
