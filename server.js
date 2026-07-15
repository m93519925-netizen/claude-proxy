require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const SESSION_KEY = process.env.SESSION_KEY;
const ORG_ID = process.env.ORG_ID;
const PORT = process.env.PORT || 3000;

if (!SESSION_KEY || !ORG_ID) {
  console.error('❌ Thiếu SESSION_KEY hoặc ORG_ID trong file .env');
  process.exit(1);
}

const getHeaders = () => ({
  'cookie': `sessionKey=${SESSION_KEY}`,
  'content-type': 'application/json',
  'origin': 'https://claude.ai',
  'referer': 'https://claude.ai/',
  'anthropic-client-platform': 'web_claude_ai',
  'anthropic-device-id': uuidv4(),
  'user-agent': 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',
  'accept': 'text/event-stream, application/json',
  'accept-language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
  'accept-encoding': 'gzip, deflate, br',
  'connection': 'keep-alive',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
});

async function createConversation() {
  const res = await fetch(
    `https://claude.ai/api/organizations/${ORG_ID}/chat_conversations`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ uuid: uuidv4(), name: '' })
    }
  );

  console.log('Create conv status:', res.status);
  console.log('Create conv headers:', JSON.stringify([...res.headers.entries()]));

  const text = await res.text();
  console.log('Create conv body:', text.slice(0, 500));

  if (!res.ok) {
    throw new Error(`Failed to create conversation: ${res.status} - ${text.slice(0, 100)}`);
  }

  const data = JSON.parse(text);
  return data.uuid;
}

async function streamMessage(prompt, convId, model = 'claude-sonnet-4-6') {
  const payload = {
    prompt,
    parent_message_uuid: '00000000-0000-0000-0000-000000000000',
    timezone: 'Asia/Saigon',
    model,
    attachments: [],
    files: [],
    sync_sources: [],
    tools: [],
    thinking_mode: 'off',
    effort: 'low',
    locale: 'en-US',
    rendering_mode: 'messages',
    turn_message_uuids: {
      human_message_uuid: uuidv4(),
      assistant_message_uuid: uuidv4()
    }
  };

  const res = await fetch(
    `https://claude.ai/api/organizations/${ORG_ID}/chat_conversations/${convId}/completion`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    }
  );

  console.log('Stream status:', res.status);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to stream: ${res.status} - ${text.slice(0, 100)}`);
  }

  return res;
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Claude Proxy running 🚀' });
});

// Proxy endpoint
app.post('/proxy', async (req, res) => {
  const { prompt, model } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Thiếu prompt' });
  }

  try {
    const convId = await createConversation();
    const claudeRes = await streamMessage(prompt, convId, model);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    claudeRes.body.on('data', chunk => res.write(chunk));
    claudeRes.body.on('end', () => res.end());
    claudeRes.body.on('error', err => {
      console.error('Stream error:', err);
      res.end();
    });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Claude Proxy chạy tại http://localhost:${PORT}`);
});
