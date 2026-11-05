import { FINAL_EXPRESSIONS } from '../../vision/classification/expressionMapping';
import { BoundingBox, DetectedFace, FinalExpression } from '../../vision/types';

export const BATTLE_CONFIG = {
  ROUND_TIME_SEC: 20,
  COUNTDOWN_SEC: 3,
  CONFIDENCE_THRESHOLD: 0.60,
  REQUIRED_CONSECUTIVE_FRAMES: 3,
};

/**
 * Pick 1 of the 6 official expressions randomly
 */
export function pickRandomExpression(exclude?: FinalExpression | null): FinalExpression {
  const choices = exclude
    ? FINAL_EXPRESSIONS.filter((e) => e !== exclude)
    : FINAL_EXPRESSIONS;
  const index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

/**
 * Checks which zone a face belongs to based on mirrored preview coordinates.
 * Left Zone (Player 1): center X < 0.5
 * Right Zone (Player 2): center X >= 0.5
 */
export function getFaceZone(box: BoundingBox, isMirrored: boolean = true): 1 | 2 {
  const centerX = box.x + box.width / 2;
  const visualCenterX = isMirrored ? 1 - centerX : centerX;
  return visualCenterX < 0.5 ? 1 : 2;
}

/**
 * Validates presence of faces in player zones:
 * Exactly 1 face per zone is required.
 */
export function countFacesInZones(faces: DetectedFace[], isMirrored: boolean = true): {
  p1Faces: DetectedFace[];
  p2Faces: DetectedFace[];
} {
  const p1Faces: DetectedFace[] = [];
  const p2Faces: DetectedFace[] = [];

  for (const face of faces) {
    if (face.status === 'active') {
      const zone = getFaceZone(face.box, isMirrored);
      if (zone === 1) {
        p1Faces.push(face);
      } else {
        p2Faces.push(face);
      }
    }
  }

  return { p1Faces, p2Faces };
}

/**
 * Evaluates whether a player's expression matches the target with confidence and multi-frame stability.
 */
export function evaluateExpressionMatch(
  detectedExpression: FinalExpression | null,
  confidence: number,
  targetExpression: FinalExpression | null,
  currentConsecutiveFrames: number,
  confidenceThreshold = BATTLE_CONFIG.CONFIDENCE_THRESHOLD,
  requiredFrames = BATTLE_CONFIG.REQUIRED_CONSECUTIVE_FRAMES
): {
  isMatched: boolean;
  newConsecutiveFrames: number;
} {
  if (!detectedExpression || !targetExpression) {
    return { isMatched: false, newConsecutiveFrames: 0 };
  }

  if (detectedExpression === targetExpression && confidence >= confidenceThreshold) {
    const updated = currentConsecutiveFrames + 1;
    return {
      isMatched: updated >= requiredFrames,
      newConsecutiveFrames: updated,
    };
  }

  return {
    isMatched: false,
    newConsecutiveFrames: 0,
  };
}
