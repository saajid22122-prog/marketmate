const express = require('express');
const cors = require('cors');
const path = require('path');

// No need for dotenv in production Vercel
const campaignRoutes = require('../backend/routes/campaign');
const chatRoutes = require('../backend/routes/chat');
const savedCampaignsRoutes = require('../backend/routes/saved-campaigns');
const featuresRoutes = require('../backend/routes/features');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/campaign', campaignRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/saved-campaigns', savedCampaignsRoutes);
app.use('/api/features', featuresRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MarketMate AI API is running on Vercel' });
});

module.exports = app;
