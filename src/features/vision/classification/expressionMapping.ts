import { FinalExpression, ExpressionConfig } from '../types';

/**
 * The 6 Official MAUNC Mascot Expressions
 */
export const FINAL_EXPRESSIONS: readonly FinalExpression[] = [
  'senang',
  'marah',
  'sedih',
  'takut',
  'sebal',
  'netral',
] as const;

export const EXPRESSION_CONFIGS: Record<FinalExpression, ExpressionConfig> = {
  senang: {
    id: 'senang',
    label: 'Senang',
    assetPath: '/assets/expressions/senang.png',
    description: 'Ekspresi gembira dan tersenyum lebar',
  },
  marah: {
    id: 'marah',
    label: 'Marah',
    assetPath: '/assets/expressions/marah.png',
    description: 'Ekspresi garang dengan taring dan tatapan tajam',
  },
  sedih: {
    id: 'sedih',
    label: 'Sedih',
    assetPath: '/assets/expressions/sedih.png',
    description: 'Ekspresi murung dengan tetesan air mata',
  },
  takut: {
    id: 'takut',
    label: 'Takut',
    assetPath: '/assets/expressions/takut.png',
    description: 'Ekspresi panik terkejut dengan keringat dingin',
  },
  sebal: {
    id: 'sebal',
    label: 'Sebal',
    assetPath: '/assets/expressions/sebal.png',
    description: 'Ekspresi kesal dengan bibir menggerutu',
  },
  netral: {
    id: 'netral',
    label: 'Netral',
    assetPath: '/assets/expressions/netral.png',
    description: 'Ekspresi tenang dan siaga',
  },
};

/**
 * Direct FER2013 label index mapping from ViT model:
 * 0: Angry
 * 1: Disgust
 * 2: Fear
 * 3: Happy
 * 4: Sad
 * 5: Surprise (Ignored / not in final 6)
 * 6: Neutral
 */
const FER2013_LABEL_MAP: Record<string, FinalExpression | null> = {
  label_0: 'marah',
  label_1: 'sebal',
  label_2: 'takut',
  label_3: 'senang',
  label_4: 'sedih',
  label_5: null, // Surprise is excluded by specification
  label_6: 'netral',

  // Natural language aliases
  angry: 'marah',
  anger: 'marah',
  marah: 'marah',

  disgust: 'sebal',
  disgusted: 'sebal',
  kesal: 'sebal',
  sebal: 'sebal',

  fear: 'takut',
  fearful: 'takut',
  scared: 'takut',
  takut: 'takut',

  happy: 'senang',
  happiness: 'senang',
  joy: 'senang',
  senang: 'senang',

  sad: 'sedih',
  sadness: 'sedih',
  sedih: 'sedih',

  neutral: 'netral',
  netral: 'netral',

  surprise: null,
  surprised: null,
};

/**
 * Centralized mapping from raw model output to final Indonesian category.
 */
export function mapModelToFinalExpression(rawLabel: string): FinalExpression | null {
  if (!rawLabel) return null;

  const normalized = rawLabel.trim().toLowerCase();

  if (normalized in FER2013_LABEL_MAP) {
    return FER2013_LABEL_MAP[normalized];
  }

  // Fallback checks
  if (normalized.includes('happy') || normalized.includes('senang') || normalized.includes('joy')) {
    return 'senang';
  }
  if (normalized.includes('angry') || normalized.includes('marah') || normalized.includes('anger')) {
    return 'marah';
  }
  if (normalized.includes('sad') || normalized.includes('sedih') || normalized.includes('sorrow')) {
    return 'sedih';
  }
  if (normalized.includes('fear') || normalized.includes('takut') || normalized.includes('scared')) {
    return 'takut';
  }
  if (
    normalized.includes('disgust') ||
    normalized.includes('sebal') ||
    normalized.includes('kesal') ||
    normalized.includes('contempt')
  ) {
    return 'sebal';
  }
  if (normalized.includes('neutral') || normalized.includes('netral')) {
    return 'netral';
  }

  return null;
}

/**
 * Returns human-readable Indonesian label for UI display.
 */
export function getExpressionDisplayName(expression: FinalExpression | null, rawLabel?: string): string {
  if (expression && EXPRESSION_CONFIGS[expression]) {
    return EXPRESSION_CONFIGS[expression].label;
  }

  const norm = rawLabel?.toLowerCase() || '';
  if (norm.includes('label_5') || norm.includes('surprise')) {
    return 'Belum Dikenali';
  }

  return 'Menganalisis';
}

/**
 * Get config or fallback to neutral
 */
export function getExpressionConfig(expression: FinalExpression | null): ExpressionConfig {
  if (expression && EXPRESSION_CONFIGS[expression]) {
    return EXPRESSION_CONFIGS[expression];
  }
  return EXPRESSION_CONFIGS['netral'];
}
