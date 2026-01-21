import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiPackage, FiEye, FiChevronRight } from 'react-icons/fi';
import { ordersAPI } from '../services/api';
import { useLanguageStore } from '../store/useStore';
import { PageLoader } from '../components/common/Loader';
import { getImageUrl } from '../utils/imageUrl';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const MyOrders = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersAPI.getMyOrders()
  });

  const orders = data?.data?.data || [];

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{t('orders.myOrders')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="container py-8">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900 mb-8">
          {t('orders.myOrders')}
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <FiPackage className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              {t('orders.noOrders')}
            </h2>
            <p className="text-gray-500 mb-6">{t('orders.noOrdersMessage')}</p>
            <Link to="/shop" className="btn btn-primary">
              {t('orders.startShopping')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-heading font-semibold text-gray-900">
                        {t('orders.orderNumber')}: {order.orderNumber}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {t(`orders.status.${order.status}`)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 lg:gap-8">
                    <div className="text-sm">
                      <span className="text-gray-500">{t('orders.items')}: </span>
                      <span className="font-medium">{order.items?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">{t('orders.total')}: </span>
                      <span className="font-heading font-bold text-primary-600">
                        Rs. {order.total?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/orders/${order._id}`}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <FiEye className="w-4 h-4" />
                    {t('orders.viewDetails')}
                    <FiChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Order Items Preview */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {order.items?.slice(0, 4).map((item, index) => (
                    <img
                      key={index}
                      src={getImageUrl(item.product?.images?.[0]?.url || item.image || order.customDesign?.uploadedImages?.[0]?.url)}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg shrink-0"
                    />
                  ))}
                  {order.items?.length > 4 && (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm shrink-0">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyOrders;
