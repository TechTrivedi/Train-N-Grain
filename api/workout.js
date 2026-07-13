import fs from 'fs';
import path from 'path';

// Load local .env variables if not already set
if (!process.env.GEMINI_API_KEY) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const val = parts.slice(1).join('=').trim();
                    if (key) process.env[key] = val;
                }
            });
        }
    } catch (e) {
        console.warn('Could not read local .env file:', e.message);
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { age, gender, goal, level, equipment } = req.body;

    if (!goal || !level || !equipment) {
        return res.status(400).json({ error: 'Missing required parameters: goal, level, and equipment are mandatory.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        return res.status(500).json({ error: 'Gemini API Key is not configured on the server.' });
    }

    const systemInstruction = `You are an expert personal trainer at Train N Grain. Your goal is to design scientifically optimized, safe, and highly structured workout routines. 
You must output ONLY a raw, valid JSON array matching the required schema. Do not wrap the response in markdown blocks like \`\`\`json. Do not include any introductory or concluding text.

JSON Schema:
[
  {
    "day": "Day 1: [Focus Area, e.g. Upper Body Strength]",
    "exercises": [
      {
        "name": "[Exercise Name, e.g. Dumbbell Bench Press]",
        "sets": 3,
        "reps": "10-12",
        "instruction": "[Actionable form tip, e.g. Keep elbows at 45 degrees, drive through your heels]"
      }
    ]
  }
]`;

    const promptText = `Generate a customized workout program for a user with the following profile:
- Age: ${age || 'N/A'}
- Gender: ${gender || 'N/A'}
- Fitness Goal: ${goal}
- Experience Level: ${level}
- Available Equipment: ${equipment}

Design a weekly routine of 3 to 5 training days depending on the experience level. Choose relevant exercises, specify sets, reps, and brief, actionable form instructions.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }],
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            return res.status(response.status).json({
                error: errData.error?.message || 'Gemini API error occurred.'
            });
        }

        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!replyText) {
            return res.status(500).json({ error: "Failed to generate workout plan from AI." });
        }

        // Parse to make sure it is valid JSON before returning
        const workoutPlan = JSON.parse(replyText.trim());
        return res.status(200).json({ plan: workoutPlan });

    } catch (err) {
        console.error('Workout generation error:', err);
        return res.status(500).json({ error: 'Internal Server Error during AI plan generation.' });
    }
}
