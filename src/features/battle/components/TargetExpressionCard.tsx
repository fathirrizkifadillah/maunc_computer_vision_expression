import React from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { BattleStatus } from '../types';
import { FinalExpression } from '../../vision/types';
import { getExpressionConfig } from '../../vision/classification/expressionMapping';

interface TargetExpressionCardProps {
  status: BattleStatus;
  targetExpression: FinalExpression | null;
  countdownValue: number;
  timeRemainingSec: number;
  canStart: boolean;
  onStartBattle: () => void;
  onPlayAgain: () => void;
}

export const TargetExpressionCard: React.FC<TargetExpressionCardProps> = ({
  status,
  targetExpression,
  countdownValue,
  timeRemainingSec,
  canStart,
  onStartBattle,
  onPlayAgain,
}) => {
  const currentConfig = getExpressionConfig(targetExpression);
  const isBattling = status === 'battling';
  const isCountdown = status === 'countdown';
  const isFinished = status === 'finished';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto">
      {/* Target Expression Card Container - High Contrast & Prominent */}
      <div className="relative w-full bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-card border-2 border-maunc-yellow/60 hover:border-maunc-yellow transition-all flex flex-col items-center justify-center min-h-[90px] sm:min-h-[102px]">
        {/* Yellow Decorative Corner Cyber Brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-maunc-yellow rounded-tl-lg pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-maunc-yellow rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-maunc-yellow rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-maunc-yellow rounded-br-lg pointer-events-none" />

        {/* Top Tag Badge */}
        <div className="absolute -top-3 bg-maunc-black text-maunc-yellow text-[10px] font-black tracking-widest uppercase px-3 py-0.5 rounded-full shadow-md border border-maunc-yellow/40 flex items-center space-x-1">
          <span>🎯</span>
          <span>Target Ekspresi</span>
        </div>

        {/* Target Content: Big, Crisp, and Clear Mascot Avatar */}
        <div className="flex items-center justify-center mt-1">
          {targetExpression ? (
            <div className="flex items-center space-x-3">
              <img
                src={currentConfig.assetPath}
                alt={currentConfig.label}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain filter drop-shadow-md animate-scale-up"
              />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tirukan:</span>
                <span className="text-base sm:text-lg md:text-xl font-black text-maunc-black uppercase tracking-wider leading-tight">
                  {currentConfig.label}
                </span>
                {isBattling && (
                  <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md mt-0.5 self-start">
                    Sisa: {timeRemainingSec}s
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 py-0.5">
              <img
                src="/assets/expressions/netral.png"
                alt="Target Netral"
                className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain filter drop-shadow-sm"
              />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Mode Acak</span>
                <span className="text-sm sm:text-base font-extrabold text-gray-700">
                  {canStart ? 'Siap Diundi!' : 'Menunggu Siap'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Action Button (Start Battle / Countdown / Main Lagi) */}
      <div className="w-full mt-2 flex justify-center">
        {isCountdown ? (
          <div className="w-full py-2.5 bg-maunc-yellow text-maunc-black font-black text-base sm:text-lg rounded-full text-center shadow-lg animate-pulse tracking-widest min-h-[44px] flex items-center justify-center border border-black/10">
            {countdownValue > 0 ? `MULAI DALAM ${countdownValue}...` : 'GO!'}
          </div>
        ) : isBattling ? (
          <div className="w-full py-2.5 bg-maunc-charcoal text-white font-black text-xs sm:text-sm rounded-full text-center shadow-md flex items-center justify-center space-x-2 min-h-[44px] border border-maunc-yellow/30">
            <span className="w-2.5 h-2.5 rounded-full bg-maunc-yellow animate-ping" />
            <span>Tirukan Ekspresi Sekarang!</span>
          </div>
        ) : isFinished ? (
          <button
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black font-black text-xs md:text-sm rounded-full shadow-glow-yellow transition-all active:scale-95 cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Lagi</span>
          </button>
        ) : (
          <button
            disabled={!canStart}
            onClick={onStartBattle}
            className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-full font-black text-xs md:text-sm transition-all active:scale-95 min-h-[44px] ${
              canStart
                ? 'bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black shadow-glow-yellow cursor-pointer border border-black/10'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Battle</span>
          </button>
        )}
      </div>
    </div>
  );
};
