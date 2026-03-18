/**
 * Translation Service
 *
 * This module handles all Google Cloud API interactions for:
 * 1. Speech-to-Text (transcription + language detection)
 * 2. Translation (Google Translate API)
 *
 * API keys are loaded from .env via app.config.js → expo-constants.
 */
import Constants from 'expo-constants';

const GOOGLE_STT_API_KEY = Constants.expoConfig?.extra?.googleSttApiKey || '';
const GOOGLE_TRANSLATE_API_KEY = Constants.expoConfig?.extra?.googleTranslateApiKey || '';

/**
 * Transcribe audio and detect language using Google Cloud Speech-to-Text API.
 *
 * @param {string} audioBase64 - Base64-encoded audio data (LINEAR16 / WAV format)
 * @param {string[]} possibleLanguages - Array of BCP-47 language codes to hint detection
 *   e.g. ['en-US', 'es-ES', 'ar-SA', 'fr-FR']
 * @returns {Promise<{ transcript: string, detectedLanguage: string }>}
 *
 * TODO: API Key goes in the URL query parameter `key=YOUR_GOOGLE_API_KEY_HERE`
 *
 * Expected request body:
 * {
 *   "config": {
 *     "encoding": "LINEAR16",
 *     "sampleRateHertz": 44100,
 *     "alternativeLanguageCodes": ["es-ES", "ar-SA", "fr-FR", ...],
 *     "languageCode": "en-US"
 *   },
 *   "audio": {
 *     "content": "<base64-encoded-audio>"
 *   }
 * }
 *
 * Expected response:
 * {
 *   "results": [
 *     {
 *       "alternatives": [
 *         { "transcript": "hello how are you", "confidence": 0.95 }
 *       ],
 *       "languageCode": "en-us"
 *     }
 *   ]
 * }
 */
export const transcribeAudio = async (audioBase64, possibleLanguages = []) => {
  console.log('STT API key loaded:', GOOGLE_STT_API_KEY ? `${GOOGLE_STT_API_KEY.substring(0, 8)}...` : 'EMPTY');
  const url = `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_STT_API_KEY}`;

  const body = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: possibleLanguages[0] || 'en-US',
      alternativeLanguageCodes: possibleLanguages.slice(1, 4), // API supports up to 3 alternatives
    },
    audio: {
      content: audioBase64,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('STT API response:', JSON.stringify(data).substring(0, 500));

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const transcript = result.alternatives[0]?.transcript || '';
      const detectedLanguage = result.languageCode || possibleLanguages[0] || 'en';
      return {
        transcript,
        detectedLanguage: detectedLanguage.split('-')[0], // Return just 'en', 'es', etc.
      };
    }

    return { transcript: '', detectedLanguage: '' };
  } catch (error) {
    console.error('Speech-to-Text error:', error);
    throw new Error('Failed to transcribe audio. Please check your API key and network connection.');
  }
};

/**
 * Translate text using Google Cloud Translation API.
 *
 * @param {string} text - The text to translate
 * @param {string} targetLang - Target language code (e.g. 'es', 'fr', 'ar')
 * @param {string} [sourceLang] - Source language code (optional, API will auto-detect)
 * @returns {Promise<string>} - The translated text
 *
 * TODO: API Key goes in the URL query parameter `key=YOUR_GOOGLE_API_KEY_HERE`
 *
 * Expected request URL:
 * https://translation.googleapis.com/language/translate/v2?key=YOUR_API_KEY
 *
 * Expected request body:
 * {
 *   "q": "Hello, how are you?",
 *   "target": "es",
 *   "source": "en",
 *   "format": "text"
 * }
 *
 * Expected response:
 * {
 *   "data": {
 *     "translations": [
 *       {
 *         "translatedText": "Hola, ¿cómo estás?",
 *         "detectedSourceLanguage": "en"
 *       }
 *     ]
 *   }
 * }
 */
export const translateText = async (text, targetLang, sourceLang = null) => {
  if (!text || !targetLang) return '';

  const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`;

  const body = {
    q: text,
    target: targetLang,
    format: 'text',
  };
  if (sourceLang) {
    body.source = sourceLang;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.data?.translations?.[0]) {
      return data.data.translations[0].translatedText;
    }

    return text; // Fallback to original text
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Failed to translate text. Please check your API key and network connection.');
  }
};
