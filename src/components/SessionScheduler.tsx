
import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { CalendarIcon, Clock } from 'lucide-react';
import { Session } from '@/types';
import { motion } from 'framer-motion';

interface SessionSchedulerProps {
  recipientId: string;
  recipientName: string;
  onScheduled?: (session: Session) => void;
}

const SessionScheduler = ({ recipientId, recipientName, onScheduled }: SessionSchedulerProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('09:00');
  const [duration, setDuration] = useState<string>('30');
  const [type, setType] = useState<'video' | 'chat'>('video');
  const [notes, setNotes] = useState<string>('');
  const { user } = useAuth();
  const { scheduleSession } = useSocket();
  const { toast } = useToast();

  const handleScheduleSession = () => {
    if (!date || !user) return;
    
    // Create date with the selected time
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes);
    
    const sessionData: Session = {
      id: `session-${Date.now()}`,
      doctorId: user.role === 'doctor' ? user.id : recipientId,
      patientId: user.role === 'patient' ? user.id : recipientId,
      doctorName: user.role === 'doctor' ? user.name : recipientName,
      patientName: user.role === 'patient' ? user.name : recipientName,
      scheduledAt: scheduledAt.toISOString(),
      duration: parseInt(duration),
      status: 'scheduled',
      notes,
      type
    };
    
    // Schedule the session
    scheduleSession(sessionData);
    
    toast({
      title: "Session Scheduled",
      description: `Your ${type} session has been scheduled for ${format(scheduledAt, 'PPP')} at ${format(scheduledAt, 'p')}`,
    });
    
    if (onScheduled) {
      onScheduled(sessionData);
    }
    
    // Reset form
    setDate(undefined);
    setTime('09:00');
    setDuration('30');
    setNotes('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-medium">Schedule a Session with {recipientName}</h3>
      
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  id="date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Session Type</Label>
            <Select value={type} onValueChange={(value: 'video' | 'chat') => setType(value)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video Call</SelectItem>
                <SelectItem value="chat">Chat Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input
            id="notes"
            placeholder="Add any notes or reason for the session"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        
        <Button 
          onClick={handleScheduleSession} 
          disabled={!date}
          className="w-full bg-medilink-primary hover:bg-medilink-primary/90"
        >
          Schedule Session
        </Button>
      </Card>
    </motion.div>
  );
};

export default SessionScheduler;
