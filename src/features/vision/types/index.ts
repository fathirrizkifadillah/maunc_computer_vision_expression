/**
 * MAUNC AI - Vision and Expression Types
 */

export type ModelExpression = 'happy' | 'angry' | 'sad' | 'fear' | 'disgust' | 'neutral' | 'surprise';

export type FinalExpression = 'senang' | 'marah' | 'sedih' | 'takut' | 'sebal' | 'netral';

export type TrackingStatus = 'active' | 'lost' | 'analyzing';

export interface BoundingBox {
  x: number; // 0 to 1 relative to video width
  y: number; // 0 to 1 relative to video height
  width: number; // 0 to 1
  height: number; // 0 to 1
}

export interface DetectedFace {
  /** Internal tracking unique ID */
  trackId: number;
  /** UI display label, e.g., 'Face ID 01' */
  faceId: string;
  /** Normalized bounding box [0, 1] */
  box: BoundingBox;
  /** Predicted final expression */
  expression: FinalExpression | null;
  /** Indonesian label for display */
  expressionLabel: string;
  /** Raw model prediction string */
  rawModelLabel: string;
  /** Confidence score between 0 and 1 */
  confidence: number;
  /** Current tracking status */
  status: TrackingStatus;
  /** Number of frames this face has been missing */
  missingFrames: number;
  /** Timestamp of last active frame */
  lastSeen: number;
  /** Facial action unit blendshapes */
  blendshapes?: Record<string, number>;
}

export interface ExpressionConfig {
  id: FinalExpression;
  label: string; // Indonesian display label
  assetPath: string; // Image path
  description: string;
}

export interface ExpressionPrediction {
  label: string;
  score: number;
}

export interface VisionPipelineStatus {
  isCameraReady: boolean;
  isDetectorReady: boolean;
  isClassifierReady: boolean;
  activeFacesCount: number;
  isMaxCapacityReached: boolean;
  error: string | null;
}
