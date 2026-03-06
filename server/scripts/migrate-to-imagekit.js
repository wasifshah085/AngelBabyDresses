/**
 * CLOUDINARY → IMAGEKIT MIGRATION SCRIPT
 *
 * Steps:
 *  1. Reads all images from Cloudinary (folder: angel-baby-dresses)
 *  2. Re-uploads each image to ImageKit directly from Cloudinary URL
 *  3. Saves a URL mapping to migration-map.json (backup)
 *  4. Updates all MongoDB documents that contain Cloudinary URLs
 *
 * Usage:
 *   cd server
 *   node scripts/migrate-to-imagekit.js
 *
 * Requires .env with BOTH Cloudinary AND ImageKit credentials.
 */

import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import ImageKit from 'imagekit';
import mongoose from 'mongoose';

// ── Init Cloudinary ────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── Init ImageKit ──────────────────────────────────────────────────────────────
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// ── Connect MongoDB ────────────────────────────────────────────────────────────
await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Fetch all Cloudinary resources under the given prefix, handling pagination */
async function getAllCloudinaryResources(prefix) {
  const resources = [];
  let nextCursor = null;

  do {
    const opts = { type: 'upload', prefix, max_results: 500 };
    if (nextCursor) opts.next_cursor = nextCursor;

    const result = await cloudinary.api.resources(opts);
    resources.push(...result.resources);
    nextCursor = result.next_cursor;
    console.log(`  Fetched ${resources.length} resources so far…`);
  } while (nextCursor);

  return resources;
}

/** Upload a single resource to ImageKit using its Cloudinary URL */
async function uploadToImageKit(resource) {
  const { public_id, secure_url, format } = resource;

  // Reconstruct the folder path and filename from Cloudinary public_id
  // public_id example: "angel-baby-dresses/products/abc123"
  const folder = path.dirname(public_id).replace(/\\/g, '/');
  const baseName = path.basename(public_id);
  const fileName = format ? `${baseName}.${format}` : baseName;

  const result = await imagekit.upload({
    file: secure_url,          // ImageKit downloads directly from this URL
    fileName,
    folder,
    useUniqueFileName: false   // keep original filename to ease mapping
  });

  return result.url;
}

/** Replace a Cloudinary URL with the mapped ImageKit URL */
function replaceUrl(urlMapping, oldUrl) {
  return urlMapping[oldUrl] || oldUrl;
}

// ── Collections to update ──────────────────────────────────────────────────────
// For each collection we list the array/nested fields that contain
// { url, publicId } objects referencing Cloudinary.

async function updateCollection(collectionName, urlMapping, fieldPaths) {
  const collection = mongoose.connection.collection(collectionName);
  const docs = await collection.find({}).toArray();
  let updatedCount = 0;

  for (const doc of docs) {
    let changed = false;

    for (const fieldPath of fieldPaths) {
      changed = replaceInDoc(doc, fieldPath.split('.'), urlMapping) || changed;
    }

    if (changed) {
      await collection.replaceOne({ _id: doc._id }, doc);
      updatedCount++;
    }
  }

  console.log(`  ${collectionName}: updated ${updatedCount} documents`);
}

/**
 * Recursively walk a dot-notation path on a document and replace
 * Cloudinary URLs with ImageKit URLs.
 * Handles both plain strings and { url, publicId } objects, and arrays.
 */
function replaceInDoc(obj, pathParts, urlMapping) {
  if (!obj || typeof obj !== 'object') return false;

  const [head, ...rest] = pathParts;

  if (Array.isArray(obj)) {
    let changed = false;
    for (const item of obj) {
      changed = replaceInDoc(item, pathParts, urlMapping) || changed;
    }
    return changed;
  }

  if (rest.length === 0) {
    // leaf node
    if (typeof obj[head] === 'string' && obj[head].includes('res.cloudinary.com')) {
      obj[head] = replaceUrl(urlMapping, obj[head]);
      return true;
    }
    if (obj[head] && typeof obj[head] === 'object' && obj[head].url) {
      const newUrl = replaceUrl(urlMapping, obj[head].url);
      if (newUrl !== obj[head].url) {
        obj[head] = { ...obj[head], url: newUrl };
        return true;
      }
    }
    return false;
  }

  if (Array.isArray(obj[head])) {
    let changed = false;
    for (const item of obj[head]) {
      changed = replaceInDoc(item, rest, urlMapping) || changed;
    }
    return changed;
  }

  return replaceInDoc(obj[head], rest, urlMapping);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== CLOUDINARY → IMAGEKIT MIGRATION ===\n');

  // 1. Fetch all Cloudinary resources
  console.log('Step 1: Fetching Cloudinary resources…');
  const resources = await getAllCloudinaryResources('angel-baby-dresses');
  console.log(`Found ${resources.length} total resources in Cloudinary\n`);

  if (resources.length === 0) {
    console.log('No resources found. Exiting.');
    await mongoose.disconnect();
    return;
  }

  // 2. Upload each to ImageKit and build URL mapping
  console.log('Step 2: Uploading to ImageKit…');
  const urlMapping = {}; // { cloudinaryUrl: imagekitUrl }
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];
    process.stdout.write(`  [${i + 1}/${resources.length}] ${resource.public_id} … `);
    try {
      const imagekitUrl = await uploadToImageKit(resource);
      urlMapping[resource.secure_url] = imagekitUrl;
      process.stdout.write(`OK → ${imagekitUrl}\n`);
      successCount++;
    } catch (err) {
      process.stdout.write(`ERROR: ${err.message}\n`);
      errorCount++;
    }
  }

  console.log(`\nUploaded: ${successCount} success, ${errorCount} errors\n`);

  // 3. Save mapping to disk as backup
  const mapFile = path.join(process.cwd(), 'scripts', 'migration-map.json');
  fs.writeFileSync(mapFile, JSON.stringify(urlMapping, null, 2));
  console.log(`URL mapping saved to ${mapFile}\n`);

  // 4. Update MongoDB collections
  console.log('Step 3: Updating MongoDB…');

  // products: images[].url, images[].publicId not needed (we keep fileId)
  await updateCollection('products', urlMapping, ['images']);

  // reviews: images[].url
  await updateCollection('reviews', urlMapping, ['images']);

  // orders: advancePayment.screenshot, finalPayment.screenshot, items (product snapshots)
  await updateCollection('orders', urlMapping, [
    'advancePayment.screenshot',
    'finalPayment.screenshot',
    'items'
  ]);

  // customdesigns: uploadedImages[].url, conversation[].attachments[].url
  await updateCollection('customdesigns', urlMapping, [
    'uploadedImages',
    'conversation.attachments'
  ]);

  // settings: may contain banner/logo images
  await updateCollection('settings', urlMapping, ['value', 'images']);

  // categories: may have image
  await updateCollection('categories', urlMapping, ['image']);

  console.log('\n=== MIGRATION COMPLETE ===');
  console.log('Next steps:');
  console.log('  1. Verify images load correctly on your site');
  console.log('  2. Update your .env: remove CLOUDINARY_* vars, keep IMAGEKIT_* vars');
  console.log('  3. Optionally delete the Cloudinary folder after verification\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
