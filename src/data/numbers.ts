import type { Concept } from './curriculum.ts';

type NumberRow = readonly [
  id: string,
  chinese: string,
  left: number,
  operation: 'plus' | 'minus',
  right: number,
];

// The illustrated numeral is the answer; arithmetic is written in words for clear narration.
const rows: NumberRow[] = [
  ['zero', '零', 1, 'minus', 1],
  ['one', '一', 2, 'minus', 1],
  ['two', '二', 1, 'plus', 1],
  ['three', '三', 2, 'plus', 1],
  ['four', '四', 2, 'plus', 2],
  ['five', '五', 4, 'plus', 1],
  ['six', '六', 3, 'plus', 3],
  ['seven', '七', 4, 'plus', 3],
  ['eight', '八', 4, 'plus', 4],
  ['nine', '九', 5, 'plus', 4],
  ['ten', '十', 5, 'plus', 5],
  ['eleven', '十一', 6, 'plus', 5],
  ['twelve', '十二', 6, 'plus', 6],
  ['thirteen', '十三', 7, 'plus', 6],
  ['fourteen', '十四', 7, 'plus', 7],
  ['fifteen', '十五', 8, 'plus', 7],
  ['sixteen', '十六', 8, 'plus', 8],
  ['seventeen', '十七', 9, 'plus', 8],
  ['eighteen', '十八', 9, 'plus', 9],
  ['nineteen', '十九', 10, 'plus', 9],
];

export const numberConcepts: Concept[] = rows.map(
  ([id, , left, operation, right], numberValue) => ({
    id,
    word: id[0].toUpperCase() + id.slice(1),
    category: 'numbers',
    description: `This is the number ${id}.`,
    fact: `What is ${rows[left][0]} ${operation} ${rows[right][0]}?`,
    difficulty: numberValue <= 3 ? 1 : numberValue <= 9 ? 2 : 3,
    art: `/art/numbers/${id}.webp`,
    numberValue,
  }),
);

export const chineseNumberCopy: Record<
  string,
  Pick<Concept, 'word' | 'description' | 'fact'>
> = Object.fromEntries(
  rows.map(([id, word, left, operation, right]) => [
    id,
    {
      word,
      description: `这是数字${word}。`,
      fact: `${rows[left][1]}${operation === 'plus' ? '加' : '减'}${rows[right][1]}等于几？`,
    },
  ]),
);
