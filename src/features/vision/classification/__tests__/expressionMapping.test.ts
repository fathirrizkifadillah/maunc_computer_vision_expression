import { describe, it, expect } from 'vitest';
import {
  FINAL_EXPRESSIONS,
  mapModelToFinalExpression,
  getExpressionDisplayName,
  getExpressionConfig,
} from '../expressionMapping';

describe('Expression Mapping Module', () => {
  it('should only contain the 6 official MAUNC expressions', () => {
    expect(FINAL_EXPRESSIONS).toHaveLength(6);
    expect(FINAL_EXPRESSIONS).toEqual(['senang', 'marah', 'sedih', 'takut', 'sebal', 'netral']);
  });

  it('should correctly map raw model and english labels to final indonesian expressions', () => {
    expect(mapModelToFinalExpression('happy')).toBe('senang');
    expect(mapModelToFinalExpression('Happy')).toBe('senang');
    expect(mapModelToFinalExpression('LABEL_3')).toBe('senang');

    expect(mapModelToFinalExpression('angry')).toBe('marah');
    expect(mapModelToFinalExpression('Angry')).toBe('marah');
    expect(mapModelToFinalExpression('LABEL_0')).toBe('marah');

    expect(mapModelToFinalExpression('sad')).toBe('sedih');
    expect(mapModelToFinalExpression('Sad')).toBe('sedih');
    expect(mapModelToFinalExpression('LABEL_4')).toBe('sedih');

    expect(mapModelToFinalExpression('fear')).toBe('takut');
    expect(mapModelToFinalExpression('Fear')).toBe('takut');
    expect(mapModelToFinalExpression('LABEL_2')).toBe('takut');

    expect(mapModelToFinalExpression('disgust')).toBe('sebal');
    expect(mapModelToFinalExpression('Disgust')).toBe('sebal');
    expect(mapModelToFinalExpression('LABEL_1')).toBe('sebal');
    expect(mapModelToFinalExpression('kesal')).toBe('sebal');

    expect(mapModelToFinalExpression('neutral')).toBe('netral');
    expect(mapModelToFinalExpression('Neutral')).toBe('netral');
    expect(mapModelToFinalExpression('LABEL_6')).toBe('netral');
  });

  it('should NOT map Surprise or other non-standard expressions to valid categories', () => {
    // Specification: Surprise is not included in the 6 expressions
    expect(mapModelToFinalExpression('surprise')).toBeNull();
    expect(mapModelToFinalExpression('Surprise')).toBeNull();
    expect(mapModelToFinalExpression('LABEL_5')).toBeNull();
    expect(mapModelToFinalExpression('laughing')).toBeNull();
    expect(mapModelToFinalExpression('confused')).toBeNull();
    expect(mapModelToFinalExpression('bored')).toBeNull();
    expect(mapModelToFinalExpression('random_unknown')).toBeNull();
    expect(mapModelToFinalExpression('')).toBeNull();
  });

  it('should return correct human-readable Indonesian display names', () => {
    expect(getExpressionDisplayName('senang')).toBe('Senang');
    expect(getExpressionDisplayName('marah')).toBe('Marah');
    expect(getExpressionDisplayName('sedih')).toBe('Sedih');
    expect(getExpressionDisplayName('takut')).toBe('Takut');
    expect(getExpressionDisplayName('sebal')).toBe('Sebal');
    expect(getExpressionDisplayName('netral')).toBe('Netral');

    // Handling surprise / unknown
    expect(getExpressionDisplayName(null, 'LABEL_5')).toBe('Belum Dikenali');
    expect(getExpressionDisplayName(null, 'surprise')).toBe('Belum Dikenali');
    expect(getExpressionDisplayName(null)).toBe('Menganalisis');
  });

  it('should map config with official asset paths', () => {
    const senangConfig = getExpressionConfig('senang');
    expect(senangConfig.assetPath).toBe('/assets/expressions/senang.png');
    expect(senangConfig.label).toBe('Senang');

    const sebalConfig = getExpressionConfig('sebal');
    expect(sebalConfig.assetPath).toBe('/assets/expressions/sebal.png');
    expect(sebalConfig.label).toBe('Sebal');
  });
});
