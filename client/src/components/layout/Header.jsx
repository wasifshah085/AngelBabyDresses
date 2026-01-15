import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FiSearch, FiHeart, FiShoppingBag, FiUser, FiMenu, FiGlobe } from 'react-icons/fi';
import { useAuthStore, useCartStore, useUIStore, useLanguageStore } from '../../store/useStore';
import { settingsAPI, cartAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import '../../styles/marquee.css';

const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { openMobileMenu, openCartDrawer, openSearch } = useUIStore();
  const { language, setLanguage } = useLanguageStore();

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch server cart for authenticated users
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.get(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // Refetch every 30 seconds
  });

  const settings = settingsData?.data?.data;

  // Use server cart count for authenticated users, local store for guests
  const serverCartCount = cartData?.data?.data?.items?.reduce((count, item) => count + item.quantity, 0) || 0;
  const itemCount = isAuthenticated ? serverCartCount : getItemCount();

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ur' : 'en';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const navLinks = [
    { name: t('common.products'), href: '/shop' },
    { name: t('common.newArrivals'), href: '/shop?filter=new' },
    { name: t('common.sale'), href: '/shop?filter=sale', highlight: true },
    { name: t('common.customDesign'), href: '/custom-design' },
    { name: t('orders.trackOrder'), href: '/track-order' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Bar */}
      <div className="bg-primary-500 text-white text-center py-2 text-sm overflow-hidden">
        <div className="marquee">
          <p>50% of payment will be charged on order and other 50% when the order is completed</p>
        </div>
      </div>

      {/* Main Header */}
      <div className="container">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile Menu Button */}
          <button
            onClick={openMobileMenu}
            className="lg:hidden p-2 text-gray-600 hover:text-primary-500"
            aria-label="Open menu"
          >
            <FiMenu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {settings?.logo?.url ? (
              <img
                src={getImageUrl(settings.logo.url)}
                alt={settings.siteName?.[language] || settings.siteName?.en || 'Angel Baby Dresses'}
                className="h-10 lg:h-12 w-auto object-contain"
              />
            ) : null}
            <div className="flex items-baseline gap-1">
              <span className="text-xl lg:text-2xl font-heading font-bold text-primary-500">
                {settings?.siteName?.[language] || settings?.siteName?.en || 'Angel Baby'}
              </span>
              <span className="hidden sm:inline text-base lg:text-lg font-heading text-gray-600">
                {!settings?.siteName ? 'Dresses' : ''}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`font-medium transition-colors hover:text-primary-500 ${
                  link.highlight ? 'text-red-500 hover:text-red-600' : 'text-gray-700'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-primary-500 transition-colors"
              aria-label="Toggle language"
            >
              <FiGlobe className="w-5 h-5" />
              <span className="hidden md:inline">{language === 'en' ? 'اردو' : 'EN'}</span>
            </button>

            {/* Search */}
            <button
              onClick={openSearch}
              className="p-2 text-gray-600 hover:text-primary-500 transition-colors"
              aria-label="Search"
            >
              <FiSearch className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className="hidden sm:block p-2 text-gray-600 hover:text-primary-500 transition-colors"
                aria-label="Wishlist"
              >
                <FiHeart className="w-5 h-5" />
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={openCartDrawer}
              className="relative p-2 text-gray-600 hover:text-primary-500 transition-colors"
              aria-label="Cart"
            >
              <FiShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-primary-500 text-white text-xs font-bold rounded-full">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* Account */}
            {isAuthenticated ? (
              <Link
                to={user?.role === 'admin' ? '/admin' : '/account'}
                className="p-2 text-gray-600 hover:text-primary-500 transition-colors"
                aria-label="Account"
              >
                <FiUser className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex btn btn-primary btn-sm"
              >
                {t('common.login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
