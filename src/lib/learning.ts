import { concepts } from '../data/curriculum.ts';
import type { AgeBand, CategoryId, Concept } from '../data/curriculum.ts';
import { localizeConcept } from '../data/localization.ts';
import type { Language } from './language.ts';

export type Question = {
  id: string;
  prompt: string;
  audioText: string;
  answerId: string;
  optionIds: string[];
};

/** Return a shuffled copy, leaving curriculum and previous rounds untouched. */
export function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}

function getPool(categoryId: CategoryId | 'all', poolIds?: readonly string[]): Concept[] {
  const categoryPool =
    categoryId === 'all' ? concepts : concepts.filter((concept) => concept.category === categoryId);
  if (!poolIds) return categoryPool;
  const requestedIds = new Set(poolIds);
  return categoryPool.filter((concept) => requestedIds.has(concept.id));
}

function recognitionPrompt(concept: Concept, language: Language): string {
  if (language === 'zh') {
    if (concept.category === 'colors') return `找出${concept.word}的色块。`;
    if (concept.category === 'numbers') {
      return `找出数字${concept.word}。`;
    }
    return `找出${concept.word}。`;
  }
  // A color word needs context: "orange" is also the name of a fruit.
  if (concept.category === 'colors') {
    return `Find the color ${concept.word.toLowerCase()}.`;
  }
  if (concept.category === 'numbers') {
    return `Find the number ${concept.word.toLowerCase()}.`;
  }
  return `Find the ${concept.word.toLowerCase()}.`;
}

export function createQuestions(
  categoryId: CategoryId | 'all',
  ageBand: AgeBand,
  roundLength = 6,
  language: Language = 'en',
  poolIds?: readonly string[],
): Question[] {
  const pool = getPool(categoryId, poolIds).map((concept) => localizeConcept(concept, language));
  const requestedLength = Number.isFinite(roundLength) ? Math.floor(roundLength) : 6;
  const count = Math.max(0, Math.min(pool.length, requestedLength));
  const optionCount = ageBand === '3-4' ? 2 : 4;

  return shuffle(pool)
    .slice(0, count)
    .map((answer) => {
      // Keep each question within one category, including mixed-topic rounds.
      // This prevents, for example, the orange fruit and orange color swatch
      // both answering a color clue, or Sun and Star answering a shape clue.
      const sameCategory = (concept: Concept) =>
        concept.category === answer.category && concept.id !== answer.id;
      const groupDistractors = pool.filter(sameCategory);
      // A selected animal group supplies both answers and choices. A tiny review
      // pool still needs enough same-topic choices to make a useful question.
      const distractors = shuffle(
        groupDistractors.length >= optionCount - 1
          ? groupDistractors
          : concepts.filter(sameCategory),
      ).slice(0, optionCount - 1);
      const prompt =
        ageBand === '3-4'
          ? recognitionPrompt(answer, language)
          : ageBand === '5-6'
            ? answer.description
            : answer.fact;

      return {
        id: `question-${ageBand}-${answer.id}`,
        prompt,
        audioText: prompt,
        answerId: answer.id,
        optionIds: shuffle([answer.id, ...distractors.map((concept) => concept.id)]),
      };
    });
}

export function buildMatchingPairs(
  categoryId: CategoryId | 'all',
  ageBand: AgeBand,
  language: Language = 'en',
  poolIds?: readonly string[],
): { id: string; word: string; art: string }[] {
  const count = ageBand === '3-4' ? 3 : 4;
  // Orange appears in two categories. Matching is spoken-word-to-picture,
  // so each word needs exactly one possible picture in the round.
  const uniqueWords = new Set<string>();
  return shuffle(getPool(categoryId, poolIds).map((concept) => localizeConcept(concept, language)))
    .filter((concept) => {
      const word = concept.word.toLowerCase();
      if (uniqueWords.has(word)) return false;
      uniqueWords.add(word);
      return true;
    })
    .slice(0, count)
    .map(({ id, word, art }) => ({ id, word, art }));
}
