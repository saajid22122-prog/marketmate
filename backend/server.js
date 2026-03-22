const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const campaignRoutes = require('./routes/campaign');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/campaign', campaignRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/saved-campaigns', require('./routes/saved-campaigns'));
app.use('/api/features', require('./routes/features'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MarketMate AI is running' });
});

// Fallback — serve index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 MarketMate AI server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
