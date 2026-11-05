import { describe, it, expect } from 'vitest';
import {
  pickRandomExpression,
  getFaceZone,
  countFacesInZones,
  evaluateExpressionMatch,
  BATTLE_CONFIG,
} from '../battleEngine';
import { FINAL_EXPRESSIONS } from '../../../vision/classification/expressionMapping';
import { DetectedFace } from '../../../vision/types';

describe('Battle Engine Logic', () => {
  describe('Random Target Expression Selection', () => {
    it('always selects one of the 6 official expressions', () => {
      for (let i = 0; i < 50; i++) {
        const picked = pickRandomExpression();
        expect(FINAL_EXPRESSIONS).toContain(picked);
      }
    });

    it('can optionally exclude previous target to prevent consecutive repetition', () => {
      const prev = 'senang';
      for (let i = 0; i < 30; i++) {
        const picked = pickRandomExpression(prev);
        expect(picked).not.toBe(prev);
        expect(FINAL_EXPRESSIONS).toContain(picked);
      }
    });
  });

  describe('Zone Partitioning & Player Face Counting', () => {
    it('correctly assigns faces to left zone (P1) or right zone (P2) with mirroring', () => {
      // In mirrored preview:
      // A face physically on left of camera (x: 0.2) appears on right of screen -> Zone 2
      // A face physically on right of camera (x: 0.8) appears on left of screen -> Zone 1
      const faceLeftCamera = { x: 0.2, y: 0.2, width: 0.2, height: 0.2 };
      expect(getFaceZone(faceLeftCamera, true)).toBe(2);

      const faceRightCamera = { x: 0.7, y: 0.2, width: 0.2, height: 0.2 };
      expect(getFaceZone(faceRightCamera, true)).toBe(1);
    });

    it('enforces exactly 1 face per player zone', () => {
      const f1: DetectedFace = {
        trackId: 1,
        faceId: 'Face ID 01',
        box: { x: 0.8, y: 0.2, width: 0.1, height: 0.1 }, // Zone 1
        expression: 'senang',
        expressionLabel: 'Senang',
        rawModelLabel: 'happy',
        confidence: 0.9,
        status: 'active',
        missingFrames: 0,
        lastSeen: Date.now(),
      };

      const f2: DetectedFace = {
        trackId: 2,
        faceId: 'Face ID 02',
        box: { x: 0.1, y: 0.2, width: 0.1, height: 0.1 }, // Zone 2
        expression: 'senang',
        expressionLabel: 'Senang',
        rawModelLabel: 'happy',
        confidence: 0.9,
        status: 'active',
        missingFrames: 0,
        lastSeen: Date.now(),
      };

      const { p1Faces, p2Faces } = countFacesInZones([f1, f2], true);
      expect(p1Faces).toHaveLength(1);
      expect(p2Faces).toHaveLength(1);
    });

    it('detects multiple faces in same zone', () => {
      const f1: DetectedFace = {
        trackId: 1,
        faceId: 'Face ID 01',
        box: { x: 0.7, y: 0.2, width: 0.1, height: 0.1 }, // Zone 1
        expression: 'senang',
        expressionLabel: 'Senang',
        rawModelLabel: '',
        confidence: 0.9,
        status: 'active',
        missingFrames: 0,
        lastSeen: Date.now(),
      };
      const f2: DetectedFace = {
        trackId: 2,
        faceId: 'Face ID 02',
        box: { x: 0.8, y: 0.2, width: 0.1, height: 0.1 }, // Zone 1
        expression: 'senang',
        expressionLabel: 'Senang',
        rawModelLabel: '',
        confidence: 0.9,
        status: 'active',
        missingFrames: 0,
        lastSeen: Date.now(),
      };

      const { p1Faces, p2Faces } = countFacesInZones([f1, f2], true);
      expect(p1Faces).toHaveLength(2); // Two faces in Zone 1!
      expect(p2Faces).toHaveLength(0);
    });
  });

  describe('Expression Matching & Multi-Frame Stability Validation', () => {
    const target = 'marah';

    it('fails if detected expression differs from target', () => {
      const res = evaluateExpressionMatch('senang', 0.95, target, 0);
      expect(res.isMatched).toBe(false);
      expect(res.newConsecutiveFrames).toBe(0);
    });

    it('fails if confidence is below threshold', () => {
      const res = evaluateExpressionMatch('marah', 0.45, target, 0, BATTLE_CONFIG.CONFIDENCE_THRESHOLD);
      expect(res.isMatched).toBe(false);
      expect(res.newConsecutiveFrames).toBe(0);
    });

    it('accumulates consecutive frames when matching and only triggers win when threshold reached', () => {
      // Frame 1: matched, count becomes 1 (required: 3)
      let res = evaluateExpressionMatch('marah', 0.85, target, 0, 0.60, 3);
      expect(res.isMatched).toBe(false);
      expect(res.newConsecutiveFrames).toBe(1);

      // Frame 2: matched, count becomes 2
      res = evaluateExpressionMatch('marah', 0.85, target, res.newConsecutiveFrames, 0.60, 3);
      expect(res.isMatched).toBe(false);
      expect(res.newConsecutiveFrames).toBe(2);

      // Frame 3: matched, count becomes 3 -> WINNER criteria fulfilled!
      res = evaluateExpressionMatch('marah', 0.85, target, res.newConsecutiveFrames, 0.60, 3);
      expect(res.isMatched).toBe(true);
      expect(res.newConsecutiveFrames).toBe(3);
    });

    it('resets consecutive frames if player expression flickers or drops', () => {
      // 2 valid frames accumulated
      let res = evaluateExpressionMatch('marah', 0.85, target, 2, 0.60, 3);
      expect(res.newConsecutiveFrames).toBe(3);

      // Next frame: player turned neutral -> resets to 0
      res = evaluateExpressionMatch('netral', 0.90, target, 2, 0.60, 3);
      expect(res.isMatched).toBe(false);
      expect(res.newConsecutiveFrames).toBe(0);
    });
  });
});
