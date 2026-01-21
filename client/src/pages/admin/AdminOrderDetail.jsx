import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiPackage, FiMapPin, FiCreditCard, FiTruck, FiPrinter, FiCheck, FiX, FiImage, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { managementAPI } from '../../services/api';
import { useLanguageStore } from '../../store/useStore';
import { PageLoader } from '../../components/common/Loader';
import Loader from '../../components/common/Loader';
import { getImageUrl } from '../../utils/imageUrl';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const paymentStatusLabels = {
  pending: 'Pending',
  submitted: 'Submitted - Review Required',
  approved: 'Approved',
  rejected: 'Rejected'
};

const AdminOrderDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null); // 'advance' or 'final'
  const [weightKg, setWeightKg] = useState(1);
  const [showShippingModal, setShowShippingModal] = useState(false);

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

  const approveAdvanceMutation = useMutation({
    mutationFn: () => managementAPI.approveAdvancePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-order', id]);
      toast.success('Advance payment approved!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const rejectAdvanceMutation = useMutation({
    mutationFn: (reason) => managementAPI.rejectAdvancePayment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-order', id]);
      toast.success('Advance payment rejected');
      setShowRejectModal(null);
      setRejectReason('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const approveFinalMutation = useMutation({
    mutationFn: () => managementAPI.approveFinalPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-order', id]);
      toast.success('Final payment approved!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const rejectFinalMutation = useMutation({
    mutationFn: (reason) => managementAPI.rejectFinalPayment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-order', id]);
      toast.success('Final payment rejected');
      setShowRejectModal(null);
      setRejectReason('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const requestFinalMutation = useMutation({
    mutationFn: () => managementAPI.requestFinalPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-order', id]);
      toast.success('Final payment request sent to customer!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const setShippingMutation = useMutation({
    mutationFn: (weightInKg) => managementAPI.setOrderShipping(id, weightInKg),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-order', id]);
      toast.success('Shipping charges set and customer notified!');
      setShowShippingModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="font-heading font-semibold text-lg mb-4">
              Reject {showRejectModal === 'advance' ? 'Advance' : 'Final'} Payment
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="input mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showRejectModal === 'advance') {
                    rejectAdvanceMutation.mutate(rejectReason);
                  } else {
                    rejectFinalMutation.mutate(rejectReason);
                  }
                }}
                disabled={rejectAdvanceMutation.isPending || rejectFinalMutation.isPending}
                className="btn bg-red-500 text-white hover:bg-red-600 flex-1"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Weight Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="font-heading font-semibold text-lg mb-4">
              Set Shipping Charges
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the package weight. Shipping rate is Rs 350 per kg.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Weight (kg)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 1)}
                className="input"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Weight:</span>
                <span className="font-medium">{weightKg} kg</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Rate:</span>
                <span className="font-medium">Rs 350/kg</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Shipping Cost:</span>
                <span className="text-primary-600">Rs {(Math.ceil(weightKg) * 350).toLocaleString()}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining Product Cost:</span>
                <span>Rs {order?.finalPayment?.amount?.toLocaleString() || (order?.subtotal - order?.advancePayment?.amount)?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total COD Amount:</span>
                <span className="text-green-600">
                  Rs {((order?.subtotal - order?.advancePayment?.amount) + (Math.ceil(weightKg) * 350)).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              * Customer will be notified via email about the shipping charges and COD amount.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowShippingModal(false)}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => setShippingMutation.mutate(weightKg)}
                disabled={setShippingMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {setShippingMutation.isPending ? <Loader size="sm" /> : 'Set & Notify Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        {/* Payment Review Section */}
        {(order.advancePayment?.status === 'submitted' || order.finalPayment?.status === 'submitted') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="font-heading font-semibold text-yellow-800 mb-4 flex items-center gap-2">
              <FiClock className="w-5 h-5" />
              Payment Review Required
            </h3>

            {/* Advance Payment Review */}
            {order.advancePayment?.status === 'submitted' && (
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Advance Payment (50%)</h4>
                  <span className="text-lg font-semibold text-primary-600">
                    Rs. {order.advancePayment.amount?.toLocaleString()}
                  </span>
                </div>
                {order.advancePayment.screenshot?.url && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Payment Screenshot:</p>
                    <a
                      href={order.advancePayment.screenshot.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <img
                        src={order.advancePayment.screenshot.url}
                        alt="Payment proof"
                        className="max-h-48 rounded-lg border hover:opacity-80"
                      />
                    </a>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {new Date(order.advancePayment.submittedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => approveAdvanceMutation.mutate()}
                    disabled={approveAdvanceMutation.isPending}
                    className="btn bg-green-500 text-white hover:bg-green-600 flex-1"
                  >
                    {approveAdvanceMutation.isPending ? <Loader size="sm" /> : (
                      <>
                        <FiCheck className="w-4 h-4 mr-2" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowRejectModal('advance')}
                    className="btn bg-red-500 text-white hover:bg-red-600 flex-1"
                  >
                    <FiX className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Final Payment Review */}
            {order.finalPayment?.status === 'submitted' && (
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Final Payment (50%)</h4>
                  <span className="text-lg font-semibold text-primary-600">
                    Rs. {order.finalPayment.amount?.toLocaleString()}
                  </span>
                </div>
                {order.finalPayment.screenshot?.url && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Payment Screenshot:</p>
                    <a
                      href={order.finalPayment.screenshot.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <img
                        src={order.finalPayment.screenshot.url}
                        alt="Payment proof"
                        className="max-h-48 rounded-lg border hover:opacity-80"
                      />
                    </a>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {new Date(order.finalPayment.submittedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => approveFinalMutation.mutate()}
                    disabled={approveFinalMutation.isPending}
                    className="btn bg-green-500 text-white hover:bg-green-600 flex-1"
                  >
                    {approveFinalMutation.isPending ? <Loader size="sm" /> : (
                      <>
                        <FiCheck className="w-4 h-4 mr-2" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowRejectModal('final')}
                    className="btn bg-red-500 text-white hover:bg-red-600 flex-1"
                  >
                    <FiX className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
                      src={getImageUrl(item.product?.images?.[0]?.url || item.image || order.customDesign?.uploadedImages?.[0]?.url)}
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
                    {order.shippingAddress?.city}, {order.shippingAddress?.province || order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                  </p>
                  <p>{order.shippingAddress?.phone}</p>
                </div>

                {/* Tracking Info */}
                {(order.shippingCarrier || order.trackingNumber) && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <FiTruck className="w-4 h-4 text-primary-500" />
                      Shipping Info
                    </h3>
                    <div className="text-sm space-y-1">
                      {order.shippingCarrier && (
                        <p><span className="text-gray-500">Courier:</span> <span className="font-medium">{order.shippingCarrier}</span></p>
                      )}
                      {order.trackingNumber && (
                        <p><span className="text-gray-500">Tracking #:</span> <span className="font-medium">{order.trackingNumber}</span></p>
                      )}
                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Track Order →
                        </a>
                      )}
                    </div>
                  </div>
                )}
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
                  <span className={order.shippingCost > 0 ? 'font-medium' : 'text-gray-500 text-xs'}>
                    {order.shippingCost > 0 ? `Rs. ${order.shippingCost?.toLocaleString()}` : (t('checkout.onDelivery') || 'On delivery (Rs 350/kg)')}
                  </span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary-600">Rs. {order.total?.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="mt-4 pt-4 border-t space-y-3">
                <p className="text-xs text-gray-500 uppercase font-semibold">{t('checkout.paymentBreakdown') || 'Payment Breakdown'}</p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">{t('checkout.advancePayment') || 'Advance (50%)'}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Rs. {order.advancePayment?.amount?.toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.advancePayment?.status === 'approved' ? 'bg-green-100 text-green-700' :
                      order.advancePayment?.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                      order.advancePayment?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.advancePayment?.status === 'approved' ? t('orders.paid') || 'Paid' :
                       order.advancePayment?.status === 'submitted' ? t('orders.verifying') || 'Verifying' :
                       order.advancePayment?.status === 'rejected' ? t('orders.rejected') || 'Rejected' : t('orders.pending') || 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">{t('checkout.finalPayment') || 'Final (50%)'}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Rs. {order.finalPayment?.amount?.toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.finalPayment?.status === 'approved' ? 'bg-green-100 text-green-700' :
                      order.finalPayment?.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                      order.finalPayment?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.finalPayment?.status === 'approved' ? t('orders.paid') || 'Paid' :
                       order.finalPayment?.status === 'submitted' ? t('orders.verifying') || 'Verifying' :
                       order.finalPayment?.status === 'rejected' ? t('orders.rejected') || 'Rejected' : t('orders.pending') || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiCreditCard className="w-4 h-4" />
                  {t('checkout.paymentMethod')}
                </div>
                <p className="font-medium capitalize">{order.paymentMethod?.replace('_', ' ')}</p>
              </div>

              {/* Shipping Charges Section */}
              {order.advancePayment?.status === 'approved' && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <FiTruck className="w-4 h-4" />
                    Shipping Charges
                  </h4>

                  {order.shippingCost > 0 ? (
                    <div className="bg-green-50 rounded-lg p-3 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Weight:</span>
                        <span className="font-medium">{(order.orderWeight / 1000).toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="font-medium">Rs {order.shippingCost?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-green-700 pt-2 border-t border-green-200">
                        <span>COD Amount:</span>
                        <span>Rs {order.finalPayment?.amount?.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-800 mb-3">
                      Shipping charges not set yet. Set weight to calculate shipping.
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setWeightKg(order.orderWeight ? order.orderWeight / 1000 : 1);
                      setShowShippingModal(true);
                    }}
                    className="btn btn-outline w-full mt-3"
                  >
                    <FiPackage className="w-4 h-4 mr-2" />
                    {order.shippingCost > 0 ? 'Update Shipping' : 'Set Shipping Charges'}
                  </button>
                </div>
              )}

              {/* Request Final Payment Button - Only show when shipping is set */}
              {order.advancePayment?.status === 'approved' &&
               order.shippingCost > 0 &&
               order.finalPayment?.status === 'pending' &&
               order.status !== 'delivered' && (
                <button
                  onClick={() => requestFinalMutation.mutate()}
                  disabled={requestFinalMutation.isPending}
                  className="btn btn-primary w-full mt-4"
                >
                  {requestFinalMutation.isPending ? <Loader size="sm" /> : 'Notify Customer - Ready for Shipping'}
                </button>
              )}
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
                    <option value="out_for_delivery">{t('orders.status.out_for_delivery')}</option>
                    <option value="delivered">{t('orders.status.delivered')}</option>
                    <option value="cancelled">{t('orders.status.cancelled')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiTruck className="w-4 h-4 inline mr-1" />
                    Courier Service
                  </label>
                  <select
                    {...register('shippingCarrier')}
                    defaultValue={order.shippingCarrier || ''}
                    className="input"
                  >
                    <option value="">Select Courier Service</option>
                    <option value="TCS">TCS</option>
                    <option value="Leopards">Leopards Courier</option>
                    <option value="M&P">M&P (Muller & Phipps)</option>
                    <option value="Pakistan Post">Pakistan Post</option>
                    <option value="Trax">Trax</option>
                    <option value="BlueEx">BlueEx</option>
                    <option value="Swyft">Swyft Logistics</option>
                    <option value="Rider">Rider</option>
                    <option value="PostEx">PostEx</option>
                    <option value="Daewoo">Daewoo Express</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    {...register('trackingNumber')}
                    defaultValue={order.trackingNumber}
                    className="input"
                    placeholder="Enter tracking number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking URL (Optional)
                  </label>
                  <input
                    type="url"
                    {...register('trackingUrl')}
                    defaultValue={order.trackingUrl}
                    className="input"
                    placeholder="https://tracking.example.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    {...register('adminNotes')}
                    rows={2}
                    className="input"
                    placeholder="Internal notes about this order"
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
