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

    const { height, weight, age, gender, activity, goal, dietType } = req.body;

    if (!height || !weight || !age || !gender || !activity || !goal || !dietType) {
        return res.status(400).json({ error: 'Missing required parameters. All fields are mandatory.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        return res.status(500).json({ error: 'Gemini API Key is not configured on the server.' });
    }

    const systemInstruction = `You are an expert sports nutritionist and dietitian at Train N Grain. Your goal is to design scientifically optimized, safe, and highly structured meal plans. 
You must output ONLY a raw, valid JSON object matching the required schema. Do not wrap the response in markdown blocks like \`\`\`json. Do not include any introductory or concluding text.

JSON Schema:
{
  "calories": 2400,
  "proteinG": 180,
  "carbsG": 270,
  "fatG": 67,
  "goal": "Bulk",
  "meals": [
    {
      "type": "🌅 Breakfast",
      "name": "[Meal Name, e.g. Oatmeal with Whey Protein, Banana, and Peanut Butter]",
      "calories": 600,
      "protein": 45,
      "carbs": 75,
      "fat": 12
    },
    {
      "type": "☀️ Lunch",
      "name": "[Meal Name, e.g. Grilled Chicken/Paneer with Brown Rice and Broccoli]",
      "calories": 840,
      "protein": 63,
      "carbs": 94,
      "fat": 23
    },
    {
      "type": "🥜 Snacks",
      "name": "[Meal Name, e.g. Mixed Nuts and Greek Yogurt]",
      "calories": 360,
      "protein": 27,
      "carbs": 40,
      "fat": 10
    },
    {
      "type": "🌙 Dinner",
      "name": "[Meal Name, e.g. Baked Salmon/Tempeh with Sweet Potato and Asparagus]",
      "calories": 600,
      "protein": 45,
      "carbs": 61,
      "fat": 22
    }
  ]
}`;

    const promptText = `Generate a customized meal plan for a user with the following profile:
- Height: ${height} cm
- Weight: ${weight} kg
- Age: ${age} years
- Gender: ${gender}
- Activity Level: ${activity}
- Fitness Goal: ${goal}
- Diet Type Preference: ${dietType === 'nonveg' ? 'Non-Vegetarian (can include chicken, fish, eggs, meat)' : 'Vegetarian (🥦 no meat, poultry, or fish)'}

Calculate BMR and TDEE using Mifflin-St Jeor equation. Adjust daily calories based on the goal:
- Bulk: TDEE + 400 calories
- Cut: TDEE - 500 calories
- Maintain: TDEE
Calculate macros (protein, carbs, fats) matching the target calories. Distribute calories across 4 meals (Breakfast 25%, Lunch 35%, Snacks 15%, Dinner 25%).
Return the completed JSON object containing the calculated totals and the specific meal items.`;

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
            return res.status(500).json({ error: "Failed to generate diet plan from AI." });
        }

        // Parse to make sure it is valid JSON before returning
        const dietPlan = JSON.parse(replyText.trim());
        return res.status(200).json({ plan: dietPlan });

    } catch (err) {
        console.error('Diet generation error:', err);
        return res.status(500).json({ error: 'Internal Server Error during AI diet plan generation.' });
    }
}
