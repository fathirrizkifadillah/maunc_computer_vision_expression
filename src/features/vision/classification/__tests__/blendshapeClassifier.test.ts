import { describe, it, expect } from 'vitest';
import { BlendshapeClassifierService } from '../BlendshapeClassifier';

describe('BlendshapeClassifierService', () => {
  it('detects Senang (Happy) when smile blendshapes are dominant', () => {
    const blendshapes = {
      mouthSmileLeft: 0.78,
      mouthSmileRight: 0.82,
      cheekSquintLeft: 0.65,
      cheekSquintRight: 0.68,
      browDownLeft: 0.05,
      browDownRight: 0.05,
    };
    const result = BlendshapeClassifierService.classify(blendshapes, 1);
    expect(result.expression).toBe('senang');
    expect(result.label).toBe('Senang');
    expect(result.confidence).toBeGreaterThan(0.75);
  });

  it('detects Marah (Angry) when brow down and frown are dominant', () => {
    const blendshapes = {
      browDownLeft: 0.85,
      browDownRight: 0.88,
      mouthFrownLeft: 0.45,
      mouthFrownRight: 0.48,
      jawClench: 0.35,
      mouthSmileLeft: 0.01,
      mouthSmileRight: 0.01,
    };
    const result = BlendshapeClassifierService.classify(blendshapes, 2);
    expect(result.expression).toBe('marah');
    expect(result.label).toBe('Marah');
    expect(result.confidence).toBeGreaterThan(0.75);
  });

  it('detects Sedih (Sad) when mouth frown and brow inner up are dominant', () => {
    const blendshapes = {
      mouthFrownLeft: 0.72,
      mouthFrownRight: 0.75,
      browInnerUp: 0.68,
      mouthPressLeft: 0.40,
      mouthPressRight: 0.42,
      mouthSmileLeft: 0.0,
      mouthSmileRight: 0.0,
    };
    const result = BlendshapeClassifierService.classify(blendshapes, 3);
    expect(result.expression).toBe('sedih');
    expect(result.label).toBe('Sedih');
    expect(result.confidence).toBeGreaterThan(0.70);
  });

  it('detects Takut (Fear) when eye wide and brow outer up are dominant', () => {
    const blendshapes = {
      eyeWideLeft: 0.82,
      eyeWideRight: 0.85,
      browOuterUpLeft: 0.65,
      browOuterUpRight: 0.68,
      mouthSmileLeft: 0.05,
      mouthSmileRight: 0.05,
    };
    const result = BlendshapeClassifierService.classify(blendshapes, 4);
    expect(result.expression).toBe('takut');
    expect(result.label).toBe('Takut');
    expect(result.confidence).toBeGreaterThan(0.75);
  });

  it('detects Sebal (Disgust) when nose sneer and mouth upper up are dominant', () => {
    const blendshapes = {
      noseSneerLeft: 0.80,
      noseSneerRight: 0.82,
      mouthUpperUpLeft: 0.65,
      mouthUpperUpRight: 0.68,
      mouthSmileLeft: 0.02,
      mouthSmileRight: 0.02,
    };
    const result = BlendshapeClassifierService.classify(blendshapes, 5);
    expect(result.expression).toBe('sebal');
    expect(result.label).toBe('Sebal');
    expect(result.confidence).toBeGreaterThan(0.75);
  });

  it('detects Netral (Neutral) when face is relaxed with low emotional activation', () => {
    const blendshapes = {
      mouthSmileLeft: 0.05,
      mouthSmileRight: 0.05,
      browDownLeft: 0.08,
      browDownRight: 0.08,
      mouthFrownLeft: 0.06,
      mouthFrownRight: 0.06,
      eyeWideLeft: 0.04,
      eyeWideRight: 0.04,
      noseSneerLeft: 0.05,
      noseSneerRight: 0.05,
    };
    const result = BlendshapeClassifierService.classify(blendshapes, 6);
    expect(result.expression).toBe('netral');
    expect(result.label).toBe('Netral');
    expect(result.confidence).toBeGreaterThanOrEqual(0.65);
  });

  it('detects Sedih on realistic subtle pouting / mouth frown + chin shrug', () => {
    const blendshapes = {
      mouthFrownLeft: 0.28,
      mouthFrownRight: 0.26,
      mouthShrugLower: 0.25,
      browInnerUp: 0.24,
      browDownLeft: 0.02,
      browDownRight: 0.02,
    };
    const result = BlendshapeClassifierService.classify(blendshapes, 7);
    expect(result.expression).toBe('sedih');
    expect(result.label).toBe('Sedih');
    expect(result.confidence).toBeGreaterThanOrEqual(0.70);
  });

  it('detects Takut on realistic wide eyes with slight parted jaw / gasp', () => {
    const blendshapes = {
      eyeWideLeft: 0.32,
      eyeWideRight: 0.30,
      jawOpen: 0.25,
      browOuterUpLeft: 0.22,
      browOuterUpRight: 0.22,
    };
    const result = BlendshapeClassifierService.classify(blendshapes, 8);
    expect(result.expression).toBe('takut');
    expect(result.label).toBe('Takut');
    expect(result.confidence).toBeGreaterThanOrEqual(0.70);
  });

  it('detects Sebal on realistic upper lip curling / asymmetric sneer', () => {
    const blendshapes = {
      noseSneerLeft: 0.24,
      mouthUpperUpLeft: 0.28,
      mouthUpperUpRight: 0.08,
    };
    const result = BlendshapeClassifierService.classify(blendshapes, 9);
    expect(result.expression).toBe('sebal');
    expect(result.label).toBe('Sebal');
    expect(result.confidence).toBeGreaterThanOrEqual(0.70);
  });

  it('detects Sedih on pure mouth cemberut without inner brow raising', () => {
    const blendshapes = {
      mouthFrownLeft: 0.32,
      mouthFrownRight: 0.32,
      mouthPressLeft: 0.25,
      mouthPressRight: 0.25,
      jawOpen: 0.02,
      browInnerUp: 0.0,
      browDownLeft: 0.05,
      browDownRight: 0.05,
    };
    const result = BlendshapeClassifierService.classify(blendshapes, 10);
    expect(result.expression).toBe('sedih');
    expect(result.label).toBe('Sedih');
    expect(result.confidence).toBeGreaterThanOrEqual(0.70);
  });

  it('does NOT misclassify sticking tongue out / melet (open jaw) as sedih', () => {
    const blendshapes = {
      jawOpen: 0.55,
      mouthLowerDownLeft: 0.70,
      mouthLowerDownRight: 0.70,
      mouthFrownLeft: 0.05,
      mouthFrownRight: 0.05,
      browInnerUp: 0.05,
    };
    const result = BlendshapeClassifierService.classify(blendshapes, 11);
    expect(result.expression).not.toBe('sedih');
  });
});
