const IMPROVE_PROMPT = `You are a nutrition coach. Given a meal's nutrition data and scoring factors, suggest 3-5 specific ingredient swaps or modifications to improve this exact meal's health score.

Each suggestion should:
- Name the specific swap (e.g., "Replace white rice with brown rice")
- Explain which scoring factor it improves (e.g., "Adds +5g fibre")
- Estimate the minute impact using these rules:
  - Per fruit/veg serving added (1 discrete fruit/veg = 1 serving, ~80g for mixed dishes, max 5): +15 min
  - Add oily fish (salmon, mackerel, sardines): +15 min
  - Remove processed meat serving: +30 min
  - Swap red meat for non-red-meat: +15 min
  - Per 5g saturated fat reduced: +7 min
  - Per 1g trans fat reduced: +12 min
  - Per 500mg sodium reduced: +6 min
  - Per 10g added sugar reduced: +4.5 min
  - Per 5g fibre added: +6 min

If the meal is already healthy, acknowledge that and suggest small enhancements.

Return JSON: { "tips": [{ "swap": "string", "why": "string", "impact": "+N min" }] }`;

const IDEAS_PROMPT = `You are a nutrition coach. Given a meal's name and nutrition profile, suggest 3 alternative meals in the same category (same meal occasion/cuisine type) that would score much better for longevity.

For each meal, estimate realistic nutrition values per serving using standard nutrition databases as reference. For fruit_veg_servings, count each discrete fruit/vegetable as 1 serving (~80g for mixed dishes). Do not count garnishes or trace ingredients. Cap at 5 max.

Return JSON: { "meals": [{ "name": "string", "description": "string - one sentence", "key_benefits": ["string"], "nutrition": { "calories": number, "saturated_fat_g": number, "trans_fat_g": number, "sodium_mg": number, "added_sugar_g": number, "fibre_g": number, "is_processed_meat": boolean, "is_red_meat": boolean, "fruit_veg_servings": number, "is_oily_fish": boolean } }] }`;

const GENERAL_IDEAS_PROMPT = `You are a nutrition coach. Suggest 3 healthy meals that score well for longevity. Include a mix of breakfast, lunch, and dinner options.

For each meal, estimate realistic nutrition values per serving using standard nutrition databases as reference. For fruit_veg_servings, count each discrete fruit/vegetable as 1 serving (~80g for mixed dishes). Do not count garnishes or trace ingredients. Cap at 5 max.

Return JSON: { "meals": [{ "name": "string", "description": "string - one sentence", "key_benefits": ["string"], "nutrition": { "calories": number, "saturated_fat_g": number, "trans_fat_g": number, "sodium_mg": number, "added_sugar_g": number, "fibre_g": number, "is_processed_meat": boolean, "is_red_meat": boolean, "fruit_veg_servings": number, "is_oily_fish": boolean } }] }`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured — missing API key' });
  }

  const { food_name, portion, nutrition, minutes, factors, mode } = req.body;
  if (!mode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (mode !== 'improve' && mode !== 'ideas') {
    return res.status(400).json({ error: 'Invalid mode — use "improve" or "ideas"' });
  }
  if (mode === 'improve' && !food_name) {
    return res.status(400).json({ error: 'food_name is required for improve mode' });
  }

  const isStandaloneIdeas = mode === 'ideas' && !food_name;
  const systemPrompt = mode === 'improve' ? IMPROVE_PROMPT : (isStandaloneIdeas ? GENERAL_IDEAS_PROMPT : IDEAS_PROMPT);
  const userMessage = isStandaloneIdeas
    ? 'Suggest 3 healthy meals that score well for longevity. Vary the meal types (breakfast, lunch, dinner).'
    : `Meal: ${food_name} (${portion})
Current score: ${minutes >= 0 ? '+' : ''}${minutes} min
Scoring factors: ${(factors || []).join(', ')}
Nutrition: ${JSON.stringify(nutrition || {})}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800
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
