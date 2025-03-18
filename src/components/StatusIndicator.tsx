
import { Circle } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const StatusIndicator = ({ status, size = 'md', showTooltip = true }: StatusIndicatorProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'busy':
        return 'text-amber-500';
      case 'offline':
        return 'text-slate-300';
      default:
        return 'text-slate-300';
    }
  };
  
  const getStatusText = () => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'h-2 w-2';
      case 'lg':
        return 'h-4 w-4';
      default:
        return 'h-3 w-3';
    }
  };
  
  const indicator = (
    <Circle className={`${getSize()} ${getStatusColor()} fill-current`} />
  );
  
  if (!showTooltip) {
    return indicator;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StatusIndicator;
