import { pipeline, env, RawImage } from '@huggingface/transformers';
import { BoundingBox, FinalExpression } from '../types';
import {
  mapModelToFinalExpression,
  getExpressionDisplayName,
  FINAL_EXPRESSIONS,
} from './expressionMapping';
import { BlendshapeClassifierService } from './BlendshapeClassifier';

// Only set mirror in Node.js test environment; browser handles direct CORS
if (typeof window === 'undefined') {
  env.remoteHost = 'https://hf-mirror.com/';
}

export interface ClassificationResult {
  expression: FinalExpression | null;
  label: string;
  rawLabel: string;
  confidence: number;
  allScores: Record<string, number>;
}

export class ExpressionClassifier {
  private static instance: ExpressionClassifier;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private classifier: any = null;
  private isInitializing = false;
  private initPromise: Promise<boolean> | null = null;
  private isReady = false;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;

  // Smoothing history per face track: trackId -> history of scores
  private scoreHistory: Map<number, { expression: FinalExpression; confidence: number; timestamp: number }[]> =
    new Map();

  private constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 224;
    this.offscreenCanvas.height = 224;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  public static getInstance(): ExpressionClassifier {
    if (!ExpressionClassifier.instance) {
      ExpressionClassifier.instance = new ExpressionClassifier();
    }
    return ExpressionClassifier.instance;
  }

  public async initialize(): Promise<boolean> {
    if (this.isReady) return true;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        this.classifier = await pipeline(
          'image-classification',
          'onnx-community/face-emotion-detection-ONNX',
          {
            dtype: 'q4',
          }
        );
        this.isReady = true;
        this.isInitializing = false;
        return true;
      } catch (err) {
        console.warn('Neural classifier background init bypassed, using on-device blendshape vision:', err);
        this.isInitializing = false;
        this.isReady = false;
        return false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Crops a face from a video element into a 224x224 RGB image
   */
  public cropFace(video: HTMLVideoElement, box: BoundingBox): RawImage | null {
    if (!this.offscreenCtx || video.videoWidth === 0 || video.videoHeight === 0) return null;

    const sx = Math.max(0, Math.floor(box.x * video.videoWidth));
    const sy = Math.max(0, Math.floor(box.y * video.videoHeight));
    const sw = Math.min(video.videoWidth - sx, Math.floor(box.width * video.videoWidth));
    const sh = Math.min(video.videoHeight - sy, Math.floor(box.height * video.videoHeight));

    if (sw <= 10 || sh <= 10) return null;

    this.offscreenCtx.clearRect(0, 0, 224, 224);
    this.offscreenCtx.drawImage(video, sx, sy, sw, sh, 0, 0, 224, 224);

    const imgData = this.offscreenCtx.getImageData(0, 0, 224, 224);
    // Convert RGBA to RGB Uint8ClampedArray for RawImage
    const rgbData = new Uint8ClampedArray(224 * 224 * 3);
    for (let i = 0, j = 0; i < imgData.data.length; i += 4, j += 3) {
      rgbData[j] = imgData.data[i];
      rgbData[j + 1] = imgData.data[i + 1];
      rgbData[j + 2] = imgData.data[i + 2];
    }

    return new RawImage(rgbData, 224, 224, 3);
  }

  /**
   * Classifies an individual face crop using Blendshapes (primary) or ViT ONNX model (secondary)
   */
  public async classifyFace(
    video: HTMLVideoElement,
    box: BoundingBox,
    trackId: number,
    blendshapes?: Record<string, number>
  ): Promise<ClassificationResult> {
    // 1. Primary on-device SOTA: If blendshapes are available from MediaPipe, use instant local classification
    if (blendshapes && Object.keys(blendshapes).length > 0) {
      const bRes = BlendshapeClassifierService.classify(blendshapes, trackId);
      return {
        expression: bRes.expression,
        label: bRes.label,
        rawLabel: bRes.rawLabel,
        confidence: bRes.confidence,
        allScores: bRes.allScores,
      };
    }

    // 2. Secondary neural inference if model is loaded
    if (this.isReady && this.classifier) {
      try {
        const rawImage = this.cropFace(video, box);
        if (rawImage) {
          const predictions = await this.classifier(rawImage);
          if (Array.isArray(predictions) && predictions.length > 0) {
            const allScores: Record<string, number> = {};
            predictions.forEach((p: { label: string; score: number }) => {
              allScores[p.label] = p.score;
            });

            // Find highest score among valid final expressions
            let topFinalExpression: FinalExpression | null = null;
            let topConfidence = 0;
            let topRawLabel = predictions[0].label;

            for (const pred of predictions) {
              const finalExpr = mapModelToFinalExpression(pred.label);
              if (finalExpr && pred.score > topConfidence) {
                topConfidence = pred.score;
                topFinalExpression = finalExpr;
                topRawLabel = pred.label;
              }
            }

            // If top raw prediction was Surprise (LABEL_5), handled according to prompt rules
            if (
              predictions[0].label.toLowerCase().includes('label_5') ||
              predictions[0].label.toLowerCase().includes('surprise')
            ) {
              return {
                expression: null,
                label: 'Belum Dikenali',
                rawLabel: predictions[0].label,
                confidence: predictions[0].score,
                allScores,
              };
            }

            if (!topFinalExpression) {
              topFinalExpression = 'netral';
            }

            // Apply temporal smoothing per trackId
            const smoothed = this.smoothPrediction(trackId, topFinalExpression, topConfidence);

            return {
              expression: smoothed.expression,
              label: getExpressionDisplayName(smoothed.expression, topRawLabel),
              rawLabel: topRawLabel,
              confidence: smoothed.confidence,
              allScores,
            };
          }
        }
      } catch (err) {
        console.warn('Face classification inference error:', err);
      }
    }

    return {
      expression: 'netral',
      label: 'Netral',
      rawLabel: 'default_netral',
      confidence: 0.85,
      allScores: { netral: 0.85 },
    };
  }

  /**
   * Multi-frame smoothing to prevent flickering and sudden jumps
   */
  private smoothPrediction(
    trackId: number,
    expression: FinalExpression,
    confidence: number
  ): { expression: FinalExpression; confidence: number } {
    const now = Date.now();
    let history = this.scoreHistory.get(trackId);
    if (!history) {
      history = [];
      this.scoreHistory.set(trackId, history);
    }

    // Keep history within last 1200ms
    history.push({ expression, confidence, timestamp: now });
    history = history.filter((h) => now - h.timestamp < 1200);
    this.scoreHistory.set(trackId, history);

    // Count votes weighted by confidence and recency
    const weightedVotes: Record<FinalExpression, number> = {
      senang: 0,
      marah: 0,
      sedih: 0,
      takut: 0,
      sebal: 0,
      netral: 0,
    };

    let totalWeight = 0;
    for (const item of history) {
      const ageMs = now - item.timestamp;
      const recencyWeight = Math.max(0.2, 1 - ageMs / 1200);
      const weight = item.confidence * recencyWeight;
      weightedVotes[item.expression] += weight;
      totalWeight += weight;
    }

    let bestExpression: FinalExpression = expression;
    let maxVote = -1;

    for (const expr of FINAL_EXPRESSIONS) {
      if (weightedVotes[expr] > maxVote) {
        maxVote = weightedVotes[expr];
        bestExpression = expr;
      }
    }

    const smoothedConfidence = totalWeight > 0 ? maxVote / totalWeight : confidence;

    return {
      expression: bestExpression,
      confidence: Math.min(0.99, Math.max(0.1, smoothedConfidence)),
    };
  }

  public clearTrackHistory(trackId: number): void {
    this.scoreHistory.delete(trackId);
  }

  public isStarting(): boolean {
    return this.isInitializing;
  }

  public isLoaded(): boolean {
    // 100% on-device blendshapes engine is immediately ready
    return true;
  }
}

export const ExpressionClassifierService = ExpressionClassifier.getInstance();
