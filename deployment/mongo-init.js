// MongoDB Initialization Script
// Creates application user with appropriate permissions

// Switch to the application database
db = db.getSiblingDB('angel-baby-dresses');

// Create application user if it doesn't exist
db.createUser({
  user: process.env.MONGO_APP_USER || 'angelbaby',
  pwd: process.env.MONGO_APP_PASSWORD || 'changeme',
  roles: [
    {
      role: 'readWrite',
      db: 'angel-baby-dresses'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.products.createIndex({ slug: 1 }, { unique: true });
db.products.createIndex({ category: 1 });
db.products.createIndex({ 'name.en': 'text', 'name.ur': 'text', 'description.en': 'text' });
db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });
db.categories.createIndex({ slug: 1 }, { unique: true });
db.reviews.createIndex({ productId: 1 });
db.coupons.createIndex({ code: 1 }, { unique: true });

print('Database initialization completed successfully!');
