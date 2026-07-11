require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

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

// Load training data
let amberPersonality = '';
let trainingModules = {};

function loadTrainingData() {
  try {
    const trainingDir = path.join(__dirname, 'AI_TRAINING_SYSTEM', 'clean_copy');
    const files = fs.readdirSync(trainingDir);
    
    let allTraining = [];
    
    files.forEach(file => {
      if (file.endsWith('.txt')) {
        const content = fs.readFileSync(path.join(trainingDir, file), 'utf8');
        const moduleName = file.replace('.txt', '');
        trainingModules[moduleName] = content;
        allTraining.push(`\n=== ${moduleName} ===\n${content}`);
      }
    });
    
    // Build comprehensive personality prompt
    amberPersonality = `You are Amber, an expert OnlyFans content creator and chat specialist. You have deep knowledge of:

${allTraining.join('\n')}

CRITICAL INSTRUCTIONS:
1. ALWAYS text like a real human girl - casual, flirty, sometimes uses emojis, imperfect grammar is OK
2. NEVER sound robotic or overly professional
3. Use the texting styles from your training - mix short and long messages, use voice notes strategically
4. Build genuine connection before selling - follow the 3-chat rule
5. Handle objections smoothly using the three-step method from your training
6. Use aftercare after every sale or intimate conversation
7. Take notes on subscribers and reference them in future chats
8. Progress the conversation naturally toward sales when appropriate
9. Be playful, teasing, but authentic - not a corporate chatbot
10. Remember: You're a real person, not an AI assistant

Current conversation context: You're chatting with a fan/subscriber. Be natural, engaging, and use your training to maximize both connection and revenue.`;
    
    console.log(`Loaded ${Object.keys(trainingModules).length} training modules`);
  } catch (err) {
    console.error('Training data load error:', err);
    // Fallback personality
    amberPersonality = 'You are Amber, a helpful AI assistant.';
  }
}

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
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriber_notes (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database initialized');
  } catch (err) {
    console.error('DB init error:', err);
  }
}

// Get conversation history with notes
async function getContext(session_id) {
  const history = await pool.query(
    'SELECT role, content FROM conversations WHERE session_id = $1 ORDER BY created_at DESC LIMIT 15',
    [session_id]
  );
  
  const notes = await pool.query(
    'SELECT note FROM subscriber_notes WHERE session_id = $1 ORDER BY created_at DESC LIMIT 5',
    [session_id]
  );
  
  return {
    history: history.rows.reverse(),
    notes: notes.rows.map(n => n.note)
  };
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

    // Get context
    const { history, notes } = await getContext(session_id);
    
    // Build system message with personality and notes
    let systemContent = amberPersonality;
    if (notes.length > 0) {
      systemContent += `\n\nSUBSCRIBER NOTES (remember these details): ${notes.join('; ')}`;
    }

    const messages = [
      { role: 'system', content: systemContent },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    // Call OpenAI with higher temperature for more human-like responses
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.85,  // Higher = more creative/human-like
      max_tokens: 800
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

// Add note endpoint
app.post('/api/notes', async (req, res) => {
  try {
    const { note, session_id = 'default' } = req.body;
    await pool.query(
      'INSERT INTO subscriber_notes (session_id, note) VALUES ($1, $2)',
      [session_id, note]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Note error:', error);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    training_loaded: Object.keys(trainingModules).length,
    timestamp: new Date().toISOString() 
  });
});

// Start server
loadTrainingData();
initDB().then(() => {
  app.listen(port, () => {
    console.log(`Amber AI server running on port ${port}`);
    console.log(`Training modules loaded: ${Object.keys(trainingModules).length}`);
  });
});
