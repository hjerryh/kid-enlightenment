import assert from 'node:assert/strict';
import test from 'node:test';
import { categories, concepts } from '../src/data/curriculum.ts';
import type { AgeBand } from '../src/data/curriculum.ts';
import { animalGroups, animalIdsByGroup, animalGroupById } from '../src/data/animals.ts';
import { buildMatchingPairs, createQuestions, shuffle } from '../src/lib/learning.ts';

const ages: AgeBand[] = ['3-4', '5-6', '7-8'];
const byId = new Map(concepts.map((concept) => [concept.id, concept]));

test('expanded topics have distinct illustrated concepts and age-appropriate clues', () => {
  assert.equal(categories.length, 6);
  assert.equal(concepts.length, 106);
  assert.equal(byId.size, concepts.length);
  for (const category of categories) {
    const members = concepts.filter((concept) => concept.category === category.id);
    const expected = category.id === 'animals' ? 62 : category.id === 'numbers' ? 20 : 6;
    assert.equal(members.length, expected, category.id);
    assert.equal(new Set(members.map((concept) => concept.description)).size, expected);
    assert.equal(new Set(members.map((concept) => concept.fact)).size, expected);
    for (const concept of members) {
      assert.equal(
        concept.art,
        category.id === 'numbers' ? `/art/numbers/${concept.id}.webp` : `/art/${concept.id}.svg`,
      );
      assert.ok(concept.description.trim().length > 0);
      assert.ok(concept.fact.trim().length > 0);
      assert.ok([1, 2, 3].includes(concept.difficulty));
    }
  }
});

test('all ages can practice every concept; only clues and option counts change', () => {
  for (const category of categories) {
    const expectedIds = concepts
      .filter((concept) => concept.category === category.id)
      .map((concept) => concept.id)
      .sort();
    for (const age of ages) {
      const questions = createQuestions(category.id, age, concepts.length);
      assert.deepEqual(questions.map((question) => question.answerId).sort(), expectedIds);
      assert.equal(new Set(questions.map((question) => question.id)).size, expectedIds.length);
      for (const question of questions) {
        const answer = byId.get(question.answerId)!;
        assert.equal(question.optionIds.length, age === '3-4' ? 2 : 4);
        assert.equal(new Set(question.optionIds).size, question.optionIds.length);
        assert.equal(question.optionIds.filter((id) => id === answer.id).length, 1);
        assert.ok(question.optionIds.every((id) => byId.get(id)?.category === answer.category));
        assert.equal(question.audioText, question.prompt);
        if (age === '3-4') assert.match(question.prompt, /^Find /);
        if (age === '5-6') assert.equal(question.prompt, answer.description);
        if (age === '7-8') assert.equal(question.prompt, answer.fact);
      }
    }
  }
});

test('mixed rounds keep potentially ambiguous pictures out of the same question', () => {
  for (const age of ages) {
    const questions = createQuestions('all', age, concepts.length);
    assert.equal(questions.length, concepts.length);
    assert.equal(new Set(questions.map((question) => question.answerId)).size, concepts.length);
    for (const question of questions) {
      const category = byId.get(question.answerId)!.category;
      assert.ok(question.optionIds.every((id) => byId.get(id)?.category === category));
    }
  }
});

test('number cards cover zero to nineteen and early questions ask for the numeral', () => {
  const numbers = concepts.filter((concept) => concept.category === 'numbers');
  assert.deepEqual(
    numbers.map((concept) => concept.numberValue),
    Array.from({ length: 20 }, (_, index) => index),
  );
  const questions = createQuestions('numbers', '3-4', 20);
  assert.equal(
    questions.find((question) => question.answerId === 'zero')!.prompt,
    'Find the number zero.',
  );
  assert.equal(
    questions.find((question) => question.answerId === 'nineteen')!.prompt,
    'Find the number nineteen.',
  );
  for (const question of questions) {
    assert.equal(
      question.prompt,
      `Find the number ${byId.get(question.answerId)!.word.toLowerCase()}.`,
    );
    assert.doesNotMatch(question.prompt, /dot/);
    assert.ok(question.optionIds.every((id) => byId.get(id)?.category === 'numbers'));
  }
});

test('round length is bounded and cannot repeat answers', () => {
  assert.equal(createQuestions('fruits', '3-4', 3).length, 3);
  assert.equal(createQuestions('fruits', '3-4', 100).length, 6);
  assert.equal(createQuestions('all', '3-4', 1000).length, concepts.length);
  assert.equal(createQuestions('fruits', '3-4', 0).length, 0);
  assert.equal(createQuestions('fruits', '3-4', -1).length, 0);
  assert.equal(createQuestions('fruits', '3-4', 2.9).length, 2);
  assert.equal(createQuestions('fruits', '3-4', Number.NaN).length, 6);
});

test('matching uses three or four unique words, even when topics are mixed', () => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    for (const category of [...categories.map(({ id }) => id), 'all' as const]) {
      for (const age of ages) {
        const pairs = buildMatchingPairs(category, age);
        assert.equal(pairs.length, age === '3-4' ? 3 : 4);
        assert.equal(new Set(pairs.map((pair) => pair.id)).size, pairs.length);
        assert.equal(new Set(pairs.map((pair) => pair.word.toLowerCase())).size, pairs.length);
        assert.ok(pairs.every((pair) => byId.get(pair.id)?.art === pair.art));
        if (category !== 'all') {
          assert.ok(pairs.every((pair) => byId.get(pair.id)?.category === category));
        }
      }
    }
  }
});

test('generating rounds and shuffling do not change shared curriculum order', () => {
  const before = concepts.map((concept) => concept.id);
  const values = [1, 2, 3, 4, 5];
  const shuffled = shuffle(values);
  assert.notEqual(shuffled, values);
  assert.deepEqual(values, [1, 2, 3, 4, 5]);
  assert.deepEqual([...shuffled].sort(), values);
  createQuestions('all', '5-6', concepts.length);
  buildMatchingPairs('all', '7-8');
  assert.deepEqual(
    concepts.map((concept) => concept.id),
    before,
  );
  assert.deepEqual(shuffle([]), []);
  assert.deepEqual(shuffle(['one']), ['one']);
});

test('animal groups contain the twelve zodiac animals plus fifty distinct animals', () => {
  const ids = animalGroups.flatMap((group) => animalIdsByGroup[group.id]);
  assert.equal(ids.length, 62);
  assert.equal(new Set(ids).size, 62);
  assert.equal(animalIdsByGroup.zodiac.length, 12);
  assert.equal(ids.filter((id) => !animalIdsByGroup.zodiac.includes(id)).length, 50);
  assert.deepEqual(
    [...ids].sort(),
    concepts
      .filter((concept) => concept.category === 'animals')
      .map(({ id }) => id)
      .sort(),
  );
  for (const group of animalGroups) {
    for (const id of animalIdsByGroup[group.id]) {
      assert.equal(animalGroupById[id], group.id);
    }
  }
});

test('a selected animal group scopes both quiz choices and matching pairs in either language', () => {
  for (const group of animalGroups) {
    const pool = animalIdsByGroup[group.id];
    for (const age of ages) {
      for (const language of ['en', 'zh'] as const) {
        const questions = createQuestions('animals', age, 6, language, pool);
        assert.equal(questions.length, 6);
        assert.equal(new Set(questions.map(({ answerId }) => answerId)).size, 6);
        for (const question of questions) {
          assert.ok(pool.includes(question.answerId));
          assert.equal(question.optionIds.length, age === '3-4' ? 2 : 4);
          assert.ok(question.optionIds.every((id) => pool.includes(id)));
        }
        const pairs = buildMatchingPairs('animals', age, language, pool);
        assert.equal(pairs.length, age === '3-4' ? 3 : 4);
        assert.ok(pairs.every(({ id }) => pool.includes(id)));
      }
    }
  }
});

test('filtered pools ignore duplicates and foreign IDs; a single review answer retains valid choices', () => {
  const questions = createQuestions('animals', '7-8', 6, 'en', [
    'rabbit',
    'rabbit',
    'apple',
    'missing',
  ]);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].answerId, 'rabbit');
  assert.equal(questions[0].optionIds.length, 4);
  assert.equal(new Set(questions[0].optionIds).size, 4);
  assert.ok(questions[0].optionIds.includes('rabbit'));
  assert.ok(questions[0].optionIds.every((id) => byId.get(id)?.category === 'animals'));
  assert.deepEqual(createQuestions('animals', '3-4', 6, 'en', []), []);
  assert.deepEqual(buildMatchingPairs('animals', '3-4', 'en', ['apple']), []);
  assert.deepEqual(
    buildMatchingPairs('animals', '3-4', 'en', ['rabbit', 'rabbit']).map(({ id }) => id),
    ['rabbit'],
  );
});

test('review selection can reach newly added animals beyond the original thirty-six concepts', () => {
  const expandedAnimal = concepts.filter((concept) => concept.category === 'animals').at(-1)!;
  const questions = createQuestions('animals', '5-6', concepts.length, 'en');
  const review = questions.filter((question) => question.answerId === expandedAnimal.id);
  assert.equal(review.length, 1);
  assert.equal(review[0].answerId, expandedAnimal.id);
});
