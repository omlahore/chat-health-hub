import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { useToast } from "@/components/ui/use-toast";
import { PhoneCall } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface EmergencyButtonProps {
  className?: string;
}

const EmergencyButton = ({ className }: EmergencyButtonProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleEmergencyAction = () => {
    toast({
      title: "Emergency Request Sent",
      description: "Medical assistance has been alerted. Stay on the line.",
      variant: "destructive",
    });

    // In a real application, this would trigger emergency alerts
    // and potentially notify healthcare providers or emergency services

    // Play emergency sound
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play();

    // Close the dialog
    setIsOpen(false);

    // Simulate a phone call after a delay
    setTimeout(() => {
      toast({
        title: "Medical Response Team",
        description: "Our team is connecting to you. Please hold.",
      });
    }, 2000);
  };

  // Use Drawer for mobile and AlertDialog for desktop
  if (isMobile) {
    return (
      <>
        <Button 
          variant="destructive" 
          size="sm" 
          className={`pulse-animation ${className}`}
          onClick={() => setIsOpen(true)}
        >
          <PhoneCall className="h-4 w-4 mr-2" />
          Emergency
        </Button>

        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="text-center text-destructive">Emergency Assistance</DrawerTitle>
              <DrawerDescription className="text-center">
                This will alert our medical response team immediately.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 text-center">
              <p className="mb-2">Patient: {user?.name}</p>
              <p className="mb-4">ID: {user?.id}</p>
              <p className="mb-4 font-medium">Are you experiencing a medical emergency?</p>
            </div>
            <DrawerFooter>
              <Button onClick={handleEmergencyAction} variant="destructive" className="w-full">
                <PhoneCall className="h-4 w-4 mr-2" />
                Confirm Emergency
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Button 
        variant="destructive" 
        size="sm" 
        className={`pulse-animation ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <PhoneCall className="h-4 w-4 mr-2" />
        Emergency
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Emergency Assistance</AlertDialogTitle>
            <AlertDialogDescription>
              This will alert our medical response team immediately.
              <div className="mt-4 p-3 bg-slate-50 rounded-md">
                <p className="mb-1"><strong>Patient:</strong> {user?.name}</p>
                <p><strong>ID:</strong> {user?.id}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEmergencyAction} className="bg-destructive hover:bg-destructive/90">
              <PhoneCall className="h-4 w-4 mr-2" />
              Confirm Emergency
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EmergencyButton;
