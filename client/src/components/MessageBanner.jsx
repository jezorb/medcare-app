import { 
  FiAlertCircle, 
  FiCheckCircle, 
  FiInfo, 
  FiAlertTriangle, 
  FiX 
} from 'react-icons/fi';
import { useState, useEffect } from 'react';

export default function MessageBanner({ tone = 'info', message }) {
  const [isVisible, setIsVisible] = useState(true);

  // Re-enable visibility if message changes
  useEffect(() => {
    if (message) setIsVisible(true);
  }, [message]);

  if (!message || !isVisible) return null;

  // Configuration for different tones
  const configs = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <FiAlertCircle className="h-5 w-5 text-red-500" />,
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <FiCheckCircle className="h-5 w-5 text-green-500" />,
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: <FiAlertTriangle className="h-5 w-5 text-amber-500" />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <FiInfo className="h-5 w-5 text-blue-500" />,
    },
  };

  const config = configs[tone] || configs.info;

  return (
    <div className={`mb-6 flex items-center justify-between p-4 rounded-lg border ${config.bg} ${config.border} shadow-sm animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        
        {/* Message Content */}
        <div className={`text-sm font-medium ${config.text}`}>
          {message}
        </div>
      </div>

      {/* Close Button */}
      <button 
        onClick={() => setIsVisible(false)}
        className={`ml-4 p-1.5 rounded-md hover:bg-white/50 transition-colors ${config.text}`}
        aria-label="Dismiss"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
}