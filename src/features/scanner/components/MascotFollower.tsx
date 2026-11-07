import React from 'react';
import { FinalExpression } from '../../vision/types';
import { getExpressionConfig } from '../../vision/classification/expressionMapping';

interface MascotFollowerProps {
  expression: FinalExpression | null;
  selectedFaceId: string | null;
}

export const MascotFollower: React.FC<MascotFollowerProps> = ({ expression, selectedFaceId }) => {
  const currentConfig = getExpressionConfig(expression);

  return (
    <div className="w-full h-56 xs:h-64 sm:h-72 md:h-80 lg:h-auto lg:flex-1 min-h-0 flex flex-col items-center justify-end relative select-none overflow-hidden">
      {/* Floating Expression Status Badge with Official Avatar */}
      <div className="mb-1.5 sm:mb-2 z-20 flex items-center space-x-2 bg-[#181A20]/90 backdrop-blur-md text-white border border-maunc-yellow/30 px-3 sm:px-3.5 py-1 rounded-full shadow-lg animate-fade-in">
        <img
          src={currentConfig.assetPath}
          alt={currentConfig.label}
          className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
        />
        <span className="text-[11px] sm:text-xs font-bold text-gray-300">
          {selectedFaceId || 'Mascot AI'}
        </span>
        <span className="text-gray-500 text-xs">•</span>
        <span className="text-[11px] sm:text-xs font-black text-maunc-yellow uppercase tracking-wider">
          {currentConfig.label}
        </span>
      </div>

      {/* Hero-Sized Half-Body Mascot (Large, Prominent, Crisp, Zero Clutter) */}
      <div className="relative w-full flex-1 min-h-0 flex items-end justify-center">
        <img
          src="/assets/mascot/maunc-mascot-half.png"
          alt="MAUNC Mascot Robotic Tiger"
          className="h-full max-h-[260px] sm:max-h-[340px] lg:max-h-[440px] xl:max-h-[500px] w-auto object-contain filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.22)] transition-transform duration-300 hover:scale-105"
        />
      </div>
    </div>
  );
};
