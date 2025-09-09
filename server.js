import express from 'express';
import 'dotenv/config';
import {GoogleGenAI} from '@google/genai';
import sqlite3 from 'sqlite3';

const app = express()
app.use(express.json())



const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("Set GEMINI_API_KEY in .env & DONT COMMIT!!!");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

app.post('/api/generate', async (req, res) => {
    const prompt = req.body?.prompt || `Return ONE JSON object with keys "A" and "B" for a funny or hot-topic Would You Rather. Each value: 8-60 chars, plain phrase only, no question text, bullets, arrays, or extra text. Output only the JSON. Example: {"A":"Fly","B":"Be invisible"}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-001',
            contents: prompt
        });
        const text = response?.text ?? JSON.stringify(response);
        res.json({ ok: true, text });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: err?.message ?? String(err) });
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is up on ${PORT}`))