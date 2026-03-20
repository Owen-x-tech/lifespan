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
  "fruit_veg_servings": "number - count of full fruit/vegetable servings (1 serving = ~80g/3oz). Only count meaningful portions, not garnishes or trace ingredients. A side of asparagus = 1, a large salad with multiple veggies = 2-3, a few berries on top of oatmeal = 0.",
  "is_oily_fish": "boolean - true for salmon, mackerel, sardines, herring, trout, anchovies",
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

  const { image, smokes } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  let systemPrompt = SYSTEM_PROMPT;
  if (smokes) {
    systemPrompt += '\n\nThe user is a smoker. Consider how smoking interacts with food\'s nutritional profile — antioxidant-rich foods may have amplified positive impact, while processed foods with nitrates may compound negative effects.';
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
        { role: 'system', content: systemPrompt },
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
