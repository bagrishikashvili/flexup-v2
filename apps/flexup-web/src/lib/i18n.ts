import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import kaCommon from '@/locales/ka/common.json';
import kaAuth from '@/locales/ka/auth.json';
import kaErrors from '@/locales/ka/errors.json';
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enErrors from '@/locales/en/errors.json';

export const SUPPORTED_LANGUAGES = ['ka', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ka',
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: ['common', 'auth', 'errors'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    resources: {
      ka: { common: kaCommon, auth: kaAuth, errors: kaErrors },
      en: { common: enCommon, auth: enAuth, errors: enErrors },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'flexup-lang',
    },
  });

export { i18n };
