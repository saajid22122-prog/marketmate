const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, model, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const selectedModel = model || 'openrouter/free';

    // Build conversation messages
    const messages = [
      {
        role: 'system',
        content: `You are MarketMate AI, a friendly and knowledgeable marketing assistant for small businesses. You specialize in:
- Digital marketing strategies
- Social media marketing (Instagram, Facebook, TikTok, Google Ads)
- Content creation and copywriting
- SEO and paid advertising
- Brand building and audience growth
- Budget optimization for marketing campaigns

Be concise, actionable, and encouraging. Use bullet points and clear formatting when helpful. Always tailor advice to small businesses with limited budgets.`
      }
    ];

    // Include conversation history if provided
    if (history && Array.isArray(history)) {
      messages.push(...history.slice(-10)); // Keep last 10 messages for context
    }

    messages.push({ role: 'user', content: message });

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: selectedModel,
        messages,
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://marketmate-alpha.vercel.app',
          'X-Title': 'MarketMate AI'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    res.json({
      success: true,
      message: aiResponse,
      model: selectedModel
    });

  } catch (error) {
    console.error('Chat API Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to get response. Please check your API key and try again.',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
