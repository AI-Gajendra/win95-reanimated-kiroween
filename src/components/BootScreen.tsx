import React, { useState, useEffect } from 'react';

interface BootScreenProps {
  onBootComplete?: () => void;
  duration?: number; // milliseconds, default 3000
}

export const BootScreen: React.FC<BootScreenProps> = ({
  onBootComplete,
  duration = 3000,
}) => {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Boot messages to display sequentially
    const bootMessages = [
      'Starting Windows 95...',
      'Loading system components...',
      'Initializing virtual file system...',
      'Resurrecting system components...',
      'Preparing desktop environment...',
    ];

    // Display messages sequentially
    const messageInterval = duration / bootMessages.length;
    const timers: NodeJS.Timeout[] = [];

    bootMessages.forEach((message, index) => {
      const timer = setTimeout(() => {
        setMessages((prev) => [...prev, message]);
      }, messageInterval * index);
      timers.push(timer);
    });

    // Trigger completion callback after duration
    const completionTimer = setTimeout(() => {
      if (onBootComplete) {
        onBootComplete();
      }
    }, duration);
    timers.push(completionTimer);

    // Cleanup timers on unmount
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [duration, onBootComplete]);

  return (
    <div
      className="fixed inset-0 z-50 bg-win95-black flex flex-col items-center justify-center"
      role="alert"
      aria-live="polite"
      aria-label="System boot screen"
    >
      {/* Win95 Logo Area */}
      <div className="mb-8 flex flex-col items-center">
        <div className="text-win95-white text-6xl font-bold mb-2 tracking-wider">
          Windows <span className="text-win95-teal">95</span>
        </div>
        <div className="text-win95-dark-gray text-sm">
          Reanimated Edition
        </div>
      </div>

      {/* Boot Messages */}
      <div className="w-[500px] min-h-[150px] flex flex-col gap-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className="text-win95-white font-win95-mono text-xs animate-pulse"
          >
            {message}
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      <div className="mt-8 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 bg-win95-teal animate-pulse"
            style={{
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
