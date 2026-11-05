import React from 'react';
import { Trophy } from 'lucide-react';
import { PlayerState } from '../types';

interface PlayerScoreCardProps {
  player: PlayerState;
}

export const PlayerScoreCard: React.FC<PlayerScoreCardProps> = ({ player }) => {
  return (
    <div className="w-full bg-[#181A20] border border-gray-800 rounded-3xl p-3.5 shadow-xl flex items-center space-x-3.5">
      {/* Yellow Trophy Icon */}
      <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-maunc-yellow flex-shrink-0">
        <Trophy className="w-5 h-5" />
      </div>

      {/* Player Identity and Score/Status */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-sm md:text-base font-bold text-white tracking-tight truncate">
          {player.isRegistered ? player.name : `Player ${player.id}`}
        </span>

        <div className="mt-1 flex items-center space-x-2">
          {player.result === 'won' ? (
            <span className="text-emerald-400 font-extrabold text-xs tracking-wide">
              MENANG (Skor: {player.score})
            </span>
          ) : player.result === 'lost' ? (
            <span className="text-red-400 font-bold text-xs tracking-wide">
              KALAH (Skor: {player.score})
            </span>
          ) : player.isReady ? (
            <span className="text-gray-400 font-medium text-xs">
              Skor: <strong className="text-white font-mono">{player.score}</strong> • Siap
            </span>
          ) : (
            <span className="text-gray-500 font-medium text-xs truncate">
              {player.isRegistered ? 'Menunggu Wajah...' : 'Belum Terdaftar'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
