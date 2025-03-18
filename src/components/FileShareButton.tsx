
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/components/ui/use-toast';
import { File, Image, Paperclip, Upload, X } from 'lucide-react';

interface FileShareButtonProps {
  recipientId: string;
  variant?: 'icon' | 'full';
}

const FileShareButton = ({ recipientId, variant = 'icon' }: FileShareButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { shareFile } = useSocket();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleShareFile = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      const success = await shareFile(recipientId, selectedFile);
      
      if (success) {
        toast({
          title: "File shared",
          description: `Successfully shared ${selectedFile.name}`,
        });
        setIsDialogOpen(false);
        setSelectedFile(null);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to share file. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while sharing the file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="h-8 w-8 text-slate-400" />;
    
    if (selectedFile.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-medilink-primary" />;
    } else {
      return <File className="h-8 w-8 text-medilink-primary" />;
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {variant === 'icon' ? (
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-10 w-10 flex-shrink-0"
            type="button"
          >
            <Paperclip className="h-5 w-5 text-slate-500" />
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="flex items-center"
            type="button"
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Share Files
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            
            <div className="flex flex-col items-center">
              {getFileIcon()}
              
              {selectedFile ? (
                <div className="mt-2 relative max-w-full">
                  <div className="flex items-center bg-slate-100 rounded px-3 py-1">
                    <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSelectedFile();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-2 font-medium">Drop file here or click to browse</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports images, documents and PDFs up to 5MB
                  </p>
                </>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleShareFile}
              disabled={!selectedFile || isUploading}
              className="bg-medilink-primary hover:bg-medilink-primary/90"
            >
              {isUploading ? 'Sharing...' : 'Share File'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileShareButton;
