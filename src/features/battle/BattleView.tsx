import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Users, AlertCircle } from 'lucide-react';
import { BattleState } from './types';
import { BATTLE_CONFIG, pickRandomExpression, countFacesInZones, evaluateExpressionMatch } from './logic/battleEngine';
import { useVisionPipeline } from '../vision/hooks/useVisionPipeline';
import { PlayerViewport } from './components/PlayerViewport';
import { PlayerRegistrationModal } from './components/PlayerRegistrationModal';
import { TargetExpressionCard } from './components/TargetExpressionCard';
import { PlayerScoreCard } from './components/PlayerScoreCard';
import { DetectedFace } from '../vision/types';

export const BattleView: React.FC = () => {
  const {
    faces,
    cameraStatus,
    error: cameraError,
    videoRef,
    startCamera,
    stopCamera,
  } = useVisionPipeline({ autoStart: false, classificationIntervalMs: 150 });

  // Battle State
  const [battleState, setBattleState] = useState<BattleState>({
    status: 'unregistered',
    targetExpression: null,
    countdownValue: 3,
    timeRemainingSec: BATTLE_CONFIG.ROUND_TIME_SEC,
    result: null,
    p1: {
      id: 1,
      name: 'Player 1',
      isRegistered: false,
      isFaceInZone: false,
      facesInZoneCount: 0,
      isReady: false,
      currentExpression: null,
      currentConfidence: 0,
      matchConsecutiveFrames: 0,
      score: 0,
      result: null,
    },
    p2: {
      id: 2,
      name: 'Player 2',
      isRegistered: false,
      isFaceInZone: false,
      facesInZoneCount: 0,
      isReady: false,
      currentExpression: null,
      currentConfidence: 0,
      matchConsecutiveFrames: 0,
      score: 0,
      result: null,
    },
  });

  const [registeringPlayerId, setRegisteringPlayerId] = useState<1 | 2 | null>(null);

  // Active faces per zone
  const [p1Face, setP1Face] = useState<DetectedFace | null>(null);
  const [p2Face, setP2Face] = useState<DetectedFace | null>(null);
  const [zoneCounts, setZoneCounts] = useState<{ p1: number; p2: number }>({ p1: 0, p2: 0 });

  const countdownTimerRef = useRef<number | null>(null);
  const roundTimerRef = useRef<number | null>(null);
  const consecutiveMatchRef = useRef<{ p1: number; p2: number }>({ p1: 0, p2: 0 });

  // Start webcam if either player is registered and camera is idle
  useEffect(() => {
    if ((battleState.p1.isRegistered || battleState.p2.isRegistered) && cameraStatus === 'idle') {
      startCamera();
    }
  }, [battleState.p1.isRegistered, battleState.p2.isRegistered, cameraStatus, startCamera]);

  // Zone partition & face tracking update
  useEffect(() => {
    if (cameraStatus !== 'active') return;

    const { p1Faces, p2Faces } = countFacesInZones(faces, true);
    setZoneCounts({ p1: p1Faces.length, p2: p2Faces.length });

    const p1Valid = p1Faces.length === 1 ? p1Faces[0] : null;
    const p2Valid = p2Faces.length === 1 ? p2Faces[0] : null;

    setP1Face(p1Valid);
    setP2Face(p2Valid);

    setBattleState((prev) => {
      const p1Ready = prev.p1.isRegistered && p1Faces.length === 1;
      const p2Ready = prev.p2.isRegistered && p2Faces.length === 1;

      let nextStatus = prev.status;
      if (prev.status === 'unregistered' || prev.status === 'waiting_ready' || prev.status === 'ready') {
        if (!prev.p1.isRegistered || !prev.p2.isRegistered) {
          nextStatus = 'unregistered';
        } else if (p1Ready && p2Ready) {
          nextStatus = 'ready';
        } else {
          nextStatus = 'waiting_ready';
        }
      }

      return {
        ...prev,
        status: nextStatus,
        p1: {
          ...prev.p1,
          isFaceInZone: p1Faces.length > 0,
          facesInZoneCount: p1Faces.length,
          isReady: p1Ready,
          currentExpression: p1Valid?.expression ?? null,
          currentConfidence: p1Valid?.confidence ?? 0,
        },
        p2: {
          ...prev.p2,
          isFaceInZone: p2Faces.length > 0,
          facesInZoneCount: p2Faces.length,
          isReady: p2Ready,
          currentExpression: p2Valid?.expression ?? null,
          currentConfidence: p2Valid?.confidence ?? 0,
        },
      };
    });
  }, [faces, cameraStatus]);

  // Round Winner Evaluation Loop
  useEffect(() => {
    if (battleState.status !== 'battling' || !battleState.targetExpression) {
      return;
    }

    const target = battleState.targetExpression;

    const p1Eval = evaluateExpressionMatch(
      p1Face?.expression ?? null,
      p1Face?.confidence ?? 0,
      target,
      consecutiveMatchRef.current.p1
    );
    consecutiveMatchRef.current.p1 = p1Eval.newConsecutiveFrames;

    const p2Eval = evaluateExpressionMatch(
      p2Face?.expression ?? null,
      p2Face?.confidence ?? 0,
      target,
      consecutiveMatchRef.current.p2
    );
    consecutiveMatchRef.current.p2 = p2Eval.newConsecutiveFrames;

    if (p1Eval.isMatched && p2Eval.isMatched) {
      // Both matched simultaneously -> Draw
      handleBattleEnd('draw');
    } else if (p1Eval.isMatched) {
      // Player 1 won
      handleBattleEnd('p1_won');
    } else if (p2Eval.isMatched) {
      // Player 2 won
      handleBattleEnd('p2_won');
    }
  }, [p1Face, p2Face, battleState.status, battleState.targetExpression]);

  const handleBattleEnd = useCallback((result: 'p1_won' | 'p2_won' | 'draw' | 'timeout') => {
    if (roundTimerRef.current) {
      window.clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }

    if (result === 'p1_won' || result === 'p2_won') {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FDB813', '#121316', '#FFFFFF', '#10B981'],
        });
      } catch {
        // Fallback if canvas context fails
      }
    }

    setBattleState((prev) => ({
      ...prev,
      status: 'finished',
      result,
      p1: {
        ...prev.p1,
        score: result === 'p1_won' ? prev.p1.score + 1 : prev.p1.score,
        result: result === 'p1_won' ? 'won' : result === 'p2_won' ? 'lost' : 'draw',
      },
      p2: {
        ...prev.p2,
        score: result === 'p2_won' ? prev.p2.score + 1 : prev.p2.score,
        result: result === 'p2_won' ? 'won' : result === 'p1_won' ? 'lost' : 'draw',
      },
    }));
  }, []);

  // Start Battle Handler: Random Target + 3s Countdown
  const startBattle = () => {
    if (!battleState.p1.isReady || !battleState.p2.isReady) return;

    // Pick 1 of 6 expressions randomly (locked for round)
    const target = pickRandomExpression(battleState.targetExpression);
    consecutiveMatchRef.current = { p1: 0, p2: 0 };

    setBattleState((prev) => ({
      ...prev,
      status: 'countdown',
      targetExpression: target,
      countdownValue: 3,
      timeRemainingSec: BATTLE_CONFIG.ROUND_TIME_SEC,
      result: null,
      p1: { ...prev.p1, result: null, matchConsecutiveFrames: 0 },
      p2: { ...prev.p2, result: null, matchConsecutiveFrames: 0 },
    }));

    let currentCount = 3;
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = window.setInterval(() => {
      currentCount--;
      if (currentCount > 0) {
        setBattleState((prev) => ({ ...prev, countdownValue: currentCount }));
      } else {
        if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;

        // Start active battling
        setBattleState((prev) => ({
          ...prev,
          status: 'battling',
          countdownValue: 0,
        }));

        // Start round timeout countdown
        let remaining = BATTLE_CONFIG.ROUND_TIME_SEC;
        if (roundTimerRef.current) window.clearInterval(roundTimerRef.current);
        roundTimerRef.current = window.setInterval(() => {
          remaining--;
          setBattleState((prev) => ({ ...prev, timeRemainingSec: remaining }));
          if (remaining <= 0) {
            handleBattleEnd('timeout');
          }
        }, 1000);
      }
    }, 1000);
  };

  // Play Again Handler (keeps players, starts fresh round)
  const handlePlayAgain = () => {
    setBattleState((prev) => ({
      ...prev,
      status: prev.p1.isReady && prev.p2.isReady ? 'ready' : 'waiting_ready',
      targetExpression: null,
      result: null,
      timeRemainingSec: BATTLE_CONFIG.ROUND_TIME_SEC,
      p1: { ...prev.p1, result: null, matchConsecutiveFrames: 0 },
      p2: { ...prev.p2, result: null, matchConsecutiveFrames: 0 },
    }));
  };

  // Change Player Handler
  const handleChangePlayer = (playerId: 1 | 2) => {
    setRegisteringPlayerId(playerId);
  };

  // Save Player Name
  const handleSavePlayerName = (name: string) => {
    if (!registeringPlayerId) return;

    setBattleState((prev) => {
      const isP1 = registeringPlayerId === 1;
      return {
        ...prev,
        p1: isP1 ? { ...prev.p1, name, isRegistered: true, result: null } : prev.p1,
        p2: !isP1 ? { ...prev.p2, name, isRegistered: true, result: null } : prev.p2,
      };
    });
    setRegisteringPlayerId(null);
  };

  // Reset Both Players
  const handleResetAll = () => {
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    if (roundTimerRef.current) window.clearInterval(roundTimerRef.current);

    setBattleState({
      status: 'unregistered',
      targetExpression: null,
      countdownValue: 3,
      timeRemainingSec: BATTLE_CONFIG.ROUND_TIME_SEC,
      result: null,
      p1: {
        id: 1,
        name: 'Player 1',
        isRegistered: false,
        isFaceInZone: false,
        facesInZoneCount: 0,
        isReady: false,
        currentExpression: null,
        currentConfidence: 0,
        matchConsecutiveFrames: 0,
        score: 0,
        result: null,
      },
      p2: {
        id: 2,
        name: 'Player 2',
        isRegistered: false,
        isFaceInZone: false,
        facesInZoneCount: 0,
        isReady: false,
        currentExpression: null,
        currentConfidence: 0,
        matchConsecutiveFrames: 0,
        score: 0,
        result: null,
      },
    });

    stopCamera();
  };

  const canStart = battleState.p1.isReady && battleState.p2.isReady && battleState.status === 'ready';

  return (
    <div className="w-full max-w-[1540px] mx-auto px-4 lg:px-8 py-6 relative pb-32">
      {/* Hidden single shared webcam video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="fixed -top-[9999px] -left-[9999px] w-1 h-1 opacity-0 pointer-events-none"
      />

      {/* Top Split Battle Arena: Player 1 (Left) & Player 2 (Right) */}
      <div className="relative w-full rounded-[2.5rem] p-3 md:p-4 bg-white/40 backdrop-blur-md border border-gray-200/80 shadow-2xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative">
          {/* Vertical Yellow Divider in center (Desktop) */}
          <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-1.5 bg-maunc-yellow -translate-x-1/2 rounded-full z-20 shadow-md" />

          {/* Left: Player 1 Viewport */}
          <PlayerViewport
            player={battleState.p1}
            detectedFace={p1Face}
            isStreaming={cameraStatus === 'active'}
            onOpenRegister={() => setRegisteringPlayerId(1)}
            zoneFaceCount={zoneCounts.p1}
          />

          {/* Right: Player 2 Viewport */}
          <PlayerViewport
            player={battleState.p2}
            detectedFace={p2Face}
            isStreaming={cameraStatus === 'active'}
            onOpenRegister={() => setRegisteringPlayerId(2)}
            zoneFaceCount={zoneCounts.p2}
          />
        </div>

        {/* Global Warning Banner if Camera Error or Capacity Exceeded */}
        {cameraError && (
          <div className="mt-3 p-3 rounded-2xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>

      {/* Bottom Dashboard Section (Player 1 Score, Target Expression + Controls, Player 2 Score) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Player 1 Score Card (Col 1-4) */}
        <div className="lg:col-span-4 order-2 lg:order-1 flex flex-col space-y-3">
          <PlayerScoreCard player={battleState.p1} />
          {battleState.p1.isRegistered && (
            <button
              onClick={() => handleChangePlayer(1)}
              className="text-xs font-semibold text-gray-500 hover:text-maunc-black self-start px-2 py-1 transition-colors"
            >
              Ganti Pemain 1
            </button>
          )}
        </div>

        {/* Center Column: Target Expression Card + Start Button (Col 5-8) */}
        <div className="lg:col-span-4 order-1 lg:order-2 flex flex-col items-center">
          <TargetExpressionCard
            status={battleState.status}
            targetExpression={battleState.targetExpression}
            countdownValue={battleState.countdownValue}
            timeRemainingSec={battleState.timeRemainingSec}
            canStart={canStart}
            onStartBattle={startBattle}
            onPlayAgain={handlePlayAgain}
          />
        </div>

        {/* Right Column: Player 2 Score Card (Col 9-12) */}
        <div className="lg:col-span-4 order-3 lg:order-3 flex flex-col space-y-3">
          <PlayerScoreCard player={battleState.p2} />
          {battleState.p2.isRegistered && (
            <button
              onClick={() => handleChangePlayer(2)}
              className="text-xs font-semibold text-gray-500 hover:text-maunc-black self-start px-2 py-1 transition-colors"
            >
              Ganti Pemain 2
            </button>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar: Reset Button on Left */}
      <div className="mt-8 flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-gray-200">
        <button
          onClick={handleResetAll}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full text-xs md:text-sm transition-all shadow-sm active:scale-95"
          title="Reset Seluruh Sesi Pertandingan"
        >
          <RotateCcw className="w-4 h-4 text-gray-600" />
          <span>Reset Pemain</span>
        </button>

        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <Users className="w-4 h-4 text-gray-400" />
          <span>Mode 2 Pemain • 1 Webcam Bersama</span>
        </div>
      </div>

      {/* Mascot Corner Character (matching Mode 2 reference design) */}
      <div className="fixed -bottom-2 -right-2 z-30 pointer-events-none select-none flex items-end justify-end">
        {/* Angled Yellow Tech Backdrop */}
        <div
          className="absolute bottom-0 right-0 w-64 md:w-80 h-48 md:h-64 bg-maunc-yellow z-0"
          style={{
            clipPath: 'polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
        />
        {/* Standing Mascot with crossed arms */}
        <div className="relative z-10 w-44 md:w-60 h-44 md:h-60">
          <img
            src="/assets/expressions/netral.png"
            alt="Mascot Battle Referee"
            className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]"
          />
        </div>
      </div>

      {/* Registration Modal for Player 1 or 2 */}
      {registeringPlayerId && (
        <PlayerRegistrationModal
          isOpen={true}
          playerId={registeringPlayerId}
          currentName={registeringPlayerId === 1 ? battleState.p1.name : battleState.p2.name}
          onSave={handleSavePlayerName}
          onClose={() => setRegisteringPlayerId(null)}
        />
      )}
    </div>
  );
};
