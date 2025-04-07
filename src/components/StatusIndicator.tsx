
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
  className?: string;
  pulseEffect?: boolean;
}

const StatusIndicator = ({ 
  status, 
  size = 'md', 
  showTooltip = true, 
  className = '',
  pulseEffect = false
}: StatusIndicatorProps) => {
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
    switch (status) {
      case 'online':
        return 'Online - Available';
      case 'busy':
        return 'Busy - In a call or session';
      case 'offline':
        return 'Offline - Unavailable';
      default:
        return 'Status unknown';
    }
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
    <Circle 
      className={`${getSize()} ${getStatusColor()} fill-current ${className} 
      ${pulseEffect && status === 'online' ? 'animate-pulse' : ''}`} 
    />
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
