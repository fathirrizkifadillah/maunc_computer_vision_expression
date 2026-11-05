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
      {/* Target Expression Card Container */}
      <div className="relative w-full bg-white rounded-3xl p-5 shadow-card border border-gray-100 flex flex-col items-center justify-center min-h-[160px]">
        {/* Yellow Decorative Corner Brackets (matching reference design) */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-maunc-yellow rounded-tl-lg pointer-events-none" />
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-maunc-yellow rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-maunc-yellow rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-maunc-yellow rounded-br-lg pointer-events-none" />

        {/* Top Tag Badge */}
        <div className="absolute -top-3.5 bg-maunc-black text-white text-[11px] font-bold tracking-wider uppercase px-4 py-1 rounded-full shadow-md border border-white/10">
          Target Ekspresi
        </div>

        {/* Target Content */}
        <div className="flex items-center justify-center space-x-3 mt-2">
          {targetExpression ? (
            <div className="flex flex-col items-center">
              <img
                src={currentConfig.assetPath}
                alt={currentConfig.label}
                className="w-20 h-20 md:w-24 md:h-24 object-contain filter drop-shadow-md animate-scale-up"
              />
              <span className="mt-1 text-sm md:text-base font-extrabold text-maunc-black uppercase tracking-wider">
                {currentConfig.label}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <img
                src="/assets/expressions/netral.png"
                alt="Target Netral"
                className="w-16 h-16 md:w-20 md:h-20 object-contain opacity-75"
              />
              <span className="text-3xl font-black text-gray-400">?</span>
            </div>
          )}
        </div>

        {/* Live Timer or Countdown Indicator */}
        {isBattling && (
          <div className="mt-2 text-xs font-mono font-bold text-amber-600 bg-amber-50 px-3 py-0.5 rounded-full border border-amber-200">
            Sisa Waktu: {timeRemainingSec}s
          </div>
        )}
      </div>

      {/* Main Action Button (Start Battle / Countdown / Main Lagi) */}
      <div className="w-full mt-4 flex justify-center">
        {isCountdown ? (
          <div className="w-full py-3.5 bg-maunc-yellow text-maunc-black font-black text-xl rounded-full text-center shadow-lg animate-pulse tracking-widest">
            {countdownValue > 0 ? countdownValue : 'GO!'}
          </div>
        ) : isBattling ? (
          <div className="w-full py-3.5 bg-maunc-charcoal text-white font-bold text-sm rounded-full text-center shadow-md flex items-center justify-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-maunc-yellow animate-ping" />
            <span>Tirukan Ekspresi Sekarang!</span>
          </div>
        ) : isFinished ? (
          <button
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center space-x-2 py-3.5 bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black font-extrabold text-sm md:text-base rounded-full shadow-glow-yellow transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Main Lagi</span>
          </button>
        ) : (
          <button
            disabled={!canStart}
            onClick={onStartBattle}
            className={`w-full flex items-center justify-center space-x-2 py-3.5 rounded-full font-extrabold text-sm md:text-base transition-all active:scale-95 ${
              canStart
                ? 'bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black shadow-glow-yellow cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Battle</span>
          </button>
        )}
      </div>
    </div>
  );
};
