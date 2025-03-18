
import { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoCallProps {
  callData: any;
  onEndCall: () => void;
}

const VideoCall = ({ callData, onEndCall }: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const { endCall } = useSocket();

  // For demo purposes, we'll use pre-recorded video files
  useEffect(() => {
    // Get local video stream
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Mock remote video with a delay
        setTimeout(() => {
          if (remoteVideoRef.current) {
            // In a real app, this would come from WebRTC connection
            remoteVideoRef.current.srcObject = stream;
          }
        }, 1000);
      })
      .catch((err) => {
        console.error('Error accessing media devices:', err);
      });

    return () => {
      // Clean up
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const handleEndCall = () => {
    endCall();
    onEndCall();
  };

  const otherPartyName = callData?.caller?.id === callData?.receiver?.id
    ? callData?.receiver?.name
    : callData?.caller?.name;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full relative rounded-2xl overflow-hidden shadow-elevation"
    >
      {/* Remote video (main view) */}
      <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted={false}
          className="w-full h-full object-cover"
        />
        
        {/* Call info overlay */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
          Call with {otherPartyName}
        </div>
        
        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-24 right-4 w-1/4 aspect-video rounded-xl overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Call controls */}
        <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm border-0 p-2 rounded-full">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className={`rounded-full h-12 w-12 ${isAudioMuted ? 'text-red-500 bg-red-500/20' : 'text-white'}`}
            >
              {isAudioMuted ? <MicOff /> : <Mic />}
            </Button>
            
            <Button
              variant="destructive"
              size="icon"
              onClick={handleEndCall}
              className="rounded-full h-14 w-14 bg-red-600 hover:bg-red-700"
            >
              <Phone className="h-6 w-6 rotate-135" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVideo}
              className={`rounded-full h-12 w-12 ${!isVideoEnabled ? 'text-red-500 bg-red-500/20' : 'text-white'}`}
            >
              {isVideoEnabled ? <Video /> : <VideoOff />}
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default VideoCall;
