
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
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
import { CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { Session } from '@/types';
import { motion } from 'framer-motion';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Slot {
  doctorId: string;
  startTime: string;
  duration: number;
  available: boolean;
}

interface SessionSchedulerProps {
  recipientId: string;
  recipientName: string;
  onScheduled?: (session: Session) => void;
}

const SessionScheduler = ({ recipientId, recipientName, onScheduled }: SessionSchedulerProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [duration, setDuration] = useState<string>('30');
  const [type, setType] = useState<'video' | 'chat'>('video');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<Slot[]>([]);
  const { user } = useAuth();
  const { socket, scheduleSession, sessionHistory } = useSocket();
  const { toast } = useToast();

  // Clear error when inputs change
  useEffect(() => {
    if (error) setError(null);
  }, [date, selectedSlot, duration]);
  
  // Get available slots from the server
  useEffect(() => {
    if (!user) return;
    
    const doctorId = user.role === 'doctor' ? user.id : recipientId;
    
    // Listen for slots list
    const handleSlotsList = (slots: Slot[]) => {
      setAvailableSlots(slots);
    };
    
    // Listen for slots updates
    const handleSlotsUpdated = (data: { doctorId: string, slots: Slot[] }) => {
      if (data.doctorId === doctorId) {
        setAvailableSlots(data.slots);
      }
    };
    
    socket.on('slots:list', handleSlotsList);
    socket.on('slots:updated', handleSlotsUpdated);
    
    // Request slots for this doctor
    socket.emit('slots:get', doctorId);
    
    return () => {
      socket.off('slots:list', handleSlotsList);
      socket.off('slots:updated', handleSlotsUpdated);
    };
  }, [user, recipientId, socket]);
  
  // Filter available slots for the selected date
  useEffect(() => {
    if (!date || !availableSlots.length) {
      setFilteredSlots([]);
      return;
    }
    
    const filtered = availableSlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      return (
        slotDate.getDate() === date.getDate() &&
        slotDate.getMonth() === date.getMonth() &&
        slotDate.getFullYear() === date.getFullYear() &&
        slot.available
      );
    });
    
    setFilteredSlots(filtered);
    
    // Clear selected slot if it's not in the filtered list
    if (selectedSlot && !filtered.some(slot => slot.startTime === selectedSlot.startTime)) {
      setSelectedSlot(null);
    }
  }, [date, availableSlots, selectedSlot]);

  const handleScheduleSession = () => {
    if (!date || !selectedSlot || !user) {
      setError('Please select a date and time slot');
      return;
    }
    
    const scheduledAt = new Date(selectedSlot.startTime);
    const doctorId = user.role === 'doctor' ? user.id : recipientId;
    const patientId = user.role === 'patient' ? user.id : recipientId;
    const doctorName = user.role === 'doctor' ? user.name : recipientName;
    const patientName = user.role === 'patient' ? user.name : recipientName;
    
    const sessionData: Session = {
      id: `session-${Date.now()}`,
      doctorId,
      patientId,
      doctorName,
      patientName,
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
    setSelectedSlot(null);
    setDuration('30');
    setNotes('');
  };

  // Render time slot options
  const renderTimeSlots = () => {
    if (!date) return <p className="text-muted-foreground">Select a date first</p>;
    
    if (filteredSlots.length === 0) {
      return <p className="text-muted-foreground">No available slots for this date</p>;
    }
    
    return (
      <div className="grid grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto">
        {filteredSlots.map((slot, index) => (
          <Button
            key={index}
            variant={selectedSlot?.startTime === slot.startTime ? "default" : "outline"}
            className={`
              ${selectedSlot?.startTime === slot.startTime ? 'bg-medilink-primary text-white' : 'hover:bg-medilink-secondary hover:text-medilink-primary'}
            `}
            onClick={() => setSelectedSlot(slot)}
          >
            {format(new Date(slot.startTime), 'h:mm a')}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-medium">Schedule a Session with {recipientName}</h3>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="date">Select Date</Label>
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
          <Label>Available Time Slots</Label>
          <div className="min-h-20 border rounded-md p-2">
            {renderTimeSlots()}
          </div>
        </div>
        
        <Separator />
        
        {selectedSlot && (
          <div className="bg-medilink-secondary/30 p-3 rounded-md">
            <p className="font-medium text-medilink-primary">Selected Slot</p>
            <p className="text-sm">
              {format(new Date(selectedSlot.startTime), 'PPP')} at {format(new Date(selectedSlot.startTime), 'h:mm a')}
            </p>
          </div>
        )}
        
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
          disabled={!date || !selectedSlot}
          className="w-full bg-medilink-primary hover:bg-medilink-primary/90"
        >
          Schedule Session
        </Button>
      </Card>
    </motion.div>
  );
};

export default SessionScheduler;
