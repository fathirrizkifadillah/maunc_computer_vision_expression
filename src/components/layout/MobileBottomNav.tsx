import React from 'react';
import { ScanFace, Gamepad2 } from 'lucide-react';
import { AppMode } from './Header';

interface MobileBottomNavProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentMode,
  onSelectMode,
}) => {
  return (
    <nav
      className="fixed bottom-3 left-3 right-3 z-40 md:hidden bg-[#121316]/95 backdrop-blur-md border border-gray-800/80 rounded-2xl p-1.5 shadow-2xl flex items-center justify-between select-none mb-[env(safe-area-inset-bottom)]"
      aria-label="Navigasi Mode Mobile"
    >
      {/* Mode 1 Button: Scanner */}
      <button
        onClick={() => onSelectMode('scanner')}
        className={`flex-1 flex items-center justify-center space-x-1.5 sm:space-x-2 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer min-h-[44px] active:scale-95 ${
          currentMode === 'scanner'
            ? 'bg-maunc-yellow text-maunc-black shadow-glow-yellow'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        aria-pressed={currentMode === 'scanner'}
      >
        <ScanFace className="w-4 h-4 flex-shrink-0" />
        <span className="hidden xs:inline">Expression </span>
        <span>Scanner</span>
      </button>

      {/* Mode 2 Button: Battle */}
      <button
        onClick={() => onSelectMode('battle')}
        className={`flex-1 flex items-center justify-center space-x-1.5 sm:space-x-2 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer min-h-[44px] active:scale-95 ${
          currentMode === 'battle'
            ? 'bg-maunc-yellow text-maunc-black shadow-glow-yellow'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        aria-pressed={currentMode === 'battle'}
      >
        <Gamepad2 className="w-4 h-4 flex-shrink-0" />
        <span className="hidden xs:inline">Expression </span>
        <span>Battle</span>
      </button>
    </nav>
  );
};
