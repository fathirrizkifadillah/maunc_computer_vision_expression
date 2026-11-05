import React from 'react';
import { Trophy } from 'lucide-react';
import { PlayerState } from '../types';

interface PlayerScoreCardProps {
  player: PlayerState;
}

export const PlayerScoreCard: React.FC<PlayerScoreCardProps> = ({ player }) => {
  return (
    <div className="w-full bg-[#181A20] border border-gray-800 rounded-3xl p-5 shadow-xl flex items-center space-x-4 min-h-[140px]">
      {/* Yellow Trophy Icon */}
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-maunc-yellow flex-shrink-0">
        <Trophy className="w-7 h-7" />
      </div>

      {/* Player Identity and Score/Status */}
      <div className="flex flex-col flex-1">
        <span className="text-base md:text-lg font-bold text-white tracking-tight truncate">
          {player.isRegistered ? player.name : `Player ${player.id}`}
        </span>

        <div className="mt-2 flex items-center space-x-2">
          {player.result === 'won' ? (
            <span className="text-emerald-400 font-extrabold text-sm tracking-wide">
              MENANG (Poin: {player.score})
            </span>
          ) : player.result === 'lost' ? (
            <span className="text-red-400 font-bold text-sm tracking-wide">
              KALAH (Poin: {player.score})
            </span>
          ) : player.isReady ? (
            <span className="text-gray-400 font-medium text-xs">
              Poin: <strong className="text-white font-mono">{player.score}</strong> • Siap
            </span>
          ) : (
            <span className="text-gray-500 font-medium text-xs">
              {player.isRegistered ? 'Menunggu Wajah...' : 'Belum Terdaftar'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
