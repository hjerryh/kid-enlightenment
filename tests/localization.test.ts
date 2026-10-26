import assert from 'node:assert/strict';
import test from 'node:test';
import { categories, concepts } from '../src/data/curriculum.ts';
import type { AgeBand } from '../src/data/curriculum.ts';
import { localizeCategory, localizeConcept } from '../src/data/localization.ts';
import { buildMatchingPairs, createQuestions } from '../src/lib/learning.ts';

const ages: AgeBand[] = ['3-4', '5-6', '7-8'];
const byId = new Map(concepts.map((concept) => [concept.id, concept]));

test('every concept and category has complete Chinese copy without changing identity or artwork', () => {
  for (const concept of concepts) {
    const translated = localizeConcept(concept, 'zh');
    assert.deepEqual(
      { ...translated, word: concept.word, description: concept.description, fact: concept.fact },
      concept,
    );
    for (const field of ['word', 'description', 'fact'] as const) {
      assert.match(translated[field], /\p{Script=Han}/u, `${concept.id}.${field}`);
      assert.doesNotMatch(translated[field], /[a-z]/i, `${concept.id}.${field}`);
    }
  }
  for (const category of categories) {
    const translated = localizeCategory(category, 'zh');
    assert.match(translated.name, /\p{Script=Han}/u);
    assert.match(translated.subtitle, /\p{Script=Han}/u);
    assert.deepEqual({ ...translated, name: category.name, subtitle: category.subtitle }, category);
    const members = concepts
      .filter((concept) => concept.category === category.id)
      .map((concept) => localizeConcept(concept, 'zh'));
    for (const field of ['word', 'description', 'fact'] as const) {
      assert.equal(new Set(members.map((concept) => concept[field])).size, members.length);
    }
  }
});

test('switching either language restores canonical copy without mutating shared data', () => {
  const originalConcepts = structuredClone(concepts);
  const originalCategories = structuredClone(categories);
  for (const concept of concepts) {
    const chinese = localizeConcept(concept, 'zh');
    assert.equal(localizeConcept(chinese, 'en'), concept);
    assert.deepEqual(localizeConcept(chinese, 'zh'), chinese);
  }
  for (const category of categories) {
    const chinese = localizeCategory(category, 'zh');
    assert.equal(localizeCategory(chinese, 'en'), category);
    assert.deepEqual(localizeCategory(chinese, 'zh'), chinese);
  }
  assert.deepEqual(concepts, originalConcepts);
  assert.deepEqual(categories, originalCategories);
});

test('Chinese rounds cover all ages and concepts while retaining stable audio and progress IDs', () => {
  for (const age of ages) {
    const english = createQuestions('all', age, concepts.length);
    const chinese = createQuestions('all', age, concepts.length, 'zh');
    assert.deepEqual(chinese.map(({ id }) => id).sort(), english.map(({ id }) => id).sort());
    for (const question of chinese) {
      const answer = localizeConcept(byId.get(question.answerId)!, 'zh');
      assert.match(question.prompt, /\p{Script=Han}/u);
      assert.doesNotMatch(question.prompt, /[a-z]/i);
      assert.equal(question.audioText, question.prompt);
      assert.equal(question.optionIds.length, age === '3-4' ? 2 : 4);
      assert.equal(question.optionIds.filter((id) => id === answer.id).length, 1);
      assert.ok(question.optionIds.every((id) => byId.get(id)?.category === answer.category));
      if (age === '5-6') assert.equal(question.prompt, answer.description);
      if (age === '7-8') assert.equal(question.prompt, answer.fact);
    }
  }
});

test('Chinese recognition names numerals and distinguishes fruit from color', () => {
  const questions = new Map(
    createQuestions('all', '3-4', concepts.length, 'zh').map((q) => [q.answerId, q]),
  );
  assert.equal(questions.get('zero')!.prompt, '找出数字零。');
  assert.equal(questions.get('two')!.prompt, '找出数字二。');
  assert.equal(questions.get('nineteen')!.prompt, '找出数字十九。');
  assert.equal(questions.get('orange')!.prompt, '找出橙子。');
  assert.equal(questions.get('orange-color')!.prompt, '找出橙色的色块。');
  for (const question of createQuestions('numbers', '3-4', 20, 'zh')) {
    assert.equal(
      question.prompt,
      `找出数字${localizeConcept(byId.get(question.answerId)!, 'zh').word}。`,
    );
    assert.doesNotMatch(question.prompt, /圆点/);
  }
});

test('Chinese matching speaks translated words with distinct labels and original artwork', () => {
  for (const category of [...categories.map(({ id }) => id), 'all' as const]) {
    for (const age of ages) {
      const pairs = buildMatchingPairs(category, age, 'zh');
      assert.equal(pairs.length, age === '3-4' ? 3 : 4);
      assert.equal(new Set(pairs.map(({ word }) => word)).size, pairs.length);
      for (const pair of pairs) {
        const original = byId.get(pair.id)!;
        assert.equal(pair.word, localizeConcept(original, 'zh').word);
        assert.equal(pair.art, original.art);
      }
    }
  }
});
