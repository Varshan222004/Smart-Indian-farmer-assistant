const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/translate
// @desc    Translate text using Google Translate API
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    if (!targetLanguage || !['en', 'hi', 'ta'].includes(targetLanguage)) {
      return res.status(400).json({ message: 'Valid target language is required (en, hi, or ta)' });
    }

    const googleTranslateApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    
    if (!googleTranslateApiKey) {
      // Fallback: Return original text if API key not configured
      return res.json({
        translatedText: text,
        sourceLanguage: 'en',
        targetLanguage: targetLanguage,
        note: 'Translation API not configured. Please add GOOGLE_TRANSLATE_API_KEY to backend .env'
      });
    }

    // Google Translate API v2
    const translateUrl = 'https://translation.googleapis.com/language/translate/v2';
    
    const response = await axios.post(
      translateUrl,
      {
        q: text,
        target: targetLanguage,
        format: 'text'
      },
      {
        params: {
          key: googleTranslateApiKey
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const translatedText = response.data.data.translations[0].translatedText;
    const detectedSourceLanguage = response.data.data.translations[0].detectedSourceLanguage || 'en';

    res.json({
      translatedText: translatedText,
      sourceLanguage: detectedSourceLanguage,
      targetLanguage: targetLanguage
    });
  } catch (error) {
    console.error('Translation error:', error.message);
    
    // Fallback: Return original text on error
    res.json({
      translatedText: req.body.text,
      sourceLanguage: 'en',
      targetLanguage: req.body.targetLanguage,
      error: 'Translation service unavailable. Showing original text.',
      note: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;

