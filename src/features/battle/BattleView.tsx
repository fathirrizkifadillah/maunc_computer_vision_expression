import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Users,
  AlertCircle,
  AlertTriangle,
  Sliders,
  Camera,
  SplitSquareVertical,
  UserPlus,
  Edit3,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { BattleState } from './types';
import { BATTLE_CONFIG, pickRandomExpression, countFacesInZones, evaluateExpressionMatch } from './logic/battleEngine';
import { CameraManager, CameraSettings } from '../vision/camera/CameraManager';
import { FaceDetectorService } from '../vision/detection/FaceDetector';
import { BlendshapeClassifierService } from '../vision/classification/BlendshapeClassifier';
import { PlayerViewport } from './components/PlayerViewport';
import { PlayerRegistrationModal } from './components/PlayerRegistrationModal';
import { TargetExpressionCard } from './components/TargetExpressionCard';
import { PlayerScoreCard } from './components/PlayerScoreCard';
import { CameraSettingsModal } from '../../components/common/CameraSettingsModal';
import { DetectedFace } from '../vision/types';

export const BattleView: React.FC = () => {
  // Camera Settings & Available Devices
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>(CameraManager.getSettings());
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [streamP1, setStreamP1] = useState<MediaStream | null>(null);
  const [streamP2, setStreamP2] = useState<MediaStream | null>(null);

  // Video Element Refs
  const videoSharedRef = useRef<HTMLVideoElement | null>(null);
  const videoP1Ref = useRef<HTMLVideoElement | null>(null);
  const videoP2Ref = useRef<HTMLVideoElement | null>(null);

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

  // Active faces per player
  const [p1Face, setP1Face] = useState<DetectedFace | null>(null);
  const [p2Face, setP2Face] = useState<DetectedFace | null>(null);
  const [zoneCounts, setZoneCounts] = useState<{ p1: number; p2: number }>({ p1: 0, p2: 0 });

  const countdownTimerRef = useRef<number | null>(null);
  const roundTimerRef = useRef<number | null>(null);
  const consecutiveMatchRef = useRef<{ p1: number; p2: number }>({ p1: 0, p2: 0 });
  const isLoopRunningRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  // Subscribe to CameraManager
  useEffect(() => {
    const unsub = CameraManager.subscribe((state) => {
      setCameraSettings(state.settings);
      setIsCameraActive(CameraManager.isStreaming());
      if (state.error) setCameraError(state.error);
    });

    // Enumerate devices initially
    CameraManager.enumerateDevices().catch(() => {});

    return () => {
      unsub();
    };
  }, []);

  // Start appropriate camera mode (Single or Dual)
  const initCameras = useCallback(async () => {
    setCameraError(null);
    try {
      const settings = CameraManager.getSettings();
      if (settings.mode === 'dual') {
        const { streamP1: s1, streamP2: s2 } = await CameraManager.startDualCameras(
          settings.p1DeviceId,
          settings.p2DeviceId
        );
        setStreamP1(s1);
        setStreamP2(s2);
      } else {
        const stream = await CameraManager.startCamera(settings.singleDeviceId);
        setStreamP1(stream);
        setStreamP2(stream);
        if (videoSharedRef.current) {
          videoSharedRef.current.srcObject = stream;
          videoSharedRef.current.play().catch(() => {});
        }
      }
      setIsCameraActive(true);
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : 'Gagal mengakses kamera.');
    }
  }, []);

  // Trigger camera startup once at least one player registers
  useEffect(() => {
    if ((battleState.p1.isRegistered || battleState.p2.isRegistered) && !isCameraActive) {
      initCameras();
    }
  }, [battleState.p1.isRegistered, battleState.p2.isRegistered, isCameraActive, initCameras]);

  // Main Computer Vision Processing Loop for Battle
  const runBattleVisionLoop = useCallback(() => {
    if (!isLoopRunningRef.current) return;

    const now = performance.now();
    const settings = CameraManager.getSettings();

    if (settings.mode === 'dual') {
      // --- DUAL CAMERA MODE (2 physical devices) ---
      const vidP1 = videoP1Ref.current;
      const vidP2 = videoP2Ref.current;

      let detectedP1: DetectedFace | null = null;
      let countP1 = 0;
      let detectedP2: DetectedFace | null = null;
      let countP2 = 0;

      // 1. Process Camera 1 for Player 1
      if (vidP1 && vidP1.readyState >= 2 && !vidP1.paused) {
        const resP1 = FaceDetectorService.detect(vidP1, now);
        countP1 = resP1.boxes.length;
        if (resP1.boxes.length === 1) {
          const bRes = BlendshapeClassifierService.classify(resP1.blendshapes[0] || {}, 101);
          detectedP1 = {
            trackId: 101,
            faceId: 'P1',
            box: resP1.boxes[0],
            blendshapes: resP1.blendshapes[0],
            expression: bRes.expression,
            expressionLabel: bRes.label,
            rawModelLabel: bRes.rawLabel,
            confidence: bRes.confidence,
            status: 'active',
            missingFrames: 0,
            lastSeen: Date.now(),
          };
        }
      }

      // 2. Process Camera 2 for Player 2
      if (vidP2 && vidP2.readyState >= 2 && !vidP2.paused) {
        // Monotonic timestamp offset for 2nd detection call
        const resP2 = FaceDetectorService.detect(vidP2, now + 1);
        countP2 = resP2.boxes.length;
        if (resP2.boxes.length === 1) {
          const bRes = BlendshapeClassifierService.classify(resP2.blendshapes[0] || {}, 102);
          detectedP2 = {
            trackId: 102,
            faceId: 'P2',
            box: resP2.boxes[0],
            blendshapes: resP2.blendshapes[0],
            expression: bRes.expression,
            expressionLabel: bRes.label,
            rawModelLabel: bRes.rawLabel,
            confidence: bRes.confidence,
            status: 'active',
            missingFrames: 0,
            lastSeen: Date.now(),
          };
        }
      }

      setZoneCounts({ p1: countP1, p2: countP2 });
      setP1Face(detectedP1);
      setP2Face(detectedP2);
    } else {
      // --- SINGLE CAMERA MODE (1 shared webcam split into Left & Right) ---
      const vidShared = videoSharedRef.current || videoP1Ref.current;
      if (vidShared && vidShared.readyState >= 2 && !vidShared.paused) {
        const res = FaceDetectorService.detect(vidShared, now);
        const rawFaces: DetectedFace[] = res.boxes.map((box, idx) => {
          const bRes = BlendshapeClassifierService.classify(res.blendshapes[idx] || {}, idx + 1);
          return {
            trackId: idx + 1,
            faceId: `Face ${idx + 1}`,
            box,
            blendshapes: res.blendshapes[idx],
            expression: bRes.expression,
            expressionLabel: bRes.label,
            rawModelLabel: bRes.rawLabel,
            confidence: bRes.confidence,
            status: 'active',
            missingFrames: 0,
            lastSeen: Date.now(),
          };
        });

        const { p1Faces, p2Faces } = countFacesInZones(rawFaces, true);
        setZoneCounts({ p1: p1Faces.length, p2: p2Faces.length });

        const validP1 = p1Faces.length === 1 ? p1Faces[0] : null;
        const validP2 = p2Faces.length === 1 ? p2Faces[0] : null;

        setP1Face(validP1);
        setP2Face(validP2);
      }
    }

    animFrameRef.current = requestAnimationFrame(runBattleVisionLoop);
  }, []);

  // Activate / stop vision loop
  useEffect(() => {
    if (isCameraActive) {
      isLoopRunningRef.current = true;
      animFrameRef.current = requestAnimationFrame(runBattleVisionLoop);
    } else {
      isLoopRunningRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      isLoopRunningRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isCameraActive, runBattleVisionLoop]);

  // Update Player Ready States based on zone face count
  useEffect(() => {
    setBattleState((prev) => {
      const p1Ready = prev.p1.isRegistered && zoneCounts.p1 === 1;
      const p2Ready = prev.p2.isRegistered && zoneCounts.p2 === 1;

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
          isFaceInZone: zoneCounts.p1 > 0,
          facesInZoneCount: zoneCounts.p1,
          isReady: p1Ready,
          currentExpression: p1Face?.expression ?? null,
          currentConfidence: p1Face?.confidence ?? 0,
        },
        p2: {
          ...prev.p2,
          isFaceInZone: zoneCounts.p2 > 0,
          facesInZoneCount: zoneCounts.p2,
          isReady: p2Ready,
          currentExpression: p2Face?.expression ?? null,
          currentConfidence: p2Face?.confidence ?? 0,
        },
      };
    });
  }, [zoneCounts.p1, zoneCounts.p2, p1Face?.expression, p1Face?.confidence, p2Face?.expression, p2Face?.confidence]);

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

    setStreamP1(null);
    setStreamP2(null);
    CameraManager.stopCamera(true);
    setIsCameraActive(false);
  };

  const canStart = battleState.p1.isReady && battleState.p2.isReady && battleState.status === 'ready';

  return (
    <div className="w-full max-w-[1540px] mx-auto px-4 lg:px-8 py-2 h-[calc(100dvh-57px-41px)] max-h-[calc(100dvh-57px-41px)] overflow-hidden flex flex-col justify-between min-h-0">
      {/* Top Split Battle Arena: Dominant, Spacious, Large Viewports */}
      <div className="relative w-full rounded-3xl p-2.5 md:p-3 bg-white/70 backdrop-blur-md border border-gray-200/90 shadow-xl flex-1 flex flex-col justify-center min-h-0 mb-2">
        {/* Quick Camera Mode Switcher Header Pill */}
        <div className="absolute top-2.5 left-4 z-30">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-bold rounded-full border border-white/10 transition-colors shadow-sm cursor-pointer"
            title="Klik untuk mengubah mode kamera (1 kamera atau 2 kamera terpisah)"
          >
            {cameraSettings.mode === 'dual' ? (
              <>
                <Camera className="w-3.5 h-3.5 text-maunc-yellow" />
                <span>Mode: 2 Kamera Terpisah</span>
              </>
            ) : (
              <>
                <SplitSquareVertical className="w-3.5 h-3.5 text-maunc-yellow" />
                <span>Mode: 1 Kamera (Split View)</span>
              </>
            )}
            <Sliders className="w-3 h-3 text-gray-400 ml-1" />
          </button>
        </div>

        {/* Arena Body: Mode 1 Kamera (Unified Split Screen) vs Mode 2 Kamera (2 Separate Boxes) */}
        {cameraSettings.mode === 'single' ? (
          /* SINGLE CAMERA ARENA: ONE CONTINUOUS CONTAINER SPLIT BY CENTER YELLOW DIVIDER */
          <div className="relative w-full h-full min-h-0 bg-[#121316] rounded-3xl overflow-hidden border border-gray-800 shadow-xl flex items-center justify-center select-none group">
            {/* Cyber Corner Brackets [ ] on outer 4 corners */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-gray-700/60 rounded-tl-lg pointer-events-none z-20" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-gray-700/60 rounded-tr-lg pointer-events-none z-20" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-gray-700/60 rounded-bl-lg pointer-events-none z-20" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-gray-700/60 rounded-br-lg pointer-events-none z-20" />

            {/* Continuous Video Feed across whole arena */}
            {isCameraActive && (
              <video
                ref={(node) => {
                  if (node) {
                    videoSharedRef.current = node;
                    if (streamP1 && node.srcObject !== streamP1) {
                      node.srcObject = streamP1;
                      node.play().catch(() => {});
                    }
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}

            {/* Vertical Golden Center Divider Line */}
            <div className="absolute left-1/2 top-2 bottom-2 w-1.5 -translate-x-1/2 bg-maunc-yellow rounded-full z-20 pointer-events-none shadow-glow-yellow" />

            {/* LEFT ZONE: Player 1 */}
            <div className="absolute left-0 top-0 bottom-0 w-1/2 z-20 pointer-events-none overflow-hidden">
              {!battleState.p1.isRegistered ? (
                /* Unregistered State for Player 1 */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white bg-black/60 backdrop-blur-sm pointer-events-auto animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 text-maunc-yellow">
                    <UserPlus className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1">
                    Player 1
                  </h3>
                  <p className="text-gray-400 text-xs mb-4">
                    Daftarkan nama untuk memulai
                  </p>
                  <button
                    onClick={() => setRegisteringPlayerId(1)}
                    className="flex items-center space-x-2 px-5 py-2 bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black font-bold rounded-full text-xs transition-all shadow-glow-yellow active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Daftar / Ganti Nama</span>
                  </button>
                </div>
              ) : (
                /* Registered State for Player 1 */
                <>
                  {/* Top-Left Name & Ready Status Pill */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2 pointer-events-auto">
                    <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                      <span className="text-white text-xs md:text-sm font-bold tracking-wide">
                        {battleState.p1.name}
                      </span>
                      <button
                        onClick={() => setRegisteringPlayerId(1)}
                        className="text-gray-400 hover:text-maunc-yellow transition-colors ml-1 cursor-pointer"
                        title="Ubah Nama"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Status Pill */}
                    {zoneCounts.p1 > 1 ? (
                      <div className="flex items-center space-x-1.5 bg-red-950/80 border border-red-500/50 text-red-200 text-xs px-3 py-1 rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <span>Area Penuh (&gt;1 wajah)</span>
                      </div>
                    ) : battleState.p1.isReady ? (
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

                  {/* Bottom-Left Detected Expression Pill */}
                  {p1Face && isCameraActive && (
                    <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-white border border-white/10 flex items-center space-x-2 pointer-events-auto">
                      <span className="text-gray-400">Ekspresi:</span>
                      <span className="font-bold text-maunc-yellow">
                        {p1Face.expressionLabel || 'Netral'}
                      </span>
                      <span className="text-gray-400">
                        ({Math.round((p1Face.confidence || 0) * 100)}%)
                      </span>
                    </div>
                  )}

                  {/* Round Win Overlay for Player 1 */}
                  {battleState.p1.result === 'won' && (
                    <div className="absolute inset-0 z-30 bg-emerald-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in border-4 border-emerald-500">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-2 text-maunc-yellow animate-bounce">
                        <Trophy className="w-8 h-8" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black text-emerald-300 tracking-wider mb-1">
                        MENANG!
                      </h2>
                      <p className="text-sm font-semibold text-white">{battleState.p1.name}</p>
                    </div>
                  )}
                  {battleState.p1.result === 'lost' && (
                    <div className="absolute inset-0 z-30 bg-red-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-red-400 tracking-wider mb-1">
                        KALAH
                      </h2>
                      <p className="text-xs text-gray-300">{battleState.p1.name}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* RIGHT ZONE: Player 2 */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 z-20 pointer-events-none overflow-hidden">
              {!battleState.p2.isRegistered ? (
                /* Unregistered State for Player 2 */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white bg-black/60 backdrop-blur-sm pointer-events-auto animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 text-maunc-yellow">
                    <UserPlus className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1">
                    Player 2
                  </h3>
                  <p className="text-gray-400 text-xs mb-4">
                    Daftarkan nama untuk memulai
                  </p>
                  <button
                    onClick={() => setRegisteringPlayerId(2)}
                    className="flex items-center space-x-2 px-5 py-2 bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black font-bold rounded-full text-xs transition-all shadow-glow-yellow active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Daftar / Ganti Nama</span>
                  </button>
                </div>
              ) : (
                /* Registered State for Player 2 */
                <>
                  {/* Top-Right Name & Ready Status Pill */}
                  <div className="absolute top-4 right-4 flex items-center space-x-2 pointer-events-auto">
                    {/* Status Pill */}
                    {zoneCounts.p2 > 1 ? (
                      <div className="flex items-center space-x-1.5 bg-red-950/80 border border-red-500/50 text-red-200 text-xs px-3 py-1 rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <span>Area Penuh (&gt;1 wajah)</span>
                      </div>
                    ) : battleState.p2.isReady ? (
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

                    <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                      <span className="text-white text-xs md:text-sm font-bold tracking-wide">
                        {battleState.p2.name}
                      </span>
                      <button
                        onClick={() => setRegisteringPlayerId(2)}
                        className="text-gray-400 hover:text-maunc-yellow transition-colors ml-1 cursor-pointer"
                        title="Ubah Nama"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom-Right Detected Expression Pill */}
                  {p2Face && isCameraActive && (
                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-white border border-white/10 flex items-center space-x-2 pointer-events-auto">
                      <span className="text-gray-400">Ekspresi:</span>
                      <span className="font-bold text-maunc-yellow">
                        {p2Face.expressionLabel || 'Netral'}
                      </span>
                      <span className="text-gray-400">
                        ({Math.round((p2Face.confidence || 0) * 100)}%)
                      </span>
                    </div>
                  )}

                  {/* Round Win Overlay for Player 2 */}
                  {battleState.p2.result === 'won' && (
                    <div className="absolute inset-0 z-30 bg-emerald-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in border-4 border-emerald-500">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-2 text-maunc-yellow animate-bounce">
                        <Trophy className="w-8 h-8" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black text-emerald-300 tracking-wider mb-1">
                        MENANG!
                      </h2>
                      <p className="text-sm font-semibold text-white">{battleState.p2.name}</p>
                    </div>
                  )}
                  {battleState.p2.result === 'lost' && (
                    <div className="absolute inset-0 z-30 bg-red-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-red-400 tracking-wider mb-1">
                        KALAH
                      </h2>
                      <p className="text-xs text-gray-300">{battleState.p2.name}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Real-time Bounding Boxes Over Unified Video */}
            {isCameraActive && p1Face && battleState.p1.isRegistered && (
              <div
                className="absolute border-2 border-maunc-yellow rounded-2xl pointer-events-none transition-all duration-75 z-10"
                style={{
                  left: `${(1 - p1Face.box.x - p1Face.box.width) * 100}%`,
                  top: `${p1Face.box.y * 100}%`,
                  width: `${p1Face.box.width * 100}%`,
                  height: `${p1Face.box.height * 100}%`,
                }}
              />
            )}
            {isCameraActive && p2Face && battleState.p2.isRegistered && (
              <div
                className="absolute border-2 border-maunc-yellow rounded-2xl pointer-events-none transition-all duration-75 z-10"
                style={{
                  left: `${(1 - p2Face.box.x - p2Face.box.width) * 100}%`,
                  top: `${p2Face.box.y * 100}%`,
                  width: `${p2Face.box.width * 100}%`,
                  height: `${p2Face.box.height * 100}%`,
                }}
              />
            )}
          </div>
        ) : (
          /* DUAL CAMERA ARENA: 2 SEPARATE PHYSICAL VIEWPORTS SIDE-BY-SIDE */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 relative items-stretch h-full min-h-0">
            {/* Left: Player 1 Viewport */}
            <PlayerViewport
              player={battleState.p1}
              detectedFace={p1Face}
              isStreaming={isCameraActive}
              onOpenRegister={() => setRegisteringPlayerId(1)}
              zoneFaceCount={zoneCounts.p1}
              stream={streamP1}
              videoRef={videoP1Ref}
            />

            {/* Right: Player 2 Viewport */}
            <PlayerViewport
              player={battleState.p2}
              detectedFace={p2Face}
              isStreaming={isCameraActive}
              onOpenRegister={() => setRegisteringPlayerId(2)}
              zoneFaceCount={zoneCounts.p2}
              stream={streamP2}
              videoRef={videoP2Ref}
            />
          </div>
        )}

        {/* Global Warning Banner if Camera Error */}
        {cameraError && (
          <div className="mt-2 p-2 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>

      {/* Bottom Dashboard Section: Player 1 Score, Target Expression + Controls, Player 2 Score */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center flex-shrink-0">
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

        {/* Center: Match Format Badge with Click to Change */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center space-x-2 text-xs text-gray-500 hover:text-maunc-black font-medium transition-colors cursor-pointer"
        >
          <Users className="w-4 h-4 text-gray-400" />
          <span>
            {cameraSettings.mode === 'dual'
              ? 'Pertandingan 2 Pemain • 2 Kamera Terpisah'
              : 'Pertandingan 2 Pemain • 1 Webcam Bersama'}
          </span>
          <span className="text-[10px] text-amber-600 font-bold underline ml-1">Ubah Kamera</span>
        </button>

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

      {/* Camera Settings Modal */}
      <CameraSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApplied={() => {
          if (battleState.p1.isRegistered || battleState.p2.isRegistered) {
            initCameras();
          }
        }}
      />
    </div>
  );
};
