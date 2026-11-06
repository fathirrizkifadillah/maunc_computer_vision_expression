import React from 'react';
import { ScanFace, Gamepad2, Info, Sliders } from 'lucide-react';

export type AppMode = 'home' | 'scanner' | 'battle';

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onOpenInfo: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onOpenInfo,
  onOpenSettings,
}) => {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-3 sm:px-4 lg:px-8 py-2 sm:py-2.5 transition-colors">
      <div className="max-w-[1540px] mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: MAUNC Brand & Title */}
        <div className="flex items-center space-x-2 sm:space-x-3.5 cursor-pointer flex-shrink-0" onClick={() => onSelectMode('home')}>
          {/* Official MAUNC Horizontal Brand */}
          <div className="flex items-center">
            <img
              src="/assets/brand/maunc-horizontal.png"
              alt="MAUNC Logo"
              className="h-8 sm:h-9 md:h-11 w-auto object-contain"
            />
          </div>

          {/* Vertical divider */}
          <div className="hidden md:block h-7 w-[2px] bg-gray-200" />

          {/* Subtitle / Product Badge */}
          <div className="hidden md:flex flex-col">
            <span className="text-xs md:text-sm font-bold text-maunc-black tracking-tight leading-tight">
              MAUNC AI
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              Robotic Tiger Vision
            </span>
          </div>
        </div>

        {/* Center & Right: Mode Switcher Pills + Camera Settings + Info Button */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Scanner Pill */}
          <button
            onClick={() => onSelectMode('scanner')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[38px] sm:min-h-[42px] ${
              currentMode === 'scanner'
                ? 'bg-maunc-yellow text-maunc-black shadow-md font-bold'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={currentMode === 'scanner'}
          >
            <ScanFace className="w-4 h-4 text-maunc-black flex-shrink-0" />
            <span>
              <span className="hidden sm:inline">Expression </span>Scanner
            </span>
          </button>

          {/* Battle Pill */}
          <button
            onClick={() => onSelectMode('battle')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[38px] sm:min-h-[42px] ${
              currentMode === 'battle'
                ? 'bg-maunc-yellow text-maunc-black shadow-md font-bold'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={currentMode === 'battle'}
          >
            <Gamepad2 className="w-4 h-4 text-maunc-black flex-shrink-0" />
            <span>
              <span className="hidden sm:inline">Expression </span>Battle
            </span>
          </button>

          {/* Camera Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 sm:p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-maunc-black transition-colors cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center flex-shrink-0"
            title="Pengaturan Kamera"
            aria-label="Pengaturan Kamera"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Info Modal Button */}
          <button
            onClick={onOpenInfo}
            className="p-2 sm:p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-maunc-black transition-colors cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center flex-shrink-0"
            title="Informasi Sistem"
            aria-label="Informasi Sistem"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
