import { useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiPackage, FiMapPin, FiCreditCard, FiTruck, FiCheck, FiX, FiArrowLeft, FiUpload, FiClock, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ordersAPI } from '../services/api';
import { useLanguageStore } from '../store/useStore';
import { PageLoader } from '../components/common/Loader';
import Loader from '../components/common/Loader';
import { getImageUrl } from '../utils/imageUrl';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const paymentStatusColors = {
  pending_advance: 'bg-yellow-100 text-yellow-800',
  advance_submitted: 'bg-blue-100 text-blue-800',
  advance_approved: 'bg-green-100 text-green-800',
  pending_final: 'bg-orange-100 text-orange-800',
  final_submitted: 'bg-blue-100 text-blue-800',
  fully_paid: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

const OrderDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

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

  const advancePaymentMutation = useMutation({
    mutationFn: (file) => ordersAPI.submitAdvancePayment(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      toast.success(t('orders.paymentSubmitted') || 'Payment submitted! Waiting for verification.');
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploading(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setUploading(false);
    }
  });

  const finalPaymentMutation = useMutation({
    mutationFn: (file) => ordersAPI.submitFinalPayment(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      toast.success(t('orders.paymentSubmitted') || 'Payment submitted! Waiting for verification.');
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploading(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setUploading(false);
    }
  });

  const order = data?.data?.data;
  const currentStepIndex = statusSteps.indexOf(order?.status);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(t('validation.imageOnly') || 'Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('validation.fileTooLarge') || 'File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmitPayment = (type) => {
    if (!selectedFile) {
      toast.error(t('validation.selectScreenshot') || 'Please select a screenshot');
      return;
    }
    setUploading(true);
    if (type === 'advance') {
      advancePaymentMutation.mutate(selectedFile);
    } else {
      finalPaymentMutation.mutate(selectedFile);
    }
  };

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

  // Determine which payment is needed
  const needsAdvancePayment = order.paymentStatus === 'pending_advance' ||
    (order.advancePayment?.status === 'rejected');
  const needsFinalPayment = order.paymentStatus === 'pending_final' ||
    (order.finalPayment?.status === 'rejected');
  const awaitingAdvanceApproval = order.advancePayment?.status === 'submitted';
  const awaitingFinalApproval = order.finalPayment?.status === 'submitted';

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
          <div className="flex flex-wrap gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
              {t(`orders.status.${order.status}`)}
            </span>
          </div>
        </div>

        {/* Payment Required Alert */}
        {(needsAdvancePayment || needsFinalPayment) && order.status !== 'cancelled' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <FiAlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-yellow-800 mb-2">
                  {needsAdvancePayment
                    ? (t('orders.advancePaymentRequired') || 'Advance Payment Required')
                    : (t('orders.finalPaymentRequired') || 'Final Payment Required')
                  }
                </h3>
                <p className="text-yellow-700 text-sm mb-4">
                  {needsAdvancePayment
                    ? (t('orders.advancePaymentDesc') || `Please pay Rs. ${order.advancePayment?.amount?.toLocaleString()} to confirm your order.`)
                    : (t('orders.finalPaymentDesc') || `Your order is ready! Please pay Rs. ${order.finalPayment?.amount?.toLocaleString()} to receive it.`)
                  }
                </p>

                {/* Rejection reason if any */}
                {order.advancePayment?.status === 'rejected' && order.advancePayment?.rejectionReason && (
                  <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                    <strong>{t('orders.rejectionReason') || 'Rejection Reason'}:</strong> {order.advancePayment.rejectionReason}
                  </div>
                )}
                {order.finalPayment?.status === 'rejected' && order.finalPayment?.rejectionReason && (
                  <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                    <strong>{t('orders.rejectionReason') || 'Rejection Reason'}:</strong> {order.finalPayment.rejectionReason}
                  </div>
                )}

                {/* Payment accounts */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">{t('orders.paymentAccounts') || 'Payment Accounts'}</h4>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">EasyPaisa</p>
                      <p className="font-mono font-medium">03471504434</p>
                      <p className="text-gray-500 text-xs">Quratulain Syed</p>
                    </div>
                    <div>
                      <p className="text-gray-500">JazzCash</p>
                      <p className="font-mono font-medium">03471504434</p>
                      <p className="text-gray-500 text-xs">Quratulain Syed</p>
                    </div>
                    <div>
                      <p className="text-gray-500">HBL Bank</p>
                      <p className="font-mono font-medium">16817905812303</p>
                      <p className="text-gray-500 text-xs">Quratulain Syed</p>
                    </div>
                  </div>
                </div>

                {/* File upload */}
                <div className="space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="relative">
                      <img src={previewUrl} alt="Payment screenshot" className="max-h-48 rounded-lg border" />
                      <button
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-yellow-400 rounded-lg hover:border-yellow-500 hover:bg-yellow-100 transition-colors w-full justify-center"
                    >
                      <FiUpload className="w-5 h-5" />
                      <span>{t('orders.uploadScreenshot') || 'Upload Payment Screenshot'}</span>
                    </button>
                  )}

                  {selectedFile && (
                    <button
                      onClick={() => handleSubmitPayment(needsAdvancePayment ? 'advance' : 'final')}
                      disabled={uploading}
                      className="btn btn-primary w-full"
                    >
                      {uploading ? <Loader size="sm" /> : (t('orders.submitPayment') || 'Submit Payment')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Awaiting Approval Alert */}
        {(awaitingAdvanceApproval || awaitingFinalApproval) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <FiClock className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-heading font-semibold text-blue-800">
                  {t('orders.awaitingVerification') || 'Payment Verification Pending'}
                </h3>
                <p className="text-blue-700 text-sm">
                  {t('orders.awaitingVerificationDesc') || 'Your payment is being verified. This usually takes a few hours.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Progress */}
        {order.status !== 'cancelled' && order.advancePayment?.status === 'approved' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="font-heading font-semibold text-gray-900 mb-6">
              {t('orders.orderProgress')}
            </h2>
            <div className="flex items-center justify-between overflow-x-auto">
              {statusSteps.map((step, index) => (
                <div key={step} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        index <= currentStepIndex
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {index < currentStepIndex ? <FiCheck /> : index + 1}
                    </div>
                    <span className="text-xs mt-2 text-gray-600 text-center whitespace-nowrap hidden sm:block">
                      {t(`orders.status.${step}`)}
                    </span>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-1 sm:mx-2 min-w-[10px] ${
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
                      src={getImageUrl(item.product?.images?.[0]?.url || item.image)}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.ageRange && <>{t('common.age', { defaultValue: 'Age' })}: {item.ageRange}</>}
                        {item.color && ` | ${t('common.color')}: ${item.color.name || item.color}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('common.quantity')}: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900">
                        Rs. {(item.price * item.quantity).toLocaleString()}
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
                  {order.shippingAddress?.city}, {order.shippingAddress?.province || order.shippingAddress?.state} {order.shippingAddress?.postalCode}
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

                {/* Payment Breakdown */}
                <div className="mt-4 pt-4 border-t border-dashed space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('checkout.advancePayment') || 'Advance (50%)'}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Rs. {order.advancePayment?.amount?.toLocaleString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.advancePayment?.status === 'approved' ? 'bg-green-100 text-green-700' :
                        order.advancePayment?.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                        order.advancePayment?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.advancePayment?.status === 'approved' ? 'Paid' :
                         order.advancePayment?.status === 'submitted' ? 'Verifying' :
                         order.advancePayment?.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('checkout.finalPayment') || 'Final (50%)'}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Rs. {order.finalPayment?.amount?.toLocaleString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.finalPayment?.status === 'approved' ? 'bg-green-100 text-green-700' :
                        order.finalPayment?.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                        order.finalPayment?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.finalPayment?.status === 'approved' ? 'Paid' :
                         order.finalPayment?.status === 'submitted' ? 'Verifying' :
                         order.finalPayment?.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <FiCreditCard className="w-4 h-4" />
                  {t('checkout.paymentMethod')}
                </div>
                <p className="font-medium capitalize">{order.paymentMethod?.replace('_', ' ')}</p>
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

              {order.status === 'pending' && order.advancePayment?.status !== 'submitted' && (
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
