const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const Redis = require('redis');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const redis = Redis.createClient({
  url: process.env.REDIS_URL
});
redis.connect();

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Import services
const { buildPrompt } = require('./prompts/amberSystem');
const { makeDecision } = require('./services/decisionEngine');
const { extractMemories } = require('./services/memoryService');
const { checkSafety } = require('./services/safetyChecker');

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    creator: process.env.CREATOR_NAME,
    version: '1.0.0',
    modules: 22
  });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { fanId, message, threadId } = req.body;
    
    // Get context
    const fan = await pool.query(
      'SELECT * FROM fans WHERE id = $1 OR platform_fan_id = $2',
      [fanId, fanId]
    );
    
    if (fan.rows.length === 0) {
      return res.status(404).json({ error: 'Fan not found' });
    }
    
    const fanData = fan.rows[0];
    
    // Get memories
    const memories = await pool.query(
      'SELECT * FROM fan_memories WHERE fan_id = $1 ORDER BY created_at DESC LIMIT 10',
      [fanData.id]
    );
    
    // Get recent messages
    const recent = await pool.query(
      `SELECT * FROM messages WHERE thread_id = $1 ORDER BY sent_at DESC LIMIT 10`,
      [threadId]
    );
    
    // Make decision
    const decision = await makeDecision(fanData, recent.rows, message);
    
    // Check safety
    const safety = checkSafety(message);
    if (!safety.safe) {
      return res.json({ 
        response: "im not really comfortable with that 😔",
        decision: 'safety_decline',
        reason: safety.reason
      });
    }
    
    // Build prompt with ALL 22 modules
    const prompt = buildPrompt({
      fan: fanData,
      memories: memories.rows,
      recentMessages: recent.rows,
      currentMessage: message,
      stage: decision.stage
    });
    
    // Generate response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message }
      ],
      temperature: 0.9,
      max_tokens: 150
    });
    
    let response = completion.choices[0].message.content;
    
    // Post-process (enforce style rules from Video 6, 7)
    response = response.toLowerCase();
    response = response.replace(/\bamber\b/g, 'Amber');
    response = response.replace(/[.,'"]/g, '');
    
    // Save messages
    await pool.query(
      'INSERT INTO messages (thread_id, sender_type, direction, content) VALUES ($1, $2, $3, $4)',
      [threadId, 'fan', 'inbound', message]
    );
    
    await pool.query(
      'INSERT INTO messages (thread_id, sender_type, direction, content) VALUES ($1, $2, $3, $4)',
      [threadId, 'ai', 'outbound', response]
    );
    
    // Extract and save memories
    const newMemories = await extractMemories(message, response);
    for (const mem of newMemories) {
      await pool.query(
        'INSERT INTO fan_memories (fan_id, memory_type, content, confidence) VALUES ($1, $2, $3, $4)',
        [fanData.id, mem.type, mem.content, mem.confidence]
      );
    }
    
    // Log decision
    await pool.query(
      'INSERT INTO ai_decisions (thread_id, decision_type, confidence, reason) VALUES ($1, $2, $3, $4)',
      [threadId, decision.type, decision.confidence, decision.reason]
    );
    
    res.json({
      response,
      decision: decision.type,
      stage: decision.stage,
      confidence: decision.confidence
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get threads
app.get('/api/threads', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, f.display_name, f.value_score 
      FROM fan_threads t
      JOIN fans f ON t.fan_id = f.id
      ORDER BY t.updated_at DESC
    `);
    res.json({ threads: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Amber AI API running on port ${PORT}`);
});
