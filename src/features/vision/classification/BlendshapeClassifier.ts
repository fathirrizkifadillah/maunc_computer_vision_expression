import { FinalExpression } from '../types';
import { getExpressionDisplayName } from './expressionMapping';

export interface BlendshapeClassificationResult {
  expression: FinalExpression;
  label: string;
  rawLabel: string;
  confidence: number;
  allScores: Record<string, number>;
}

interface TrackFilterState {
  smoothedScores: Record<FinalExpression, number>;
  activeExpression: FinalExpression;
  lastChangeTime: number;
}

const ALL_EXPRESSIONS: readonly FinalExpression[] = [
  'senang',
  'marah',
  'sedih',
  'takut',
  'sebal',
  'netral',
] as const;

export class BlendshapeClassifier {
  private static instance: BlendshapeClassifier;
  private trackStates: Map<number, TrackFilterState> = new Map();

  public static getInstance(): BlendshapeClassifier {
    if (!BlendshapeClassifier.instance) {
      BlendshapeClassifier.instance = new BlendshapeClassifier();
    }
    return BlendshapeClassifier.instance;
  }

  /**
   * Resets temporal filter state for a given face track or all tracks
   */
  public resetTrack(trackId?: number): void {
    if (trackId !== undefined) {
      this.trackStates.delete(trackId);
    } else {
      this.trackStates.clear();
    }
  }

  /**
   * Classifies facial expression in real-time from 52 MediaPipe facial action unit blendshapes.
   * Runs 100% locally on-device at 60 FPS with continuous EMA filtering & Hysteresis latching for robust Expo arcade action.
   */
  public classify(
    blendshapes: Record<string, number>,
    trackId?: number
  ): BlendshapeClassificationResult {
    const b = blendshapes || {};

    // 1. Senang (Happy / Joy)
    // Primary: mouthSmileLeft/Right; Secondary: cheekSquintLeft/Right
    const smileL = b['mouthSmileLeft'] || 0;
    const smileR = b['mouthSmileRight'] || 0;
    const cheekL = b['cheekSquintLeft'] || 0;
    const cheekR = b['cheekSquintRight'] || 0;
    const smileScore = Math.max(smileL, smileR) * 0.65 + ((smileL + smileR) * 0.5) * 0.35;
    const rawSenang = smileScore * 1.05 + ((cheekL + cheekR) * 0.5) * 0.20;

    // 2. Marah (Angry)
    // Primary: browDownLeft/Right (AU4); Secondary: mouthFrown, eyeSquint, jawClench
    const browDownL = b['browDownLeft'] || 0;
    const browDownR = b['browDownRight'] || 0;
    const frownL = b['mouthFrownLeft'] || 0;
    const frownR = b['mouthFrownRight'] || 0;
    const pressL = b['mouthPressLeft'] || 0;
    const pressR = b['mouthPressRight'] || 0;
    const eyeSquintL = b['eyeSquintLeft'] || 0;
    const eyeSquintR = b['eyeSquintRight'] || 0;

    const browDownScore = Math.max(browDownL, browDownR) * 0.65 + ((browDownL + browDownR) * 0.5) * 0.35;
    const frownScore = (frownL + frownR) * 0.5;
    const pressScore = (pressL + pressR) * 0.5;
    const eyeSquintScore = (eyeSquintL + eyeSquintR) * 0.5;
    const rawMarah = browDownScore * 0.70 + frownScore * 0.15 + pressScore * 0.10 + eyeSquintScore * 0.10;

    // 3. Sedih (Sad / Pouting / Cemberut)
    // Primary: mouthFrownLeft/Right (AU15), mouthShrugLower (AU17), mouthPress (AU24), browInnerUp (AU1)
    // Note: Sticking tongue out (melet) has wide open jaw without frown; penalized via openJawPenalty.
    const mouthFrown = Math.max(frownL, frownR) * 0.70 + ((frownL + frownR) * 0.5) * 0.30;
    const mouthPout = Math.max(
      b['mouthShrugLower'] || 0,
      b['mouthPucker'] || 0,
      ((b['mouthPressLeft'] || 0) + (b['mouthPressRight'] || 0)) * 0.5,
      b['mouthRollLower'] || 0
    );
    const mouthSadness = Math.max(mouthFrown * 1.35, (mouthFrown + mouthPout) * 0.95);
    const browSadness = b['browInnerUp'] || 0;
    const jawOpen = b['jawOpen'] || 0;
    const openJawPenalty = Math.max(0, 1 - jawOpen * 3.5);
    const browDownAvg = (browDownL + browDownR) * 0.5;
    const heavyAngryPenalty = browDownAvg > 0.40 ? Math.max(0.2, 1 - (browDownAvg - 0.40) * 2.5) : 1.0;
    const rawSedih = Math.max(mouthSadness, mouthSadness * 0.6 + browSadness * 0.6, browSadness * 1.2)
      * openJawPenalty
      * heavyAngryPenalty;

    // 4. Takut (Fear / Scared / Shocked / Kaget)
    // Primary: eyeWideLeft/Right (AU5), jawOpen / mouthGasp, browUp (AU1+2)
    // Note: Fear strictly requires widened eyes. Without wide eyes, opening mouth is just eating/talking.
    const eyeWideL = b['eyeWideLeft'] || 0;
    const eyeWideR = b['eyeWideRight'] || 0;
    const browOuterUpL = b['browOuterUpLeft'] || 0;
    const browOuterUpR = b['browOuterUpRight'] || 0;
    const eyeWide = Math.max(eyeWideL, eyeWideR) * 0.7 + ((eyeWideL + eyeWideR) * 0.5) * 0.3;
    const browUp = Math.max(browSadness, (browOuterUpL + browOuterUpR) * 0.5);
    const mouthGasp = Math.max(
      b['jawOpen'] || 0,
      b['mouthFunnel'] || 0,
      ((b['mouthStretchLeft'] || 0) + (b['mouthStretchRight'] || 0)) * 0.5
    );
    const eyeWideFactor = Math.min(1.0, eyeWide / 0.15);
    const rawTakut = (eyeWide * 0.55 + browUp * 0.30 + mouthGasp * 0.15) * 1.35 * eyeWideFactor;

    // 5. Sebal (Disgust / Sneer / Contempt)
    // Primary: noseSneerLeft/Right (AU9), mouthUpperUpLeft/Right (AU10), asymmetric sneer
    const noseSneerL = b['noseSneerLeft'] || 0;
    const noseSneerR = b['noseSneerRight'] || 0;
    const mouthUpperUpL = b['mouthUpperUpLeft'] || 0;
    const mouthUpperUpR = b['mouthUpperUpRight'] || 0;
    const sneer = Math.max(noseSneerL, noseSneerR) * 0.7 + ((noseSneerL + noseSneerR) * 0.5) * 0.3;
    const upperUp = Math.max(mouthUpperUpL, mouthUpperUpR) * 0.7 + ((mouthUpperUpL + mouthUpperUpR) * 0.5) * 0.3;
    const asymmetry = Math.abs(mouthUpperUpL - mouthUpperUpR) * 0.4;
    const disgustBase = Math.max(sneer * 1.30, upperUp * 1.20, (sneer + upperUp) * 0.80) + asymmetry;
    const rawSebal = disgustBase * 1.40;

    // 6. Netral (Neutral baseline)
    const maxEmotionalScore = Math.max(rawSenang, rawMarah, rawSedih, rawTakut, rawSebal);
    const rawNetral = Math.max(0, 1 - maxEmotionalScore * 1.5);

    const rawScores: Record<FinalExpression, number> = {
      senang: rawSenang,
      marah: rawMarah,
      sedih: rawSedih,
      takut: rawTakut,
      sebal: rawSebal,
      netral: rawNetral,
    };

    // Candidate ranking for non-tracked or initial determination
    const emotionalCandidates: [FinalExpression, number][] = [
      ['senang', rawSenang],
      ['marah', rawMarah],
      ['sedih', rawSedih],
      ['takut', rawTakut],
      ['sebal', rawSebal],
    ];
    emotionalCandidates.sort((a, b) => b[1] - a[1]);
    const topRawCandidate = emotionalCandidates[0];

    let winningEmotion: FinalExpression =
      topRawCandidate[1] >= 0.22 ? topRawCandidate[0] : 'netral';
    let winningScore = winningEmotion === 'netral' ? rawNetral : topRawCandidate[1];

    // Temporal EMA filter & Hysteresis latching for tracked faces
    if (trackId !== undefined) {
      let state = this.trackStates.get(trackId);
      const now = Date.now();

      if (!state) {
        // Initial frame for this face: latch immediately to prevent startup delay
        state = {
          smoothedScores: { ...rawScores },
          activeExpression: winningEmotion,
          lastChangeTime: now,
        };
        this.trackStates.set(trackId, state);
      } else {
        // Continuous Exponential Moving Average (alpha = 0.42 for fast 50ms rise time without transient spikes)
        const alpha = 0.42;
        for (const expr of ALL_EXPRESSIONS) {
          state.smoothedScores[expr] =
            alpha * rawScores[expr] + (1 - alpha) * state.smoothedScores[expr];
        }

        const currentActive = state.activeExpression;
        const currentActiveScore = state.smoothedScores[currentActive] || 0;

        // Rank smoothed candidates
        const smoothedCandidates: [FinalExpression, number][] = [
          ['senang', state.smoothedScores.senang],
          ['marah', state.smoothedScores.marah],
          ['sedih', state.smoothedScores.sedih],
          ['takut', state.smoothedScores.takut],
          ['sebal', state.smoothedScores.sebal],
        ];
        smoothedCandidates.sort((a, b) => b[1] - a[1]);
        const bestCandidate = smoothedCandidates[0];

        // Minimum dwell time (160ms) prevents micro-flickering while preserving brisk responsive feel
        const dwellPassed = now - state.lastChangeTime >= 160;

        if (currentActive === 'netral') {
          // Enter Threshold: to transition from neutral to an active emotion, score must reach >= 0.22
          if (bestCandidate[1] >= 0.22 && dwellPassed) {
            state.activeExpression = bestCandidate[0];
            state.lastChangeTime = now;
          }
        } else {
          // Exit Threshold: to drop back to neutral, current active emotion must fall below 0.16
          if (currentActiveScore < 0.16 && dwellPassed) {
            if (bestCandidate[1] >= 0.22) {
              state.activeExpression = bestCandidate[0];
            } else {
              state.activeExpression = 'netral';
            }
            state.lastChangeTime = now;
          } else if (
            bestCandidate[0] !== currentActive &&
            bestCandidate[1] > currentActiveScore + 0.08 &&
            dwellPassed
          ) {
            // Dethrone: Another emotion can take over only if it decisively beats the active emotion by 0.08 margin
            state.activeExpression = bestCandidate[0];
            state.lastChangeTime = now;
          }
        }
      }

      winningEmotion = state.activeExpression;
      winningScore = state.smoothedScores[winningEmotion];
    }

    // Normalized display confidence (0.70 to 0.98)
    const normalizedConfidence = Math.min(
      0.98,
      Math.max(0.70, winningEmotion === 'netral' ? 0.85 : 0.68 + Math.min(1.0, winningScore) * 0.35)
    );

    return {
      expression: winningEmotion,
      label: getExpressionDisplayName(winningEmotion),
      rawLabel: winningEmotion,
      confidence: Number(normalizedConfidence.toFixed(2)),
      allScores: trackId !== undefined && this.trackStates.has(trackId)
        ? { ...this.trackStates.get(trackId)!.smoothedScores }
        : rawScores,
    };
  }
}

export const BlendshapeClassifierService = BlendshapeClassifier.getInstance();