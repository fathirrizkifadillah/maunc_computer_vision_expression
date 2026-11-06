import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#14161A] text-white py-2 sm:py-2.5 px-3 sm:px-4 md:px-8 border-t border-gray-800/80 relative z-20 flex-shrink-0">
      <div className="max-w-[1540px] mx-auto flex items-center justify-between flex-wrap gap-2 text-[10px] sm:text-xs">
        {/* Left: Official MAUNC Gear Emblem Logo + Brand Text */}
        <div className="flex items-center space-x-2.5">
          <img
            src="/assets/brand/maunc-logo.png"
            alt="MAUNC Emblem Logo"
            className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 object-contain flex-shrink-0"
          />
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
            <span className="font-extrabold tracking-wider text-xs sm:text-sm text-white">
              MAUNC
            </span>
            <span className="text-gray-400 text-[10px] sm:text-[11px] md:text-xs font-medium">
              Mechanical Autonomous Navigation Control
            </span>
          </div>
        </div>

        {/* Center: Subtle horizontal line */}
        <div className="hidden lg:block flex-1 mx-6 h-[1px] bg-gradient-to-r from-maunc-yellow/40 via-gray-700/50 to-transparent" />

        {/* Right: Organization Identity */}
        <div className="text-[10px] sm:text-[11px] text-gray-400 font-mono flex items-center space-x-2">
          <span>Universitas Siliwangi</span>
        </div>
      </div>
    </footer>
  );
};
