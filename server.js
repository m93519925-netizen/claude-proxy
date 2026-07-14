// server.js
const express = require('express');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const SESSION_KEY = 'sk-ant-sid02-...'; // paste session key mới vào đây
const ORG_ID = 'b13aee14-47c7-4677-a58c-2f3eee8d047c';

const HEADERS = {
  'cookie': `sessionKey=${SESSION_KEY}`,
  'content-type': 'application/json',
  'origin': 'https://claude.ai',
  'anthropic-client-platform': 'web_claude_ai',
  'anthropic-device-id': uuidv4(),
  'user-agent': 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',
  'accept': 'text/event-stream',
  'referer': 'https://claude.ai/',
};

// Tạo conversation mới
async function createConversation() {
  const res = await fetch(
    `https://claude.ai/api/organizations/${ORG_ID}/chat_conversations`,
    {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ uuid: uuidv4(), name: '' })
    }
  );
  const data = await res.json();
  console.log('Create conv status:', res.status);
  return data.uuid;
}

// Stream message
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
    effort: 'normal',
    locale: 'en-US',
    rendering_mode: 'messages',
    turn_message_uuids: {
      human_message_uuid: uuidv4(),
      ai_message_uuid: uuidv4()
    }
  };

  const res = await fetch(
    `https://claude.ai/api/organizations/${ORG_ID}/chat_conversations/${convId}/completion`,
    {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(payload)
    }
  );

  return res;
}

// Endpoint nhận request từ Colab
app.post('/proxy', async (req, res) => {
  try {
    const { prompt, model } = req.body;

    const convId = await createConversation();
    const claudeRes = await streamMessage(prompt, convId, model);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');

    claudeRes.body.on('data', chunk => {
      res.write(chunk);
    });

    claudeRes.body.on('end', () => {
      res.end();
    });

    claudeRes.body.on('error', err => {
      console.error('Stream error:', err);
      res.end();
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.json({ status: 'Termux proxy running' }));

app.listen(3000, () => console.log('🚀 Proxy chạy tại http://localhost:3000'));
