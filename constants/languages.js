// Each entry: { label, code (BCP-47), speechCode (for expo-speech) }
export const LANGUAGES = [
  { label: 'English', code: 'en', speechCode: 'en-US' },
  { label: 'Spanish', code: 'es', speechCode: 'es-ES' },
  { label: 'Arabic', code: 'ar', speechCode: 'ar-SA' },
  { label: 'French', code: 'fr', speechCode: 'fr-FR' },
  { label: 'Mandarin', code: 'zh', speechCode: 'zh-CN' },
  { label: 'Russian', code: 'ru', speechCode: 'ru-RU' },
  { label: 'Portuguese', code: 'pt', speechCode: 'pt-BR' },
  { label: 'German', code: 'de', speechCode: 'de-DE' },
  { label: 'Japanese', code: 'ja', speechCode: 'ja-JP' },
  { label: 'Korean', code: 'ko', speechCode: 'ko-KR' },
  { label: 'Italian', code: 'it', speechCode: 'it-IT' },
  { label: 'Hindi', code: 'hi', speechCode: 'hi-IN' },
  { label: 'Urdu', code: 'ur', speechCode: 'ur-PK' },
  { label: 'Turkish', code: 'tr', speechCode: 'tr-TR' },
  { label: 'Dutch', code: 'nl', speechCode: 'nl-NL' },
  { label: 'Polish', code: 'pl', speechCode: 'pl-PL' },
  { label: 'Swedish', code: 'sv', speechCode: 'sv-SE' },
  { label: 'Greek', code: 'el', speechCode: 'el-GR' },
  { label: 'Hebrew', code: 'he', speechCode: 'he-IL' },
  { label: 'Thai', code: 'th', speechCode: 'th-TH' },
  { label: 'Vietnamese', code: 'vi', speechCode: 'vi-VN' },
];

export const getLanguageByCode = (code) =>
  LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];

export const getLanguageLabel = (code) => getLanguageByCode(code).label;
