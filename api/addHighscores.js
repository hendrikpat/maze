// api/addHighscore.js
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({
            error: 'Method Not Allowed'
        });
    }

    const {
        username,
        score
    } = request.body;

    if (!username || !score) {
        return response.status(400).json({
            error: 'Missing username or score'
        });
    }

    const KV_REST_API_URL = process.env.KV_REST_API_URL;
    const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

    try {
        // Get existing highscores
        const getRes = await fetch(`${KV_REST_API_URL}/get/highscores`, {
            headers: {
                Authorization: `Bearer ${KV_REST_API_TOKEN}`,
            },
        });

        if (!getRes.ok) {
            throw new Error(`HTTP error! Status: ${getRes.status}`);
        }

        const getData = await getRes.json();
        let highscores = getData.result || {};

        // Add or update the new highscore
        highscores[username] = parseInt(score);

        // Set the updated highscores
        const setRes = await fetch(`${KV_REST_API_URL}/set/highscores`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${KV_REST_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(highscores),
        });

        if (!setRes.ok) {
            throw new Error(`HTTP error! Status: ${setRes.status}`);
        }

        return response.status(200).json({
            success: true
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({
            error: 'Failed to add highscore'
        });
    }
}
