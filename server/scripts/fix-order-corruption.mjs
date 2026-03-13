/**
 * FIX ORDER CORRUPTION SCRIPT
 *
 * Problem: The ImageKit migration script corrupted ObjectId and Date fields
 * in orders by replacing full documents using the raw MongoDB driver.
 * BSON ObjectIds became { buffer: {'0':x,'1':y,...} } plain objects.
 * BSON Dates became {} empty objects.
 *
 * Usage:
 *   cd server
 *   node scripts/fix-order-corruption.mjs
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { BSON } from 'mongodb';

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB\n');

const db = mongoose.connection;
const ordersCol = db.collection('orders');
const orders = await ordersCol.find({}).toArray();
console.log(`Found ${orders.length} orders to check\n`);

/**
 * Returns true if val is a corrupted ObjectId:
 * a plain object { buffer: { '0': n, '1': n, ... } } with exactly 12 numeric entries.
 */
function isCorruptedOid(val) {
  if (!val || typeof val !== 'object') return false;
  if (val instanceof BSON.ObjectId) return false;
  if (!val.buffer || typeof val.buffer !== 'object' || Buffer.isBuffer(val.buffer)) return false;
  const keys = Object.keys(val.buffer);
  return keys.length === 12 && keys.every(k => !isNaN(k));
}

/**
 * Returns true if val is a corrupted Date: a plain empty object {}.
 */
function isCorruptedDate(val) {
  if (!val || typeof val !== 'object') return false;
  if (val instanceof Date || val instanceof BSON.ObjectId) return false;
  if (Buffer.isBuffer(val)) return false;
  if (val.buffer) return false; // leave buffer-like objects for OID handling
  return Object.keys(val).length === 0;
}

/** Reconstruct ObjectId from corrupted buffer plain-object */
function toObjectId(val) {
  const bytes = Object.values(val.buffer).map(Number);
  return new BSON.ObjectId(Buffer.from(bytes));
}

/** Recursively fix all corrupted fields in obj (mutates in place). Returns true if changed. */
function fixObj(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (obj instanceof Date || obj instanceof BSON.ObjectId || Buffer.isBuffer(obj)) return false;

  let changed = false;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (isCorruptedOid(obj[i])) {
        obj[i] = toObjectId(obj[i]);
        changed = true;
      } else if (isCorruptedDate(obj[i])) {
        obj[i] = null;
        changed = true;
      } else {
        changed = fixObj(obj[i]) || changed;
      }
    }
    return changed;
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === null || val === undefined) continue;
    if (isCorruptedOid(val)) {
      obj[key] = toObjectId(val);
      changed = true;
    } else if (isCorruptedDate(val)) {
      obj[key] = null;
      changed = true;
    } else if (typeof val === 'object' && !(val instanceof Date) && !(val instanceof BSON.ObjectId) && !Buffer.isBuffer(val)) {
      changed = fixObj(val) || changed;
    }
  }
  return changed;
}

let fixedCount = 0;
let errorCount = 0;

for (const order of orders) {
  try {
    const changed = fixObj(order);
    if (changed) {
      await ordersCol.replaceOne({ _id: order._id }, order);
      fixedCount++;
      console.log(`Fixed order ${order.orderNumber}`);
    }
  } catch (err) {
    console.error(`Error on order ${order.orderNumber}:`, err.message);
    errorCount++;
  }
}

console.log(`\n=== DONE ===`);
console.log(`Fixed:     ${fixedCount} orders`);
console.log(`Errors:    ${errorCount}`);
console.log(`Unchanged: ${orders.length - fixedCount - errorCount}`);

await mongoose.disconnect();
