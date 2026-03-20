// Open Food Facts barcode lookup
// Returns nutrition JSON in microlife.js format

const OFF_API = 'https://world.openfoodfacts.org/api/v2/product';

// Category tags that indicate fruit/veg
const FRUIT_VEG_TAGS = [
  'en:fruits', 'en:vegetables', 'en:fresh-fruits', 'en:fresh-vegetables',
  'en:frozen-fruits', 'en:frozen-vegetables', 'en:dried-fruits',
  'en:canned-vegetables', 'en:canned-fruits', 'en:berries', 'en:citrus',
  'en:tropical-fruits', 'en:leafy-vegetables', 'en:root-vegetables'
];

const PROCESSED_MEAT_TAGS = [
  'en:sausages', 'en:salamis', 'en:bacons', 'en:ham', 'en:hams',
  'en:hot-dogs', 'en:deli-meats', 'en:cured-meats', 'en:processed-meats',
  'en:corned-beef', 'en:jerky', 'en:pates'
];

const RED_MEAT_TAGS = [
  'en:beef', 'en:pork', 'en:lamb', 'en:veal', 'en:goat',
  'en:meats', 'en:red-meats', 'en:ground-beef', 'en:steaks'
];

function hasTag(categories, tagList) {
  if (!categories) return false;
  const tags = Array.isArray(categories) ? categories : [];
  return tags.some(t => tagList.includes(t.toLowerCase()));
}

export async function lookupBarcode(code) {
  const res = await fetch(`${OFF_API}/${code}.json`);
  if (!res.ok) throw new Error('Product not found. Try scanning the food directly.');

  const data = await res.json();
  if (data.status !== 1 || !data.product) {
    throw new Error('Product not found. Try scanning the food directly.');
  }

  const p = data.product;
  const n = p.nutriments || {};
  const categories = p.categories_tags || [];

  // Determine serving size
  const servingG = p.serving_quantity || 100;
  const factor = servingG / 100;

  const food_name = p.product_name || p.product_name_en || 'Unknown product';
  const portion = p.serving_size || `${servingG}g`;

  return {
    food_name,
    portion,
    calories: Math.round((n['energy-kcal_100g'] || 0) * factor),
    saturated_fat_g: round1((n['saturated-fat_100g'] || 0) * factor),
    trans_fat_g: round1((n['trans-fat_100g'] || 0) * factor),
    sodium_mg: Math.round((n['sodium_100g'] || 0) * 1000 * factor),
    sugar_g: round1((n['sugars_100g'] || 0) * factor),
    fibre_g: round1((n['fiber_100g'] || 0) * factor),
    is_fruit_or_veg: hasTag(categories, FRUIT_VEG_TAGS),
    is_processed_meat: hasTag(categories, PROCESSED_MEAT_TAGS),
    is_red_meat: hasTag(categories, RED_MEAT_TAGS),
    is_whole_food: false
  };
}

function round1(v) {
  return Math.round(v * 10) / 10;
}
