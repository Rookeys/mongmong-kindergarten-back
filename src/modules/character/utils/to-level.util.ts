import {
  INITIAL_LEVEL,
  LETTERS_PER_LEVEL,
  MAX_LEVEL,
} from '../constants/character-growth.constants';

/**
 * 사이클 동안 쓴 편지 수로 레벨을 구한다. 0~89통 Lv1, 90통 Lv2, 180통 Lv3, 270통부터 Lv4.
 */
export const toLevel = (letterCount: number): number =>
  Math.min(
    MAX_LEVEL,
    INITIAL_LEVEL + Math.floor(letterCount / LETTERS_PER_LEVEL),
  );
