import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';

const savedLang = localStorage.getItem('bhumi_lang') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Keep the chosen language across refreshes / other tabs.
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('bhumi_lang', lng);
  document.documentElement.lang = lng;
});
document.documentElement.lang = savedLang;

export default i18n;
