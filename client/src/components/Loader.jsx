import { FiLoader } from 'react-icons/fi';

export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 w-full animate-in fade-in duration-500">
      {/* Animated Spinner Container */}
      <div className="relative flex items-center justify-center">
        {/* Outer Glow/Pulse Effect */}
        <div className="absolute h-12 w-12 rounded-full bg-blue-100 animate-ping opacity-20"></div>
        
        {/* Main Spinning Icon */}
        <FiLoader className="h-10 w-10 text-blue-600 animate-spin transition-all" />
      </div>

      {/* Loading Text */}
      <div className="mt-4 flex flex-col items-center">
        <span className="text-sm font-semibold text-gray-700 tracking-wide">
          {text}
        </span>
        
        {/* Mini progress line (Optional but looks cool) */}
        <div className="mt-2 h-1 w-24 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-shimmer w-1/2"></div>
        </div>
      </div>
    </div>
  );
}