export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface AIVibe {
  quote: string;
  mood: string;
}

export interface ObstacleData {
  id: string;
  x: number;
  z: number;
  type: 'pyramid' | 'pillar' | 'block';
  color: string;
}

export const LANE_WIDTH = 3;
export const MAX_LANES = 3; // -1, 0, 1 (Left, Center, Right)
export const WORLD_SPEED_BASE = 40;
export const SPAWN_INTERVAL_BASE = 1.5;