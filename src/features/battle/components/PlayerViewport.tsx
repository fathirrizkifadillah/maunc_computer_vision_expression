import React from 'react';
import { UserPlus, Edit3, CheckCircle2, AlertTriangle, Trophy } from 'lucide-react';
import { PlayerState } from '../types';
import { DetectedFace } from '../../vision/types';

interface PlayerViewportProps {
  player: PlayerState;
  detectedFace: DetectedFace | null;
  isStreaming: boolean;
  onOpenRegister: () => void;
  zoneFaceCount: number;
}

export const PlayerViewport: React.FC<PlayerViewportProps> = ({
  player,
  detectedFace,
  isStreaming,
  onOpenRegister,
  zoneFaceCount,
}) => {
  const isRegistered = player.isRegistered;

  return (
    <div className="relative w-full h-full min-h-[300px] md:min-h-[360px] lg:min-h-[400px] bg-[#121316] rounded-3xl overflow-hidden border border-gray-800 shadow-xl flex items-center justify-center select-none group">
      {/* Decorative Cyber Corner Brackets [ ] */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-gray-700/60 rounded-tl-lg pointer-events-none" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-gray-700/60 rounded-tr-lg pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-gray-700/60 rounded-bl-lg pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-gray-700/60 rounded-br-lg pointer-events-none" />

      {/* State 1: Unregistered State (Exact match to reference design) */}
      {!isRegistered ? (
        <div className="flex flex-col items-center justify-center p-6 text-center text-white z-10 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-maunc-yellow">
            <UserPlus className="w-8 h-8" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1">
            Player {player.id}
          </h3>
          <p className="text-gray-400 text-xs md:text-sm mb-5">
            Daftarkan nama untuk memulai
          </p>
          <button
            onClick={onOpenRegister}
            className="flex items-center space-x-2 px-6 py-2.5 bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black font-bold rounded-full text-xs md:text-sm transition-all shadow-glow-yellow active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Daftar / Ganti Nama</span>
          </button>
        </div>
      ) : (
        /* State 2: Registered & Active */
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Top Player Name & Ready Badge */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
              <span className="text-white text-xs md:text-sm font-bold tracking-wide">
                {player.name}
              </span>
              <button
                onClick={onOpenRegister}
                className="pointer-events-auto text-gray-400 hover:text-maunc-yellow transition-colors ml-1 cursor-pointer"
                title="Ubah Nama"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Status Pill */}
            {zoneFaceCount > 1 ? (
              <div className="flex items-center space-x-1.5 bg-red-950/80 border border-red-500/50 text-red-200 text-xs px-3 py-1 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Area Penuh (&gt;1 wajah)</span>
              </div>
            ) : player.isReady ? (
              <div className="flex items-center space-x-1.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Siap</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Mencari Wajah...</span>
              </div>
            )}
          </div>

          {/* Face Detection Outline for this player */}
          {detectedFace && isStreaming && (
            <div className="absolute bottom-4 left-4 z-20 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/10 flex items-center space-x-2">
              <span className="text-gray-400">Ekspresi:</span>
              <span className="font-bold text-maunc-yellow">
                {detectedFace.expressionLabel || 'Menganalisis'}
              </span>
              <span className="text-gray-400">
                ({Math.round((detectedFace.confidence || 0) * 100)}%)
              </span>
            </div>
          )}

          {/* Round Finish Results Overlay */}
          {player.result === 'won' && (
            <div className="absolute inset-0 z-30 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in border-4 border-emerald-500">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-2 text-maunc-yellow animate-bounce">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-emerald-300 tracking-wider mb-1">
                MENANG!
              </h2>
              <p className="text-sm font-semibold text-white">{player.name}</p>
            </div>
          )}

          {player.result === 'lost' && (
            <div className="absolute inset-0 z-30 bg-red-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <h2 className="text-2xl md:text-3xl font-extrabold text-red-400 tracking-wider mb-1">
                KALAH
              </h2>
              <p className="text-xs text-gray-300">{player.name}</p>
            </div>
          )}

          {player.result === 'draw' && (
            <div className="absolute inset-0 z-30 bg-gray-900/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <h2 className="text-2xl md:text-3xl font-extrabold text-amber-300 tracking-wider mb-1">
                SERI
              </h2>
              <p className="text-xs text-gray-300">{player.name}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
