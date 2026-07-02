// routes/market.js
const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * Utility: check if user message is just a greeting / small talk
 * If true, we DO NOT call Gemini for prices.
 */
function isGreeting(text = '') {
  const lower = text.trim().toLowerCase();
  if (!lower) return false;
  const greetings = ['hi', 'hello', 'hey', 'hai', 'good morning', 'good evening', 'good afternoon'];
  return greetings.some((g) => lower === g || lower.startsWith(g + ' '));
}

/**
 * Utility: check if query is really about price / market
 * If this is false, we won't call Gemini.
 */
function isPriceQuery(text = '') {
  const lower = text.toLowerCase();
  const keywords = ['price', 'rate', 'cost', 'market', 'per kg', 'per kilogram', 'kg price'];
  return keywords.some((k) => lower.includes(k));
}

/**
 * Call Gemini with the raw user query.
 * We don't set price/location; Gemini will answer.
 * We only tell it: "answer with price per Kg".
 */
async function getMarketReplyFromGemini(userQuery, retryCount = 0) {
  const MAX_RETRIES = 2;
  const currentDate = new Date().toISOString().split('T')[0];

  // Use your key directly or via env
  const geminiApiKey ='AIzaSyCnJtVTKc_FLUxx0t-DpGuzr_Zq8s1pYAg';

  if (!geminiApiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`;

  const prompt = `
You are a market price assistant.

Today's date: ${currentDate}

User query:
"${userQuery}"

Answer rules:
- Reply in plain text only (no JSON, no markdown code blocks).
- Understand the commodity and location from the user query.
- Give the current market price in Indian Rupees **per Kg** (not per quintal).
- Example format (you can change words, but keep it short):
  "Tomato in Chennai is around ₹28–₹32 per Kg today."
- Mention:
  • Commodity
  • Location (as understood from the user query)
  • Current price per Kg
  • A realistic price range per Kg
- The answer should be 2–4 short lines.
- Do NOT add long analysis paragraphs.
- Do NOT mention that you are an AI model.
- If you are unsure, give your best estimate but still return a single price range per Kg.
  `.trim();

  try {
    console.log('[Gemini] Calling with query:', userQuery);

    const response = await axios.post(
      geminiUrl,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200,
        },
      },
      {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.data?.error) {
      const err = response.data.error;
      const msg = err.message || 'Unknown Gemini error';
      const code = err.code || err.status;

      console.error('[Gemini] Error payload:', err);

      if ((code === 429 || err.status === 'RESOURCE_EXHAUSTED') && retryCount < MAX_RETRIES) {
        const waitMs = 2000 * (retryCount + 1);
        console.log(`[Gemini] Rate-limited. Retrying in ${waitMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, waitMs));
        return getMarketReplyFromGemini(userQuery, retryCount + 1);
      }

      if (code === 401 || code === 403 || msg.toLowerCase().includes('api key')) {
        throw new Error(`Gemini auth error: ${msg}`);
      }

      throw new Error(`Gemini error: ${msg}`);
    }

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      console.error(
        '[Gemini] Empty response structure:',
        JSON.stringify(response.data, null, 2)
      );
      throw new Error('Empty response from Gemini');
    }

    console.log('[Gemini] Response text (first 200 chars):', text.substring(0, 200));
    return text;
  } catch (error) {
    console.error('[Gemini] Request error:', error.message);

    if (
      retryCount < MAX_RETRIES &&
      (!error.response || [500, 503].includes(error.response.status))
    ) {
      const waitMs = 2000 * (retryCount + 1);
      console.log(`[Gemini] Network/server issue. Retrying in ${waitMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, waitMs));
      return getMarketReplyFromGemini(userQuery, retryCount + 1);
    }

    throw error;
  }
}

/**
 * GET /api/market/chat/test
 * Just to check auth + routing
 */
router.get('/chat/test', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Market chat endpoint is working',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/market/chat
 * Natural language query (chat screen)
 */
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, query } = req.body;

    if (!message && !query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a query about market prices',
        detailedMessage:
          'Example: "What is the price of tomato per Kg in Chennai?"',
        data: [],
        prices: [],
      });
    }

    const userQuery = (message || query || '').trim();
    console.log('[Market Chat] User query:', userQuery);

    // 1️⃣ If just greeting → reply without calling Gemini
    if (isGreeting(userQuery)) {
      return res.json({
        success: true,
        message: 'Greeting',
        detailedMessage:
          'Hi! 👋 I can help you with market prices per Kg.\nTry asking: "Tomato price per Kg in Chennai" or "Rice rate per Kg in Madurai".',
        data: [],
        prices: [],
        count: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // 2️⃣ If not even a price-related query → guide the user
    if (!isPriceQuery(userQuery)) {
      return res.json({
        success: false,
        message: 'Not a price query',
        detailedMessage:
          'I can only answer market price questions (per Kg).\nPlease ask like: "What is the price of onion per Kg in Chennai?"',
        data: [],
        prices: [],
        count: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // 3️⃣ Real price query → call Gemini
    const geminiReply = await getMarketReplyFromGemini(userQuery);

    return res.json({
      success: true,
      message: 'Market price information',
      detailedMessage: geminiReply, // 🟢 frontend shows this directly
      data: [],
      prices: [],
      count: 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Market Chat] Error:', error.message);

    let statusCode = 500;
    let errorMessage = 'Error processing your query';
    let detailedMessage = `Sorry, I encountered an error: ${error.message}`;

    if (error.message.includes('404')) {
      statusCode = 404;
      errorMessage = 'Endpoint not found';
      detailedMessage =
        'The Gemini service endpoint was not found or is not reachable.';
    } else if (
      error.message.includes('401') ||
      error.message.toLowerCase().includes('unauthorized')
    ) {
      statusCode = 401;
      errorMessage = 'Authentication error';
      detailedMessage =
        'Gemini API authentication failed. Please check your API key (GEMINI_API_KEY).';
    } else if (
      error.message.includes('429') ||
      error.message.toLowerCase().includes('rate limit')
    ) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded';
      detailedMessage =
        'Gemini rate limit exceeded. Please wait a moment and try again.';
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      detailedMessage,
      data: [],
      prices: [],
    });
  }
});

/**
 * Optional: GET /api/market
 * Example: /api/market?commodity=tomato&district=Chennai
 * We just build a sentence and send that to Gemini.
 */
router.get('/', protect, async (req, res) => {
  try {
    const { commodity, district, state } = req.query;

    if (!commodity && !district && !state) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one of commodity / district / state',
        detailedMessage:
          'Example: /api/market?commodity=tomato&district=Chennai&state=Tamil%20Nadu',
        data: [],
        prices: [],
      });
    }

    const parts = [];
    if (commodity) parts.push(`commodity: ${commodity}`);
    if (district) parts.push(`district: ${district}`);
    if (state) parts.push(`state: ${state}`);

    const syntheticQuery = `Market price per Kg for ${parts.join(', ')}`;
    const geminiReply = await getMarketReplyFromGemini(syntheticQuery);

    return res.json({
      success: true,
      message: 'Market price information',
      detailedMessage: geminiReply,
      data: [],
      prices: [],
      count: 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Market GET] Error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Error fetching market data',
      detailedMessage: error.message,
      data: [],
      prices: [],
    });
  }
});

module.exports = router;
