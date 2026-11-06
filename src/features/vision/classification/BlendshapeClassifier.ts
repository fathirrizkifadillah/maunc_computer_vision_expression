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
    // Primary: mouthSmileLeft/Right; Secondary: cheekSquintLeft/Right, mouthDimpleLeft/Right
    const smileL = b['mouthSmileLeft'] || 0;
    const smileR = b['mouthSmileRight'] || 0;
    const cheekL = b['cheekSquintLeft'] || 0;
    const cheekR = b['cheekSquintRight'] || 0;
    const dimpleL = b['mouthDimpleLeft'] || 0;
    const dimpleR = b['mouthDimpleRight'] || 0;
    const avgSmile = (smileL + smileR) * 0.5;
    const avgCheek = (cheekL + cheekR) * 0.5;
    const avgDimple = (dimpleL + dimpleR) * 0.5;
    const rawSenang = avgSmile * 0.70 + avgCheek * 0.20 + avgDimple * 0.10;

    // 2. Marah (Angry)
    // Primary: browDownLeft/Right, mouthFrownLeft/Right; Secondary: mouthPressLeft/Right, eyeSquintLeft/Right
    const browDownL = b['browDownLeft'] || 0;
    const browDownR = b['browDownRight'] || 0;
    const frownL = b['mouthFrownLeft'] || 0;
    const frownR = b['mouthFrownRight'] || 0;
    const pressL = b['mouthPressLeft'] || 0;
    const pressR = b['mouthPressRight'] || 0;
    const eyeSquintL = b['eyeSquintLeft'] || 0;
    const eyeSquintR = b['eyeSquintRight'] || 0;
    const avgBrowDown = (browDownL + browDownR) * 0.5;
    const avgFrown = (frownL + frownR) * 0.5;
    const avgPress = (pressL + pressR) * 0.5;
    const avgEyeSquint = (eyeSquintL + eyeSquintR) * 0.5;
    const rawMarah = avgBrowDown * 0.55 + avgFrown * 0.25 + avgPress * 0.10 + avgEyeSquint * 0.10;

    // 3. Sedih (Sad)
    // Primary: browInnerUp, mouthFrownLeft/Right; Secondary: mouthPressLeft/Right
    const browInnerUp = b['browInnerUp'] || 0;
    const rawSedih = browInnerUp * 0.45 + avgFrown * 0.40 + avgPress * 0.15;

    // 4. Takut (Fear)
    // Primary: eyeWideLeft/Right; Secondary: browOuterUpLeft/Right, browInnerUp
    const eyeWideL = b['eyeWideLeft'] || 0;
    const eyeWideR = b['eyeWideRight'] || 0;
    const browOuterUpL = b['browOuterUpLeft'] || 0;
    const browOuterUpR = b['browOuterUpRight'] || 0;
    const avgEyeWide = (eyeWideL + eyeWideR) * 0.5;
    const avgBrowOuterUp = (browOuterUpL + browOuterUpR) * 0.5;
    const rawTakut = avgEyeWide * 0.55 + avgBrowOuterUp * 0.25 + browInnerUp * 0.20;

    // 5. Sebal (Disgust / Contempt)
    // Primary: noseSneerLeft/Right; Secondary: mouthUpperUpLeft/Right
    const noseSneerL = b['noseSneerLeft'] || 0;
    const noseSneerR = b['noseSneerRight'] || 0;
    const mouthUpperUpL = b['mouthUpperUpLeft'] || 0;
    const mouthUpperUpR = b['mouthUpperUpRight'] || 0;
    const avgSneer = (noseSneerL + noseSneerR) * 0.5;
    const avgUpperUp = (mouthUpperUpL + mouthUpperUpR) * 0.5;
    const rawSebal = avgSneer * 0.60 + avgUpperUp * 0.40;

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

    // Responsive trigger threshold: 0.19 for instant reactive detection
    if (topCandidate[1] >= 0.19 && topCandidate[1] > rawNetral * 0.45) {
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
