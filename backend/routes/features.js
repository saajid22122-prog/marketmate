const express = require('express');
const axios = require('axios');
const router = express.Router();

const callOpenRouter = async (prompt, model) => {
  const selectedModel = model || 'openrouter/free';
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
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'MarketMate AI'
      }
    }
  );

  const aiContent = response.data.choices[0].message.content;
  try {
    const cleanedContent = aiContent
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    return { data: JSON.parse(cleanedContent), model: selectedModel };
  } catch (parseError) {
    return { data: { raw: aiContent, parseError: true }, model: selectedModel };
  }
};

// POST /api/features/planner
router.post('/planner', async (req, res) => {
  try {
    const { budget, goal, model } = req.body;
    if (!budget || !goal) return res.status(400).json({ error: 'Missing budget or goal.' });

    const prompt = `Generate a marketing campaign planner.
Budget: ${budget}
Goal: ${goal}

Return JSON ONLY:
{
  "timeline": [
    { "day": "Day 1-3", "action": "Action description" }
  ],
  "allocation": [
    { "category": "Social Media Ads", "amount": "$100" }
  ]
}`;
    const result = await callOpenRouter(prompt, model);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Planner API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate planner.', 
      details: error.response?.data?.error?.message || error.message 
    });
  }
});

// POST /api/features/ab-test
router.post('/ab-test', async (req, res) => {
  try {
    const { product, audience, model } = req.body;
    if (!product || !audience) return res.status(400).json({ error: 'Missing product or audience.' });

    const prompt = `Generate an A/B test for an ad.
Product: ${product}
Audience: ${audience}

Return JSON ONLY:
{
  "versionA": "Ad copy version A text",
  "versionB": "Ad copy version B text",
  "comparison": "Detailed explanation of which might perform better and why"
}`;
    const result = await callOpenRouter(prompt, model);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('AB-Test API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate A/B test.',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// POST /api/features/insights
router.post('/insights', async (req, res) => {
  try {
    const { product, model } = req.body;
    if (!product) return res.status(400).json({ error: 'Missing product.' });

    const prompt = `Generate audience insights for a product.
Product: ${product}

Return JSON ONLY:
{
  "targetAudience": "Description of the ideal target audience",
  "interests": ["Interest 1", "Interest 2"],
  "painPoints": ["Pain point 1", "Pain point 2"]
}`;
    const result = await callOpenRouter(prompt, model);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Insights API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate insights.',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// POST /api/features/improve
router.post('/improve', async (req, res) => {
  try {
    const { campaignText, model } = req.body;
    if (!campaignText) return res.status(400).json({ error: 'Missing campaign text.' });

    const prompt = `Improve this existing ad/campaign. Correct any flaws, make it more persuasive, and optimize for conversions.
Original Campaign:
${campaignText}

Return JSON ONLY:
{
  "improvedCampaign": "The improved ad/campaign text",
  "explanation": "What was changed and why it is better"
}`;
    const result = await callOpenRouter(prompt, model);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Improve API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to improve campaign.',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
