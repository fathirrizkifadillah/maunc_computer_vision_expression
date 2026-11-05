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
      handleBattleEnd('draw');
    } else if (p1Eval.isMatched) {
      handleBattleEnd('p1_won');
    } else if (p2Eval.isMatched) {
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
        // Fallback
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

        setBattleState((prev) => ({
          ...prev,
          status: 'battling',
          countdownValue: 0,
        }));

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

  const handleChangePlayer = (playerId: 1 | 2) => {
    setRegisteringPlayerId(playerId);
  };

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
    <div className="w-full max-w-[1540px] mx-auto px-4 lg:px-8 py-3 flex-1 flex flex-col justify-between gap-3 min-h-0">
      {/* Hidden single shared webcam video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="fixed -top-[9999px] -left-[9999px] w-1 h-1 opacity-0 pointer-events-none"
      />

      {/* Top Split Battle Arena: Dominant, Spacious, Large Viewports */}
      <div className="relative w-full rounded-3xl p-3 md:p-4 bg-white/50 backdrop-blur-md border border-gray-200/90 shadow-xl flex-1 flex flex-col justify-center min-h-[300px] md:min-h-[360px] lg:min-h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 relative items-center h-full">
          {/* Vertical Yellow Divider in center (Desktop) */}
          <div className="hidden md:block absolute left-1/2 top-2 bottom-2 w-1.5 bg-maunc-yellow -translate-x-1/2 rounded-full z-20 shadow-sm" />

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

        {/* Global Warning Banner if Camera Error */}
        {cameraError && (
          <div className="mt-2 p-2 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>

      {/* Bottom Dashboard Section: Player 1 Score, Target Expression + Controls, Player 2 Score */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center flex-shrink-0">
        {/* Left Column: Player 1 Score Card (Col 1-4) */}
        <div className="lg:col-span-4 flex flex-col space-y-1">
          <PlayerScoreCard player={battleState.p1} />
          {battleState.p1.isRegistered && (
            <button
              onClick={() => handleChangePlayer(1)}
              className="text-[11px] font-semibold text-gray-500 hover:text-maunc-black self-start px-2 py-0.5 transition-colors cursor-pointer"
            >
              Ganti Pemain 1
            </button>
          )}
        </div>

        {/* Center Column: Target Expression Card + Start Button (Col 5-8) */}
        <div className="lg:col-span-4 flex flex-col items-center">
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
        <div className="lg:col-span-4 flex flex-col space-y-1">
          <PlayerScoreCard player={battleState.p2} />
          {battleState.p2.isRegistered && (
            <button
              onClick={() => handleChangePlayer(2)}
              className="text-[11px] font-semibold text-gray-500 hover:text-maunc-black self-start px-2 py-0.5 transition-colors cursor-pointer"
            >
              Ganti Pemain 2
            </button>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-1.5 border-t border-gray-200/80 flex-shrink-0">
        {/* Left: Reset Button */}
        <button
          onClick={handleResetAll}
          className="flex items-center space-x-2 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Reset Seluruh Sesi Pertandingan"
        >
          <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
          <span>Reset Pemain</span>
        </button>

        {/* Center: Match Format Badge */}
        <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium">
          <Users className="w-4 h-4 text-gray-400" />
          <span>Pertandingan 2 Pemain • 1 Webcam Bersama</span>
        </div>

        {/* Right: Clean MAUNC Emblem Identity */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
          <img
            src="/assets/brand/maunc-logo.png"
            alt="MAUNC Logo"
            className="w-4 h-4 object-contain"
          />
          <span className="text-[11px] font-bold text-maunc-black">MAUNC Arena</span>
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
