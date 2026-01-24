/**
 * Database Cleanup Script - Production Preparation
 *
 * This script removes all test/dummy data while preserving:
 * ✅ Admin users
 * ✅ Products
 * ✅ Categories
 * ✅ Settings
 *
 * ⚠️ IMPORTANT: Always backup your database before running this script!
 *
 * Usage:
 *   node server/scripts/cleanupTestData.js --dry-run    # Preview what will be deleted
 *   node server/scripts/cleanupTestData.js              # Actually delete the data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
import User from '../models/User.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Review from '../models/Review.js';
import CustomDesign from '../models/CustomDesign.js';
import Coupon from '../models/Coupon.js';
import Sale from '../models/Sale.js';

// Check for dry-run flag
const isDryRun = process.argv.includes('--dry-run');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
};

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log.success('Connected to MongoDB');
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

async function getCollectionStats() {
  const stats = {
    users: {
      total: await User.countDocuments(),
      admins: await User.countDocuments({ role: 'admin' }),
      customers: await User.countDocuments({ role: 'customer' }),
    },
    orders: await Order.countDocuments(),
    carts: await Cart.countDocuments(),
    reviews: await Review.countDocuments(),
    customDesigns: await CustomDesign.countDocuments(),
    coupons: await Coupon.countDocuments(),
    sales: await Sale.countDocuments(),
  };
  return stats;
}

async function cleanup() {
  log.header('DATABASE CLEANUP SCRIPT');

  if (isDryRun) {
    log.warning('DRY RUN MODE - No data will be deleted');
    console.log('Run without --dry-run flag to actually delete data\n');
  } else {
    log.warning('LIVE MODE - Data will be permanently deleted!');
    console.log('');
  }

  await connectDB();

  // Get current stats
  log.header('CURRENT DATABASE STATE');
  const beforeStats = await getCollectionStats();

  console.log('Collection               Count      Action');
  console.log('─'.repeat(55));
  console.log(`Users (Total)            ${String(beforeStats.users.total).padEnd(10)} -`);
  console.log(`  ├─ Admins              ${String(beforeStats.users.admins).padEnd(10)} ${colors.green}KEEP${colors.reset}`);
  console.log(`  └─ Customers           ${String(beforeStats.users.customers).padEnd(10)} ${colors.red}DELETE${colors.reset}`);
  console.log(`Orders                   ${String(beforeStats.orders).padEnd(10)} ${colors.red}DELETE${colors.reset}`);
  console.log(`Carts                    ${String(beforeStats.carts).padEnd(10)} ${colors.red}DELETE${colors.reset}`);
  console.log(`Reviews                  ${String(beforeStats.reviews).padEnd(10)} ${colors.red}DELETE${colors.reset}`);
  console.log(`Custom Designs           ${String(beforeStats.customDesigns).padEnd(10)} ${colors.red}DELETE${colors.reset}`);
  console.log(`Coupons                  ${String(beforeStats.coupons).padEnd(10)} ${colors.red}DELETE${colors.reset}`);
  console.log(`Sales                    ${String(beforeStats.sales).padEnd(10)} ${colors.red}DELETE${colors.reset}`);
  console.log(`Products                 -          ${colors.green}KEEP${colors.reset}`);
  console.log(`Categories               -          ${colors.green}KEEP${colors.reset}`);
  console.log(`Settings                 -          ${colors.green}KEEP${colors.reset}`);
  console.log('');

  if (isDryRun) {
    log.info('Dry run complete. No changes made.');
    await mongoose.disconnect();
    return;
  }

  // Confirmation for live mode
  log.header('PERFORMING CLEANUP');

  const results = {
    customersDeleted: 0,
    ordersDeleted: 0,
    cartsDeleted: 0,
    reviewsDeleted: 0,
    customDesignsDeleted: 0,
    couponsDeleted: 0,
    salesDeleted: 0,
  };

  try {
    // 1. Delete all orders
    const ordersResult = await Order.deleteMany({});
    results.ordersDeleted = ordersResult.deletedCount;
    log.success(`Deleted ${results.ordersDeleted} orders`);

    // 2. Delete all carts
    const cartsResult = await Cart.deleteMany({});
    results.cartsDeleted = cartsResult.deletedCount;
    log.success(`Deleted ${results.cartsDeleted} carts`);

    // 3. Delete all reviews
    const reviewsResult = await Review.deleteMany({});
    results.reviewsDeleted = reviewsResult.deletedCount;
    log.success(`Deleted ${results.reviewsDeleted} reviews`);

    // 4. Delete all custom designs
    const customDesignsResult = await CustomDesign.deleteMany({});
    results.customDesignsDeleted = customDesignsResult.deletedCount;
    log.success(`Deleted ${results.customDesignsDeleted} custom designs`);

    // 5. Delete all coupons
    const couponsResult = await Coupon.deleteMany({});
    results.couponsDeleted = couponsResult.deletedCount;
    log.success(`Deleted ${results.couponsDeleted} coupons`);

    // 6. Delete all sales
    const salesResult = await Sale.deleteMany({});
    results.salesDeleted = salesResult.deletedCount;
    log.success(`Deleted ${results.salesDeleted} sales`);

    // 7. Delete customer users (keep admins)
    const customersResult = await User.deleteMany({ role: 'customer' });
    results.customersDeleted = customersResult.deletedCount;
    log.success(`Deleted ${results.customersDeleted} customer accounts`);

    // 8. Clear wishlists from admin users (optional cleanup)
    await User.updateMany({ role: 'admin' }, { $set: { wishlist: [] } });
    log.success('Cleared admin wishlists');

  } catch (error) {
    log.error(`Error during cleanup: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  // Final summary
  log.header('CLEANUP COMPLETE');

  const afterStats = await getCollectionStats();

  console.log('Summary of deleted data:');
  console.log('─'.repeat(40));
  console.log(`  Orders:          ${results.ordersDeleted}`);
  console.log(`  Carts:           ${results.cartsDeleted}`);
  console.log(`  Reviews:         ${results.reviewsDeleted}`);
  console.log(`  Custom Designs:  ${results.customDesignsDeleted}`);
  console.log(`  Coupons:         ${results.couponsDeleted}`);
  console.log(`  Sales:           ${results.salesDeleted}`);
  console.log(`  Customers:       ${results.customersDeleted}`);
  console.log('─'.repeat(40));
  console.log('');

  console.log('Remaining data:');
  console.log('─'.repeat(40));
  console.log(`  Admin users:     ${afterStats.users.admins}`);
  console.log(`  Products:        (unchanged)`);
  console.log(`  Categories:      (unchanged)`);
  console.log(`  Settings:        (unchanged)`);
  console.log('');

  log.success('Database cleanup completed successfully!');
  log.info('Your database is now ready for production.');

  await mongoose.disconnect();
}

// Run the cleanup
cleanup().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
