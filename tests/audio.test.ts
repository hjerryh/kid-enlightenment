import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { concepts } from '../src/data/curriculum.ts';
import { localizeConcept } from '../src/data/localization.ts';
import { createQuestions } from '../src/lib/learning.ts';
import { recordedSpeech } from '../src/lib/audio-manifest.ts';
import { recordedSpeechZh } from '../src/lib/audio-manifest-zh.ts';
import {
  isSpeechSupported,
  playSpeech,
  playWord,
  setAudioEnabled,
  stopAudio,
  speak,
  subscribeAudioErrors,
} from '../src/lib/audio.ts';

class FakeAudio {
  static instances: FakeAudio[] = [];
  static fail = false;
  preload = '';
  lang = '';
  currentTime = 0;
  src = '';
  paused = true;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    FakeAudio.instances.push(this);
  }
  load() {}
  pause() {
    this.paused = true;
  }
  play(): Promise<void> {
    this.paused = false;
    return FakeAudio.fail ? Promise.reject(new Error('Missing recording')) : Promise.resolve();
  }
}

const globals = globalThis as unknown as Record<string, unknown>;
const previousAudio = globals.Audio;
const previousWindow = globals.window;
const previousUtterance = globals.SpeechSynthesisUtterance;
globals.Audio = FakeAudio;

function installSpeech(fails = false) {
  const spoken: Record<string, unknown>[] = [];
  class FakeUtterance {
    text: string;
    onend?: () => void;
    onerror?: (event: { error: string }) => void;
    constructor(text: string) {
      this.text = text;
    }
  }
  globals.SpeechSynthesisUtterance = FakeUtterance;
  globals.window = {
    SpeechSynthesisUtterance: FakeUtterance,
    speechSynthesis: {
      cancel() {},
      getVoices: () => [
        { name: 'Chinese', lang: 'zh-CN' },
        { name: 'Samantha', lang: 'en-US' },
      ],
      speak(utterance: FakeUtterance) {
        spoken.push(utterance as unknown as Record<string, unknown>);
        queueMicrotask(() =>
          fails ? utterance.onerror?.({ error: 'synthesis-failed' }) : utterance.onend?.(),
        );
      },
    },
  };
  return spoken;
}

test.after(() => {
  stopAudio();
  globals.Audio = previousAudio;
  globals.window = previousWindow;
  globals.SpeechSynthesisUtterance = previousUtterance;
});

test('module imports without browser globals and reports speech unavailable', () => {
  assert.equal(isSpeechSupported(), false);
});

test('rapid taps reuse one player and cancel the previous playback cleanly', async () => {
  const first = playWord('apple');
  const player = FakeAudio.instances[0];
  assert.equal(player.src, '/audio/apple.mp3');
  assert.equal(player.lang, 'en-US');
  const second = playWord('banana');
  await first;
  assert.equal(FakeAudio.instances.length, 1);
  assert.equal(player.src, '/audio/banana.mp3');
  player.onended?.();
  await second;
});

test('muting stops the active clip and suppresses subsequent speech', async () => {
  const playing = playWord('cat');
  setAudioEnabled(false);
  await playing;
  const player = FakeAudio.instances[0];
  assert.equal(player.paused, true);
  await playWord('dog');
  assert.equal(player.src, '/audio/cat.mp3');
  setAudioEnabled(true);
});

test('missing recordings fall back to an explicit English voice', async () => {
  const spoken = installSpeech();
  FakeAudio.fail = true;
  await playWord('apple');
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].text, 'Apple');
  assert.equal(spoken[0].lang, 'en-US');
  assert.deepEqual(spoken[0].voice, { name: 'Samantha', lang: 'en-US' });
  FakeAudio.fail = false;
});

test('known prompt speech plays a bundled recording', async () => {
  const spoken = installSpeech();
  const playing = playSpeech('Wonderful! You did it.');
  const player = FakeAudio.instances[0];
  assert.equal(player.src, '/audio/well-done.mp3');
  player.onended?.();
  await playing;
  assert.equal(spoken.length, 0);
});

test('switching language cancels the old clip and selects the Chinese recording', async () => {
  const english = playWord('apple');
  const chinese = playWord('apple', 'zh');
  await english;
  const player = FakeAudio.instances[0];
  assert.equal(player.src, '/audio/zh/apple.mp3');
  assert.equal(player.lang, 'zh-CN');
  player.onended?.();
  await chinese;

  const backToEnglish = playWord('banana');
  assert.equal(player.src, '/audio/banana.mp3');
  assert.equal(player.lang, 'en-US');
  player.onended?.();
  await backToEnglish;
});

test('Chinese phrase lookup preserves characters and uses the correct bundled clip', async () => {
  const spoken = installSpeech();
  const player = FakeAudio.instances[0];
  for (const id of ['banana', 'well-done', 'question-3-4-circle']) {
    const playing = playSpeech(recordedSpeechZh[id], 'zh');
    assert.equal(player.src, `/audio/zh/${id}.mp3`);
    player.onended?.();
    await playing;
  }
  assert.equal(spoken.length, 0);
});

test('unrecorded Chinese text uses Mandarin synthesis instead of an unrelated recording', async () => {
  const spoken = installSpeech();
  await playSpeech('这是一句新的中文提示。', 'zh');
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].text, '这是一句新的中文提示。');
  assert.equal(spoken[0].lang, 'zh-CN');
  assert.deepEqual(spoken[0].voice, { name: 'Chinese', lang: 'zh-CN' });
});

test('missing Chinese recordings fall back to Mandarin speech', async () => {
  const spoken = installSpeech();
  FakeAudio.fail = true;
  await playWord('apple', 'zh');
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].text, recordedSpeechZh.apple);
  assert.equal(spoken[0].lang, 'zh-CN');
  assert.deepEqual(spoken[0].voice, { name: 'Chinese', lang: 'zh-CN' });
  FakeAudio.fail = false;
});

test('a complete playback failure rejects and speak reports its error to the UI', async () => {
  installSpeech(true);
  FakeAudio.fail = true;
  await assert.rejects(playWord('dog'), /English audio is unavailable/);
  const received = new Promise<Error>((resolve) => {
    const unsubscribe = subscribeAudioErrors((error) => {
      unsubscribe();
      resolve(error);
    });
  });
  speak('An unrecorded prompt.');
  assert.match((await received).message, /synthesis-failed/);
  FakeAudio.fail = false;
});

test('invalid recording ids fail explicitly', async () => {
  await assert.rejects(playWord('../../unknown'), /No English recording is registered/);
});

function assertNarrationBundle(directory: string, scripts: Readonly<Record<string, string>>) {
  const manifest = JSON.parse(
    readFileSync(new URL(`${directory}/manifest.json`, import.meta.url), 'utf8'),
  ) as {
    clips: Record<string, { text: string; duration: number; bytes: number; sha256: string }>;
  };
  assert.deepEqual(Object.keys(manifest.clips).sort(), Object.keys(scripts).sort());
  for (const [id, text] of Object.entries(scripts)) {
    const bytes = readFileSync(new URL(`${directory}/${id}.mp3`, import.meta.url));
    const clip = manifest.clips[id];
    assert.equal(clip.text, text, `Outdated narration text: ${id}`);
    assert.ok(bytes.length > 1000, `Missing or empty narration: ${id}`);
    assert.equal(clip.bytes, bytes.length, `Truncated narration: ${id}`);
    assert.equal(
      clip.sha256,
      createHash('sha256').update(bytes).digest('hex'),
      `Changed narration: ${id}`,
    );
    assert.ok(
      clip.duration >= 0.2 && clip.duration <= 12,
      `Narration exceeds playback budget: ${id}`,
    );
  }
}

test('all concepts and every age-band question have real local narration assets', () => {
  for (const concept of concepts) assert.equal(recordedSpeech[concept.id], concept.word);
  for (const age of ['3-4', '5-6', '7-8'] as const) {
    for (const question of createQuestions('all', age, concepts.length)) {
      assert.equal(recordedSpeech[question.id], question.audioText);
    }
  }
  assertNarrationBundle('../public/audio', recordedSpeech);
});

test('Chinese narration covers every word, age-band question, and English recording ID', () => {
  assert.deepEqual(Object.keys(recordedSpeechZh).sort(), Object.keys(recordedSpeech).sort());
  for (const concept of concepts) {
    assert.equal(recordedSpeechZh[concept.id], localizeConcept(concept, 'zh').word);
  }
  for (const age of ['3-4', '5-6', '7-8'] as const) {
    for (const question of createQuestions('all', age, concepts.length, 'zh')) {
      assert.equal(recordedSpeechZh[question.id], question.audioText);
    }
  }
  for (const [id, text] of Object.entries(recordedSpeechZh)) {
    assert.match(text, /\p{Script=Han}/u, `Missing Chinese narration: ${id}`);
  }
  assertNarrationBundle('../public/audio/zh', recordedSpeechZh);
});
