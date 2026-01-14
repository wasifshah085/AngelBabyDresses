import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { FiHome, FiSearch } from 'react-icons/fi';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>404 - {t('errors.pageNotFound')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="text-center">
          <h1 className="text-9xl font-heading font-bold text-primary-200">404</h1>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mt-4 mb-2">
            {t('errors.pageNotFound')}
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {t('errors.pageNotFoundDesc')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/" className="btn btn-primary">
              <FiHome className="w-5 h-5 mr-2" />
              {t('common.goHome')}
            </Link>
            <Link to="/shop" className="btn btn-outline">
              <FiSearch className="w-5 h-5 mr-2" />
              {t('nav.shop')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
