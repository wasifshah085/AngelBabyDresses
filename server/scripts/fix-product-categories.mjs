/**
 * FIX PRODUCT CATEGORIES SCRIPT
 *
 * Problem: All products have category: null in the database.
 * This script auto-assigns products to categories based on keyword matching
 * in their name, description, and tags fields.
 *
 * Usage:
 *   cd server
 *   node scripts/fix-product-categories.mjs          # dry-run (no changes)
 *   node scripts/fix-product-categories.mjs --apply  # apply changes
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const DRY_RUN = !process.argv.includes('--apply');

if (DRY_RUN) {
  console.log('=== DRY RUN MODE (use --apply to save changes) ===\n');
} else {
  console.log('=== APPLY MODE (changes will be saved to DB) ===\n');
}

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB\n');

const db = mongoose.connection;
const productsCol = db.collection('products');
const categoriesCol = db.collection('categories');

// 1. Load all categories
const categories = await categoriesCol.find({ isActive: true }).toArray();
console.log(`Found ${categories.length} active categories:`);
categories.forEach(c => console.log(`  - [${c._id}] ${c.name?.en} (slug: ${c.slug})`));
console.log();

// 2. Load all products with null/missing category
const allProducts = await productsCol.find({}).toArray();
const nullCatProducts = allProducts.filter(p => !p.category);
const hasCatProducts = allProducts.filter(p => p.category);

console.log(`Total products: ${allProducts.length}`);
console.log(`Products WITH category: ${hasCatProducts.length}`);
console.log(`Products WITHOUT category: ${nullCatProducts.length}\n`);

if (nullCatProducts.length === 0) {
  console.log('All products already have categories assigned. Nothing to do.');
  await mongoose.disconnect();
  process.exit(0);
}

// 3. Build keyword → category map from category names and slugs
// Each category gets an array of keywords to match against product text
function buildKeywords(category) {
  const keywords = [];
  const nameEn = (category.name?.en || '').toLowerCase();
  const slug = (category.slug || '').toLowerCase();

  // Add the full name and slug
  keywords.push(nameEn);
  keywords.push(slug);

  // Add individual words from name (skip short words)
  nameEn.split(/\s+/).forEach(word => {
    if (word.length >= 3) keywords.push(word);
  });

  return [...new Set(keywords)].filter(Boolean);
}

const categoryKeywords = categories.map(cat => ({
  category: cat,
  keywords: buildKeywords(cat)
}));

console.log('Category keyword mappings:');
categoryKeywords.forEach(ck => {
  console.log(`  ${ck.category.name?.en}: [${ck.keywords.join(', ')}]`);
});
console.log();

// 4. Match each product to a category
function matchCategory(product) {
  const nameEn = (product.name?.en || '').toLowerCase();
  const nameUr = (product.name?.ur || '').toLowerCase();
  const descEn = (product.description?.en || '').toLowerCase();
  const tags = Array.isArray(product.tags) ? product.tags.join(' ').toLowerCase() : '';
  const searchText = `${nameEn} ${nameUr} ${tags} ${descEn}`;

  let bestMatch = null;
  let bestScore = 0;

  for (const ck of categoryKeywords) {
    let score = 0;
    for (const keyword of ck.keywords) {
      if (searchText.includes(keyword)) {
        // Longer keyword matches score higher
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = ck.category;
    }
  }

  return bestScore > 0 ? { category: bestMatch, score: bestScore } : null;
}

const matched = [];
const unmatched = [];

for (const product of nullCatProducts) {
  const result = matchCategory(product);
  if (result) {
    matched.push({ product, category: result.category, score: result.score });
  } else {
    unmatched.push(product);
  }
}

console.log(`\nMatched ${matched.length} products:`);
matched.forEach(m => {
  console.log(`  "${m.product.name?.en}" → ${m.category.name?.en} (score: ${m.score})`);
});

if (unmatched.length > 0) {
  console.log(`\nUnmatched ${unmatched.length} products (need manual assignment):`);
  unmatched.forEach(p => {
    console.log(`  - "${p.name?.en}" (slug: ${p.slug})`);
  });
}

// 5. Apply changes if --apply flag is passed
if (!DRY_RUN && matched.length > 0) {
  console.log('\nApplying changes...');

  // Group by category to count
  const categoryUpdateCounts = {};

  for (const { product, category } of matched) {
    await productsCol.updateOne(
      { _id: product._id },
      { $set: { category: category._id } }
    );
    categoryUpdateCounts[category._id.toString()] = (categoryUpdateCounts[category._id.toString()] || 0) + 1;
    console.log(`  Updated "${product.name?.en}" → ${category.name?.en}`);
  }

  // Update productCount on each category
  console.log('\nUpdating productCount on categories...');
  for (const [catId, count] of Object.entries(categoryUpdateCounts)) {
    // Count all products (including pre-existing) for this category
    const totalCount = await productsCol.countDocuments({
      category: new mongoose.Types.ObjectId(catId),
      isActive: true
    });
    await categoriesCol.updateOne(
      { _id: new mongoose.Types.ObjectId(catId) },
      { $set: { productCount: totalCount } }
    );
    const cat = categories.find(c => c._id.toString() === catId);
    console.log(`  ${cat?.name?.en}: productCount = ${totalCount}`);
  }

  console.log('\n=== DONE ===');
  console.log(`Updated ${matched.length} products with category assignments.`);
  if (unmatched.length > 0) {
    console.log(`${unmatched.length} products still need manual category assignment via admin panel.`);
  }
} else if (!DRY_RUN) {
  console.log('\nNo matched products to update.');
} else {
  console.log('\n[DRY RUN] No changes made. Run with --apply to save.');
}

await mongoose.disconnect();
