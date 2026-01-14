import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { FiSearch, FiPackage, FiTruck, FiCheck, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ordersAPI } from '../services/api';
import { useLanguageStore } from '../store/useStore';
import Loader from '../components/common/Loader';

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const OrderTracking = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [order, setOrder] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const trackMutation = useMutation({
    mutationFn: (orderNumber) => ordersAPI.track(orderNumber),
    onSuccess: (response) => {
      setOrder(response.data.data);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('orders.notFound'));
      setOrder(null);
    }
  });

  const onSubmit = (data) => {
    trackMutation.mutate(data.orderNumber);
  };

  const currentStepIndex = order ? statusSteps.indexOf(order.status) : -1;

  return (
    <>
      <Helmet>
        <title>{t('orders.trackOrder')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-heading font-bold text-gray-900 mb-4">
              {t('orders.trackOrder')}
            </h1>
            <p className="text-gray-600">
              {t('orders.trackOrderDesc')}
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mb-10">
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  {...register('orderNumber', { required: t('validation.required') })}
                  className={`input ${errors.orderNumber ? 'input-error' : ''}`}
                  placeholder={t('orders.enterOrderNumber')}
                />
                {errors.orderNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.orderNumber.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={trackMutation.isPending}
                className="btn btn-primary px-8"
              >
                {trackMutation.isPending ? (
                  <Loader size="sm" />
                ) : (
                  <>
                    <FiSearch className="w-5 h-5 mr-2" />
                    {t('orders.track')}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Order Info */}
          {order && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Order Header */}
              <div className="bg-primary-50 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-heading font-bold text-gray-900">
                      {t('orders.orderNumber')}: {order.orderNumber}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(order.createdAt).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                    {t(`orders.status.${order.status}`)}
                  </span>
                </div>
              </div>

              {/* Progress Tracker */}
              {order.status !== 'cancelled' && (
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    {statusSteps.map((step, index) => (
                      <div key={step} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              index <= currentStepIndex
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            {index < currentStepIndex ? (
                              <FiCheck className="w-6 h-6" />
                            ) : step === 'shipped' ? (
                              <FiTruck className="w-5 h-5" />
                            ) : step === 'delivered' ? (
                              <FiMapPin className="w-5 h-5" />
                            ) : (
                              <FiPackage className="w-5 h-5" />
                            )}
                          </div>
                          <span className="text-xs mt-2 text-gray-600 text-center hidden md:block">
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

              {/* Order Details */}
              <div className="p-6">
                {/* Status History */}
                {order.statusHistory?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-heading font-semibold text-gray-900 mb-4">
                      {t('orders.statusHistory')}
                    </h3>
                    <div className="space-y-3">
                      {order.statusHistory.map((history, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 mt-2 rounded-full bg-primary-500" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {t(`orders.status.${history.status}`)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(history.timestamp).toLocaleString()}
                            </p>
                            {history.note && (
                              <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tracking Number */}
                {order.trackingNumber && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <FiTruck className="w-4 h-4" />
                      {t('orders.trackingNumber')}
                    </div>
                    <p className="font-medium text-gray-900">{order.trackingNumber}</p>
                  </div>
                )}

                {/* Shipping Address */}
                <div className="mt-6">
                  <h3 className="font-heading font-semibold text-gray-900 mb-3">
                    {t('checkout.shippingAddress')}
                  </h3>
                  <div className="text-gray-600">
                    <p className="font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
                    <p>{order.shippingAddress?.address}</p>
                    <p>
                      {order.shippingAddress?.city}, {order.shippingAddress?.state}
                    </p>
                    <p>{order.shippingAddress?.phone}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-6">
                  <h3 className="font-heading font-semibold text-gray-900 mb-3">
                    {t('orders.orderItems')}
                  </h3>
                  <div className="space-y-3">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex gap-3">
                        <img
                          src={item.product?.images?.[0]?.url || item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.ageRange} x {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="mt-6 pt-6 border-t flex justify-between items-center">
                  <span className="font-heading font-semibold text-gray-900">
                    {t('cart.total')}
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    Rs. {order.total?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderTracking;
