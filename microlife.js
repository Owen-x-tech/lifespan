// Microlife scoring engine
// Based on Spiegelhalter (2012) BMJ paper

export function score(nutrition) {
  let minutes = 0;
  const factors = [];

  // Fruit/veg serving: +30 min
  if (nutrition.is_fruit_or_veg) {
    minutes += 30;
    factors.push("Fruit/veg serving: +30 min");
  }

  // Processed meat serving: -30 min
  if (nutrition.is_processed_meat) {
    minutes -= 30;
    factors.push("Processed meat: -30 min");
  }

  // Red meat serving: -15 min
  if (nutrition.is_red_meat && !nutrition.is_processed_meat) {
    minutes -= 15;
    factors.push("Red meat: -15 min");
  }

  // Per 5g saturated fat above 2g: -9 min
  const satFat = nutrition.saturated_fat_g || 0;
  if (satFat > 2) {
    const penalty = ((satFat - 2) / 5) * -9;
    minutes += penalty;
    factors.push(`Saturated fat ${satFat}g: ${Math.round(penalty)} min`);
  }

  // Per 1g trans fat: -15 min
  const transFat = nutrition.trans_fat_g || 0;
  if (transFat > 0) {
    const penalty = transFat * -15;
    minutes += penalty;
    factors.push(`Trans fat ${transFat}g: ${Math.round(penalty)} min`);
  }

  // Per 500mg sodium above 500mg: -6 min
  const sodium = nutrition.sodium_mg || 0;
  if (sodium > 500) {
    const penalty = ((sodium - 500) / 500) * -6;
    minutes += penalty;
    factors.push(`Sodium ${sodium}mg: ${Math.round(penalty)} min`);
  }

  // Per 10g added sugar above 5g: -4.5 min
  const sugar = nutrition.sugar_g || 0;
  if (sugar > 5) {
    const penalty = ((sugar - 5) / 10) * -4.5;
    minutes += penalty;
    factors.push(`Sugar ${sugar}g: ${Math.round(penalty)} min`);
  }

  // Per 5g fibre: +6 min
  const fibre = nutrition.fibre_g || 0;
  if (fibre > 0) {
    const bonus = (fibre / 5) * 6;
    minutes += bonus;
    factors.push(`Fibre ${fibre}g: +${Math.round(bonus)} min`);
  }

  // Whole food bonus: +3 min
  if (nutrition.is_whole_food) {
    minutes += 3;
    factors.push("Whole food: +3 min");
  }

  return {
    minutes: Math.round(minutes),
    factors
  };
}
