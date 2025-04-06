
export interface User {
  id: string;
  username: string;
  role: 'patient' | 'doctor';
  name: string;
  image?: string;
  status?: 'online' | 'offline' | 'busy';
}

export interface Message {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  fromSelf?: boolean;
  attachments?: Attachment[];
  sessionId?: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'document';
  url: string;
  name: string;
  size?: number;
}

export interface Session {
  id: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  patientName: string;
  scheduledAt: string;
  duration: number; // in minutes
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  type: 'video' | 'chat';
}

export interface CallData {
  callId: string;
  caller: {
    id: string;
    name: string;
    role: 'patient' | 'doctor';
  };
  receiver: {
    id: string;
    name: string;
    role: 'patient' | 'doctor';
  };
  timestamp: string;
  status?: 'calling' | 'active' | 'ended';
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  medications: Medication[];
  instructions: string;
  createdAt: string;
  signatureData?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}
