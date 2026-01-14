import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FiFacebook, FiInstagram, FiTwitter, FiYoutube } from 'react-icons/fi';
import { FaTiktok, FaWhatsapp } from 'react-icons/fa';
import { settingsAPI } from '../../services/api';
import { useLanguageStore } from '../../store/useStore';

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
    { name: t('footer.sizeGuide'), href: '/size-guide' }
  ];

  const customerService = [
    { name: t('footer.contactUs'), href: '/contact' },
    { name: t('footer.faq'), href: '/faq' },
    { name: t('footer.shippingInfo'), href: '/shipping' },
    { name: t('footer.returns'), href: '/returns' },
    { name: t('order.trackOrder'), href: '/track-order' }
  ];

  const socialLinks = [
    { name: 'Facebook', icon: FiFacebook, href: '#' },
    { name: 'Instagram', icon: FiInstagram, href: '#' },
    { name: 'TikTok', icon: FaTiktok, href: '#' },
    { name: 'WhatsApp', icon: FaWhatsapp, href: '#' }
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
            <form className="flex w-full max-w-md">
              <input
                type="email"
                placeholder={t('home.emailPlaceholder')}
                className="flex-1 px-4 py-3 rounded-l-lg focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gray-900 text-white font-medium rounded-r-lg hover:bg-gray-800 transition-colors"
              >
                {t('home.subscribe')}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {settings?.logo?.url && (
                <img
                  src={settings.logo.url}
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

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-heading font-semibold text-white mb-4">
              {t('footer.customerService')}
            </h4>
            <ul className="space-y-3">
              {customerService.map((link) => (
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
                <a href={`mailto:${settings?.contact?.email || 'info@angelbabydresses.com'}`} className="hover:text-primary-400 transition-colors">
                  {settings?.contact?.email || 'info@angelbabydresses.com'}
                </a>
              </li>
              <li>
                <a href={`tel:${settings?.contact?.phone || '+923001234567'}`} className="hover:text-primary-400 transition-colors">
                  {settings?.contact?.phone || '+92 300 1234567'}
                </a>
              </li>
              {(settings?.contact?.whatsapp || true) && (
                <li>
                  <a
                    href={`https://wa.me/${settings?.contact?.whatsapp || '923001234567'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                  >
                    <FaWhatsapp className="w-5 h-5" />
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>{t('footer.copyright')}</p>
            <p>{t('footer.madeWithLove')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
