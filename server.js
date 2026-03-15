require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API route for chatbot (replaces api/chat.php)
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { messages } = req.body;
  if (!messages) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        stream: true,
        max_tokens: 800,
        temperature: 0.7
      })
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();
  } catch (err) {
    console.error('Chat API error:', err);
    res.status(500).json({ error: 'Failed to fetch AI response' });
  }
});

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Redirect .html URLs to clean URLs for SEO (301 permanent redirect)
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const clean = req.path === '/index.html' ? '/' : req.path.slice(0, -5);
    return res.redirect(301, clean);
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Tavira Digital running on port ${PORT}`);
});
