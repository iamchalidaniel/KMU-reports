"use client";

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  icon?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({
  content,
  children,
  icon = true,
  position = 'top',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  const arrowClasses = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-gray-700 dark:border-t-gray-300 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-gray-700 dark:border-b-gray-300 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent',
    left: 'left-[-4px] top-1/2 -translate-y-1/2 border-l-gray-700 dark:border-l-gray-300 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent',
    right: 'right-[-4px] top-1/2 -translate-y-1/2 border-r-gray-700 dark:border-r-gray-300 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children || (
          icon && (
            <HelpCircle className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition" />
          )
        )}
      </div>

      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gray-700 dark:bg-gray-800 rounded-lg shadow-lg whitespace-nowrap pointer-events-none ${positionClasses[position]} animate-in fade-in duration-150`}
        >
          {content}
          <div className={`absolute ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
}
