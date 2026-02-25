exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) throw new Error('API ключ не найден');

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

        // Парсим данные от клиента (текст + картинка)
        const requestBody = JSON.parse(event.body);
        const userMessage = requestBody.message || "Посмотри на это фото"; 
        const imageBase64 = requestBody.image; // Получаем картинку, если она есть

        // Собираем части запроса (parts)
        let parts = [{ text: userMessage }];

        // Если есть картинка, добавляем её в запрос для Gemini
        if (imageBase64) {
            // Вытаскиваем тип (mime type) и сами данные (base64)
            const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
                parts.push({
                    inline_data: {
                        mime_type: matches[1],
                        data: matches[2]
                    }
                });
            }
        }

        const geminiPayload = {
            system_instruction: {
                parts: [{ text: "Ты — Saule AI, умный ассистент платформы EduTwin. Твоя задача — помогать студентам. Материалы курса: https://drive.google.com/drive/folders/1_n1e_KxUTyCqMp2RoDQLJ9QZiDAFwAhn" }]
            },
            contents: [{ parts: parts }]
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error?.message || 'Ошибка API Google');

        return { statusCode: 200, headers, body: JSON.stringify(data) };

    } catch (error) {
        console.error('Ошибка функции:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};