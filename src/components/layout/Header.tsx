import React from 'react';
import { ScanFace, Gamepad2, Info } from 'lucide-react';

export type AppMode = 'home' | 'scanner' | 'battle';

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onOpenInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentMode, onSelectMode, onOpenInfo }) => {
  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-[1540px] mx-auto flex items-center justify-between flex-wrap gap-4">
        {/* Left: MAUNC Brand & Title */}
        <div className="flex items-center space-x-4 cursor-pointer" onClick={() => onSelectMode('home')}>
          {/* Official MAUNC Horizontal Brand */}
          <div className="flex items-center">
            <img
              src="/assets/brand/maunc-horizontal.png"
              alt="MAUNC Logo"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </div>

          {/* Vertical divider */}
          <div className="hidden sm:block h-8 w-[2px] bg-gray-200" />

          {/* Subtitle / Product Badge */}
          <div className="hidden sm:flex flex-col">
            <span className="text-sm md:text-base font-bold text-maunc-black tracking-tight leading-tight">
              MAUNC AI
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Robotic Tiger Vision
            </span>
          </div>
        </div>

        {/* Center & Right: Mode Switcher Pills + Info Button */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Scanner Pill */}
          <button
            onClick={() => onSelectMode('scanner')}
            className={`flex items-center space-x-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 ${
              currentMode === 'scanner'
                ? 'bg-maunc-yellow text-maunc-black shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={currentMode === 'scanner'}
          >
            <ScanFace className="w-4 h-4 md:w-5 md:h-5 text-maunc-black" />
            <span>Expression Scanner</span>
          </button>

          {/* Battle Pill */}
          <button
            onClick={() => onSelectMode('battle')}
            className={`flex items-center space-x-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 ${
              currentMode === 'battle'
                ? 'bg-maunc-yellow text-maunc-black shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={currentMode === 'battle'}
          >
            <Gamepad2 className="w-4 h-4 md:w-5 md:h-5 text-maunc-black" />
            <span>Expression Battle</span>
          </button>

          {/* Info Modal Button */}
          <button
            onClick={onOpenInfo}
            className="p-2 md:p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            title="Informasi Sistem"
            aria-label="Informasi Sistem"
          >
            <Info className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
