export type Language = 'en' | 'zh';

export const LANGUAGE_STORAGE_KEY = 'little-world-language';

export function parseLanguage(value: string | null): Language {
  return value === 'zh' ? 'zh' : 'en';
}
