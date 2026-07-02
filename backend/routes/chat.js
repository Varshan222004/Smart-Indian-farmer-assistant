const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');

const router = express.Router();

// @route   POST /api/chat
// @desc    Chat with AI assistant
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { message, locale } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const llmApiKey = process.env.LLM_API_KEY;
    const llmProvider = process.env.LLM_PROVIDER || 'gemini';
    // Optional override for model name, defaults to Gemini 3 Pro preview (which your key supports)
    const llmModel = process.env.LLM_MODEL_NAME || 'gemini-3-pro-preview';

    if (!llmApiKey) {
      return res.status(503).json({
        message: 'AI chat service is not configured. Please add LLM_API_KEY to backend .env',
        response: 'I apologize, but the AI assistant is currently unavailable. Please configure the AI service in the backend environment variables.'
      });
    }

    // Get user context for personalized responses
    const user = await User.findById(req.user.id);
    const userContext = user
      ? `User is a farmer from ${user.location?.state || 'India'}, manages ${user.landSize || 'unknown'} acres with ${user.landQuality || 'medium'} land quality and ${user.soilType || 'loamy'} soil.`
      : '';

    // Prepare prompt with context
    const systemPrompt = [
      'You are a professional agronomy advisor and experienced Indian farmer.',
      'Give guidance that is practical, region-aware, season-aware, and based on sustainable agriculture best practices.',
      'Structure responses with short sections (e.g., Diagnosis, Immediate Actions, Long-Term Care, Safety) when helpful.',
      'Always explain the reasoning briefly so the farmer understands the “why”, not just the “what”.',
      'If information is missing, ask clarifying questions instead of guessing. Never fabricate data or guarantees.',
      `Respond in ${locale || 'English'} using simple, respectful language. ${userContext}`
    ].join(' ');

    const fullMessage = `${systemPrompt}\n\nFarmer question: ${message}\n\nAdvisor:`;

    let response;

    if (llmProvider === 'gemini') {
      // Direct REST call to Gemini v1beta API with Gemini 3 Pro preview
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${llmModel}:generateContent`;

      const geminiResponse = await axios.post(
        `${geminiUrl}?key=${llmApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: fullMessage
                }
              ]
            }
          ]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      if (geminiResponse.data.candidates && geminiResponse.data.candidates[0]) {
        const parts = geminiResponse.data.candidates[0].content.parts;
        response = parts.map((p) => p.text || '').join('\n').trim();
      } else {
        throw new Error('Invalid response from Gemini API');
      }
    } else if (llmProvider === 'openai') {
      // OpenAI API call
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${llmApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      response = openaiResponse.data.choices[0].message.content;
    } else {
      return res.status(500).json({
        message: 'Unsupported LLM provider',
        response: 'Configuration error'
      });
    }

    // Persist conversation for this user (both user question and assistant reply)
    try {
      await ChatMessage.create([
        {
          user: req.user.id,
          role: 'user',
          content: message
        },
        {
          user: req.user.id,
          role: 'assistant',
          content: response
        }
      ]);
    } catch (persistError) {
      console.error('Chat history save error:', persistError.message);
      // Do not fail the main request if history saving fails
    }

    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    if (error.response) {
      const status = error.response.status;
      const errData = error.response.data;
      let friendly = 'I apologize, but I encountered an error. Please try again.';

      // Special handling for Gemini quota issues so the user sees the real reason
      if (errData?.error?.status === 'RESOURCE_EXHAUSTED') {
        friendly =
          'The AI service has run out of free quota on this API key. Please add a new Gemini API key with quota in the backend .env and restart the server.';
      }

      return res.status(status).json({
        message: 'Error from AI service',
        error: errData,
        response: friendly
      });
    }
    res.status(500).json({
      message: 'Error processing chat request',
      error: error.message,
      response: 'I apologize, but I encountered an error. Please try again.'
    });
  }
});

// @route   GET /api/chat/history
// @desc    Get recent chat history for the logged-in user
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ user: req.user.id })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.createdAt
      }))
    });
  } catch (error) {
    console.error('Chat history fetch error:', error.message);
    res.status(500).json({ message: 'Failed to load chat history' });
  }
});

module.exports = router;

