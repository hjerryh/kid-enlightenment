import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dayStreak,
  freshProgress,
  localDate,
  parseProgress,
  recordAnswer,
  recordDiscovery,
  recordSession,
} from '../src/lib/progress.ts';

test('missing, corrupt, incompatible, and non-object saved data safely start fresh', () => {
  for (const input of [null, '', '{broken', 'null', 'true', '17', '[]', '{}', '{"version":2}']) {
    assert.deepEqual(parseProgress(input), freshProgress(), String(input));
  }
});

test('saved settings, discovered words, attempts, and days survive a valid round trip', () => {
  const morning = new Date(2026, 9, 22, 9, 30);
  let progress = freshProgress();
  progress.ageBand = '7-8';
  progress.sound = false;
  progress.dailyGoal = 12;
  progress = recordDiscovery(progress, 'banana');
  progress = recordAnswer(progress, 'apple', false, morning);
  progress = recordAnswer(progress, 'apple', true, morning);
  progress = recordSession(progress, morning);
  assert.deepEqual(parseProgress(JSON.stringify(progress)), progress);
});

test('invalid nested saved values are sanitized without discarding valid progress', () => {
  const progress = parseProgress(
    JSON.stringify({
      version: 1,
      ageBand: '2-99',
      sound: 'false',
      dailyGoal: 100,
      discovered: ['apple', 'apple', 'not-a-word', 5, null, 'banana'],
      attempts: {
        apple: { total: 3.8, correct: 20 },
        banana: { total: -3, correct: -1 },
        pear: { total: '8', correct: true },
        grapes: [],
        unknown: { total: 10, correct: 10 },
      },
      days: {
        '2026-10-22': { words: ['apple', 'apple', 'banana', 'unknown', null], sessions: 2.9 },
        '2026-10-21': { words: 'apple', sessions: -8 },
        '2026-10-20': [],
        invalid: { words: ['apple'], sessions: 4 },
      },
    }),
  );

  assert.equal(progress.ageBand, '5-6');
  assert.equal(progress.sound, true);
  assert.equal(progress.dailyGoal, 6);
  assert.deepEqual(progress.discovered, ['apple', 'banana']);
  assert.deepEqual(progress.attempts, {
    apple: { total: 3, correct: 3 },
    banana: { total: 0, correct: 0 },
    pear: { total: 0, correct: 0 },
  });
  assert.deepEqual(progress.days, {
    '2026-10-22': { words: ['apple', 'banana'], sessions: 2 },
    '2026-10-21': { words: [], sessions: 0 },
  });
});

test('overflowing JSON counters cannot become infinite learning progress', () => {
  const progress = parseProgress(
    '{"version":1,"attempts":{"apple":{"total":1e400,"correct":1e400}},"days":{"2026-10-22":{"words":[],"sessions":1e400}}}',
  );
  assert.deepEqual(progress.attempts.apple, { total: 0, correct: 0 });
  assert.equal(progress.days['2026-10-22'].sessions, 0);
});

test('saved day keys must be real calendar dates, including the leap-year rule', () => {
  const day = { words: ['apple'], sessions: 1 };
  const progress = parseProgress(
    JSON.stringify({
      version: 1,
      days: {
        '2026-02-29': day,
        '2026-02-30': day,
        '2026-04-31': day,
        '2026-00-20': day,
        '2026-13-01': day,
        '2026-10-00': day,
        '2026-10-32': day,
        '2026-1-22': day,
        '2026-10-22': day,
        '2024-02-29': day,
        '2026-02-28': day,
      },
    }),
  );
  assert.deepEqual(Object.keys(progress.days).sort(), ['2024-02-29', '2026-02-28', '2026-10-22']);
});

test('each fresh profile owns its own arrays and records', () => {
  const first = freshProgress();
  const second = freshProgress();
  first.discovered.push('apple');
  first.days['2026-10-22'] = { words: ['apple'], sessions: 1 };
  first.attempts.apple = { total: 1, correct: 1 };
  assert.deepEqual(second.discovered, []);
  assert.deepEqual(second.days, {});
  assert.deepEqual(second.attempts, {});
});

test('discoveries are deduplicated and cannot introduce unknown words or sessions', () => {
  const empty = freshProgress();
  const once = recordDiscovery(empty, 'apple');
  const twice = recordDiscovery(once, 'apple');
  const unknown = recordDiscovery(twice, 'not-a-concept');
  assert.deepEqual(unknown.discovered, ['apple']);
  assert.deepEqual(unknown.attempts, {});
  assert.deepEqual(unknown.days, {});
  assert.deepEqual(empty.discovered, []);
});

test('wrong answers count as attempts but not as words practiced successfully today', () => {
  const date = new Date(2026, 9, 22, 10);
  const empty = freshProgress();
  const wrong = recordAnswer(empty, 'apple', false, date);
  assert.deepEqual(wrong.attempts.apple, { total: 1, correct: 0 });
  assert.deepEqual(wrong.days['2026-10-22'], { words: [], sessions: 0 });
  assert.deepEqual(empty.attempts, {});

  const correct = recordAnswer(wrong, 'apple', true, date);
  const wrongAgain = recordAnswer(correct, 'apple', false, date);
  const repeatedCorrect = recordAnswer(wrongAgain, 'apple', true, date);
  assert.deepEqual(repeatedCorrect.attempts.apple, { total: 4, correct: 2 });
  assert.deepEqual(repeatedCorrect.days['2026-10-22'], { words: ['apple'], sessions: 0 });
  assert.deepEqual(repeatedCorrect.discovered, ['apple']);
  assert.deepEqual(wrong.days['2026-10-22'].words, []);
});

test('unknown answer IDs leave profile and daily progress unchanged', () => {
  const progress = recordAnswer(freshProgress(), 'apple', true, new Date(2026, 9, 22));
  assert.deepEqual(recordAnswer(progress, 'unknown', true), progress);
  assert.deepEqual(recordAnswer(progress, 'unknown', false), progress);
});

test('local midnight starts a new day while preserving previous practice and lifetime totals', () => {
  const beforeMidnight = new Date(2026, 9, 22, 23, 59);
  const afterMidnight = new Date(2026, 9, 23, 0, 1);
  assert.equal(localDate(beforeMidnight), '2026-10-22');
  assert.equal(localDate(afterMidnight), '2026-10-23');

  let progress = recordAnswer(freshProgress(), 'apple', true, beforeMidnight);
  progress = recordSession(progress, beforeMidnight);
  progress = recordAnswer(progress, 'banana', false, afterMidnight);
  progress = recordAnswer(progress, 'apple', true, afterMidnight);
  assert.deepEqual(progress.days, {
    '2026-10-22': { words: ['apple'], sessions: 1 },
    '2026-10-23': { words: ['apple'], sessions: 0 },
  });
  assert.deepEqual(progress.attempts.apple, { total: 2, correct: 2 });
  assert.deepEqual(progress.attempts.banana, { total: 1, correct: 0 });
});

test('a completed round increments sessions once, independently of answer count', () => {
  const today = new Date(2026, 9, 22, 10);
  const tomorrow = new Date(2026, 9, 23, 10);
  let progress = freshProgress();
  for (const id of ['apple', 'banana', 'orange', 'strawberry', 'grapes', 'pear']) {
    progress = recordAnswer(progress, id, true, today);
  }
  assert.equal(progress.days['2026-10-22'].sessions, 0);
  assert.equal(progress.days['2026-10-22'].words.length, 6);

  progress = recordSession(progress, today);
  assert.equal(progress.days['2026-10-22'].sessions, 1);
  progress = recordSession(progress, today);
  assert.equal(progress.days['2026-10-22'].sessions, 2);
  progress = recordSession(progress, tomorrow);
  assert.deepEqual(progress.days['2026-10-23'], { words: [], sessions: 1 });
  assert.equal(progress.days['2026-10-22'].sessions, 2);
  assert.equal(progress.days['2026-10-22'].words.length, 6);
});

test('streak includes yesterday until today has a completed session', () => {
  const today = new Date(2026, 9, 22, 10);
  let progress = freshProgress();
  assert.equal(dayStreak(progress, today), 0);
  progress = recordSession(progress, new Date(2026, 9, 20, 18));
  progress = recordSession(progress, new Date(2026, 9, 21, 18));
  assert.equal(dayStreak(progress, today), 2);

  progress = recordAnswer(progress, 'apple', true, today);
  assert.equal(dayStreak(progress, today), 2, 'An unfinished round does not add a streak day');
  progress = recordSession(progress, today);
  progress = recordSession(progress, today);
  assert.equal(dayStreak(progress, today), 3, 'Several rounds on one day still count as one day');
});

test('streak stops at gaps and ignores future sessions', () => {
  const today = new Date(2026, 9, 22, 10);
  let progress = freshProgress();
  progress = recordSession(progress, new Date(2026, 9, 19));
  progress = recordSession(progress, new Date(2026, 9, 20));
  assert.equal(dayStreak(progress, today), 0, 'A missing yesterday breaks an older streak');

  progress = recordSession(progress, new Date(2026, 9, 23));
  assert.equal(dayStreak(progress, today), 0, 'A future date cannot produce a current streak');
  progress = recordSession(progress, today);
  assert.equal(dayStreak(progress, today), 1);
});

test('streak traverses month, year, and leap-day boundaries by local calendar days', () => {
  const newYear = new Date(2027, 0, 1, 10);
  let progress = freshProgress();
  for (const date of [new Date(2026, 11, 30), new Date(2026, 11, 31), newYear]) {
    progress = recordSession(progress, date);
  }
  assert.equal(dayStreak(progress, newYear), 3);

  const march = new Date(2024, 2, 1, 10);
  progress = freshProgress();
  for (const date of [new Date(2024, 1, 28), new Date(2024, 1, 29), march]) {
    progress = recordSession(progress, date);
  }
  assert.equal(dayStreak(progress, march), 3);
});
