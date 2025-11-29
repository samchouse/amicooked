'use client';

import { useEffect, useState } from 'react';

const loadingMessages = [
  'Analyzing your study habits...',
  'Calculating academic factors...',
  'Comparing with successful students...',
  'Generating personalized insights...',
  'Preparing your results...',
];

export default function Loading() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-xl p-12">
        {/* Animated flame/fire icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl animate-bounce">🔥</div>
          </div>
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full border-4 border-orange-200 animate-ping opacity-30" />
          <div className="absolute inset-2 rounded-full border-4 border-orange-300 animate-ping opacity-20" style={{ animationDelay: '0.2s' }} />
          <div className="absolute inset-4 rounded-full border-4 border-orange-400 animate-ping opacity-10" style={{ animationDelay: '0.4s' }} />
        </div>

        {/* Loading bar */}
        <div className="h-2 bg-zinc-200 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 rounded-full animate-loading-bar" />
        </div>

        {/* Message */}
        <p className="text-lg font-medium text-zinc-700 transition-opacity duration-300">
          {loadingMessages[messageIndex]}
        </p>
        <p className="text-sm text-zinc-400 mt-2">This will only take a moment</p>
      </div>
    </div>
  );
}
