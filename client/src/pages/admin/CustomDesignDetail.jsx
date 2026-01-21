import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiSend, FiUser, FiPhone, FiMail, FiMessageCircle, FiPackage, FiMapPin, FiCreditCard, FiTruck, FiPrinter, FiCheck, FiX, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { managementAPI } from '../../services/api';
import { useLanguageStore } from '../../store/useStore';
import { PageLoader } from '../../components/common/Loader';
import Loader from '../../components/common/Loader';
import { getImageUrl } from '../../utils/imageUrl';

const designStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  quoted: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  in_production: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const orderStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const CustomDesignDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm();

  const [quotedPrice, setQuotedPrice] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [message, setMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [weightKg, setWeightKg] = useState(1);
  const [showShippingModal, setShowShippingModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-custom-design', id],
    queryFn: () => managementAPI.getCustomDesign(id)
  });

  const updateMutation = useMutation({
    mutationFn: (data) => managementAPI.updateCustomDesign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-custom-design', id]);
      queryClient.invalidateQueries(['admin-custom-designs']);
      toast.success(t('admin.designUpdated'));
      setUpdating(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setUpdating(false);
    }
  });

  const messageMutation = useMutation({
    mutationFn: (data) => managementAPI.addDesignMessage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-custom-design', id]);
      setMessage('');
      toast.success('Message sent');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  // Order-related mutations (use the order ID from design.order)
  const approveAdvanceMutation = useMutation({
    mutationFn: () => managementAPI.approveAdvancePayment(design?.order?._id || design?.order),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-custom-design', id]);
      toast.success('Advance payment approved!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const rejectAdvanceMutation = useMutation({
    mutationFn: (reason) => managementAPI.rejectAdvancePayment(design?.order?._id || design?.order, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-custom-design', id]);
      toast.success('Advance payment rejected');
      setShowRejectModal(null);
      setRejectReason('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const approveFinalMutation = useMutation({
    mutationFn: () => managementAPI.approveFinalPayment(design?.order?._id || design?.order),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-custom-design', id]);
      toast.success('Final payment approved!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const rejectFinalMutation = useMutation({
    mutationFn: (reason) => managementAPI.rejectFinalPayment(design?.order?._id || design?.order, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-custom-design', id]);
      toast.success('Final payment rejected');
      setShowRejectModal(null);
      setRejectReason('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const requestFinalMutation = useMutation({
    mutationFn: () => managementAPI.requestFinalPayment(design?.order?._id || design?.order),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-custom-design', id]);
      toast.success('Final payment request sent to customer!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const setShippingMutation = useMutation({
    mutationFn: (weightInKg) => managementAPI.setOrderShipping(design?.order?._id || design?.order, weightInKg),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-custom-design', id]);
      toast.success('Shipping charges set and customer notified!');
      setShowShippingModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: (data) => managementAPI.updateOrderStatus(design?.order?._id || design?.order, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-custom-design', id]);
      toast.success(t('admin.orderUpdated'));
      setUpdating(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setUpdating(false);
    }
  });

  if (isLoading) return <PageLoader />;

  const design = data?.data?.data;
  const order = design?.order;
  const hasOrder = order && typeof order === 'object' && order._id;
  const advanceAmount = design?.quotedPrice ? Math.ceil((design.quotedPrice * design.quantity) / 2) : 0;
  const finalAmount = design?.quotedPrice ? (design.quotedPrice * design.quantity) - advanceAmount : 0;

  if (!design) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Custom design not found</p>
        <button onClick={() => navigate('/admin/custom-designs')} className="btn btn-primary mt-4">
          Back to Custom Designs
        </button>
      </div>
    );
  }

  const handleSendQuote = () => {
    if (!quotedPrice || Number(quotedPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    updateMutation.mutate({
      status: 'quoted',
      quotedPrice: Number(quotedPrice),
      estimatedDays: estimatedDays ? Number(estimatedDays) : undefined,
      adminNotes
    });
  };

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({ status: newStatus });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    messageMutation.mutate({ message });
  };

  const onOrderSubmit = (data) => {
    setUpdating(true);
    updateOrderMutation.mutate(data);
  };

  return (
    <>
      <Helmet>
        <title>Custom Design #{design.designNumber || design._id.slice(-6).toUpperCase()} | Angel Baby Dresses</title>
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
      {showShippingModal && hasOrder && (
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
                <span>Rs {finalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total COD Amount:</span>
                <span className="text-green-600">
                  Rs {(finalAmount + (Math.ceil(weightKg) * 350)).toLocaleString()}
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
          <button
            onClick={() => navigate('/admin/custom-designs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft />
            {t('admin.backToDesigns') || 'Back to Custom Designs'}
          </button>
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
              Design #{design.designNumber || design._id.slice(-6).toUpperCase()}
            </h1>
            <p className="text-gray-500 mt-1">
              {new Date(design.createdAt).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${designStatusColors[design.status]}`}>
              {t(`customDesign.status.${design.status}`)}
            </span>
            {hasOrder && (
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${orderStatusColors[order.status]}`}>
                {t(`orders.status.${order.status}`)}
              </span>
            )}
          </div>
        </div>

        {/* Payment Review Section */}
        {hasOrder && (order.advancePayment?.status === 'submitted' || order.finalPayment?.status === 'submitted') && (
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
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Design Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiPackage className="w-5 h-5 text-primary-500" />
                Design Details
              </h2>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-900">{new Date(design.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Product Type:</span>
                  <span className="ml-2 text-gray-900 capitalize">{design.productType}</span>
                </div>
                <div>
                  <span className="text-gray-500">Size:</span>
                  <span className="ml-2 text-gray-900">{design.size}</span>
                </div>
                <div>
                  <span className="text-gray-500">Quantity:</span>
                  <span className="ml-2 text-gray-900">{design.quantity}</span>
                </div>
                {design.preferredColors?.length > 0 && (
                  <div>
                    <span className="text-gray-500">Colors:</span>
                    <span className="ml-2 text-gray-900">{design.preferredColors.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{design.description}</p>
              </div>

              {design.additionalNotes && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-900 mb-2">Additional Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{design.additionalNotes}</p>
                </div>
              )}
            </div>

            {/* Uploaded Images */}
            {design.uploadedImages?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Reference Images</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {design.uploadedImages.map((img, index) => (
                    <a
                      key={index}
                      href={getImageUrl(img.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition"
                    >
                      <img
                        src={getImageUrl(img.url)}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Customer & Shipping */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-heading font-semibold text-gray-900 mb-4">
                  {t('admin.customer')}
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FiUser className="w-5 h-5 text-gray-400" />
                    <span>{design.user?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiMail className="w-5 h-5 text-gray-400" />
                    <span>{design.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiPhone className="w-5 h-5 text-gray-400" />
                    <span>{design.customerContact?.whatsapp || design.customerContact?.phone || design.user?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {hasOrder && order.shippingAddress && (
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
              )}
            </div>

            {/* Conversation */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                <FiMessageCircle className="inline mr-2" />
                Conversation
              </h2>

              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {design.conversation?.length > 0 ? (
                  design.conversation.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        msg.sender === 'admin'
                          ? 'bg-primary-50 ml-8'
                          : 'bg-gray-100 mr-8'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {msg.sender === 'admin' ? 'Admin' : 'Customer'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-800">{msg.message}</p>
                      {msg.attachments?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {msg.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={getImageUrl(att.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-16 h-16 rounded overflow-hidden bg-gray-200"
                            >
                              <img src={getImageUrl(att.url)} alt="" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No messages yet</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={messageMutation.isPending || !message.trim()}
                  className="btn btn-primary"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary - Show when order exists */}
            {hasOrder && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="font-heading font-semibold text-gray-900 mb-4">
                  {t('cart.orderSummary')}
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('cart.subtotal')}</span>
                    <span className="font-medium">Rs. {(design.quotedPrice * design.quantity)?.toLocaleString()}</span>
                  </div>
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

                {/* Request Final Payment Button */}
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
            )}

            {/* Design Status Update */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Update Design Status</h2>
              <select
                value={design.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updateMutation.isPending}
                className="input w-full"
              >
                <option value="pending">{t('customDesign.status.pending')}</option>
                <option value="reviewing">{t('customDesign.status.reviewing')}</option>
                <option value="quoted">{t('customDesign.status.quoted')}</option>
                <option value="accepted">{t('customDesign.status.accepted')}</option>
                <option value="in_production">{t('customDesign.status.in_production')}</option>
                <option value="completed">{t('customDesign.status.completed')}</option>
                <option value="cancelled">{t('customDesign.status.cancelled')}</option>
              </select>
            </div>

            {/* Quote Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {design.quotedPrice ? 'Quote Details' : 'Send Quote'}
              </h2>

              {design.quotedPrice ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-500">Price per item:</span>
                    <span className="ml-2 text-lg font-bold text-primary-600">
                      Rs. {design.quotedPrice.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total ({design.quantity} items):</span>
                    <span className="ml-2 text-xl font-bold text-primary-600">
                      Rs. {(design.quotedPrice * design.quantity).toLocaleString()}
                    </span>
                  </div>
                  {design.estimatedDays && (
                    <div>
                      <span className="text-gray-500">Estimated Days:</span>
                      <span className="ml-2 text-gray-900">{design.estimatedDays} days</span>
                    </div>
                  )}
                  {design.adminNotes && (
                    <div>
                      <span className="text-gray-500">Notes:</span>
                      <p className="text-gray-900 mt-1">{design.adminNotes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per item (Rs.) *
                    </label>
                    <input
                      type="number"
                      value={quotedPrice}
                      onChange={(e) => setQuotedPrice(e.target.value)}
                      className="input w-full"
                      placeholder="Enter quoted price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Days
                    </label>
                    <input
                      type="number"
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(e.target.value)}
                      className="input w-full"
                      placeholder="e.g., 7"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes for Customer
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="input w-full"
                      rows={3}
                      placeholder="Any notes about the quote..."
                    />
                  </div>
                  <button
                    onClick={handleSendQuote}
                    disabled={updateMutation.isPending}
                    className="btn btn-primary w-full"
                  >
                    Send Quote
                  </button>
                </div>
              )}
            </div>

            {/* Order Update Section - Only show when order exists */}
            {hasOrder && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-heading font-semibold text-gray-900 mb-4">
                  {t('admin.updateOrder')}
                </h2>
                <form onSubmit={handleSubmit(onOrderSubmit)} className="space-y-4">
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
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomDesignDetail;
