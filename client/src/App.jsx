import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CustomDesign from './pages/CustomDesign';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OrderSuccess from './pages/OrderSuccess';
import OrderTracking from './pages/OrderTracking';
import NotFound from './pages/NotFound';

// Protected Pages
import Account from './pages/Account';
import Wishlist from './pages/Wishlist';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import MyDesigns from './pages/MyDesigns';
import DesignDetail from './pages/DesignDetail';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductForm from './pages/admin/ProductForm';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminCustomDesigns from './pages/admin/CustomDesigns';
import AdminCustomDesignDetail from './pages/admin/CustomDesignDetail';
import AdminCustomers from './pages/admin/Customers';
import AdminSales from './pages/admin/Sales';
import AdminCoupons from './pages/admin/Coupons';
import AdminReviews from './pages/admin/Reviews';
import AdminSettings from './pages/admin/Settings';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import ScrollToTop from './components/common/ScrollToTop';

// Store
import { useLanguageStore, useAuthStore } from './store/useStore';

function App() {
  const { i18n } = useTranslation();
  const { language, direction } = useLanguageStore();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction, i18n]);

  return (
    <div className={`min-h-screen ${direction === 'rtl' ? 'font-urdu' : 'font-body'}`}>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="custom-design" element={<CustomDesign />} />
          <Route path="track-order" element={<OrderTracking />} />
          <Route path="order-success/:orderNumber" element={<OrderSuccess />} />

          {/* Auth Routes */}
          <Route path="login" element={isAuthenticated ? <Navigate to="/account" /> : <Login />} />
          <Route path="register" element={isAuthenticated ? <Navigate to="/account" /> : <Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route path="checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="account" element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          } />
          <Route path="wishlist" element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          } />
          <Route path="orders" element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          } />
          <Route path="orders/:id" element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          } />
          <Route path="my-designs" element={
            <ProtectedRoute>
              <MyDesigns />
            </ProtectedRoute>
          } />
          <Route path="my-designs/:id" element={
            <ProtectedRoute>
              <DesignDetail />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="custom-designs" element={<AdminCustomDesigns />} />
          <Route path="custom-designs/:id" element={<AdminCustomDesignDetail />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="sales" element={<AdminSales />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
