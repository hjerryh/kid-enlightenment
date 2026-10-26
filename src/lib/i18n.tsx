import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Category, Concept } from '../data/curriculum';
import { localizeCategory, localizeConcept } from '../data/localization';
import { stopAudio } from './audio';
import { LANGUAGE_STORAGE_KEY, parseLanguage } from './language';
import type { Language } from './language';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (english: string, chinese: string) => string;
  localizeConcept: (concept: Concept) => Concept;
  localizeCategory: (category: Category) => Category;
  languageStorageWarning: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function loadLanguage(): Language {
  try {
    return parseLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState(loadLanguage);
  const [languageStorageWarning, setStorageWarning] = useState(false);
  const setLanguage = useCallback((next: Language) => {
    stopAudio();
    updateLanguage(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title =
      language === 'zh'
        ? 'Little World · 小小世界，大大发现'
        : 'Little World · Big discoveries, little steps';
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      setStorageWarning(false);
    } catch {
      setStorageWarning(true);
    }
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (english, chinese) => (language === 'zh' ? chinese : english),
      localizeConcept: (concept) => localizeConcept(concept, language),
      localizeCategory: (category) => localizeCategory(category, language),
      languageStorageWarning,
    }),
    [language, setLanguage, languageStorageWarning],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('LanguageProvider is required.');
  return context;
}
