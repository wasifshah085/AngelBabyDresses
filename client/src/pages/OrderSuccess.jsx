import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { FiCheckCircle, FiPackage, FiArrowRight } from 'react-icons/fi';

const OrderSuccess = () => {
  const { orderNumber } = useParams();
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('orders.orderSuccess')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="container py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <FiCheckCircle className="w-12 h-12 text-green-500" />
          </div>

          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-4">
            {t('orders.thankYou')}
          </h1>

          <p className="text-gray-600 mb-2">
            {t('orders.orderPlaced')}
          </p>

          {orderNumber && (
            <p className="text-lg font-medium text-gray-900 mb-8">
              {t('orders.orderNumber')}: <span className="text-primary-600">{orderNumber}</span>
            </p>
          )}

          <div className="bg-primary-50 rounded-xl p-6 mb-8">
            <FiPackage className="w-8 h-8 text-primary-500 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-900 mb-2">
              {t('orders.whatNext')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('orders.confirmationEmail')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/my-orders" className="btn btn-primary">
              {t('orders.viewOrders')}
              <FiArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link to="/shop" className="btn btn-outline">
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSuccess;
