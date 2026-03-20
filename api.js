// Calls the serverless API proxy (no client-side API key needed)

export async function analyzeFood(base64Image, { smokes } = {}) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, smokes: !!smokes })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function getCoaching(entry, mode) {
  const body = entry
    ? {
        food_name: entry.food_name,
        portion: entry.portion,
        nutrition: entry.nutrition,
        minutes: entry.minutes,
        factors: entry.factors,
        mode
      }
    : { mode };

  const response = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${response.status}`);
  }

  return response.json();
}
