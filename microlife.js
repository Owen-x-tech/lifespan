// Microlife scoring engine
// Based on Spiegelhalter (2012) microlives and Stylianou et al. (2021) HENI framework

export function score(nutrition, profile = {}) {
  let minutes = 0;
  const factors = [];

  // --- Profile-based modifiers ---

  // Age multiplier (Fadnes 2022) — remaining lifespan decay
  const age = profile.age || 30;
  let ageMultiplier = 1.0;
  if (age >= 80) ageMultiplier = 0.30;
  else if (age >= 70) ageMultiplier = 0.50;
  else if (age >= 60) ageMultiplier = 0.70;
  else if (age >= 40) ageMultiplier = 0.85;

  // BMI (computed from profile)
  const bmi = (profile.weight && profile.height)
    ? profile.weight / ((profile.height / 100) ** 2)
    : null;

  // Sex and BMI flags for per-factor modifiers
  const isFemale = profile.gender === 'female';
  const isMale = profile.gender === 'male';
  const isHighBmi = bmi && bmi > 27;

  // Sodium modifier: 1.3x if female (DASH-Sodium), 1.3x if BMI > 27 (PMC10406397)
  let sodiumModifier = 1.0;
  if (isFemale) sodiumModifier *= 1.3;
  if (isHighBmi) sodiumModifier *= 1.3;

  // Red meat modifier: 1.15x if male (heme iron meta-analysis)
  const redMeatModifier = isMale ? 1.15 : 1.0;

  // --- Factor scoring ---

  // Fruit/veg servings: +15 min each, capped at 5 servings per scan
  const fvServings = Math.min(nutrition.fruit_veg_servings ?? 0, 5);
  const isMeat = nutrition.is_processed_meat || nutrition.is_red_meat;

  if (fvServings > 0) {
    const bonus = fvServings * 15;
    minutes += bonus;
    factors.push(`Fruit/veg (${fvServings} serving${fvServings > 1 ? 's' : ''}): +${bonus} min`);
  }

  // Oily fish serving: +15 min
  if (nutrition.is_oily_fish) {
    minutes += 15;
    factors.push("Oily fish (omega-3): +15 min");
  }

  // Processed meat serving: -30 min
  if (nutrition.is_processed_meat) {
    minutes -= 30;
    factors.push("Processed meat: -30 min");
  }

  // Red meat serving: -15 min (x1.15 if male)
  if (nutrition.is_red_meat && !nutrition.is_processed_meat) {
    const penalty = -15 * redMeatModifier;
    minutes += penalty;
    factors.push(`Red meat: ${Math.round(penalty)} min`);
  }

  // Per 5g saturated fat above 2g: -7 min
  // When meat categorical flag is active, reduce by 50% to avoid double-counting
  const satFat = nutrition.saturated_fat_g || 0;
  if (satFat > 2) {
    const raw = ((satFat - 2) / 5) * -7;
    const penalty = isMeat ? raw * 0.5 : raw;
    minutes += penalty;
    factors.push(`Saturated fat ${satFat}g: ${Math.round(penalty)} min`);
  }

  // Per 1g trans fat: -12 min
  const transFat = nutrition.trans_fat_g || 0;
  if (transFat > 0) {
    const penalty = transFat * -12;
    minutes += penalty;
    factors.push(`Trans fat ${transFat}g: ${Math.round(penalty)} min`);
  }

  // Per 500mg sodium above 500mg: -6 min (modified by sex/BMI)
  // When meat categorical flag is active, reduce by 50% to avoid double-counting
  const sodium = nutrition.sodium_mg || 0;
  if (sodium > 500) {
    const raw = ((sodium - 500) / 500) * -6;
    const basePenalty = isMeat ? raw * 0.5 : raw;
    const penalty = basePenalty * sodiumModifier;
    minutes += penalty;
    factors.push(`Sodium ${sodium}mg: ${Math.round(penalty)} min`);
  }

  // Per 10g added sugar above 5g: -4.5 min
  // Skip when fruit/veg servings active (categorical score already accounts for sugar)
  const sugar = nutrition.added_sugar_g || 0;
  if (sugar > 5 && fvServings === 0) {
    const penalty = ((sugar - 5) / 10) * -4.5;
    minutes += penalty;
    factors.push(`Added sugar ${sugar}g: ${Math.round(penalty)} min`);
  }

  // Per 5g fibre: +6 min
  // Skip when fruit/veg servings active (categorical score already accounts for fibre)
  const fibre = nutrition.fibre_g || 0;
  if (fibre > 0 && fvServings === 0) {
    const bonus = (fibre / 5) * 6;
    minutes += bonus;
    factors.push(`Fibre ${fibre}g: +${Math.round(bonus)} min`);
  }

  // Apply age multiplier to final score
  minutes = minutes * ageMultiplier;

  // Personalized flag — true when profile provides meaningful modifier data
  const personalized = !!(profile.age || profile.gender || (profile.weight && profile.height));

  return {
    minutes: Math.round(minutes),
    factors,
    personalized
  };
}
