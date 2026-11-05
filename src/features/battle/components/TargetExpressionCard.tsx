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
      <div className="relative w-full bg-white rounded-3xl p-2.5 shadow-card border border-gray-100 flex flex-col items-center justify-center min-h-[105px]">
        {/* Yellow Decorative Corner Brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-maunc-yellow rounded-tl-lg pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-maunc-yellow rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-maunc-yellow rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-maunc-yellow rounded-br-lg pointer-events-none" />

        {/* Top Tag Badge */}
        <div className="absolute -top-2.5 bg-maunc-black text-white text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md border border-white/10">
          Target Ekspresi
        </div>

        {/* Target Content */}
        <div className="flex items-center justify-center mt-0.5">
          {targetExpression ? (
            <div className="flex flex-col items-center">
              <img
                src={currentConfig.assetPath}
                alt={currentConfig.label}
                className="w-12 h-12 md:w-14 md:h-14 object-contain filter drop-shadow-md animate-scale-up"
              />
              <span className="text-xs font-extrabold text-maunc-black uppercase tracking-wider mt-0.5">
                {currentConfig.label}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 py-0.5">
              <img
                src="/assets/expressions/netral.png"
                alt="Target Netral"
                className="w-11 h-11 md:w-13 md:h-13 object-contain opacity-75"
              />
              <span className="text-xl font-black text-gray-400">?</span>
            </div>
          )}
        </div>

        {/* Live Timer or Countdown Indicator */}
        {isBattling && (
          <div className="mt-0.5 text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Sisa: {timeRemainingSec}s
          </div>
        )}
      </div>

      {/* Main Action Button (Start Battle / Countdown / Main Lagi) */}
      <div className="w-full mt-2 flex justify-center">
        {isCountdown ? (
          <div className="w-full py-2 bg-maunc-yellow text-maunc-black font-black text-base rounded-full text-center shadow-lg animate-pulse tracking-widest">
            {countdownValue > 0 ? countdownValue : 'GO!'}
          </div>
        ) : isBattling ? (
          <div className="w-full py-2 bg-maunc-charcoal text-white font-bold text-xs rounded-full text-center shadow-md flex items-center justify-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-maunc-yellow animate-ping" />
            <span>Tirukan Ekspresi Sekarang!</span>
          </div>
        ) : isFinished ? (
          <button
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center space-x-2 py-2 bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black font-extrabold text-xs md:text-sm rounded-full shadow-glow-yellow transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Lagi</span>
          </button>
        ) : (
          <button
            disabled={!canStart}
            onClick={onStartBattle}
            className={`w-full flex items-center justify-center space-x-2 py-2 rounded-full font-extrabold text-xs md:text-sm transition-all active:scale-95 ${
              canStart
                ? 'bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black shadow-glow-yellow cursor-pointer'
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
