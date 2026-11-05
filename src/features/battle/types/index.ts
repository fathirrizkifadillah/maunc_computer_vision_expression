import { FinalExpression } from '../../vision/types';

export type BattleStatus =
  | 'unregistered' // Players need to register
  | 'waiting_ready' // Registered, waiting for faces in zone
  | 'ready' // Both players ready to start
  | 'countdown' // 3, 2, 1, GO!
  | 'battling' // Round in progress
  | 'finished'; // Round ended with result

export type BattleResult = 'p1_won' | 'p2_won' | 'draw' | 'timeout' | null;

export interface PlayerState {
  id: 1 | 2;
  name: string;
  isRegistered: boolean;
  isFaceInZone: boolean;
  facesInZoneCount: number;
  isReady: boolean;
  currentExpression: FinalExpression | null;
  currentConfidence: number;
  matchConsecutiveFrames: number;
  score: number;
  result: 'won' | 'lost' | 'draw' | null;
}

export interface BattleState {
  status: BattleStatus;
  targetExpression: FinalExpression | null;
  countdownValue: number;
  timeRemainingSec: number;
  result: BattleResult;
  p1: PlayerState;
  p2: PlayerState;
}
