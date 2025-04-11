
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { useSocket } from '@/contexts/SocketContext';
import { Session } from '@/types';
import { motion } from 'framer-motion';

const AppointmentCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { sessionHistory } = useSocket();
  
  // Get days of the current month
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  
  // Filter sessions for the selected date
  const getDayAppointments = (day: Date): Session[] => {
    return sessionHistory.filter(session => {
      const sessionDate = parseISO(session.scheduledAt);
      return isSameDay(sessionDate, day);
    });
  };
  
  // Go to next/previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(prevMonth.getMonth() - 1);
      return newMonth;
    });
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(prevMonth.getMonth() + 1);
      return newMonth;
    });
  };
  
  // Handle day click
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setOpenDialog(true);
  };
  
  // Get appointment count for a specific day
  const getAppointmentCount = (day: Date): number => {
    return getDayAppointments(day).length;
  };
  
  // Determine day status
  const getDayStatus = (day: Date) => {
    const appointments = getDayAppointments(day);
    
    if (appointments.length === 0) return null;
    
    if (appointments.some(app => app.status === 'cancelled')) {
      return 'cancelled';
    }
    if (appointments.some(app => app.status === 'completed')) {
      return 'completed';
    }
    return 'scheduled';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2" />
          Appointment Calendar
        </h3>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        {/* Calendar header - days of the week */}
        <div className="grid grid-cols-7 text-center border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2 text-sm font-medium text-slate-600">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {daysInMonth.map((day, index) => {
            const dayOfMonth = day.getDate();
            const isToday = isSameDay(day, new Date());
            const appointmentCount = getAppointmentCount(day);
            const dayStatus = getDayStatus(day);
            
            return (
              <div 
                key={index}
                className={`
                  min-h-20 p-2 border border-slate-100 relative
                  ${isToday ? 'bg-slate-50' : ''}
                  ${dayStatus === 'completed' ? 'bg-green-50' : ''}
                  ${dayStatus === 'scheduled' ? 'bg-blue-50' : ''}
                  ${dayStatus === 'cancelled' ? 'bg-red-50' : ''}
                  hover:bg-slate-50 cursor-pointer transition
                `}
                onClick={() => handleDayClick(day)}
              >
                <div className={`
                  text-sm font-medium
                  ${isToday ? 'text-medilink-primary font-bold' : ''}
                `}>
                  {dayOfMonth}
                </div>
                
                {appointmentCount > 0 && (
                  <Badge 
                    className={`
                      absolute top-1 right-1 
                      ${dayStatus === 'completed' ? 'bg-green-600' : ''}
                      ${dayStatus === 'scheduled' ? 'bg-blue-600' : ''}
                      ${dayStatus === 'cancelled' ? 'bg-red-600' : 'bg-medilink-primary'}
                    `}
                  >
                    {appointmentCount}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </Card>
      
      {/* Day detail dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'MMMM d, yyyy')} Appointments
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedDate && getDayAppointments(selectedDate).length > 0 ? (
              getDayAppointments(selectedDate).map((appointment) => (
                <Card key={appointment.id} className="p-3 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {appointment.type === 'video' ? 'Video Call' : 'Chat Session'} with {appointment.patientName}
                      </div>
                      
                      <div className="text-sm text-slate-500">
                        {format(parseISO(appointment.scheduledAt), 'p')} ({appointment.duration} min)
                      </div>
                      
                      <div className="mt-1">
                        <Badge 
                          className={`
                            ${appointment.status === 'completed' ? 'bg-green-600' : ''}
                            ${appointment.status === 'scheduled' ? 'bg-blue-600' : ''}
                            ${appointment.status === 'cancelled' ? 'bg-red-600' : ''}
                          `}
                        >
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-2 text-sm bg-slate-50 p-2 rounded">
                      {appointment.notes}
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">No appointments scheduled for this day.</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AppointmentCalendar;
