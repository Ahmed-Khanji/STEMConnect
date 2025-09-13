import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
		lng: "en",            // always start in English
    fallbackLng: "en", // Change this to your default language, e.g., "fr" or "ar"
    debug: true, // Set to false in production to hide debug logs
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json", // Change path if you're using custom structure like /locales/translationEN.json
    },
    react: { useSuspense: false }
  });
 
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng; // change html lng to the language
});

export default i18n;