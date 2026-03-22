const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: '/Users/user/Desktop/marketing project/.env' });

(async () => {
  try {
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openrouter/free',
        messages: [{ role: 'user', content: 'hello' }]
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
    console.log("SUCCESS", res.data.choices[0].message.content);
  } catch (e) {
    console.log("FAILED");
    console.error(e.response ? e.response.data : e.message);
  }
})();
