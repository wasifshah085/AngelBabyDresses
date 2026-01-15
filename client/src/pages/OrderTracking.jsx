import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { FiSearch, FiPackage, FiTruck, FiCheck, FiMapPin, FiClock, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ordersAPI } from '../services/api';
import { useLanguageStore } from '../store/useStore';
import Loader from '../components/common/Loader';
import { getImageUrl } from '../utils/imageUrl';

// Order status steps in order
const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

// Status colors for badges
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

// Icons for each status step
const statusIcons = {
  pending: FiClock,
  confirmed: FiCheckCircle,
  processing: FiPackage,
  shipped: FiTruck,
  out_for_delivery: FiTruck,
  delivered: FiMapPin
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
                <div className="p-6 border-b overflow-x-auto">
                  <h3 className="font-heading font-semibold text-gray-900 mb-4">
                    {t('orders.orderProgress')}
                  </h3>
                  <div className="flex items-center justify-between min-w-max md:min-w-0">
                    {statusSteps.map((step, index) => {
                      const StepIcon = statusIcons[step] || FiPackage;
                      const isCompleted = index < currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const isPending = index > currentStepIndex;

                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${
                                isCompleted
                                  ? 'bg-green-500 text-white'
                                  : isCurrent
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-200 text-gray-400'
                              }`}
                            >
                              {isCompleted ? (
                                <FiCheck className="w-5 h-5 md:w-6 md:h-6" />
                              ) : (
                                <StepIcon className="w-4 h-4 md:w-5 md:h-5" />
                              )}
                            </div>
                            <span className={`text-xs mt-2 text-center max-w-[60px] md:max-w-none ${
                              isCurrent ? 'text-primary-600 font-medium' : 'text-gray-600'
                            } hidden sm:block`}>
                              {t(`orders.status.${step}`)}
                            </span>
                          </div>
                          {index < statusSteps.length - 1 && (
                            <div
                              className={`flex-1 h-1 mx-1 md:mx-2 min-w-[20px] ${
                                index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Mobile status label */}
                  <div className="sm:hidden mt-4 text-center">
                    <span className="text-sm font-medium text-primary-600">
                      {t(`orders.status.${order.status}`)}
                    </span>
                  </div>
                </div>
              )}

              {/* Order Details */}
              <div className="p-6">
                {/* Estimated Delivery */}
                {order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <div className="mb-6 bg-primary-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-primary-700">
                      <FiClock className="w-5 h-5" />
                      <span className="font-medium">
                        {t('orders.estimatedDelivery') || 'Estimated Delivery'}:
                      </span>
                      <span>
                        {new Date(order.estimatedDelivery).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Tracking Number */}
                {order.trackingNumber && (
                  <div className="mb-6 bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
                          <FiTruck className="w-4 h-4" />
                          {t('orders.trackingNumber')}
                        </div>
                        <p className="font-medium text-gray-900">{order.trackingNumber}</p>
                      </div>
                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-primary"
                        >
                          {t('orders.trackShipment') || 'Track Shipment'}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Status History */}
                {order.statusHistory?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-heading font-semibold text-gray-900 mb-4">
                      {t('orders.statusHistory')}
                    </h3>
                    <div className="space-y-3 border-l-2 border-gray-200 pl-4">
                      {[...order.statusHistory].reverse().map((history, index) => (
                        <div key={index} className="relative">
                          <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-primary-500 border-2 border-white" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {t(`orders.status.${history.status}`)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(history.updatedAt || history.timestamp).toLocaleString(
                                language === 'ur' ? 'ur-PK' : 'en-US',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }
                              )}
                            </p>
                            {history.note && (
                              <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">{history.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
                          src={getImageUrl(item.product?.images?.[0]?.url || item.image)}
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
