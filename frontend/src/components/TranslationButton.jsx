import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

const TranslationButton = ({ text, className = '' }) => {
  const { i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' }
  ];

  const translateText = async (targetLang) => {
    if (targetLang === currentLang || !text) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/translate', {
        text: text,
        targetLanguage: targetLang
      });

      setTranslatedText(response.data.translatedText);
      setCurrentLang(targetLang);
    } catch (err) {
      setError('Translation failed. Showing original text.');
      console.error('Translation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!text) return null;

  return (
    <div className={`translation-container ${className}`}>
      <div className="mb-2">
        <p className="text-gray-700 whitespace-pre-wrap">{translatedText || text}</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mt-2 p-2 bg-gray-50 rounded-md">
        <span className="text-xs text-gray-600 font-medium">Translate to:</span>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => translateText(lang.code)}
            disabled={loading || currentLang === lang.code}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              currentLang === lang.code
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={lang.name}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </button>
        ))}
        {loading && (
          <span className="text-xs text-gray-500 italic">Translating...</span>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-600 mt-1 italic">{error}</p>
      )}
    </div>
  );
};

export default TranslationButton;

