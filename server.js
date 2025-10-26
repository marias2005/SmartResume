import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import Resume from './models/Resume.js';
import OpenAI from 'openai';

dotenv.config();
console.log("ENV LOADED:");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Loaded" : "❌ Missing");
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing");

const app = express();
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60 * 1000, max: 60 }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err.message));

// OpenAI client
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY not set. AI generation won't work.");
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Test route
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.get('/', (req, res) => res.send('✅ Smart Resume Builder Backend running!'));
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date() }));

// Generate AI suggestions
app.post('/api/generate', async (req, res) => {
  if (!openai) return res.status(500).json({ ok: false, error: "OpenAI not configured" });

  try {
    const { text, tone = 'Professional', focus = 'General' } = req.body;
    if (!text) return res.status(400).json({ ok: false, error: "Missing resume text" });

const prompt = `
You are an expert resume writer.
Rewrite this resume text in a ${tone} tone.
Focus on improving the ${focus} section.
Make it sound concise, professional, and impactful.

Resume Text:
${text}
`;


    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: prompt,
      max_output_tokens: 500,
    });

    let suggestion = '';
    if (response.output_text) {
      suggestion = response.output_text;
    } else if (response.output?.[0]?.content?.[0]?.text) {
      suggestion = response.output[0].content[0].text;
    } else {
      suggestion = '⚠️ No AI suggestion generated.';
    }

    res.json({ ok: true, suggestion: suggestion.trim() });
  } catch (err) {
    console.error('Generate error:', err.message || err);
    res.status(500).json({ ok: false, error: err.message ?? String(err) });
  }
});

// Save resume
app.post('/api/resumes', async (req, res) => {
  try {
    const doc = await Resume.create(req.body);
    res.json({ ok: true, resume: doc });
  } catch (err) {
    console.error('Save resume error:', err.message || err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// List resumes
app.get('/api/resumes', async (req, res) => {
  try {
    const docs = await Resume.find().sort({ createdAt: -1 }).limit(50);
    res.json({ ok: true, resumes: docs });
  } catch (err) {
    console.error('List resumes error:', err.message || err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Backend listening on port ${PORT}`));
