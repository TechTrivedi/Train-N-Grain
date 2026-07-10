import fs from 'fs';
import path from 'path';

// Load local .env variables if not already set (e.g. running outside vercel dev)
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

    const { messages, page, username } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid body: "messages" array is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        return res.status(500).json({ error: 'Gemini API Key is not configured on the server.' });
    }

    // 1. Choose system prompt based on page context
    let systemText = "You are a professional, helpful fitness and nutrition coach at Train N Grain. Keep your responses motivating, structured, and practical.";
    if (page === 'fitness') {
        systemText = "You are a professional, encouraging personal fitness trainer at Train N Grain. Help users with workout plans, exercise forms, and scheduling. Motivate them!";
    } else if (page === 'nutrition') {
        systemText = "You are an expert sports nutritionist and dietitian at Train N Grain. Help users with diet plans, recipes, macro counting, and calorie intake guidelines.";
    }

    if (username) {
        systemText += ` The user's name is ${username}. Address them by name when appropriate.`;
    }

    // Strict topic restriction constraint
    systemText += "\n\nCRITICAL RULE: You must politely but firmly decline to answer any questions or discuss topics that are not related to fitness, health, workouts, training, nutrition, or diet. For example, if asked about the weather, general trivia, politics, coding, or historical facts, politely respond that your training is strictly focused on fitness and nutrition guidance on the Train N Grain platform.";

    // 2. Format conversation history into Gemini format (user vs model)
    const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    // 3. Query the Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                systemInstruction: {
                    parts: [{ text: systemText }]
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
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

        return res.status(200).json({ reply: replyText });

    } catch (err) {
        console.error('Chat error:', err);
        return res.status(500).json({ error: 'Internal Server Error.' });
    }
}
