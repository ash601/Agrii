const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/chat/sessions - Create new chat session
router.post('/sessions', auth, async (req, res, next) => {
  try {
    const session = await prisma.chatSession.create({
      data: {
        userId: req.user.id,
        title: req.body.title || 'New Chat',
      },
    });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/sessions - List user's sessions
router.get('/sessions', auth, async (req, res, next) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true },
        },
      },
    });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/sessions/:id/messages - Get session messages
router.get('/sessions/:id/messages', auth, async (req, res, next) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

// POST /api/chat/sessions/:id/messages - Send message
router.post('/sessions/:id/messages', auth, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    // Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content,
      },
    });

    // Build conversational history
    const history = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // Generate AI response via Claude
    const aiResponse = await callClaudeAPI(content, history, req.user);

    // Save AI response
    const savedResponse = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: aiResponse,
      },
    });

    // Update session title from first message
    if (history.length <= 1) {
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { title: content.substring(0, 50) + (content.length > 50 ? '...' : '') },
      });
    }

    res.json({
      userMessage: { role: 'user', content, createdAt: new Date() },
      aiMessage: savedResponse,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/chat/sessions/:id
router.delete('/sessions/:id', auth, async (req, res, next) => {
  try {
    await prisma.chatSession.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    res.json({ message: 'Session deleted.' });
  } catch (error) {
    next(error);
  }
});

// Claude AI response generator
async function callClaudeAPI(question, history, user) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey || apiKey === 'mock') {
    return `Error: Anthropic API key is missing or set to "mock". Please update it in the server's .env file.`;
  }

  // Fetch local weather immediately before generating the prompt!
  let weatherContextStr = 'No local weather data currently available.';
  try {
    const { getLiveWeather } = require('../services/weather.service');
    const liveWeather = await getLiveWeather(user.state, user.district);
    if (liveWeather && liveWeather.condition !== 'Unknown') {
      weatherContextStr = `${liveWeather.temperature}°C, ${liveWeather.humidity}% Humidity, ${liveWeather.condition} in ${liveWeather.city}`;
    }
  } catch (err) {
    console.error('Failed to inject weather into Chat context:', err);
  }

  const systemPrompt = `You are AgriTrade AI, an expert agricultural market assistant designed to help Indian farmers and buyers.
You have deep knowledge of weather impacts, crop cycles, diseases, yield forecasting, and storage best practices.
Current user: ${user.name} (Role: ${user.role}, Location: ${user.district}, ${user.state}). Tailor your advice for their specific role and location.

Live Context for ${user.district}, ${user.state}:
- CURRENT WEATHER: ${weatherContextStr}

IMPORTANT LANGUAGE INSTRUCTIONS:
- You must answer in the specific language the user requests (e.g., "answer in Hindi", "tell me in Hinglish").
- If the user writes in Hindi or Hinglish, reply in the same natural Hindi/Hinglish language.
- By default, be concise, highly practical, and use emojis where appropriate to make information scannable.`;

  const messages = history.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content || '',
  }));

  // Append current question
  messages.push({ role: 'user', content: question });

  const payload = {
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages
  };

  try {
    // Workaround for Node.js ETIMEDOUT network blocking issue on some macOS setups
    // Uses a child_process curl connection instead of native fetch 
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Escape single quotes safely for bash
    const safePayload = JSON.stringify(payload).replace(/'/g, "'\\''");

    const curlCmd = `curl -s -X POST https://api.anthropic.com/v1/messages \\
      -H "x-api-key: ${apiKey}" \\
      -H "anthropic-version: 2023-06-01" \\
      -H "content-type: application/json" \\
      -d '${safePayload}'`;

    const { stdout, stderr } = await execAsync(curlCmd, { maxBuffer: 5 * 1024 * 1024 });

    if (!stdout || stdout.trim() === '') {
      return 'I encountered an empty response from the AI server.';
    }

    const data = JSON.parse(stdout);

    if (data.type === 'error') {
      console.error('Anthropic API Error:', data);
      return `API Error: ${data.error?.message || 'Unknown API issue'}`;
    }

    return data.content && data.content[0] ? data.content[0].text : 'No response received from AI.';

  } catch (error) {
    console.error('Failed to fetch from Anthropic:', error);
    return `System / Curl Error: ${error.message}`;
  }
}

module.exports = router;
