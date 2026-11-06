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
   * Runs 100% locally on-device at 60 FPS without external network dependency.
   */
  public classify(
    blendshapes: Record<string, number>,
    trackId?: number
  ): BlendshapeClassificationResult {
    const b = blendshapes || {};

    // 1. Senang (Happy / Joy)
    // Primary: mouthSmileLeft, mouthSmileRight; Secondary: cheekSquintLeft, cheekSquintRight
    const smileL = b['mouthSmileLeft'] || 0;
    const smileR = b['mouthSmileRight'] || 0;
    const cheekL = b['cheekSquintLeft'] || 0;
    const cheekR = b['cheekSquintRight'] || 0;
    const rawSenang = (smileL + smileR) * 0.70 + (cheekL + cheekR) * 0.30;

    // 2. Marah (Angry)
    // Primary: browDownLeft, browDownRight; Secondary: mouthFrownLeft, mouthFrownRight, jawClench
    const browDownL = b['browDownLeft'] || 0;
    const browDownR = b['browDownRight'] || 0;
    const frownL = b['mouthFrownLeft'] || 0;
    const frownR = b['mouthFrownRight'] || 0;
    const jawClench = b['jawClench'] || 0;
    const rawMarah = (browDownL + browDownR) * 0.65 + (frownL + frownR) * 0.20 + jawClench * 0.15;

    // 3. Sedih (Sad)
    // Primary: mouthFrownLeft, mouthFrownRight, browInnerUp; Secondary: mouthPressLeft, mouthPressRight
    const browInnerUp = b['browInnerUp'] || 0;
    const mouthPressL = b['mouthPressLeft'] || 0;
    const mouthPressR = b['mouthPressRight'] || 0;
    const rawSedih = (frownL + frownR) * 0.50 + browInnerUp * 0.35 + (mouthPressL + mouthPressR) * 0.15;

    // 4. Takut (Fear)
    // Primary: eyeWideLeft, eyeWideRight; Secondary: browOuterUpLeft, browOuterUpRight
    const eyeWideL = b['eyeWideLeft'] || 0;
    const eyeWideR = b['eyeWideRight'] || 0;
    const browOuterUpL = b['browOuterUpLeft'] || 0;
    const browOuterUpR = b['browOuterUpRight'] || 0;
    const rawTakut = (eyeWideL + eyeWideR) * 0.70 + (browOuterUpL + browOuterUpR) * 0.30;

    // 5. Sebal (Disgust / Contempt)
    // Primary: noseSneerLeft, noseSneerRight; Secondary: mouthUpperUpLeft, mouthUpperUpRight
    const noseSneerL = b['noseSneerLeft'] || 0;
    const noseSneerR = b['noseSneerRight'] || 0;
    const mouthUpperUpL = b['mouthUpperUpLeft'] || 0;
    const mouthUpperUpR = b['mouthUpperUpRight'] || 0;
    const rawSebal = (noseSneerL + noseSneerR) * 0.60 + (mouthUpperUpL + mouthUpperUpR) * 0.40;

    // 6. Netral (Neutral)
    const maxEmotionalScore = Math.max(rawSenang, rawMarah, rawSedih, rawTakut, rawSebal);
    const rawNetral = Math.max(0, 1 - maxEmotionalScore * 1.6);

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

    // Responsive trigger threshold: 0.22 for active expression detection
    if (topCandidate[1] >= 0.22 && topCandidate[1] > rawNetral * 0.5) {
      chosenExpression = topCandidate[0];
      chosenScore = topCandidate[1];
    } else {
      chosenExpression = 'netral';
      chosenScore = Math.max(0.65, Math.min(0.96, rawNetral));
    }

    // Normalized display confidence (0.68 to 0.98)
    const normalizedConfidence = Math.min(
      0.98,
      Math.max(0.68, chosenExpression === 'netral' ? 0.85 : 0.65 + chosenScore * 0.35)
    );

    // Apply temporal smoothing per trackId
    let finalExpr = chosenExpression;
    let finalConf = normalizedConfidence;

    if (trackId !== undefined) {
      const smoothed = this.smooth(trackId, chosenExpression, normalizedConfidence);
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
   * Temporal smoothing to prevent flicker while preserving instant reactivity
   */
  private smooth(
    trackId: number,
    expression: FinalExpression,
    confidence: number
  ): { expression: FinalExpression; confidence: number } {
    const now = Date.now();
    let history = this.smoothingMap.get(trackId);
    if (!history) {
      history = [];
      this.smoothingMap.set(trackId, history);
    }

    // Keep history within last 500ms
    history.push({ expression, confidence, timestamp: now });
    history = history.filter((h) => now - h.timestamp <= 500);
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
