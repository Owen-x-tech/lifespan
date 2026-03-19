const SYSTEM_PROMPT = `You analyze food photos and estimate nutritional content. Given an image of food, identify it and return a JSON object with these exact fields:

{
  "food_name": "string - name of the food item",
  "portion": "string - estimated portion size with weight",
  "calories": number,
  "saturated_fat_g": number,
  "trans_fat_g": number,
  "sodium_mg": number,
  "sugar_g": number,
  "fibre_g": number,
  "is_processed_meat": boolean,
  "is_red_meat": boolean,
  "is_fruit_or_veg": boolean,
  "is_whole_food": boolean
}

Be accurate with nutritional estimates. Use standard nutrition databases as reference. If you see packaging with nutrition info, use those values. Return ONLY the JSON object.`;

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
            { type: 'text', text: 'Identify this food and estimate its nutrition.' },
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
  const nutrition = JSON.parse(data.choices[0].message.content);
  return res.json(nutrition);
}
