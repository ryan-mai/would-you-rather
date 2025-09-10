import express from 'express';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const distPath = path.resolve(process.cwd(), 'dist');
console.log('process.cwd() =', process.cwd());
console.log('Resolved distPath =', distPath, 'exists?', fs.existsSync(distPath));
if (fs.existsSync(distPath)) console.log('dist contents:', fs.readdirSync(distPath));

app.use(express.static(distPath));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not set in environment. AI calls will fail. Set this in Render dashboard and rotate the exposed key.');
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

app.post('/api/generate', async (req, res) => {
  const prompt = req.body?.prompt || `Create a JSON object for a "Would You Rather" game.  
    - The JSON must contain exactly two keys: "choiceA" and "choiceB".  
    - Each value must be a string between 8 and 100 characters.  
    - The comparison must be humorous, interesting, or a commonly debated hot topic.  
    - Themes of the question should surround superpowers, food, gaming, art, and lifestyle.
    - The target audience is teenagers or young adults.  
    - Do not include arrays, extra keys, explanations, or text outside the JSON.  
    - Output only the JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt
    });

    const text = response?.text ?? JSON.stringify(response);
    const cleaned = text.replace(/```json|```/g, '').trim();

    let parsed = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      const m = cleaned.match(/(\[.*\]|\{.*\})/s);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch (e) { parsed = null; }
      }
    }

    const parsedArray = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? [parsed] : []);
    const candidates = parsedArray.map(c => ({
      choiceA: String(c?.choiceA ?? c?.A ?? c?.a ?? '').trim(),
      choiceB: String(c?.choiceB ?? c?.B ?? c?.b ?? '').trim()
    })).filter(c => c.choiceA && c.choiceB);

    let out = candidates;

    res.json({ ok: true, text: JSON.stringify(out.slice(0, 10)) });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ ok: false, error: err?.message ?? String(err) });
  }
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  const indexFile = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexFile)) {
    console.error('index.html not found at', indexFile);
    return res.status(500).send('index.html not found (build may have failed)');
  }
  res.sendFile(indexFile);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is up on ${PORT}`));