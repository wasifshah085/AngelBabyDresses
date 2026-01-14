# Angel Baby Dresses

A modern e-commerce platform for kids clothing in Pakistan.

## Features

- **Customer Features**
  - Browse products by category
  - Search and filter products
  - Add to cart and wishlist
  - Custom design submission (upload or interactive builder)
  - Multiple payment options (JazzCash, Easypaisa, COD)
  - Order tracking
  - Multi-language support (English & Urdu)

- **Admin Features**
  - Dashboard with analytics
  - Product & category management
  - Order management
  - Custom design orders
  - Customer management
  - Sales & coupon management
  - Review moderation
  - Site settings

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Payment**: JazzCash, Easypaisa
- **File Storage**: Cloudinary
- **Notifications**: Email (Nodemailer) + WhatsApp

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB
- Cloudinary account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment files:
   ```bash
   cp server/.env.example server/.env
   ```

4. Configure your `.env` file with:
   - MongoDB connection string
   - JWT secret
   - Cloudinary credentials
   - Email (SMTP) settings
   - WhatsApp API credentials
   - JazzCash/Easypaisa merchant credentials

5. Start development servers:
   ```bash
   npm run dev
   ```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Project Structure

```
AngelBabyDresses/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # Zustand stores
│   │   ├── i18n/          # Translations
│   │   └── styles/        # Global styles
│   └── ...
├── server/                 # Node.js Backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
└── ...
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password

### Products
- `GET /api/products` - List products
- `GET /api/products/:slug` - Get product details
- `GET /api/products/featured` - Featured products
- `GET /api/products/search` - Search products

### Cart & Orders
- `GET /api/cart` - Get cart
- `POST /api/cart/add` - Add to cart
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - User orders

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `CRUD /api/admin/products` - Product management
- `CRUD /api/admin/categories` - Category management
- `GET/PUT /api/admin/orders` - Order management

## License

MIT
