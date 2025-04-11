
import { useState, useEffect } from 'react';
import { format, addDays, parse, isValid } from 'date-fns';
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
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Clock, Plus, X, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface TimeRange {
  start: string;
  end: string;
}

interface AvailabilityDay {
  date: Date;
  timeRanges: TimeRange[];
}

const DoctorAvailabilityManager = ({ doctorId }: { doctorId: string }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDay[]>([]);
  const [currentTimeRanges, setCurrentTimeRanges] = useState<TimeRange[]>([{ start: '09:00', end: '17:00' }]);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const { toast } = useToast();

  // Clear error when inputs change
  useEffect(() => {
    if (error) setError(null);
  }, [selectedDate, currentTimeRanges]);

  // Load existing availability for this date when date changes
  useEffect(() => {
    if (!selectedDate) return;
    
    const existingDay = availabilityDays.find(day => 
      day.date.getDate() === selectedDate.getDate() &&
      day.date.getMonth() === selectedDate.getMonth() &&
      day.date.getFullYear() === selectedDate.getFullYear()
    );
    
    if (existingDay) {
      setCurrentTimeRanges(existingDay.timeRanges);
    } else {
      // Default 9-5 schedule
      setCurrentTimeRanges([{ start: '09:00', end: '17:00' }]);
    }
  }, [selectedDate, availabilityDays]);

  // Add a new time range
  const addTimeRange = () => {
    setCurrentTimeRanges([...currentTimeRanges, { start: '09:00', end: '17:00' }]);
  };

  // Remove a time range
  const removeTimeRange = (index: number) => {
    setCurrentTimeRanges(currentTimeRanges.filter((_, i) => i !== index));
  };

  // Update a time range
  const updateTimeRange = (index: number, field: 'start' | 'end', value: string) => {
    const newRanges = [...currentTimeRanges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    setCurrentTimeRanges(newRanges);
  };

  // Validate time range
  const validateTimeRange = (range: TimeRange) => {
    if (!range.start || !range.end) return false;
    
    // Check format
    const startDate = parse(range.start, 'HH:mm', new Date());
    const endDate = parse(range.end, 'HH:mm', new Date());
    
    if (!isValid(startDate) || !isValid(endDate)) return false;
    
    // Check that end is after start
    return startDate < endDate;
  };

  // Save availability for the selected date
  const saveAvailability = () => {
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    
    // Validate time ranges
    const invalidRanges = currentTimeRanges.filter(range => !validateTimeRange(range));
    if (invalidRanges.length > 0) {
      setError('One or more time ranges are invalid. Make sure end time is after start time.');
      return;
    }
    
    // Find if we already have this date
    const dateIndex = availabilityDays.findIndex(day => 
      day.date.getDate() === selectedDate.getDate() &&
      day.date.getMonth() === selectedDate.getMonth() &&
      day.date.getFullYear() === selectedDate.getFullYear()
    );
    
    const newAvailabilityDays = [...availabilityDays];
    
    if (dateIndex >= 0) {
      // Update existing day
      newAvailabilityDays[dateIndex] = {
        date: selectedDate,
        timeRanges: currentTimeRanges
      };
    } else {
      // Add new day
      newAvailabilityDays.push({
        date: selectedDate,
        timeRanges: currentTimeRanges
      });
    }
    
    setAvailabilityDays(newAvailabilityDays);
    
    // Transform data for the server
    const serverData: Record<string, TimeRange[]> = {};
    newAvailabilityDays.forEach(day => {
      const dateKey = format(day.date, 'yyyy-MM-dd');
      serverData[dateKey] = day.timeRanges;
    });
    
    // Send to server
    socket.emit('availability:set', {
      doctorId,
      availability: serverData
    });
    
    toast({
      title: "Availability Updated",
      description: `Your availability for ${format(selectedDate, 'PPP')} has been updated.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-medium">Set Your Availability</h3>
      
      {error && (
        <Alert variant="destructive">
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
                {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Available Hours</Label>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              onClick={addTimeRange}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Time Range
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {currentTimeRanges.map((range, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex flex-1 gap-2">
                  <div className="w-1/2">
                    <Label htmlFor={`start-${index}`} className="sr-only">Start Time</Label>
                    <Input
                      id={`start-${index}`}
                      type="time"
                      value={range.start}
                      onChange={(e) => updateTimeRange(index, 'start', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="w-1/2">
                    <Label htmlFor={`end-${index}`} className="sr-only">End Time</Label>
                    <Input
                      id={`end-${index}`}
                      type="time"
                      value={range.end}
                      onChange={(e) => updateTimeRange(index, 'end', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeTimeRange(index)}
                  disabled={currentTimeRanges.length === 1}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        <Button 
          onClick={saveAvailability} 
          disabled={!selectedDate || currentTimeRanges.length === 0}
          className="w-full bg-medilink-primary hover:bg-medilink-primary/90"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Availability
        </Button>
      </Card>
      
      <div className="mt-4">
        <h4 className="text-md font-medium mb-2">Your Configured Availability</h4>
        {availabilityDays.length === 0 ? (
          <p className="text-muted-foreground">No custom availability configured yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availabilityDays.map((day, index) => (
              <Card key={index} className="p-3">
                <div className="font-medium">{format(day.date, 'PPP')}</div>
                <div className="text-sm text-muted-foreground">
                  {day.timeRanges.map((range, idx) => (
                    <div key={idx}>
                      {range.start} - {range.end}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DoctorAvailabilityManager;
