import React from 'react';
import { Play, RotateCcw, Target } from 'lucide-react';
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
      {/* Target Expression Card Container - Dark Robotic Aesthetic matching Player Cards */}
      <div className="w-full bg-[#181A20] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl border border-gray-800 hover:border-maunc-yellow/50 transition-all flex flex-col items-center justify-center min-h-[96px]">
        {/* Header Label - Clean SVG Icon & Mono Typography, Zero Emojis */}
        <div className="flex items-center space-x-1.5 text-maunc-yellow mb-2 self-center">
          <Target className="w-3.5 h-3.5 text-maunc-yellow flex-shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase">
            Target Ekspresi
          </span>
        </div>

        {/* Target Content: Official Mascot Avatar & Clear Expression Status */}
        <div className="flex items-center justify-center">
          {targetExpression ? (
            <div className="flex items-center space-x-3.5 py-0.5">
              <img
                src={currentConfig.assetPath}
                alt={currentConfig.label}
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain filter drop-shadow-md"
              />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                  Tirukan:
                </span>
                <span className="text-base sm:text-lg font-black text-white uppercase tracking-wider leading-tight">
                  {currentConfig.label}
                </span>
                {isBattling && (
                  <span className="text-[11px] font-mono font-bold text-maunc-yellow bg-maunc-yellow/10 border border-maunc-yellow/30 px-2 py-0.5 rounded-md mt-1 self-start">
                    Sisa: {timeRemainingSec}s
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3.5 py-0.5">
              <img
                src="/assets/expressions/netral.png"
                alt="Target Netral"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain opacity-70 filter drop-shadow-md"
              />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                  Mode Acak
                </span>
                <span className="text-sm sm:text-base font-bold text-gray-200">
                  {canStart ? 'Siap Diundi' : 'Menunggu Siap'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Action Button (Start Battle / Countdown / Main Lagi) */}
      <div className="w-full mt-2.5 flex justify-center">
        {isCountdown ? (
          <div className="w-full py-2.5 sm:py-3 bg-maunc-yellow text-maunc-black font-black text-sm sm:text-base rounded-full text-center shadow-glow-yellow animate-pulse tracking-widest min-h-[44px] flex items-center justify-center">
            {countdownValue > 0 ? `MULAI DALAM ${countdownValue}...` : 'GO!'}
          </div>
        ) : isBattling ? (
          <div className="w-full py-2.5 sm:py-3 bg-[#242730] text-maunc-yellow border border-maunc-yellow/40 font-black text-xs sm:text-sm rounded-full text-center shadow-md flex items-center justify-center space-x-2 min-h-[44px]">
            <span className="w-2.5 h-2.5 rounded-full bg-maunc-yellow animate-ping" />
            <span>Tirukan Ekspresi Sekarang!</span>
          </div>
        ) : isFinished ? (
          <button
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center space-x-2 py-2.5 sm:py-3 bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black font-black text-xs sm:text-sm rounded-full shadow-glow-yellow transition-all active:scale-95 cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Lagi</span>
          </button>
        ) : (
          <button
            disabled={!canStart}
            onClick={onStartBattle}
            className={`w-full flex items-center justify-center space-x-2 py-2.5 sm:py-3 rounded-full font-black text-xs sm:text-sm transition-all active:scale-95 min-h-[44px] ${
              canStart
                ? 'bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black shadow-glow-yellow cursor-pointer'
                : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
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
