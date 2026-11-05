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
    <div className="w-full flex-1 min-h-[160px] max-h-[260px] flex flex-col items-center justify-end relative select-none">
      {/* Minimal Floating Expression Status Badge (Only shown when active, zero clutter) */}
      {selectedFaceId && (
        <div className="mb-2 z-20 flex items-center space-x-2 bg-maunc-black/90 backdrop-blur-md text-white border border-white/10 px-3.5 py-1 rounded-full shadow-lg animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-maunc-yellow animate-ping" />
          <span className="text-xs font-bold tracking-wide">{selectedFaceId}</span>
          <span className="text-gray-400 text-xs">•</span>
          <span className="text-xs font-extrabold text-maunc-yellow uppercase tracking-wider">
            {currentConfig.label}
          </span>
        </div>
      )}

      {/* Large Half-Body Mascot (Crisp, Hero-Sized, No Clutter Text) */}
      <div className="relative w-full h-full flex items-end justify-center">
        <img
          src="/assets/mascot/maunc-mascot-half.png"
          alt="MAUNC Mascot Robotic Tiger"
          className="h-48 md:h-56 lg:h-64 w-auto max-w-full object-contain filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-all duration-300 hover:scale-105"
        />
      </div>
    </div>
  );
};
