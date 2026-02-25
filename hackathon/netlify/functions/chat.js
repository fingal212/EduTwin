exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // БЕРЕМ КЛЮЧ ИЗ НАСТРОЕК NETLIFY
        const API_KEY = process.env.GEMINI_API_KEY;

        // Защита: если ключ забыли добавить в Netlify, выводим понятную ошибку
        if (!API_KEY) {
            throw new Error("Ключ GEMINI_API_KEY не найден в переменных окружения Netlify!");
        }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        const requestBody = JSON.parse(event.body);
        const userMessage = requestBody.message || "Привет"; 
        
        let parts = [{ text: userMessage }];

        if (requestBody.image) {
            const matches = requestBody.image.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
                parts.push({
                    inline_data: { mime_type: matches[1], data: matches[2] }
                });
            }
        }

        const geminiPayload = {
            system_instruction: {
                parts: [{ text: "Ты — Saule AI, умный ассистент образовательной платформы EduTwin. Твоя задача — помогать студентам и преподавателям." }]
            },
            contents: [{ parts: parts }]
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Google API Error:", data);
            throw new Error(data.error?.message || 'Ошибка API Google');
        }

        return { statusCode: 200, headers, body: JSON.stringify(data) };

    } catch (error) {
        console.error('Ошибка функции:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};