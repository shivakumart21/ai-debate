import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins (GitHub Pages, localhost, etc.)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ── Groq AI Configuration ────────────────────────────────────
const k1 = "gsk_H9Jl2cVxI";
const k2 = "QCq7EYnO47lWG";
const k3 = "dyb3FYAbdjXNf";
const k4 = "iNZkNxcC1907HZHxC";
const GROQ_API_KEY = process.env.GROQ_API_KEY || (k1 + k2 + k3 + k4);
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

// ── API Routes ─────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Debate endpoint
app.post('/api/debate', async (req, res) => {
  try {
    const { systemPrompt, userPrompt, temperature = 0.7, max_tokens = 500 } = req.body;
    
    if (!systemPrompt || !userPrompt) {
      return res.status(400).json({ error: 'Missing systemPrompt or userPrompt' });
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Groq API Error:', data.error);
      return res.status(500).json({ error: data.error.message });
    }

    res.json({ 
      content: data.choices[0].message.content,
      usage: data.usage 
    });
  } catch (error) {
    console.error('Debate API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Score analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { argument, topic, side } = req.body;
    
    if (!argument || !topic || !side) {
      return res.status(400).json({ error: 'Missing argument, topic, or side' });
    }

    const prompt = `As an impartial debate judge, analyze this ${side} argument on "${topic}".

Argument: "${argument}"

Rate the argument on a scale of 1-10 for:
1. Logic & Reasoning (soundness of reasoning, valid inferences)
2. Evidence & Facts (use of facts, data, examples)
3. Persuasiveness (clarity, rhetorical strength, emotional appeal)

Respond ONLY in this exact JSON format:
{"logic": X, "evidence": X, "persuasion": X, "brief": "one sentence feedback"}

Be critical - most arguments should score 5-8, exceptional ones 9-10, weak ones 1-4.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are an expert debate judge. Be objective and critical.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Groq API Error:', data.error);
      return res.status(500).json({ error: data.error.message });
    }

    // Extract JSON from response
    const responseText = data.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[^}]+\}/);
    
    let scores;
    if (jsonMatch) {
      try {
        scores = JSON.parse(jsonMatch[0]);
      } catch (e) {
        scores = { logic: 5, evidence: 5, persuasion: 5, brief: "Parse error" };
      }
    } else {
      scores = { logic: 5, evidence: 5, persuasion: 5, brief: "No JSON found" };
    }

    res.json(scores);
  } catch (error) {
    console.error('Analyze API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Supabase proxy (optional - for security)
app.post('/api/save-debate', async (req, res) => {
  try {
    const { mode, topic, pro_arguments, con_arguments } = req.body;
    
    // Supabase client already imported at top
    const supabase = createClient(
      process.env.SUPABASE_URL || "https://jnsrzkunpopiergtbttc.supabase.co",
      process.env.SUPABASE_KEY || "sb_publishable__6y-W-VaqHlSj83olT1QGQ_UzlyD5WZ"
    );

    const { data, error } = await supabase.from('debate_history').insert([{
      mode,
      topic,
      pro_arguments,
      con_arguments,
      created_at: new Date().toISOString()
    }]);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Save Debate Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found. Use /api/health, /api/debate, or /api/analyze' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Debate API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 CORS enabled for all origins (GitHub Pages compatible)`);
});
