import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiPackage, FiMapPin, FiCreditCard, FiTruck, FiCheck, FiX, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ordersAPI } from '../services/api';
import { useLanguageStore } from '../store/useStore';
import { PageLoader } from '../components/common/Loader';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const OrderDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersAPI.getById(id)
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      toast.success(t('orders.cancelSuccess'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const order = data?.data?.data;

  const currentStepIndex = statusSteps.indexOf(order?.status);

  if (isLoading) return <PageLoader />;

  if (!order) {
    return (
      <div className="container py-16 text-center">
        <FiPackage className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-medium text-gray-900 mb-2">
          {t('orders.notFound')}
        </h2>
        <Link to="/my-orders" className="btn btn-primary mt-4">
          {t('orders.backToOrders')}
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('orders.orderDetails')} #{order.orderNumber} | Angel Baby Dresses</title>
      </Helmet>

      <div className="container py-8">
        <Link
          to="/my-orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft />
          {t('orders.backToOrders')}
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900">
              {t('orders.orderNumber')}: {order.orderNumber}
            </h1>
            <p className="text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
            {t(`orders.status.${order.status}`)}
          </span>
        </div>

        {/* Order Progress */}
        {order.status !== 'cancelled' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="font-heading font-semibold text-gray-900 mb-6">
              {t('orders.orderProgress')}
            </h2>
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index <= currentStepIndex
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {index < currentStepIndex ? <FiCheck /> : index + 1}
                    </div>
                    <span className="text-xs mt-2 text-gray-600 text-center">
                      {t(`orders.status.${step}`)}
                    </span>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        index < currentStepIndex ? 'bg-primary-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiPackage className="w-5 h-5 text-primary-500" />
                {t('orders.orderItems')}
              </h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <img
                      src={item.product?.images?.[0]?.url || item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.ageRange && <>{t('common.age', { defaultValue: 'Age' })}: {item.ageRange}</>}
                        {item.color && ` | ${t('common.color')}: ${item.color.name || item.color}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('common.quantity')}: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Rs. {item.price?.toLocaleString()} x {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiMapPin className="w-5 h-5 text-primary-500" />
                {t('checkout.shippingAddress')}
              </h2>
              <div className="text-gray-600">
                <p className="font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
                <p>{order.shippingAddress?.address}</p>
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                </p>
                <p>{order.shippingAddress?.phone}</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-6 lg:mt-0">
            <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
              <h2 className="font-heading font-semibold text-gray-900 mb-4">
                {t('cart.orderSummary')}
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('cart.subtotal')}</span>
                  <span className="font-medium">Rs. {order.subtotal?.toLocaleString()}</span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('cart.discount')}</span>
                    <span>-Rs. {order.discount?.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">{t('cart.shipping')}</span>
                  <span className="font-medium">
                    {order.shippingCost === 0 ? t('cart.free') : `Rs. ${order.shippingCost}`}
                  </span>
                </div>

                <hr className="my-4" />

                <div className="flex justify-between text-lg font-semibold">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary-600">Rs. {order.total?.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <FiCreditCard className="w-4 h-4" />
                  {t('checkout.paymentMethod')}
                </div>
                <p className="font-medium capitalize">{order.paymentMethod}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {t(`orders.payment.${order.paymentStatus}`)}
                </span>
              </div>

              {order.trackingNumber && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <FiTruck className="w-4 h-4" />
                    {t('orders.trackingNumber')}
                  </div>
                  <p className="font-medium">{order.trackingNumber}</p>
                </div>
              )}

              {order.status === 'pending' && (
                <button
                  onClick={() => {
                    if (window.confirm(t('orders.confirmCancel'))) {
                      cancelMutation.mutate();
                    }
                  }}
                  disabled={cancelMutation.isPending}
                  className="btn btn-outline w-full mt-6 text-red-500 border-red-300 hover:bg-red-50"
                >
                  <FiX className="w-4 h-4 mr-2" />
                  {t('orders.cancelOrder')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetail;
