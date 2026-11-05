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
    <div className="fixed -bottom-2 -right-2 z-30 pointer-events-none select-none flex items-end justify-end">
      {/* Angled Yellow Tech Backdrop Polygon (matching reference design) */}
      <div
        className="absolute bottom-0 right-0 w-64 md:w-80 h-48 md:h-64 bg-maunc-yellow z-0"
        style={{
          clipPath: 'polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Mascot Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Dynamic Speech / Expression Bubble */}
        {selectedFaceId && (
          <div className="mb-1 bg-black/80 backdrop-blur-md text-white border border-white/20 px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-fade-in flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-maunc-yellow animate-ping" />
            <span>Mengikuti: {selectedFaceId} ({currentConfig.label})</span>
          </div>
        )}

        {/* Mascot Face & Torso Composition */}
        <div className="relative w-44 md:w-60 h-44 md:h-60 transition-all duration-300 transform hover:scale-105">
          {/* Active Expression Face Overlay */}
          <img
            src={currentConfig.assetPath}
            alt={`Maskot MAUNC - ${currentConfig.label}`}
            className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)] transition-opacity duration-200"
          />
        </div>
      </div>
    </div>
  );
};
