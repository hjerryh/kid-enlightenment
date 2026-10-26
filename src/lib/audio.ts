import { recordedSpeech } from './audio-manifest.ts';
import { recordedSpeechZh } from './audio-manifest-zh.ts';
import type { Language } from './language.ts';

const locales: Record<Language, string> = { en: 'en-US', zh: 'zh-CN' };
const recordings = { en: recordedSpeech, zh: recordedSpeechZh };
const errorListeners = new Set<(error: Error) => void>();
let audio: HTMLAudioElement | undefined;
let enabled = true;
let generation = 0;
let finishCurrent: (() => void) | undefined;

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Safe to import in Node/SSR: browser globals are only read inside functions. */
export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

function getAudio(): HTMLAudioElement {
  if (typeof Audio === 'undefined')
    throw new Error('Audio playback is unavailable on this device.');
  if (!audio) {
    audio = new Audio();
    audio.preload = 'auto';
  }
  return audio;
}

/** Cancel any existing voice before a new clip, navigation, or muting. */
export function stopAudio(): void {
  generation += 1;
  const finish = finishCurrent;
  finishCurrent = undefined;
  finish?.();
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

export function setAudioEnabled(value: boolean): void {
  enabled = value;
  if (!enabled) stopAudio();
}

/** Subscribe to errors from the fire-and-forget speak() API. */
export function subscribeAudioErrors(listener: (error: Error) => void): () => void {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

function playRecording(id: string, token: number, language: Language): Promise<void> {
  return new Promise((resolve, reject) => {
    const element = getAudio();
    let settled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      element.onended = null;
      element.onerror = null;
      if (finishCurrent === cancel) finishCurrent = undefined;
      if (error) reject(error);
      else resolve();
    };
    const cancel = () => finish();
    finishCurrent = cancel;
    element.onended = () => finish();
    element.onerror = () =>
      finish(
        new Error(
          language === 'zh'
            ? `无法加载“${id}”的中文语音。`
            : `The English recording for ${id} could not be loaded.`,
        ),
      );
    timeout = setTimeout(() => {
      element.pause();
      finish(
        new Error(
          language === 'zh'
            ? '中文语音播放超时，请重试。'
            : 'The English recording took too long to play.',
        ),
      );
    }, 15000);
    element.lang = locales[language];
    element.src = `${import.meta.env?.BASE_URL ?? '/'}audio/${language === 'zh' ? 'zh/' : ''}${encodeURIComponent(id)}.mp3`;
    element.load();
    void element.play().catch((error: unknown) => {
      if (token !== generation) finish();
      else finish(asError(error));
    });
  });
}

function synthesise(text: string, token: number, language: Language): Promise<void> {
  if (!isSpeechSupported())
    return Promise.reject(
      new Error(
        language === 'zh'
          ? '此设备暂时无法播放中文语音。'
          : 'English voice playback is unavailable on this device.',
      ),
    );
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locales[language];
    utterance.rate = 0.8;
    utterance.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find(
        (item) =>
          item.lang.replace('_', '-') === locales[language] &&
          (language === 'zh' ? /tingting|婷婷/i : /samantha/i).test(item.name),
      ) ??
      voices.find((item) => item.lang.replace('_', '-') === locales[language]) ??
      voices.find((item) =>
        language === 'zh'
          ? /^zh(?:[-_](?:cn|sg|tw))?$/i.test(item.lang)
          : /^en[-_]/i.test(item.lang),
      );
    if (voice) utterance.voice = voice;
    let settled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      utterance.onend = null;
      utterance.onerror = null;
      if (finishCurrent === cancel) finishCurrent = undefined;
      if (error) reject(error);
      else resolve();
    };
    const cancel = () => finish();
    finishCurrent = cancel;
    utterance.onend = () => finish();
    utterance.onerror = (event) => {
      if (token !== generation || event.error === 'canceled' || event.error === 'interrupted')
        finish();
      else
        finish(
          new Error(
            language === 'zh'
              ? `中文语音无法播放（${event.error}）。`
              : `English speech could not play (${event.error}).`,
          ),
        );
    };
    timeout = setTimeout(
      () => {
        finish(
          new Error(
            language === 'zh'
              ? '中文语音未播放完，请点喇叭重试。'
              : 'English speech did not finish. Please tap the speaker to retry.',
          ),
        );
        window.speechSynthesis.cancel();
      },
      Math.max(15000, text.length * 150),
    );
    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      finish(asError(error));
    }
  });
}

/**
 * Play a bundled word/phrase, falling back to device speech if the file fails.
 * Resolves on finish or deliberate cancellation; rejects if both routes fail.
 * Call from a user gesture to satisfy iOS playback restrictions.
 */
export async function playWord(id: string, language: Language = 'en'): Promise<void> {
  if (!enabled) return;
  const text = recordings[language][id];
  if (!text)
    throw new Error(
      language === 'zh'
        ? `没有找到“${id}”的中文语音。`
        : `No English recording is registered for "${id}".`,
    );
  stopAudio();
  const token = generation;
  try {
    await playRecording(id, token, language);
  } catch (recordingError) {
    if (token !== generation || !enabled) return;
    try {
      await synthesise(text, token, language);
    } catch (speechError) {
      throw new Error(
        `${language === 'zh' ? '中文语音暂不可用。' : 'English audio is unavailable.'} ${asError(speechError).message}`,
        {
          cause: recordingError,
        },
      );
    }
  }
}

/** Promise-based speech API for UI that needs a playback state or error. */
export async function playSpeech(text: string, language: Language = 'en'): Promise<void> {
  if (!enabled || !text.trim()) return;
  const normalised = normalise(text);
  const match =
    normalised &&
    Object.entries(recordings[language]).find(([, script]) => normalise(script) === normalised);
  if (match) return playWord(match[0], language);
  stopAudio();
  return synthesise(text, generation, language);
}

/** Prefer recordings in the selected language, otherwise use matching device speech. */
export function speak(text: string, language: Language = 'en'): void {
  void playSpeech(text, language).catch((error: unknown) => {
    const issue = asError(error);
    const listeners = [...errorListeners];
    for (const listener of listeners) listener(issue);
    if (listeners.length === 0 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('little-world:audio-error', { detail: issue }));
    }
  });
}
