/* ==========================================================================
   MarketMate AI — Frontend Logic
   ========================================================================== */

(function () {
  'use strict';

  // ───── DOM References ─────
  const sidebar     = document.getElementById('sidebar');
  const overlay     = document.getElementById('sidebar-overlay');
  const hamburger   = document.getElementById('hamburger');
  const navBtns     = document.querySelectorAll('.nav-btn');
  const tabs        = document.querySelectorAll('.tab-content');
  const modelSelect = document.getElementById('model-select');

  // Campaign
  const campaignForm    = document.getElementById('campaign-form');
  const btnGenerate     = document.getElementById('btn-generate');
  const btnRegenerate   = document.getElementById('btn-regenerate');
  const campaignLoading = document.getElementById('campaign-loading');
  const campaignError   = document.getElementById('campaign-error');
  const campaignErrorMsg = document.getElementById('campaign-error-msg');
  const campaignOutput  = document.getElementById('campaign-output');
  const adCopiesContainer = document.getElementById('ad-copies-container');
  const captionCard     = document.getElementById('caption-card');
  const hashtagsContainer = document.getElementById('hashtags-container');
  const strategyCard    = document.getElementById('strategy-card');

  // Chat
  const chatForm     = document.getElementById('chat-form');
  const chatInput    = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const btnSend      = document.getElementById('btn-send');

  // ───── State ─────
  let lastCampaignPayload = null;
  let chatHistory = [];

  // ───── Tab Switching ─────
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabs.forEach(t => {
        t.classList.remove('active');
        if (t.id === `tab-${target}`) {
          t.classList.add('active');
          const header = t.querySelector('.page-header h1');
          if (header) applyBlurAnimation(header);
        }
      });

      // Close sidebar on mobile
      closeSidebar();
    });
  });

  // ───── Mobile Sidebar ─────
  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }

  hamburger.addEventListener('click', openSidebar);
  overlay.addEventListener('click', closeSidebar);

  // ───── Blur Text Animation ─────
  function applyBlurAnimation(element) {
    if (!element) return;
    
    if (!element.dataset.originalText) {
      // Clean up any existing spans if re-applying
      if(element.querySelector('.blur-word')) {
         let fullText = '';
         element.querySelectorAll('.blur-word').forEach(s => fullText += s.textContent);
         element.dataset.originalText = fullText.trim();
      } else {
         element.dataset.originalText = element.textContent.trim();
      }
    }
    
    const text = element.dataset.originalText;
    const words = text.split(' ');
    
    element.innerHTML = '';
    
    words.forEach((word, index) => {
      const span = document.createElement('span');
      // Append a space after the word, preserving standard spacing
      span.textContent = word + (index < words.length - 1 ? '\u00A0' : '');
      span.className = 'blur-word';
      // Stagger the animation by 0.05s increments
      span.style.animationDelay = `${index * 0.08}s`;
      element.appendChild(span);
    });
  }

  // Trigger once on initial load
  const initialHeader = document.querySelector('.tab-content.active .page-header h1');
  if (initialHeader) applyBlurAnimation(initialHeader);

  // ═══════════════════════════════════════════════════════════════════════════
  //  CAMPAIGN GENERATOR
  // ═══════════════════════════════════════════════════════════════════════════

  campaignForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      product:  document.getElementById('input-product').value.trim(),
      audience: document.getElementById('input-audience').value.trim(),
      budget:   document.getElementById('input-budget').value.trim(),
      platform: document.getElementById('input-platform').value,
      tone:     document.getElementById('input-tone').value,
      model:    modelSelect.value
    };
    lastCampaignPayload = payload;
    generateCampaign(payload);
  });

  btnRegenerate.addEventListener('click', () => {
    if (lastCampaignPayload) {
      lastCampaignPayload.model = modelSelect.value; // pick current model
      generateCampaign(lastCampaignPayload);
    }
  });

  async function generateCampaign(payload) {
    // UI states
    campaignOutput.classList.add('hidden');
    campaignError.classList.add('hidden');
    campaignLoading.classList.remove('hidden');
    btnGenerate.disabled = true;

    try {
      const res = await fetch('/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || json.details || 'Unknown error');
      }

      renderCampaign(json.data);
      campaignLoading.classList.add('hidden');
      campaignOutput.classList.remove('hidden');

    } catch (err) {
      campaignLoading.classList.add('hidden');
      campaignErrorMsg.textContent = err.message;
      campaignError.classList.remove('hidden');
    } finally {
      btnGenerate.disabled = false;
    }
  }

  function renderCampaign(data) {
    window.lastCampaignData = data;
    // Handle raw text fallback
    if (data.parseError && data.raw) {
      adCopiesContainer.innerHTML = '';
      captionCard.textContent = '';
      hashtagsContainer.innerHTML = '';
      strategyCard.textContent = data.raw;
      return;
    }

    // Ad Copies
    adCopiesContainer.innerHTML = '';
    (data.adCopies || []).forEach((copy, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<span class="card-label">Ad Copy ${i + 1}</span><p>${escapeHTML(copy)}</p>`;
      adCopiesContainer.appendChild(card);
    });

    // Instagram Caption
    captionCard.innerHTML = `<p>${escapeHTML(data.instagramCaption || '')}</p>`;

    // Hashtags
    hashtagsContainer.innerHTML = '';
    (data.hashtags || []).forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'hashtag-chip';
      chip.textContent = tag.startsWith('#') ? tag : `#${tag}`;
      hashtagsContainer.appendChild(chip);
    });

    // Strategy
    strategyCard.textContent = data.strategy || '';

    // Revenue Strategy
    const rev = data.revenueStrategy || {};
    document.querySelector('#revenue-pricing p').textContent = rev.pricingTips || 'N/A';

    const channelsList = document.querySelector('#revenue-channels ul');
    channelsList.innerHTML = '';
    (rev.salesChannels || []).forEach(ch => {
      const li = document.createElement('li');
      li.textContent = ch;
      channelsList.appendChild(li);
    });

    document.querySelector('#revenue-projection p').textContent = rev.revenueProjection || 'N/A';
    document.querySelector('#revenue-tips p').textContent = rev.monetizationTips || 'N/A';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CHAT ASSISTANT
  // ═══════════════════════════════════════════════════════════════════════════

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;

    appendBubble('user', msg);
    chatHistory.push({ role: 'user', content: msg });
    chatInput.value = '';
    chatInput.focus();

    sendChat(msg);
  });

  async function sendChat(message) {
    btnSend.disabled = true;

    // Show typing indicator
    const typingEl = createTypingIndicator();
    chatMessages.appendChild(typingEl);
    scrollChat();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          model: modelSelect.value,
          history: chatHistory.slice(-10)
        })
      });

      const json = await res.json();
      typingEl.remove();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to get response');
      }

      appendBubble('bot', json.message);
      chatHistory.push({ role: 'assistant', content: json.message });

    } catch (err) {
      typingEl.remove();
      appendBubble('bot', `⚠️ ${err.message}`);
    } finally {
      btnSend.disabled = false;
    }
  }

  function appendBubble(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role === 'user' ? 'user' : 'bot'}`;

    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar';

    if (role === 'user') {
      avatar.textContent = 'U';
    } else {
      avatar.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
    }

    const content = document.createElement('div');
    content.className = 'bubble-content';
    content.innerHTML = formatMessage(text);

    bubble.appendChild(avatar);
    bubble.appendChild(content);
    chatMessages.appendChild(bubble);
    scrollChat();
  }

  function createTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-bubble bot';
    wrapper.innerHTML = `
      <div class="bubble-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      </div>
      <div class="bubble-content">
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>`;
    return wrapper;
  }

  function scrollChat() {
    requestAnimationFrame(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  // ───── Utilities ─────

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatMessage(text) {
    // Simple markdown-like formatting for chat
    let html = escapeHTML(text);

    // Bold **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Bullet points
    html = html.replace(/^[\s]*[-•]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    // Clean up nested <ul>
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Numbered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraph if no block elements
    if (!html.includes('<ul>') && !html.includes('<li>')) {
      html = `<p>${html}</p>`;
    }

    return html;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SHARED UTILITIES (Export & Save)
  // ═══════════════════════════════════════════════════════════════════════════
  function downloadTxt(filename, text) {
    const el = document.createElement('a');
    el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    el.setAttribute('download', filename);
    el.style.display = 'none';
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  }

  async function saveToHistoryDB(payload, btn) {
    const originalText = btn.innerHTML;
    btn.textContent = "Saving...";
    btn.disabled = true;
    try {
      const res = await fetch('/api/saved-campaigns/save-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save');
      btn.textContent = "Saved!";
      loadHistory(); // refresh history list
    } catch (err) {
      alert("Error saving: " + err.message);
      btn.textContent = "Error";
    } finally {
      setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);
    }
  }

  // Bind Generator Export/Save
  const getEl = id => document.getElementById(id);
  
  if (getEl('btn-save-generator')) {
    getEl('btn-save-generator').addEventListener('click', function() {
      if (lastCampaignPayload && window.lastCampaignData) {
        saveToHistoryDB({ ...lastCampaignPayload, outputs: window.lastCampaignData, type: 'generator' }, this);
      }
    });
    getEl('btn-export-generator').addEventListener('click', () => {
      if (window.lastCampaignData) {
        downloadTxt('campaign.txt', JSON.stringify(window.lastCampaignData, null, 2));
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CAMPAIGN PLANNER
  // ═══════════════════════════════════════════════════════════════════════════
  let lastPlannerPayload = null;
  let lastPlannerData = null;

  if (getEl('planner-form')) {
    getEl('planner-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        budget: getEl('planner-budget').value.trim(),
        goal: getEl('planner-goal').value,
        model: modelSelect.value
      };
      lastPlannerPayload = payload;
      await runFeature('/api/features/planner', payload, getEl('btn-planner'), getEl('planner-loading'), getEl('planner-error'), getEl('planner-output'), getEl('planner-error-msg'), (data) => {
        lastPlannerData = data;
        renderPlanner(data);
      });
    });

    getEl('btn-regenerate-planner').addEventListener('click', () => {
      if (lastPlannerPayload) {
        lastPlannerPayload.model = modelSelect.value;
        getEl('planner-form').dispatchEvent(new Event('submit'));
      }
    });

    getEl('btn-save-planner').addEventListener('click', function() {
      if (lastPlannerPayload && lastPlannerData) saveToHistoryDB({ ...lastPlannerPayload, outputs: lastPlannerData, type: 'planner' }, this);
    });

    getEl('btn-export-planner').addEventListener('click', () => {
      if (lastPlannerData) downloadTxt('planner.txt', JSON.stringify(lastPlannerData, null, 2));
    });
  }

  function renderPlanner(data) {
    const d = data.data || data;
    const tList = getEl('planner-timeline');
    tList.innerHTML = '';
    (d.timeline || []).forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${escapeHTML(item.day || '')}:</strong> ${escapeHTML(item.action || '')}`;
      tList.appendChild(li);
    });

    const aList = getEl('planner-allocation');
    aList.innerHTML = '';
    (d.allocation || []).forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${escapeHTML(item.category || '')}</span> <strong>${escapeHTML(item.amount || '')}</strong>`;
      aList.appendChild(li);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  A/B TESTING
  // ═══════════════════════════════════════════════════════════════════════════
  let lastAbPayload = null;
  let lastAbData = null;

  if (getEl('ab-test-form')) {
    getEl('ab-test-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        product: getEl('ab-product').value.trim(),
        audience: getEl('ab-audience').value.trim(),
        model: modelSelect.value
      };
      lastAbPayload = payload;
      await runFeature('/api/features/ab-test', payload, getEl('btn-ab-test'), getEl('ab-loading'), getEl('ab-error'), getEl('ab-output'), getEl('ab-error-msg'), (data) => {
        lastAbData = data;
        renderAB(data);
      });
    });

    getEl('btn-regenerate-ab').addEventListener('click', () => {
      if (lastAbPayload) {
        lastAbPayload.model = modelSelect.value;
        getEl('ab-test-form').dispatchEvent(new Event('submit'));
      }
    });

    getEl('btn-save-ab').addEventListener('click', function() {
      if (lastAbPayload && lastAbData) saveToHistoryDB({ ...lastAbPayload, outputs: lastAbData, type: 'ab-test' }, this);
    });

    getEl('btn-export-ab').addEventListener('click', () => {
      if (lastAbData) downloadTxt('ab-test.txt', JSON.stringify(lastAbData, null, 2));
    });
  }

  function renderAB(data) {
    const d = data.data || data;
    getEl('ab-version-a').textContent = d.versionA || '';
    getEl('ab-version-b').textContent = d.versionB || '';
    getEl('ab-comparison').innerHTML = `<p>${formatMessage(d.comparison || '')}</p>`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  AUDIENCE INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════════
  let lastInsightsPayload = null;
  let lastInsightsData = null;

  if (getEl('insights-form')) {
    getEl('insights-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        product: getEl('insights-product').value.trim(),
        model: modelSelect.value
      };
      lastInsightsPayload = payload;
      await runFeature('/api/features/insights', payload, getEl('btn-insights'), getEl('insights-loading'), getEl('insights-error'), getEl('insights-output'), getEl('insights-error-msg'), (data) => {
        lastInsightsData = data;
        renderInsights(data);
      });
    });

    getEl('btn-regenerate-insights').addEventListener('click', () => {
      if (lastInsightsPayload) {
        lastInsightsPayload.model = modelSelect.value;
        getEl('insights-form').dispatchEvent(new Event('submit'));
      }
    });

    getEl('btn-save-insights').addEventListener('click', function() {
      if (lastInsightsPayload && lastInsightsData) saveToHistoryDB({ ...lastInsightsPayload, outputs: lastInsightsData, type: 'insights' }, this);
    });

    getEl('btn-export-insights').addEventListener('click', () => {
      if (lastInsightsData) downloadTxt('insights.txt', JSON.stringify(lastInsightsData, null, 2));
    });
  }

  function renderInsights(data) {
    const d = data.data || data;
    getEl('insights-audience').innerHTML = `<p>${escapeHTML(d.targetAudience || '')}</p>`;
    
    getEl('insights-interests').innerHTML = '';
    (d.interests || []).forEach(int => {
      getEl('insights-interests').innerHTML += `<li>${escapeHTML(int)}</li>`;
    });

    getEl('insights-painpoints').innerHTML = '';
    (d.painPoints || []).forEach(pt => {
      getEl('insights-painpoints').innerHTML += `<li>${escapeHTML(pt)}</li>`;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  IMPROVE CAMPAIGN
  // ═══════════════════════════════════════════════════════════════════════════
  let lastImprovePayload = null;
  let lastImproveData = null;

  if (getEl('improve-form')) {
    getEl('improve-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        campaignText: getEl('improve-text').value.trim(),
        model: modelSelect.value
      };
      lastImprovePayload = payload;
      await runFeature('/api/features/improve', payload, getEl('btn-improve'), getEl('improve-loading'), getEl('improve-error'), getEl('improve-output'), getEl('improve-error-msg'), (data) => {
        lastImproveData = data;
        renderImprove(data);
      });
    });

    getEl('btn-regenerate-improve').addEventListener('click', () => {
      if (lastImprovePayload) {
        lastImprovePayload.model = modelSelect.value;
        getEl('improve-form').dispatchEvent(new Event('submit'));
      }
    });

    getEl('btn-save-improve').addEventListener('click', function() {
      if (lastImprovePayload && lastImproveData) saveToHistoryDB({ ...lastImprovePayload, outputs: lastImproveData, type: 'improve' }, this);
    });

    getEl('btn-export-improve').addEventListener('click', () => {
      if (lastImproveData) downloadTxt('improved.txt', JSON.stringify(lastImproveData, null, 2));
    });
  }

  function renderImprove(data) {
    const d = data.data || data;
    getEl('improve-improved').textContent = d.improvedCampaign || '';
    getEl('improve-explanation').innerHTML = `<p>${formatMessage(d.explanation || '')}</p>`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  HISTORY TAB
  // ═══════════════════════════════════════════════════════════════════════════
  if (getEl('nav-history')) {
    getEl('nav-history').addEventListener('click', () => {
      loadHistory();
    });
  }

  async function loadHistory() {
    try {
      getEl('history-loading').classList.remove('hidden');
      const res = await fetch('/api/saved-campaigns/campaigns');
      const json = await res.json();
      getEl('history-loading').classList.add('hidden');
      if (!res.ok || !json.success) throw new Error(json.error);
      
      const grid = getEl('history-grid');
      grid.innerHTML = '';
      if (json.data.length === 0) {
        grid.innerHTML = '<p>No saved campaigns yet.</p>';
        return;
      }
      
      json.data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
          <span class="history-type">${escapeHTML(item.type)}</span>
          <span class="history-date">${new Date(item.created_at || item.createdAt).toLocaleString()}</span>
          <h4 style="margin: 0.5rem 0;">${escapeHTML(item.product || 'Unknown Product')}</h4>
          <p style="font-size: 0.85rem; color: #bbb; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHTML(getPreviewText(item))}
          </p>
        `;
        card.addEventListener('click', () => {
          showSavedDetails(item);
        });
        grid.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      getEl('history-loading').classList.add('hidden');
    }
  }

  function showSavedDetails(item) {
    const type = item.type || 'generator';
    // 1. Switch Tab
    const navBtn = getEl(`nav-${type === 'generator' ? 'campaign' : type}`);
    if (navBtn) navBtn.click();

    // 2. Populate Data based on type
    let d = item.outputs;
    if (d && d.data) d = d.data; // Handle potential wrapper

    if (type === 'generator') {
        window.lastCampaignData = d;
        renderCampaign(d);
    } else if (type === 'planner') {
        renderPlanner(d);
    } else if (type === 'ab-test') {
        renderAB(d);
    } else if (type === 'insights') {
        renderInsights(d);
    } else if (type === 'improve') {
        renderImprove(d);
    }
    
    // Scroll to output
    const outputEl = getEl(
        type === 'generator' ? 'campaign-output' : 
        type === 'planner' ? 'planner-output' : 
        type === 'ab-test' ? 'ab-output' : 
        type === 'insights' ? 'insights-output' : 
        'improve-output'
    );
    if (outputEl) {
        outputEl.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function getPreviewText(item) {
    try {
      let o = item.outputs;
      if (o && o.data) o = o.data; // Handle potential wrapper

      if (item.type === 'generator') return o.strategy || '...';
      if (item.type === 'planner') return o.timeline && o.timeline[0] ? (o.timeline[0].action || o.timeline[0].step || '...') : '...';
      if (item.type === 'ab-test') return o.versionA || '...';
      if (item.type === 'insights') return o.targetAudience || '...';
      if (item.type === 'improve') return o.improvedCampaign || '...';
    } catch(e) {}
    return 'Saved campaign data...';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SHARED API RUNNER
  // ═══════════════════════════════════════════════════════════════════════════
  async function runFeature(endpoint, payload, btnEl, loadingEl, errorEl, outputEl, errorMsgEl, renderCallback) {
    outputEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    loadingEl.classList.remove('hidden');
    btnEl.disabled = true;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Unknown error');

      renderCallback(json);
      loadingEl.classList.add('hidden');
      outputEl.classList.remove('hidden');
    } catch (err) {
      loadingEl.classList.add('hidden');
      errorMsgEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      btnEl.disabled = false;
    }
  }

})();
