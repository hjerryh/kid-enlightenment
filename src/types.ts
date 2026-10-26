import type { CategoryId } from './data/curriculum';

export type Page = 'explore' | 'play' | 'progress';
export type PracticeConfig = {
  kind: 'quiz' | 'match';
  categoryId: CategoryId | 'all';
  poolIds?: readonly string[];
  reviewIds?: string[];
};
export type SessionResult = {
  config: PracticeConfig;
  total: number;
  firstTry: number;
  reviewIds: string[];
};
