require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize database
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        role VARCHAR(50),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('DB init error:', err);
  }
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, session_id = 'default' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Save user message
    await pool.query(
      'INSERT INTO conversations (session_id, role, content) VALUES ($1, $2, $3)',
      [session_id, 'user', message]
    );

    // Get conversation history
    const history = await pool.query(
      'SELECT role, content FROM conversations WHERE session_id = $1 ORDER BY created_at DESC LIMIT 10',
      [session_id]
    );

    const messages = [
      { role: 'system', content: 'You are Amber, a helpful AI assistant.' },
      ...history.rows.reverse().map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages
    });

    const reply = completion.choices[0].message.content;

    // Save assistant response
    await pool.query(
      'INSERT INTO conversations (session_id, role, content) VALUES ($1, $2, $3)',
      [session_id, 'assistant', reply]
    );

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
initDB().then(() => {
  app.listen(port, () => {
    console.log(`Amber AI server running on port ${port}`);
  });
});
