import { describe, it, expect, beforeEach } from 'vitest';
import { FaceTracker, calculateIoU, calculateCenterDistance } from '../FaceTracker';
import { BoundingBox } from '../../types';

describe('Face Tracker & IoU Matching', () => {
  let tracker: FaceTracker;

  beforeEach(() => {
    tracker = new FaceTracker({
      maxFaces: 3,
      iouThreshold: 0.25,
      centerDistThreshold: 0.35,
      gracePeriodFrames: 3, // short grace period for deterministic testing
    });
  });

  it('calculates IoU correctly for identical, overlapping, and disjoint boxes', () => {
    const boxA: BoundingBox = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
    const boxB: BoundingBox = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
    expect(calculateIoU(boxA, boxB)).toBeCloseTo(1.0);

    const disjoint: BoundingBox = { x: 0.6, y: 0.6, width: 0.2, height: 0.2 };
    expect(calculateIoU(boxA, disjoint)).toBe(0);

    const overlap: BoundingBox = { x: 0.2, y: 0.1, width: 0.2, height: 0.2 };
    // overlap width = 0.1, height = 0.2 -> interArea = 0.02, unionArea = 0.04 + 0.04 - 0.02 = 0.06 -> IoU = 1/3
    expect(calculateIoU(boxA, overlap)).toBeCloseTo(1 / 3);
  });

  it('calculates center distance correctly', () => {
    const b1: BoundingBox = { x: 0.0, y: 0.0, width: 0.2, height: 0.2 }; // center: (0.1, 0.1)
    const b2: BoundingBox = { x: 0.3, y: 0.4, width: 0.2, height: 0.2 }; // center: (0.4, 0.5)
    // dx = 0.3, dy = 0.4 -> dist = 0.5
    expect(calculateCenterDistance(b1, b2)).toBeCloseTo(0.5);
  });

  it('creates Face ID 01 when first face is detected', () => {
    const faces = tracker.update([{ box: { x: 0.2, y: 0.2, width: 0.2, height: 0.2 } }]);
    expect(faces).toHaveLength(1);
    expect(faces[0].faceId).toBe('Face ID 01');
    expect(faces[0].status).toBe('active');
  });

  it('maintains the same Face ID when the face moves across frames', () => {
    // Frame 1
    let faces = tracker.update([{ box: { x: 0.2, y: 0.2, width: 0.2, height: 0.2 } }]);
    expect(faces[0].faceId).toBe('Face ID 01');

    // Frame 2: face moved slightly to x: 0.22, y: 0.21
    faces = tracker.update([{ box: { x: 0.22, y: 0.21, width: 0.2, height: 0.2 } }]);
    expect(faces).toHaveLength(1);
    expect(faces[0].faceId).toBe('Face ID 01'); // Persistent ID preserved
    expect(faces[0].status).toBe('active');

    // Frame 3: face moved further to x: 0.25, y: 0.23
    faces = tracker.update([{ box: { x: 0.25, y: 0.23, width: 0.2, height: 0.2 } }]);
    expect(faces[0].faceId).toBe('Face ID 01');
  });

  it('assigns unique sequential Face IDs to multiple faces (up to max 3)', () => {
    const d1 = { box: { x: 0.1, y: 0.1, width: 0.15, height: 0.15 } };
    const d2 = { box: { x: 0.4, y: 0.1, width: 0.15, height: 0.15 } };
    const d3 = { box: { x: 0.7, y: 0.1, width: 0.15, height: 0.15 } };
    const d4 = { box: { x: 0.8, y: 0.5, width: 0.15, height: 0.15 } };

    // 4 detections passed, but only 3 must be accepted
    const faces = tracker.update([d1, d2, d3, d4]);
    expect(faces).toHaveLength(3);
    const ids = faces.map((f) => f.faceId);
    expect(ids).toContain('Face ID 01');
    expect(ids).toContain('Face ID 02');
    expect(ids).toContain('Face ID 03');
  });

  it('retains Face ID during grace period and only releases after grace expires', () => {
    // Frame 1: Face detected
    tracker.update([{ box: { x: 0.2, y: 0.2, width: 0.2, height: 0.2 } }]);

    // Frame 2: Face temporarily missing -> status becomes 'lost', but ID is kept
    let faces = tracker.update([]);
    expect(faces).toHaveLength(1);
    expect(faces[0].faceId).toBe('Face ID 01');
    expect(faces[0].status).toBe('lost');

    // Frame 3: Still within grace period
    faces = tracker.update([]);
    expect(faces).toHaveLength(1);
    expect(faces[0].status).toBe('lost');

    // Frame 4: Face reappears -> status returns to 'active'
    faces = tracker.update([{ box: { x: 0.21, y: 0.2, width: 0.2, height: 0.2 } }]);
    expect(faces).toHaveLength(1);
    expect(faces[0].faceId).toBe('Face ID 01');
    expect(faces[0].status).toBe('active');

    // Now let grace period expire: 4 empty frames (grace is 3)
    tracker.update([]);
    tracker.update([]);
    tracker.update([]);
    faces = tracker.update([]);
    expect(faces).toHaveLength(0); // Slot has been released!

    // Next new face re-uses the recycled slot Face ID 01
    faces = tracker.update([{ box: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 } }]);
    expect(faces).toHaveLength(1);
    expect(faces[0].faceId).toBe('Face ID 01');
  });
});
