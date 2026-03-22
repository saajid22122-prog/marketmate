# 🚀 MarketMate AI — AI Marketing Campaign Builder

An AI-powered web application that helps small businesses generate complete marketing campaigns in seconds.

## Features

- **Campaign Generator** — Input product details, get 3 ad copies, Instagram caption, 10 hashtags, and a marketing strategy
- **AI Chat Assistant** — Ask marketing questions and get expert-level advice
- **Multi-Model Support** — Switch between GPT-4o Mini and Claude 3 Haiku
- **Regenerate** — Re-generate campaigns with one click

## Tech Stack

| Layer    | Technology               |
|----------|--------------------------|
| Frontend | HTML, CSS, JavaScript    |
| Backend  | Node.js, Express.js      |
| AI API   | OpenRouter (GPT / Claude)|
| HTTP     | Axios                    |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Add your API key

Open `.env` and replace the placeholder with your [OpenRouter](https://openrouter.ai/) API key:

```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 3. Start the server

```bash
npm start
```

### 4. Open the app

Visit **http://localhost:3000** in your browser.

## Project Structure

```
├── backend/
│   ├── server.js          # Express server
│   └── routes/
│       ├── campaign.js    # Campaign generation endpoint
│       └── chat.js        # Chat assistant endpoint
├── frontend/
│   ├── index.html         # Dashboard UI
│   ├── style.css          # Dark-theme styles
│   └── script.js          # Frontend logic
├── .env                   # API key (not committed)
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint        | Description              |
|--------|-----------------|--------------------------|
| POST   | /api/campaign   | Generate marketing campaign |
| POST   | /api/chat       | Chat with AI assistant   |
| GET    | /api/health     | Server health check      |

## Security

- API key stored in `.env` (server-side only)
- `.env` is listed in `.gitignore`
- No secrets exposed to the frontend
