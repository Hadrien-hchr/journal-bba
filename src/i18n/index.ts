import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { common } from './resources/common';
import { auth } from './resources/auth';
import { events } from './resources/events';
import { content } from './resources/content';
import { account } from './resources/account';

export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const LANGUAGE_STORAGE_KEY = 'app_language';

const resources = {
  fr: {
    common: common.fr,
    auth: auth.fr,
    events: events.fr,
    content: content.fr,
    account: account.fr,
  },
  en: {
    common: common.en,
    auth: auth.en,
    events: events.en,
    content: content.en,
    account: account.en,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    defaultNS: 'common',
    ns: ['common', 'auth', 'events', 'content', 'account'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export default i18n;
