import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { z } from 'zod';

import kaCommon from '@/locales/ka/common.json';
import kaAuth from '@/locales/ka/auth.json';
import kaErrors from '@/locales/ka/errors.json';
import kaValidation from '@/locales/ka/validation.json';
import kaCompanies from '@/locales/ka/companies.json';
import kaNavigation from '@/locales/ka/navigation.json';
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enErrors from '@/locales/en/errors.json';
import enValidation from '@/locales/en/validation.json';
import enCompanies from '@/locales/en/companies.json';
import enNavigation from '@/locales/en/navigation.json';
import { zodI18nErrorMap } from './zod-error-map';

export const SUPPORTED_LANGUAGES = ['ka', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ka',
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: ['common', 'auth', 'errors', 'validation', 'companies', 'navigation'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    resources: {
      ka: { common: kaCommon, auth: kaAuth, errors: kaErrors, validation: kaValidation, companies: kaCompanies, navigation: kaNavigation },
      en: { common: enCommon, auth: enAuth, errors: enErrors, validation: enValidation, companies: enCompanies, navigation: enNavigation },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'flexup-lang',
    },
  });

// Set global Zod error map — lazily calls i18n.t() at validation time, safe to register now
z.setErrorMap(zodI18nErrorMap);

export { i18n };
