import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiPackage, FiMapPin, FiCreditCard, FiTruck, FiPrinter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { managementAPI } from '../../services/api';
import { useLanguageStore } from '../../store/useStore';
import { PageLoader } from '../../components/common/Loader';
import Loader from '../../components/common/Loader';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const AdminOrderDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(false);

  const { register, handleSubmit } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => managementAPI.getOrderById(id)
  });

  const updateMutation = useMutation({
    mutationFn: (data) => managementAPI.updateOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-order', id]);
      toast.success(t('admin.orderUpdated'));
      setUpdating(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setUpdating(false);
    }
  });

  const order = data?.data?.data;

  const onSubmit = (data) => {
    setUpdating(true);
    updateMutation.mutate(data);
  };

  if (isLoading) return <PageLoader />;

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">{t('orders.notFound')}</p>
        <Link to="/admin/orders" className="btn btn-primary mt-4">
          {t('admin.backToOrders')}
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('admin.orderDetails')} #{order.orderNumber} | Angel Baby Dresses</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/admin/orders"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft />
            {t('admin.backToOrders')}
          </Link>
          <button
            onClick={() => window.print()}
            className="btn btn-outline"
          >
            <FiPrinter className="w-4 h-4 mr-2" />
            {t('admin.printInvoice')}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiPackage className="w-5 h-5 text-primary-500" />
                {t('orders.orderItems')}
              </h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                    <img
                      src={item.product?.images?.[0]?.url || item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.ageRange && <>{t('common.age', { defaultValue: 'Age' })}: {item.ageRange}</>}
                        {item.color && ` | ${t('common.color')}: ${item.color.name || item.color}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        Rs. {item.price?.toLocaleString()} x {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer & Shipping */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-heading font-semibold text-gray-900 mb-4">
                  {t('admin.customer')}
                </h2>
                <div className="text-gray-600">
                  <p className="font-medium text-gray-900">{order.user?.name || 'Guest'}</p>
                  <p>{order.user?.email}</p>
                  <p>{order.user?.phone}</p>
                </div>
              </div>

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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
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
                <hr />
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary-600">Rs. {order.total?.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
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
            </div>

            {/* Update Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-heading font-semibold text-gray-900 mb-4">
                {t('admin.updateOrder')}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.status')}
                  </label>
                  <select
                    {...register('status')}
                    defaultValue={order.status}
                    className="input"
                  >
                    <option value="pending">{t('orders.status.pending')}</option>
                    <option value="confirmed">{t('orders.status.confirmed')}</option>
                    <option value="processing">{t('orders.status.processing')}</option>
                    <option value="shipped">{t('orders.status.shipped')}</option>
                    <option value="delivered">{t('orders.status.delivered')}</option>
                    <option value="cancelled">{t('orders.status.cancelled')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiTruck className="w-4 h-4 inline mr-1" />
                    {t('orders.trackingNumber')}
                  </label>
                  <input
                    type="text"
                    {...register('trackingNumber')}
                    defaultValue={order.trackingNumber}
                    className="input"
                    placeholder={t('admin.enterTracking')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.note')}
                  </label>
                  <textarea
                    {...register('note')}
                    rows={2}
                    className="input"
                    placeholder={t('admin.statusNote')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="btn btn-primary w-full"
                >
                  {updating ? <Loader size="sm" /> : t('admin.updateOrder')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOrderDetail;
