const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// POST /api/saved-campaigns/save-campaign
router.post('/save-campaign', async (req, res) => {
  try {
    const { product, audience, budget, platform, tone, outputs, type } = req.body;
    
    if (!outputs) {
      return res.status(400).json({ error: 'Outputs data is required to save a campaign' });
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert([
        {
          product: product || null,
          audience: audience || null,
          budget: budget || null,
          platform: platform || null,
          tone: tone || null,
          outputs,
          type: type || 'generator'
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error saving campaign to Supabase:', error);
    res.status(500).json({ error: 'Failed to save campaign to Supabase' });
  }
});

// GET /api/saved-campaigns/campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching campaigns from Supabase:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns from Supabase' });
  }
});

module.exports = router;
