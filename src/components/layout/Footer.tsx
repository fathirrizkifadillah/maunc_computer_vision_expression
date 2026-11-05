import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#18181B] text-white py-3 px-4 md:px-8 border-t border-gray-800 relative z-10 overflow-hidden">
      <div className="max-w-[1540px] mx-auto flex items-center justify-between flex-wrap gap-3">
        {/* Left: Hazard diagonal tech stripes + MAUNC brand text */}
        <div className="flex items-center space-x-3">
          <div className="h-6 w-10 sm:w-12 hazard-stripes rounded-sm border border-yellow-500/30 flex-shrink-0" />
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="font-extrabold tracking-wider text-sm md:text-base text-white">
              MAUNC
            </span>
            <span className="text-gray-400 text-xs md:text-sm font-medium">
              Mechanical Autonomous Navigation Control
            </span>
          </div>
        </div>

        {/* Center: Subtle horizontal line */}
        <div className="hidden lg:block flex-1 mx-6 h-[1px] bg-gradient-to-r from-maunc-yellow/50 via-gray-700 to-transparent" />

        {/* Right note */}
        <div className="text-xs text-gray-400 font-mono">
          <span>Universitas Siliwangi</span>
        </div>
      </div>
    </footer>
  );
};
