import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FiX, FiChevronRight, FiUser, FiHeart, FiGlobe } from 'react-icons/fi';
import { useUIStore, useAuthStore, useLanguageStore } from '../../store/useStore';
import { settingsAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

const MobileMenu = () => {
  const { t, i18n } = useTranslation();
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get(),
    staleTime: 5 * 60 * 1000,
  });

  const settings = settingsData?.data?.data;

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ur' : 'en';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const menuLinks = [
    { name: t('common.home'), href: '/' },
    { name: t('common.products'), href: '/shop' },
    { name: t('common.newArrivals'), href: '/shop?filter=new' },
    { name: t('common.sale'), href: '/shop?filter=sale', highlight: true },
    { name: t('common.customDesign'), href: '/custom-design' },
    { name: t('order.trackOrder'), href: '/track-order' }
  ];

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  if (!isMobileMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeMobileMenu}
      />

      {/* Menu Panel */}
      <div className="absolute inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {settings?.logo?.url && (
              <img
                src={getImageUrl(settings.logo.url)}
                alt={settings.siteName?.[language] || settings.siteName?.en || 'Logo'}
                className="h-8 w-auto object-contain"
              />
            )}
            <span className="text-xl font-heading font-bold text-primary-500">
              {settings?.siteName?.[language] || settings?.siteName?.en || 'Angel Baby Dresses'}
            </span>
          </div>
          <button
            onClick={closeMobileMenu}
            className="p-2 text-gray-500 hover:text-gray-700"
            aria-label="Close menu"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* User Section */}
        <div className="p-4 bg-gray-50">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <FiUser className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.name}</p>
                <Link
                  to="/account"
                  onClick={closeMobileMenu}
                  className="text-sm text-primary-500"
                >
                  {t('account.myAccount')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="flex-1 btn btn-primary btn-sm"
              >
                {t('common.login')}
              </Link>
              <Link
                to="/register"
                onClick={closeMobileMenu}
                className="flex-1 btn btn-outline btn-sm"
              >
                {t('common.register')}
              </Link>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-4">
          <ul className="space-y-1">
            {menuLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    link.highlight
                      ? 'text-red-500 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{link.name}</span>
                  <FiChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Additional Links */}
        {isAuthenticated && (
          <div className="p-4 border-t">
            <ul className="space-y-1">
              <li>
                <Link
                  to="/wishlist"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <FiHeart className="w-5 h-5" />
                  <span>{t('common.wishlist')}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <FiChevronRight className="w-5 h-5" />
                  <span>{t('account.orders') || 'My Orders'}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/my-designs"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <FiChevronRight className="w-5 h-5" />
                  <span>{t('account.myDesigns') || 'My Custom Designs'}</span>
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary-500"
            >
              <FiGlobe className="w-5 h-5" />
              <span>{language === 'en' ? 'اردو' : 'English'}</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-500 hover:text-red-600"
              >
                {t('common.logout')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
