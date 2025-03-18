
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import { useSocket } from '@/contexts/SocketContext';

interface IncomingCallDialogProps {
  isOpen: boolean;
  caller: {
    name: string;
    role: string;
  };
  callId: string;
}

const IncomingCallDialog = ({ isOpen, caller, callId }: IncomingCallDialogProps) => {
  const { acceptCall, rejectCall } = useSocket();

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Incoming Call</DialogTitle>
          <DialogDescription className="text-center text-lg">
            {caller.name} is calling you
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center my-4">
          <div className="w-20 h-20 rounded-full bg-medilink-secondary flex items-center justify-center text-4xl text-medilink-primary">
            {caller.name.charAt(0)}
          </div>
        </div>
        
        <DialogFooter className="flex justify-center gap-4 sm:gap-6">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full h-14 w-14 p-0 border-red-500 text-red-500 hover:bg-red-50"
            onClick={() => rejectCall(callId)}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
          
          <Button
            variant="default"
            size="lg"
            className="rounded-full h-14 w-14 p-0 bg-green-500 hover:bg-green-600"
            onClick={() => acceptCall(callId)}
          >
            <Phone className="h-6 w-6" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallDialog;
