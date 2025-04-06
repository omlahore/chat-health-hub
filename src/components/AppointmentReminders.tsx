
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Session } from '@/types';

interface AppointmentRemindersProps {
  sessions: Session[];
  patientId: string;
  className?: string;
}

const AppointmentReminders = ({ sessions, patientId, className }: AppointmentRemindersProps) => {
  const { toast } = useToast();
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    // Filter for upcoming sessions for this patient
    const upcoming = sessions
      .filter(session => 
        session.patientId === patientId &&
        session.status === 'scheduled' &&
        new Date(session.scheduledAt) > new Date()
      )
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    
    setUpcomingSessions(upcoming);
    
    // Check notification permission status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
    
    // Set up reminder checks
    const reminderCheck = setInterval(() => {
      checkUpcomingAppointments();
    }, 60000); // Check every minute
    
    // Initial check
    checkUpcomingAppointments();
    
    return () => {
      clearInterval(reminderCheck);
    };
  }, [sessions, patientId]);

  const checkUpcomingAppointments = () => {
    const now = new Date();
    
    upcomingSessions.forEach(session => {
      const sessionTime = new Date(session.scheduledAt);
      const timeDiff = sessionTime.getTime() - now.getTime();
      const minutesUntilSession = Math.floor(timeDiff / (1000 * 60));
      
      // Send reminder notifications at specific intervals
      if (minutesUntilSession === 60 || minutesUntilSession === 30 || minutesUntilSession === 15) {
        showReminderNotification(session, minutesUntilSession);
      }
    });
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications Not Supported",
        description: "Your browser does not support notifications.",
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You will now receive appointment reminders.",
        });
      } else {
        toast({
          title: "Notifications Disabled",
          description: "You will not receive appointment reminders.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const showReminderNotification = (session: Session, minutesRemaining: number) => {
    // In-app toast notification
    toast({
      title: "Upcoming Appointment",
      description: `Your appointment with ${session.doctorName} is in ${minutesRemaining} minutes.`,
    });
    
    // Play sound
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.3;
    audio.play();
    
    // Browser notification
    if (permissionStatus === 'granted') {
      const notification = new Notification('MediLink Appointment Reminder', {
        body: `Your appointment with ${session.doctorName} is in ${minutesRemaining} minutes.`,
        icon: '/favicon.ico'
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
  };

  const formatSessionTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getTimeUntilSession = (dateTimeString: string) => {
    const sessionTime = new Date(dateTimeString);
    const now = new Date();
    const timeDiff = sessionTime.getTime() - now.getTime();
    
    if (timeDiff < 0) return 'Past due';
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `in ${days} day${days > 1 ? 's' : ''}`;
    }
    
    if (hours > 0) {
      return `in ${hours} hr${hours > 1 ? 's' : ''} ${minutes} min`;
    }
    
    return `in ${minutes} min`;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <BellRing className="h-5 w-5 mr-2 text-yellow-500" />
            Appointment Reminders
          </div>
          {permissionStatus !== 'granted' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={requestNotificationPermission}
            >
              <Bell className="h-4 w-4 mr-1" />
              Enable Notifications
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Never miss your scheduled appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingSessions.length > 0 ? (
          <div className="space-y-3">
            {upcomingSessions.slice(0, 3).map((session) => {
              const { date, time } = formatSessionTime(session.scheduledAt);
              const timeUntil = getTimeUntilSession(session.scheduledAt);
              
              return (
                <div 
                  key={session.id} 
                  className="flex justify-between items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
                >
                  <div>
                    <h4 className="font-medium">{session.doctorName}</h4>
                    <div className="text-sm text-slate-500">
                      {date} • {time} 
                      ({session.duration} min, {session.type})
                    </div>
                  </div>
                  <Badge variant={timeUntil.includes('min') ? "destructive" : "outline"}>
                    {timeUntil}
                  </Badge>
                </div>
              );
            })}
            
            {upcomingSessions.length > 3 && (
              <div className="text-center text-sm text-slate-500 pt-2">
                +{upcomingSessions.length - 3} more upcoming appointments
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p>No upcoming appointments</p>
            <p className="text-sm mt-1">Schedule one from the Calendar tab</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentReminders;
