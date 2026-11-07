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
    <div className="flex flex-col items-center justify-center w-full max-w-xs mx-auto">
      {/* Target Expression Card Container */}
      <div className="relative w-full bg-white rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 shadow-card border border-gray-100 flex flex-col items-center justify-center min-h-[76px] sm:min-h-[84px]">
        {/* Yellow Decorative Corner Brackets */}
        <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-maunc-yellow rounded-tl-lg pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-maunc-yellow rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-maunc-yellow rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-maunc-yellow rounded-br-lg pointer-events-none" />

        {/* Top Tag Badge */}
        <div className="absolute -top-2 bg-maunc-black text-white text-[8px] sm:text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-md border border-white/10">
          Target Ekspresi
        </div>

        {/* Target Content */}
        <div className="flex items-center justify-center mt-0.5">
          {targetExpression ? (
            <div className="flex flex-col items-center">
              <img
                src={currentConfig.assetPath}
                alt={currentConfig.label}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 object-contain filter drop-shadow-md animate-scale-up"
              />
              <span className="text-[10px] sm:text-xs font-extrabold text-maunc-black uppercase tracking-wider mt-0.5">
                {currentConfig.label}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 py-0.5">
              <img
                src="/assets/expressions/netral.png"
                alt="Target Netral"
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 object-contain opacity-75"
              />
              <span className="text-base sm:text-lg font-black text-gray-400">?</span>
            </div>
          )}
        </div>

        {/* Live Timer or Countdown Indicator */}
        {isBattling && (
          <div className="mt-0.5 text-[9px] sm:text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Sisa: {timeRemainingSec}s
          </div>
        )}
      </div>

      {/* Main Action Button (Start Battle / Countdown / Main Lagi) */}
      <div className="w-full mt-1 sm:mt-1.5 flex justify-center">
        {isCountdown ? (
          <div className="w-full py-1.5 sm:py-2 bg-maunc-yellow text-maunc-black font-black text-sm sm:text-base rounded-full text-center shadow-lg animate-pulse tracking-widest min-h-[38px] flex items-center justify-center">
            {countdownValue > 0 ? countdownValue : 'GO!'}
          </div>
        ) : isBattling ? (
          <div className="w-full py-1.5 sm:py-2 bg-maunc-charcoal text-white font-bold text-xs rounded-full text-center shadow-md flex items-center justify-center space-x-1.5 min-h-[38px]">
            <span className="w-2 h-2 rounded-full bg-maunc-yellow animate-ping" />
            <span>Tirukan Ekspresi Sekarang!</span>
          </div>
        ) : isFinished ? (
          <button
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center space-x-2 py-1.5 sm:py-2 bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black font-extrabold text-xs md:text-sm rounded-full shadow-glow-yellow transition-all active:scale-95 cursor-pointer min-h-[38px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Main Lagi</span>
          </button>
        ) : (
          <button
            disabled={!canStart}
            onClick={onStartBattle}
            className={`w-full flex items-center justify-center space-x-2 py-1.5 sm:py-2 rounded-full font-extrabold text-xs md:text-sm transition-all active:scale-95 min-h-[38px] ${
              canStart
                ? 'bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black shadow-glow-yellow cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Battle</span>
          </button>
        )}
      </div>
    </div>
  );
};
