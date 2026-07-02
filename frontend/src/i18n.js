import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import taTranslations from './locales/ta.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
      ta: { translation: taTranslations }
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'ta'],
    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Keys to store language in
      caches: ['localStorage'],
      // Default language if detection fails
      lookupLocalStorage: 'i18nextLng',
      // Don't cache language detection
      checkWhitelist: true
    },
    debug: false,
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;

