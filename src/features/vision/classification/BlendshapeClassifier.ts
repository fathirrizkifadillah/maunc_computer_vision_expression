import { FinalExpression } from '../types';
import { getExpressionDisplayName } from './expressionMapping';

export interface BlendshapeClassificationResult {
  expression: FinalExpression;
  label: string;
  rawLabel: string;
  confidence: number;
  allScores: Record<string, number>;
}

export class BlendshapeClassifier {
  private static instance: BlendshapeClassifier;
  private smoothingMap: Map<number, { expression: FinalExpression; confidence: number; timestamp: number }[]> = new Map();

  public static getInstance(): BlendshapeClassifier {
    if (!BlendshapeClassifier.instance) {
      BlendshapeClassifier.instance = new BlendshapeClassifier();
    }
    return BlendshapeClassifier.instance;
  }

  /**
   * Classifies facial expression in real-time from 52 MediaPipe facial action unit blendshapes.
   * Runs 100% locally on-device at 60 FPS with calibrated gain scaling for subtle webcam expressions.
   */
  public classify(
    blendshapes: Record<string, number>,
    trackId?: number
  ): BlendshapeClassificationResult {
    const b = blendshapes || {};

    // 1. Senang (Happy / Joy)
    // Primary: mouthSmileLeft/Right; Secondary: cheekSquintLeft/Right, mouthDimpleLeft/Right
    const smileL = b['mouthSmileLeft'] || 0;
    const smileR = b['mouthSmileRight'] || 0;
    const cheekL = b['cheekSquintLeft'] || 0;
    const cheekR = b['cheekSquintRight'] || 0;
    const smileScore = Math.max(smileL, smileR) * 0.6 + ((smileL + smileR) * 0.5) * 0.4;
    const rawSenang = smileScore * 0.80 + ((cheekL + cheekR) * 0.5) * 0.20;

    // 2. Marah (Angry)
    // Primary: browDownLeft/Right, mouthFrownLeft/Right; Secondary: mouthPressLeft/Right
    const browDownL = b['browDownLeft'] || 0;
    const browDownR = b['browDownRight'] || 0;
    const frownL = b['mouthFrownLeft'] || 0;
    const frownR = b['mouthFrownRight'] || 0;
    const pressL = b['mouthPressLeft'] || 0;
    const pressR = b['mouthPressRight'] || 0;
    const browDownScore = Math.max(browDownL, browDownR) * 0.6 + ((browDownL + browDownR) * 0.5) * 0.4;
    const frownScore = (frownL + frownR) * 0.5;
    const pressScore = (pressL + pressR) * 0.5;
    const rawMarah = browDownScore * 0.65 + frownScore * 0.20 + pressScore * 0.15;

    // 3. Sedih (Sad / Pouting / Cemberut)
    // Primary: mouthFrownLeft/Right (AU15), mouthShrugLower (AU17), mouthPress (AU24), browInnerUp (AU1)
    // Note: Sadness requires closed or nearly-closed mouth. Sticking tongue out (melet) has open jaw, so it is penalized.
    const mouthFrown = Math.max(frownL, frownR) * 0.70 + ((frownL + frownR) * 0.5) * 0.30;
    const mouthPout = Math.max(
      b['mouthShrugLower'] || 0,
      ((b['mouthPressLeft'] || 0) + (b['mouthPressRight'] || 0)) * 0.5,
      b['mouthRollLower'] || 0
    );
    // Standalone mouth sadness: frown or chin pouting triggers sadness naturally
    const mouthSadness = Math.max(mouthFrown * 1.35, (mouthFrown + mouthPout) * 0.90);
    const browSadness = b['browInnerUp'] || 0;
    const jawOpen = b['jawOpen'] || 0;
    const openJawPenalty = Math.max(0, 1 - jawOpen * 3.5);
    const browDownAvg = (browDownL + browDownR) * 0.5;
    const heavyAngryPenalty = browDownAvg > 0.40 ? Math.max(0.2, 1 - (browDownAvg - 0.40) * 2.5) : 1.0;
    const rawSedih = Math.max(mouthSadness, mouthSadness * 0.6 + browSadness * 0.6, browSadness * 1.2)
      * openJawPenalty
      * heavyAngryPenalty;

    // 4. Takut (Fear / Scared / Shocked)
    // Primary: eyeWideLeft/Right (AU5), browUp (AU1+2), jawOpen / mouthFunnel
    // Note: Fear strictly requires widened eyes. Without wide eyes, opening mouth is just eating/melet.
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
    const eyeWideFactor = Math.min(1.0, eyeWide / 0.14);
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
    const disgustBase = Math.max(sneer * 1.25, upperUp * 1.15, (sneer + upperUp) * 0.75) + asymmetry;
    const rawSebal = disgustBase * 1.45;

    // 6. Netral (Neutral)
    const maxEmotionalScore = Math.max(rawSenang, rawMarah, rawSedih, rawTakut, rawSebal);
    const rawNetral = Math.max(0, 1 - maxEmotionalScore * 1.5);

    const scores: Record<FinalExpression, number> = {
      senang: rawSenang,
      marah: rawMarah,
      sedih: rawSedih,
      takut: rawTakut,
      sebal: rawSebal,
      netral: rawNetral,
    };

    // Determine winning emotion
    let chosenExpression: FinalExpression = 'netral';
    let chosenScore = rawNetral;

    const emotionalCandidates: [FinalExpression, number][] = [
      ['senang', rawSenang],
      ['marah', rawMarah],
      ['sedih', rawSedih],
      ['takut', rawTakut],
      ['sebal', rawSebal],
    ];

    // Sort by emotional score descending
    emotionalCandidates.sort((a, b) => b[1] - a[1]);
    const topCandidate = emotionalCandidates[0];

    // Responsive trigger threshold: 0.16 for instant, natural detection on real webcams
    if (topCandidate[1] >= 0.16) {
      chosenExpression = topCandidate[0];
      chosenScore = topCandidate[1];
    } else {
      chosenExpression = 'netral';
      chosenScore = Math.max(0.70, Math.min(0.96, rawNetral));
    }

    // Normalized display confidence (0.70 to 0.98)
    const normalizedConfidence = Math.min(
      0.98,
      Math.max(0.70, chosenExpression === 'netral' ? 0.85 : 0.68 + chosenScore * 0.40)
    );

    // Apply temporal smoothing per trackId (250ms responsive window)
    let finalExpr = chosenExpression;
    let finalConf = normalizedConfidence;

    if (trackId !== undefined) {
      const smoothed = this.smooth(trackId, chosenExpression, normalizedConfidence, chosenScore);
      finalExpr = smoothed.expression;
      finalConf = smoothed.confidence;
    }

    return {
      expression: finalExpr,
      label: getExpressionDisplayName(finalExpr),
      rawLabel: `blendshape_${finalExpr}`,
      confidence: finalConf,
      allScores: scores,
    };
  }

  /**
   * Temporal smoothing (250ms window) with fast-path for clear active expressions
   */
  private smooth(
    trackId: number,
    expression: FinalExpression,
    confidence: number,
    score: number
  ): { expression: FinalExpression; confidence: number } {
    const now = Date.now();
    let history = this.smoothingMap.get(trackId);
    if (!history) {
      history = [];
      this.smoothingMap.set(trackId, history);
    }

    // Fast-path: clear active expressions (score >= 0.26) react immediately without waiting
    if (expression !== 'netral' && score >= 0.26) {
      this.smoothingMap.set(trackId, [{ expression, confidence, timestamp: now }]);
      return { expression, confidence: Number(confidence.toFixed(2)) };
    }

    // Keep history within last 250ms
    history.push({ expression, confidence, timestamp: now });
    history = history.filter((h) => now - h.timestamp <= 250);
    this.smoothingMap.set(trackId, history);

    // Count expression occurrences
    const counts: Record<string, number> = {};
    let totalConf = 0;
    for (const item of history) {
      counts[item.expression] = (counts[item.expression] || 0) + 1;
      if (item.expression === expression) {
        totalConf += item.confidence;
      }
    }

    let topExpr = expression;
    let maxCount = 0;
    for (const [expr, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        topExpr = expr as FinalExpression;
      }
    }

    const avgConf = counts[topExpr] ? totalConf / counts[topExpr] : confidence;
    return {
      expression: topExpr,
      confidence: Number(avgConf.toFixed(2)),
    };
  }
}

export const BlendshapeClassifierService = BlendshapeClassifier.getInstance();
