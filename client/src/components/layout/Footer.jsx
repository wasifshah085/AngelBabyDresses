import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FiFacebook, FiInstagram, FiMail } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { settingsAPI } from '../../services/api';
import { useLanguageStore } from '../../store/useStore';
import { getImageUrl } from '../../utils/imageUrl';

const Footer = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get(),
    staleTime: 5 * 60 * 1000,
  });

  const settings = settingsData?.data?.data;

  const quickLinks = [
    { name: t('common.shop'), href: '/shop' },
    { name: t('common.newArrivals'), href: '/shop?filter=new' },
    { name: t('common.sale'), href: '/shop?filter=sale' },
    { name: t('common.customDesign'), href: '/custom-design' },
    { name: t('order.trackOrder'), href: '/track-order' }
  ];

  const socialLinks = [
    { name: 'Facebook', icon: FiFacebook, href: 'https://www.facebook.com/share/17kYD7ba11/' },
    { name: 'Instagram', icon: FiInstagram, href: 'https://www.instagram.com/angelbabydresses_official?igsh=MWlnM3VidGJtaHMzeA==' },
    { name: 'WhatsApp', icon: FaWhatsapp, href: 'https://wa.me/923341542572' }
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter Section */}
      <div className="bg-primary-500">
        <div className="container py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-xl lg:text-2xl font-heading font-bold text-white">
                {t('home.newsletter')}
              </h3>
              <p className="text-white/80 mt-1">
                {t('home.newsletterDesc')}
              </p>
            </div>
            <form className="flex flex-col sm:flex-row w-full max-w-md gap-2 sm:gap-0 overflow-hidden">
              <input
                type="email"
                placeholder={t('home.emailPlaceholder')}
                className="w-full sm:flex-1 min-w-0 px-4 py-3 rounded-lg sm:rounded-s-lg sm:rounded-e-none focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg sm:rounded-s-none sm:rounded-e-lg hover:bg-gray-800 transition-colors whitespace-nowrap flex-shrink-0"
              >
                {t('home.subscribe')}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Brand Story Section */}
      <div className="bg-gray-800">
        <div className="container py-8 lg:py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-center md:text-left">
            <div>
              <h4 className="text-base font-heading font-semibold text-primary-400 mb-2">Our Story</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                At Angel Baby Dresses, we believe every little girl deserves to feel like an angel. What began as a passion for fine fabrics and detailed craftsmanship has grown into a boutique creating elegant, one-of-a-kind dresses for life's most precious moments.
              </p>
            </div>
            <div>
              <h4 className="text-base font-heading font-semibold text-primary-400 mb-2">Our Craft</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                We specialize in custom made dresses, handcrafted with care using soft linings, delicate lace, and hand finished details. Each piece is tailored to your child and your occasion.
              </p>
            </div>
            <div>
              <h4 className="text-base font-heading font-semibold text-primary-400 mb-2">Our Promise</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                We create more than dresses, we create memories. Our promise is timeless elegance, comfort, and a magical experience for every Angel Baby.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {settings?.logo?.url && (
                <img
                  src={getImageUrl(settings.logo.url)}
                  alt={settings.siteName?.[language] || settings.siteName?.en || 'Logo'}
                  className="h-10 w-auto object-contain"
                />
              )}
              <h3 className="text-xl font-heading font-bold text-white">
                {settings?.siteName?.[language] || settings?.siteName?.en || 'Angel Baby Dresses'}
              </h3>
            </div>
            <p className="text-gray-400 mb-4">
              {settings?.siteTagline?.[language] || settings?.siteTagline?.en || t('footer.aboutDesc')}
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-primary-500 hover:text-white transition-all"
                  aria-label={link.name}
                >
                  <link.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-heading font-semibold text-white mb-4">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-heading font-semibold text-white mb-4">
              {t('footer.contactUs')}
            </h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a
                  href="mailto:angelbabydressesofficial@gmail.com"
                  className="inline-flex items-center gap-2 hover:text-primary-400 transition-colors"
                >
                  <FiMail className="w-5 h-5" />
                  angelbabydressesofficial@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/923341542572"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                >
                  <FaWhatsapp className="w-5 h-5" />
                  0334-1542572
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>{t('footer.copyright')}</p>
            <p>
              Designed & Developed by{' '}
              <a
                href="https://zyvonsolutions.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                Zyvon Solutions
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
