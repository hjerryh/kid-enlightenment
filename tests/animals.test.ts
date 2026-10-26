import assert from 'node:assert/strict';
import test from 'node:test';
import {
  animalConcepts,
  animalGroupById,
  animalGroups,
  animalIdsByGroup,
  chineseAnimalCopy,
} from '../src/data/animals.ts';
import { concepts } from '../src/data/curriculum.ts';
import { localizeConcept } from '../src/data/localization.ts';
import { chineseNumberCopy, numberConcepts } from '../src/data/numbers.ts';

const zodiac = [
  'rat',
  'ox',
  'tiger',
  'rabbit',
  'dragon',
  'snake',
  'horse',
  'goat',
  'monkey',
  'rooster',
  'dog',
  'pig',
];
const additionalAnimals = [
  'cat',
  'lion',
  'elephant',
  'turtle',
  'panda',
  'bear',
  'polar-bear',
  'fox',
  'wolf',
  'giraffe',
  'zebra',
  'rhinoceros',
  'hippopotamus',
  'kangaroo',
  'koala',
  'deer',
  'camel',
  'squirrel',
  'hedgehog',
  'bat',
  'otter',
  'beaver',
  'raccoon',
  'gorilla',
  'duck',
  'goose',
  'penguin',
  'owl',
  'eagle',
  'parrot',
  'peacock',
  'flamingo',
  'ostrich',
  'woodpecker',
  'dolphin',
  'whale',
  'shark',
  'octopus',
  'jellyfish',
  'seahorse',
  'seal',
  'crab',
  'starfish',
  'crocodile',
  'frog',
  'lizard',
  'butterfly',
  'bee',
  'ladybug',
  'ant',
];

test('the animal collection contains all twelve zodiac entries plus fifty different animals', () => {
  assert.equal(additionalAnimals.length, 50);
  assert.equal(animalConcepts.length, 62);
  assert.deepEqual(animalIdsByGroup.zodiac, zodiac);
  assert.deepEqual(
    animalConcepts.map(({ id }) => id).sort(),
    [...zodiac, ...additionalAnimals].sort(),
  );
  assert.equal(new Set(animalConcepts.map(({ id }) => id)).size, 62);
  assert.equal(concepts.length, 106);
  assert.equal(new Set(concepts.map(({ id }) => id)).size, 106);
  for (const id of ['cat', 'dog', 'rabbit', 'lion', 'elephant', 'turtle']) {
    assert.ok(concepts.some((concept) => concept.id === id && concept.category === 'animals'));
  }
});

test('each animal belongs to exactly one complete learning group', () => {
  const expectedSizes = { zodiac: 12, land: 23, birds: 10, water: 9, little: 8 };
  const groupedIds: string[] = [];
  for (const group of animalGroups) {
    const members = animalIdsByGroup[group.id];
    assert.equal(members.length, expectedSizes[group.id], group.id);
    assert.ok(group.name.length > 0 && group.zhName.length > 0);
    for (const id of members) {
      assert.equal(animalGroupById[id], group.id);
      assert.ok(animalConcepts.some((concept) => concept.id === id));
      groupedIds.push(id);
    }
  }
  assert.equal(groupedIds.length, 62);
  assert.equal(new Set(groupedIds).size, 62);
});

test('all animal cards have bilingual labels, distinct clues, and distinct artwork paths', () => {
  assert.equal(Object.keys(chineseAnimalCopy).length, 62);
  for (const language of ['en', 'zh'] as const) {
    const localized = animalConcepts.map((concept) => localizeConcept(concept, language));
    for (const field of ['word', 'description', 'fact', 'art'] as const) {
      assert.equal(
        new Set(localized.map((concept) => concept[field])).size,
        62,
        `${language} ${field}`,
      );
    }
    for (const concept of localized) {
      assert.ok(concept.description.trim().length > 0);
      assert.ok(concept.fact.trim().length > 0);
      assert.equal(concept.art, `/art/${concept.id}.svg`);
      if (language === 'zh') {
        assert.match(concept.word, /[\u4e00-\u9fff]/);
        assert.match(concept.description, /[\u4e00-\u9fff]/);
        assert.match(concept.fact, /[\u4e00-\u9fff]/);
      }
    }
  }
});

test('dragon is explicitly mythical and brown bear is distinguished from other bears', () => {
  const dragon = animalConcepts.find(({ id }) => id === 'dragon')!;
  assert.match(dragon.description, /Chinese mythical/);
  assert.match(dragon.fact, /not a real animal/);
  assert.match(chineseAnimalCopy.dragon.description, /中国神话/);
  assert.match(chineseAnimalCopy.dragon.fact, /不是真实的动物/);
  assert.equal(animalConcepts.find(({ id }) => id === 'bear')!.word, 'Brown bear');
  assert.equal(chineseAnimalCopy.bear.word, '棕熊');
});

test('number cards cover zero through nineteen and preserve earlier progress IDs', () => {
  assert.equal(numberConcepts.length, 20);
  assert.equal(Object.keys(chineseNumberCopy).length, 20);
  assert.deepEqual(
    numberConcepts.map(({ numberValue }) => numberValue),
    Array.from({ length: 20 }, (_, value) => value),
  );
  assert.deepEqual(
    numberConcepts.slice(1, 7).map(({ id }) => id),
    ['one', 'two', 'three', 'four', 'five', 'six'],
  );
  for (const concept of numberConcepts) {
    assert.equal(concept.art, `/art/numbers/${concept.id}.webp`);
    assert.equal(concept.description, `This is the number ${concept.id}.`);
    const chinese = localizeConcept(concept, 'zh');
    assert.equal(chinese.numberValue, concept.numberValue);
    assert.equal(chinese.description, `这是数字${chinese.word}。`);
    assert.doesNotMatch(
      `${concept.description} ${concept.fact} ${chinese.description} ${chinese.fact}`,
      /dot|圆点/,
    );
  }
});

test('every English and Chinese number challenge calculates to the depicted numeral', () => {
  const englishValues = new Map(numberConcepts.map(({ id, numberValue }) => [id, numberValue!]));
  const chineseValues = new Map(
    numberConcepts.map((concept) => [localizeConcept(concept, 'zh').word, concept.numberValue!]),
  );
  for (const concept of numberConcepts) {
    const english = /^What is (\w+) (plus|minus) (\w+)\?$/.exec(concept.fact)!;
    assert.ok(english, concept.fact);
    const left = englishValues.get(english[1])!;
    const right = englishValues.get(english[3])!;
    assert.ok(left <= 10 && right <= 10);
    assert.equal(english[2] === 'plus' ? left + right : left - right, concept.numberValue);
    const chineseFact = localizeConcept(concept, 'zh').fact;
    const chinese = /^(.+)(加|减)(.+)等于几？$/.exec(chineseFact)!;
    assert.ok(chinese, chineseFact);
    const zhLeft = chineseValues.get(chinese[1])!;
    const zhRight = chineseValues.get(chinese[3])!;
    assert.equal(chinese[2] === '加' ? zhLeft + zhRight : zhLeft - zhRight, concept.numberValue);
  }
});
