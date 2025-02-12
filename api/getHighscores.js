// api/getHighscores.js
export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({
            error: 'Method Not Allowed'
        });
    }

    const KV_REST_API_URL = process.env.KV_REST_API_URL;
    const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

    try {
        const res = await fetch(`${KV_REST_API_URL}/get/highscores`, {
            headers: {
                Authorization: `Bearer ${KV_REST_API_TOKEN}`,
            },
        });

        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();
        const highscores = data.result || {}; // Adjust based on Upstash response structure

        return response.status(200).json(highscores);
    } catch (error) {
        console.error(error);
        return response.status(500).json({
            error: 'Failed to retrieve highscores'
        });
    }
}
