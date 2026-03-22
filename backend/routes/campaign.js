const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { product, audience, budget, platform, tone, model } = req.body;

    // Validate required fields
    if (!product || !audience || !budget || !platform || !tone) {
      return res.status(400).json({
        error: 'Missing required fields. Please provide product, audience, budget, platform, and tone.'
      });
    }

    const selectedModel = model || 'openrouter/free';

    const prompt = `You are a marketing expert and business strategist. Generate a structured marketing campaign with a revenue plan.

Product: ${product}
Audience: ${audience}
Budget: ${budget}
Platform: ${platform}
Tone: ${tone}

Return the response in the following JSON format ONLY (no markdown, no code fences, just raw JSON):
{
  "adCopies": [
    "Ad copy 1 text here",
    "Ad copy 2 text here",
    "Ad copy 3 text here"
  ],
  "instagramCaption": "Your Instagram caption here",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"],
  "strategy": "Your short marketing strategy here (2-3 paragraphs)",
  "revenueStrategy": {
    "pricingTips": "How to price the product competitively for the target audience",
    "salesChannels": ["Channel 1", "Channel 2", "Channel 3"],
    "revenueProjection": "Estimated revenue and ROI based on the given budget",
    "monetizationTips": "3-4 actionable tips on maximizing revenue and scaling sales"
  }
}`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are a world-class marketing expert. Always respond with valid JSON only. No markdown, no code fences, no extra text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'marketmate-alpha.vercel.app',
          'X-Title': 'MarketMate AI'
        }
      }
    );

    const aiContent = response.data.choices[0].message.content;

    // Try to parse JSON from the response
    let campaignData;
    try {
      // Remove potential markdown code fences
      const cleanedContent = aiContent
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      campaignData = JSON.parse(cleanedContent);
    } catch (parseError) {
      // If JSON parsing fails, return raw text
      campaignData = {
        raw: aiContent,
        parseError: true
      };
    }

    res.json({
      success: true,
      data: campaignData,
      model: selectedModel
    });

  } catch (error) {
    console.error('Campaign API Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to generate campaign. Please check your API key and try again.',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
