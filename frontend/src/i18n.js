import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en/translation.json'
import fr from '../locales/fr/translation.json'

// The JSON files are the single source of truth for copy; add new keys there.
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: 'en',
  fallbackLng: ['en', 'fr'],
  interpolation: { escapeValue: false },
})

export default i18n
