const axios = require('axios');
(async () => {
  try {
    const res = await axios.get('https://openrouter.ai/api/v1/models');
    const freeModels = res.data.data.filter(m => m.id.endsWith(':free') || m.id.includes('free'));
    console.log(freeModels.slice(0, 10).map(m => m.id));
  } catch(e) { console.error(e); }
})();
