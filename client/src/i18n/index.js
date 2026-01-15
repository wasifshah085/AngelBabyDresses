import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import urTranslations from './locales/ur.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      ur: {
        translation: urTranslations
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    // Return the key formatted nicely if no translation is found
    // This prevents raw keys like "orders.trackOrder" from showing
    returnEmptyString: false,
    // When a key is missing, try to make it human-readable
    parseMissingKeyHandler: (key) => {
      // Convert "orders.trackOrder" to "Track Order"
      const parts = key.split('.');
      const lastPart = parts[parts.length - 1];
      // Convert camelCase to Title Case with spaces
      return lastPart
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    }
  });

export default i18n;
