import { useState } from 'react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { motion } from 'framer-motion';

const NotificationsPopover = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, markNotificationRead, markAllNotificationsRead } = useSocket();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      // When opening popover, mark all as read
      markAllNotificationsRead();
    }
    setIsOpen(open);
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = parseISO(timestamp);
    const now = new Date();
    
    // If less than 24 hours ago, show relative time
    if (now.getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    // Otherwise show date
    return format(date, 'PPp');
  };
  
  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-medium">Notifications</h3>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={markAllNotificationsRead}>
            Mark all as read
          </Button>
        </div>
        
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p>No notifications</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: notification.read ? 1 : 0.8, backgroundColor: notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)' }}
                  animate={{ opacity: 1, backgroundColor: 'transparent' }}
                  transition={{ duration: 0.3 }}
                  className="p-3 hover:bg-slate-50"
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm">{notification.title}</div>
                    <div className="text-xs text-slate-500">{formatTimestamp(notification.timestamp)}</div>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPopover;
