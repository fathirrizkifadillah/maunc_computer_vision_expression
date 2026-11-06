import { BoundingBox, DetectedFace } from '../types';

export interface RawDetection {
  box: BoundingBox;
  blendshapes?: Record<string, number>;
}

export interface TrackerOptions {
  maxFaces?: number;
  iouThreshold?: number;
  centerDistThreshold?: number;
  gracePeriodFrames?: number;
}

/**
 * Calculates Intersection over Union (IoU) between two bounding boxes.
 */
export function calculateIoU(a: BoundingBox, b: BoundingBox): number {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;

  const interX1 = Math.max(a.x, b.x);
  const interY1 = Math.max(a.y, b.y);
  const interX2 = Math.min(ax2, bx2);
  const interY2 = Math.min(ay2, by2);

  const interWidth = Math.max(0, interX2 - interX1);
  const interHeight = Math.max(0, interY2 - interY1);
  const interArea = interWidth * interHeight;

  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const unionArea = areaA + areaB - interArea;

  if (unionArea <= 0) return 0;
  return interArea / unionArea;
}

/**
 * Calculates Euclidean distance between centroids of two boxes (normalized 0-1).
 */
export function calculateCenterDistance(a: BoundingBox, b: BoundingBox): number {
  const cAx = a.x + a.width / 2;
  const cAy = a.y + a.height / 2;
  const cBx = b.x + b.width / 2;
  const cBy = b.y + b.height / 2;

  const dx = cAx - cBx;
  const dy = cAy - cBy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Robust Face Tracker maintaining stable Face IDs across frames.
 * - Prevents Face ID flipping
 * - Grace period for occlusions / fast movement
 * - Max 3 faces capacity
 */
export class FaceTracker {
  private activeTracks: Map<number, DetectedFace> = new Map();
  private availableSlots: number[] = [1, 2, 3];
  private nextTrackId = 1;

  private readonly maxFaces: number;
  private readonly iouThreshold: number;
  private readonly centerDistThreshold: number;
  private readonly gracePeriodFrames: number;

  constructor(options: TrackerOptions = {}) {
    this.maxFaces = options.maxFaces ?? 3;
    this.iouThreshold = options.iouThreshold ?? 0.25;
    this.centerDistThreshold = options.centerDistThreshold ?? 0.35;
    this.gracePeriodFrames = options.gracePeriodFrames ?? 18; // ~1-2 seconds at 15-20fps
  }

  public update(detections: RawDetection[], timestamp: number = Date.now()): DetectedFace[] {
    // 1. Limit raw detections to max capacity (first 3)
    const validDetections = detections.slice(0, this.maxFaces);

    const currentTrackIds = Array.from(this.activeTracks.keys());
    const matchedTrackIds = new Set<number>();
    const matchedDetectionIndices = new Set<number>();

    // 2. Perform greedy matching based on IoU and center distance
    for (const trackId of currentTrackIds) {
      const track = this.activeTracks.get(trackId)!;
      let bestMatchIndex = -1;
      let bestScore = -1;

      for (let i = 0; i < validDetections.length; i++) {
        if (matchedDetectionIndices.has(i)) continue;

        const detBox = validDetections[i].box;
        const iou = calculateIoU(track.box, detBox);
        const dist = calculateCenterDistance(track.box, detBox);

        // Combined score: IoU + proximity weight
        if (iou >= this.iouThreshold || dist <= this.centerDistThreshold) {
          const proximityScore = Math.max(0, 1 - dist);
          const score = iou * 0.6 + proximityScore * 0.4;
          if (score > bestScore) {
            bestScore = score;
            bestMatchIndex = i;
          }
        }
      }

      if (bestMatchIndex !== -1) {
        matchedTrackIds.add(trackId);
        matchedDetectionIndices.add(bestMatchIndex);

        const det = validDetections[bestMatchIndex];
        // Smooth bounding box transition to avoid jitter
        track.box = {
          x: track.box.x * 0.3 + det.box.x * 0.7,
          y: track.box.y * 0.3 + det.box.y * 0.7,
          width: track.box.width * 0.3 + det.box.width * 0.7,
          height: track.box.height * 0.3 + det.box.height * 0.7,
        };
        track.blendshapes = det.blendshapes;
        track.status = 'active';
        track.missingFrames = 0;
        track.lastSeen = timestamp;
      } else {
        // Track was not matched in this frame
        track.missingFrames++;
        if (track.missingFrames <= this.gracePeriodFrames) {
          track.status = 'lost';
        } else {
          // Grace period expired, release slot
          this.releaseSlot(track);
          this.activeTracks.delete(trackId);
        }
      }
    }

    // 3. For unmatched detections, create new tracks if capacity allows
    for (let i = 0; i < validDetections.length; i++) {
      if (matchedDetectionIndices.has(i)) continue;

      if (this.activeTracks.size < this.maxFaces && this.availableSlots.length > 0) {
        const slot = this.availableSlots.shift()!;
        const trackId = this.nextTrackId++;

        const newTrack: DetectedFace = {
          trackId,
          faceId: `Face ID 0${slot}`,
          box: { ...validDetections[i].box },
          blendshapes: validDetections[i].blendshapes,
          expression: 'netral',
          expressionLabel: 'Menganalisis',
          rawModelLabel: '',
          confidence: 0,
          status: 'active',
          missingFrames: 0,
          lastSeen: timestamp,
        };

        this.activeTracks.set(trackId, newTrack);
      }
    }

    return Array.from(this.activeTracks.values());
  }

  private releaseSlot(track: DetectedFace) {
    const slotMatch = track.faceId.match(/\d+/);
    if (slotMatch) {
      const slotNum = parseInt(slotMatch[0], 10);
      if (!this.availableSlots.includes(slotNum)) {
        this.availableSlots.push(slotNum);
        this.availableSlots.sort((a, b) => a - b);
      }
    }
  }

  public updateExpression(
    trackId: number,
    expression: DetectedFace['expression'],
    label: string,
    rawModelLabel: string,
    confidence: number
  ) {
    const track = this.activeTracks.get(trackId);
    if (track) {
      track.expression = expression;
      track.expressionLabel = label;
      track.rawModelLabel = rawModelLabel;
      // Exponential moving average for confidence score
      track.confidence = track.confidence === 0 ? confidence : track.confidence * 0.2 + confidence * 0.8;
    }
  }

  public getActiveFaces(): DetectedFace[] {
    return Array.from(this.activeTracks.values());
  }

  public reset() {
    this.activeTracks.clear();
    this.availableSlots = [1, 2, 3];
    this.nextTrackId = 1;
  }
}
