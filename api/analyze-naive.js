const SYSTEM_PROMPT = `You are a health estimation AI. Given an image of food, estimate how many minutes of life expectancy this single serving adds or removes, based on your general knowledge of nutrition and epidemiology.

Return a JSON object with these exact fields:
{
  "food_name": "string - name of the food item",
  "portion": "string - estimated portion size",
  "minutes": number (positive = life gained, negative = life lost),
  "reasoning": "string - brief explanation of your estimate"
}

Be specific with the minutes number. Don't hedge — give your best single estimate. Return ONLY the JSON object.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured — missing API key' });
  }

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'How many minutes of life does this food add or remove per serving?' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return res.status(response.status).json({
      error: err.error?.message || `OpenAI API error: ${response.status}`
    });
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);
  return res.json(result);
}
