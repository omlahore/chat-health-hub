
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
