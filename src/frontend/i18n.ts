import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import zh from './locales/zh.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'sessionStorage', 'navigator'],
      caches: ['localStorage', 'sessionStorage'],
      // 规范化语言代码，将 'zh-CN', 'zh-Hans' 等转换为 'zh'
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
    },
    // 支持语言列表
    supportedLngs: ['en', 'zh'],
    // 非精确匹配时的回退规则
    nonExplicitSupportedLngs: true,
  });

export default i18n;

