import { useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useDropzone } from 'react-dropzone';
import { FiArrowLeft, FiSend, FiImage, FiX, FiCheck, FiClock, FiTruck, FiCreditCard, FiPackage, FiUpload, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { customDesignAPI, ordersAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';
import { PageLoader } from '../components/common/Loader';
import Loader from '../components/common/Loader';
import { getImageUrl } from '../utils/imageUrl';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  quoted: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  in_production: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const HowItWorks = () => (
  <div className="bg-gradient-to-br from-primary-50 to-pink-50 rounded-xl p-6 mb-6">
    <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <FiInfo className="w-5 h-5 text-primary-500" />
      How Payment Works
    </h3>
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
        <div>
          <p className="font-medium text-gray-900">Accept Quote & Pay 50% Advance</p>
          <p className="text-sm text-gray-600">Pay 50% of the quoted price via JazzCash, Easypaisa, or Bank Transfer to confirm your order.</p>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
        <div>
          <p className="font-medium text-gray-900">Admin Verifies Payment</p>
          <p className="text-sm text-gray-600">Our team will verify your payment screenshot and confirm your order within 24 hours.</p>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
        <div>
          <p className="font-medium text-gray-900">Production Begins</p>
          <p className="text-sm text-gray-600">Once payment is verified, we start making your custom design with care and attention.</p>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">4</div>
        <div>
          <p className="font-medium text-gray-900">Pay Remaining 50% + Shipping (COD)</p>
          <p className="text-sm text-gray-600">Pay the remaining amount plus shipping (Rs 350/kg) when you receive your order via Cash on Delivery.</p>
        </div>
      </div>
    </div>
  </div>
);

const PaymentAccounts = ({ t }) => (
  <div className="bg-white border rounded-lg p-4 mb-4">
    <h4 className="font-medium text-gray-900 mb-3">{t('orders.paymentAccounts') || 'Payment Accounts'}</h4>
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between p-2 bg-green-50 rounded">
        <div>
          <p className="font-medium text-green-800">JazzCash</p>
          <p className="text-green-700">0334-1542572</p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText('03341542572');
            toast.success('Copied!');
          }}
          className="text-green-600 hover:text-green-700 text-xs"
        >
          Copy
        </button>
      </div>
      <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
        <div>
          <p className="font-medium text-blue-800">Easypaisa</p>
          <p className="text-blue-700">0334-1542572</p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText('03341542572');
            toast.success('Copied!');
          }}
          className="text-blue-600 hover:text-blue-700 text-xs"
        >
          Copy
        </button>
      </div>
      <div className="p-2 bg-gray-50 rounded">
        <p className="font-medium text-gray-800">Bank Transfer</p>
        <p className="text-gray-600">HBL - Angel Baby Dresses</p>
        <p className="text-gray-600">Account: 1234567890123</p>
      </div>
    </div>
  </div>
);

const DesignDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Shipping form state
  const [shippingForm, setShippingForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    city: '',
    province: '',
    postalCode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('jazzcash');

  const { data, isLoading } = useQuery({
    queryKey: ['design', id],
    queryFn: () => customDesignAPI.getById(id)
  });

  const design = data?.data?.data;

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setAttachments(prev => [...prev, ...newFiles].slice(0, 3));
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 3,
    maxSize: 5 * 1024 * 1024
  });

  const messageMutation = useMutation({
    mutationFn: (data) => customDesignAPI.addMessage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['design', id]);
      setMessage('');
      setAttachments([]);
      setSending(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setSending(false);
    }
  });

  const acceptMutation = useMutation({
    mutationFn: (data) => customDesignAPI.acceptQuote(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['design', id]);
      toast.success(t('customDesign.quoteAccepted') || 'Quote accepted! Please pay the advance amount.');
      setShowAcceptForm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => customDesignAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['design', id]);
      toast.success(t('customDesign.designCancelled'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const paymentMutation = useMutation({
    mutationFn: (file) => ordersAPI.submitAdvancePayment(design.order._id || design.order, file),
    onSuccess: () => {
      queryClient.invalidateQueries(['design', id]);
      setPaymentScreenshot(null);
      setUploading(false);
      toast.success(t('orders.paymentSubmitted') || 'Payment submitted! Waiting for verification.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setUploading(false);
    }
  });

  const handleSendMessage = () => {
    if (!message.trim() && attachments.length === 0) return;
    setSending(true);
    messageMutation.mutate({
      message: message.trim(),
      attachments: attachments.map(a => a.file)
    });
  };

  const handleAcceptQuote = () => {
    // Validate form
    if (!shippingForm.fullName || !shippingForm.phone || !shippingForm.address ||
        !shippingForm.city || !shippingForm.province) {
      toast.error('Please fill all required shipping fields');
      return;
    }
    acceptMutation.mutate({
      shippingAddress: shippingForm,
      paymentMethod
    });
  };

  const handlePaymentUpload = () => {
    if (!paymentScreenshot) {
      toast.error('Please select a payment screenshot');
      return;
    }
    setUploading(true);
    paymentMutation.mutate(paymentScreenshot);
  };

  if (isLoading) return <PageLoader />;

  if (!design) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-xl font-medium text-gray-900 mb-4">
          {t('customDesign.notFound')}
        </h2>
        <Link to="/my-designs" className="btn btn-primary">
          {t('customDesign.backToDesigns')}
        </Link>
      </div>
    );
  }

  const order = design.order;
  const advanceAmount = design.quotedPrice ? Math.ceil((design.quotedPrice * design.quantity) / 2) : 0;
  const needsPayment = order && (order.paymentStatus === 'pending_advance' || order.advancePayment?.status === 'pending');
  const paymentSubmitted = order && order.advancePayment?.status === 'submitted';
  const paymentApproved = order && order.advancePayment?.status === 'approved';

  return (
    <>
      <Helmet>
        <title>{t('customDesign.designDetails')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="container py-8">
        <Link
          to="/my-designs"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft />
          {t('customDesign.backToDesigns')}
        </Link>

        {/* How It Works - Show when quote is available */}
        {design.status === 'quoted' && !showAcceptForm && (
          <HowItWorks />
        )}

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Design Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-heading font-bold text-gray-900">
                  {t('customDesign.designId')}: #{design.designNumber || design._id.slice(-6).toUpperCase()}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[design.status]}`}>
                  {t(`customDesign.status.${design.status}`)}
                </span>
              </div>

              {/* Design Images */}
              {design.uploadedImages?.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {design.uploadedImages.map((image, index) => (
                    <img
                      key={index}
                      src={getImageUrl(image.url)}
                      alt={`Design ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(getImageUrl(image.url), '_blank')}
                    />
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {t('customDesign.description')}
                  </h3>
                  <p className="text-gray-900">{design.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      {t('common.size')}
                    </h3>
                    <p className="text-gray-900">{design.size}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      {t('common.quantity')}
                    </h3>
                    <p className="text-gray-900">{design.quantity}</p>
                  </div>
                </div>

                {design.preferredColors?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      {t('customDesign.preferredColors')}
                    </h3>
                    <p className="text-gray-900">{design.preferredColors.join(', ')}</p>
                  </div>
                )}

                {design.additionalNotes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      {t('customDesign.additionalNotes') || 'Additional Notes'}
                    </h3>
                    <p className="text-gray-900">{design.additionalNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Accept Quote Form */}
            {showAcceptForm && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-heading font-semibold text-gray-900 mb-4">
                  {t('customDesign.shippingDetails') || 'Shipping & Payment Details'}
                </h2>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={shippingForm.fullName}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={shippingForm.phone}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={shippingForm.email}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, email: e.target.value }))}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <textarea
                      value={shippingForm.address}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, address: e.target.value }))}
                      className="input"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, city: e.target.value }))}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Province *
                      </label>
                      <select
                        value={shippingForm.province}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, province: e.target.value }))}
                        className="input"
                        required
                      >
                        <option value="">Select Province</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Sindh">Sindh</option>
                        <option value="KPK">Khyber Pakhtunkhwa</option>
                        <option value="Balochistan">Balochistan</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="AJK">Azad Kashmir</option>
                        <option value="GB">Gilgit-Baltistan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={shippingForm.postalCode}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method for Advance (50%) *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['jazzcash', 'easypaisa', 'bank_transfer'].map((method) => (
                        <label
                          key={method}
                          className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${
                            paymentMethod === method
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method}
                            checked={paymentMethod === method}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium capitalize">
                            {method === 'bank_transfer' ? 'Bank Transfer' : method}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> You will pay Rs. {advanceAmount.toLocaleString()} (50%) now via {paymentMethod}.
                      The remaining 50% + shipping charges (Rs 350/kg) will be paid via Cash on Delivery.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAcceptForm(false)}
                      className="btn btn-outline flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAcceptQuote}
                      disabled={acceptMutation.isPending}
                      className="btn btn-primary flex-1"
                    >
                      {acceptMutation.isPending ? <Loader size="sm" /> : 'Confirm & Proceed to Payment'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Section - After accepting quote */}
            {design.status === 'accepted' && needsPayment && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiCreditCard className="w-5 h-5 text-primary-500" />
                  {t('customDesign.payAdvance') || 'Pay Advance Amount'}
                </h2>

                <div className="bg-primary-50 rounded-lg p-4 mb-4">
                  <p className="text-lg font-bold text-primary-600">
                    Amount to Pay: Rs. {advanceAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-primary-700">50% advance payment</p>
                </div>

                <PaymentAccounts t={t} />

                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Please transfer the amount to any of the above accounts and upload the payment screenshot below.
                  </p>

                  <div className="border-2 border-dashed rounded-lg p-4">
                    {paymentScreenshot ? (
                      <div className="flex items-center gap-4">
                        <img
                          src={URL.createObjectURL(paymentScreenshot)}
                          alt="Payment screenshot"
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{paymentScreenshot.name}</p>
                          <button
                            onClick={() => setPaymentScreenshot(null)}
                            className="text-red-500 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer">
                        <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload payment screenshot</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPaymentScreenshot(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <button
                    onClick={handlePaymentUpload}
                    disabled={uploading || !paymentScreenshot}
                    className="btn btn-primary w-full"
                  >
                    {uploading ? <Loader size="sm" /> : 'Submit Payment'}
                  </button>
                </div>
              </div>
            )}

            {/* Payment Submitted - Awaiting verification */}
            {paymentSubmitted && (
              <div className="bg-yellow-50 rounded-xl p-6">
                <h2 className="font-heading font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <FiClock className="w-5 h-5" />
                  {t('orders.awaitingVerification') || 'Payment Verification Pending'}
                </h2>
                <p className="text-yellow-700">
                  {t('orders.awaitingVerificationDesc') || 'Your payment is being verified. This usually takes a few hours. You will be notified once verified.'}
                </p>
              </div>
            )}

            {/* Payment Approved */}
            {paymentApproved && (
              <div className="bg-green-50 rounded-xl p-6">
                <h2 className="font-heading font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <FiCheck className="w-5 h-5" />
                  {t('orders.paymentApproved') || 'Payment Verified!'}
                </h2>
                <p className="text-green-700">
                  Your advance payment has been verified. Your custom design is now in production!
                </p>
                {order && (
                  <Link to={`/orders/${order._id || order}`} className="btn btn-outline mt-4">
                    View Order Details
                  </Link>
                )}
              </div>
            )}

            {/* Tracking Info - Show when order has tracking details */}
            {order && (order.shippingCarrier || order.trackingNumber) && (
              <div className="bg-indigo-50 rounded-xl p-6">
                <h2 className="font-heading font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                  <FiTruck className="w-5 h-5" />
                  {t('orders.trackingInfo') || 'Shipping Information'}
                </h2>
                <div className="space-y-2 text-sm">
                  {order.shippingCarrier && (
                    <p><span className="text-indigo-600">{t('orders.courier') || 'Courier'}:</span> <span className="font-medium text-indigo-900">{order.shippingCarrier}</span></p>
                  )}
                  {order.trackingNumber && (
                    <p><span className="text-indigo-600">{t('orders.trackingNumber') || 'Tracking #'}:</span> <span className="font-medium text-indigo-900">{order.trackingNumber}</span></p>
                  )}
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-indigo-700 hover:text-indigo-900 font-medium"
                    >
                      {t('orders.trackOrder') || 'Track Your Order'} →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Conversation */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-heading font-semibold text-gray-900 mb-4">
                {t('customDesign.conversation')}
              </h2>

              {/* Messages */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {design.conversation?.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    {t('customDesign.noMessages')}
                  </p>
                ) : (
                  design.conversation?.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-xl p-4 ${
                        msg.sender === 'customer'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="mb-2">{msg.message}</p>
                        {msg.attachments?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {msg.attachments.map((att, i) => (
                              <img
                                key={i}
                                src={getImageUrl(att.url)}
                                alt=""
                                className="w-16 h-16 object-cover rounded cursor-pointer"
                                onClick={() => window.open(getImageUrl(att.url), '_blank')}
                              />
                            ))}
                          </div>
                        )}
                        <p className={`text-xs mt-2 ${
                          msg.sender === 'customer' ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {new Date(msg.sentAt || msg.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              {!['completed', 'cancelled'].includes(design.status) && (
                <div className="border-t pt-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t('customDesign.typeMessage')}
                        className="input resize-none"
                        rows={2}
                      />
                      {attachments.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {attachments.map((att, index) => (
                            <div key={index} className="relative">
                              <img
                                src={att.preview}
                                alt=""
                                className="w-12 h-12 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div {...getRootProps()}>
                        <input {...getInputProps()} />
                        <button type="button" className="btn btn-outline px-3">
                          <FiImage className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={sending || (!message.trim() && attachments.length === 0)}
                        className="btn btn-primary px-3"
                      >
                        {sending ? <Loader size="sm" /> : <FiSend className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="mt-6 lg:mt-0">
            <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
              {/* Quote Info */}
              {design.quotedPrice && (
                <div className="mb-6 pb-6 border-b">
                  <h3 className="font-heading font-semibold text-gray-900 mb-3">
                    {t('customDesign.quote')}
                  </h3>
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    Rs. {(design.quotedPrice * design.quantity).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-500 mb-1">
                    Rs. {design.quotedPrice.toLocaleString()} × {design.quantity} items
                  </p>
                  {design.estimatedDays && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FiClock className="w-4 h-4" />
                      {t('customDesign.estimatedDaysValue', { days: design.estimatedDays }) || `Estimated: ${design.estimatedDays} days`}
                    </p>
                  )}

                  {design.status === 'quoted' && !showAcceptForm && (
                    <button
                      onClick={() => setShowAcceptForm(true)}
                      className="btn btn-primary w-full mt-4"
                    >
                      <FiCheck className="w-5 h-5 mr-2" />
                      {t('customDesign.acceptQuote')}
                    </button>
                  )}
                </div>
              )}

              {/* Order Summary */}
              {order && (
                <div className="mb-6 pb-6 border-b">
                  <h3 className="font-heading font-semibold text-gray-900 mb-3">
                    {t('cart.orderSummary')}
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('cart.subtotal')}</span>
                      <span className="font-medium">Rs. {(design.quotedPrice * design.quantity)?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('cart.shipping')}</span>
                      <span className="text-gray-500 text-xs">{t('checkout.onDelivery') || 'On delivery (Rs 350/kg)'}</span>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-between text-base font-semibold">
                      <span>{t('cart.total')}</span>
                      <span className="text-primary-600">Rs. {(design.quotedPrice * design.quantity)?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <p className="text-xs text-gray-500 uppercase font-semibold">{t('checkout.paymentBreakdown') || 'Payment Breakdown'}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">{t('checkout.advancePayment') || 'Advance (50%)'}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">Rs. {advanceAmount.toLocaleString()}</span>
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
                        <span className="font-medium text-sm">Rs. {advanceAmount.toLocaleString()}</span>
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
                    <p className="text-xs text-gray-500 mt-2">
                      * {t('checkout.shippingNote') || 'Shipping: Rs 350/kg (calculated when order is ready)'}
                    </p>
                  </div>
                </div>
              )}

              {/* Design Details */}
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('customDesign.productType') || 'Type'}</span>
                  <span className="font-medium capitalize">{design.productType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common.createdAt')}</span>
                  <span className="font-medium">
                    {new Date(design.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Cancel Button */}
              {['pending', 'reviewing', 'quoted'].includes(design.status) && !showAcceptForm && (
                <button
                  onClick={() => {
                    if (window.confirm(t('customDesign.confirmCancel'))) {
                      cancelMutation.mutate();
                    }
                  }}
                  disabled={cancelMutation.isPending}
                  className="btn btn-outline w-full mt-6 text-red-500 border-red-300 hover:bg-red-50"
                >
                  {cancelMutation.isPending ? <Loader size="sm" /> : t('customDesign.cancelDesign')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DesignDetail;
