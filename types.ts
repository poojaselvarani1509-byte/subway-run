
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export enum PowerUpType {
  NONE = 'NONE',
  HOVERBOARD = 'HOVERBOARD',
  JETPACK = 'JETPACK',
  SNEAKERS = 'SNEAKERS',
  MAGNET = 'MAGNET'
}

export interface ObstacleData {
  id: string;
  type: 'TRAIN' | 'BARRIER' | 'SCAFFOLD' | 'MOVING_TRAIN';
  lane: number; // -1, 0, 1
  z: number;
}

export interface CoinData {
  id: string;
  lane: number;
  z: number;
}

export interface PowerUpData {
  id: string;
  type: PowerUpType;
  lane: number;
  z: number;
}
