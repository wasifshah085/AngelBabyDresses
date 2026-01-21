import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { FiMapPin, FiCreditCard, FiCheck, FiInfo, FiUpload, FiX, FiImage, FiPackage, FiTruck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { cartAPI, ordersAPI, authAPI } from '../services/api';
import { useAuthStore, useCartStore, useLanguageStore } from '../store/useStore';
import { PageLoader } from '../components/common/Loader';
import Loader from '../components/common/Loader';
import { getImageUrl } from '../utils/imageUrl';

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const { user, isAuthenticated } = useAuthStore();
  const { clearCart } = useCartStore();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('easypaisa');
  const [loading, setLoading] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.get(),
    enabled: isAuthenticated
  });

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: () => authAPI.getMe(),
    enabled: isAuthenticated
  });

  const createOrderMutation = useMutation({
    mutationFn: (data) => ordersAPI.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['cart']);
      clearCart();
      const { data: orderData } = response.data;
      navigate(`/order-success/${orderData.orderNumber}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.orderError'));
      setLoading(false);
    }
  });

  const cart = cartData?.data?.data;
  const addresses = userData?.data?.data?.addresses || [];

  // Payment methods
  const paymentMethods = [
    {
      id: 'easypaisa',
      name: 'EasyPaisa',
      color: 'bg-green-50 border-green-200',
      account: '03341542572',
      accountHolder: 'Quratulain Syed'
    },
    {
      id: 'jazzcash',
      name: 'JazzCash',
      color: 'bg-red-50 border-red-200',
      account: '03341542572',
      accountHolder: 'Quratulain Syed'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer (HBL)',
      color: 'bg-blue-50 border-blue-200',
      bankName: 'HBL (Habib Bank Limited)',
      account: '16817905812303',
      accountHolder: 'Quratulain Syed'
    }
  ];

  const total = cart?.total || 0;
  const advanceAmount = Math.ceil((cart?.subtotal || 0) / 2);
  const finalAmount = (cart?.subtotal || 0) - advanceAmount;

  const onAddressSubmit = (data) => {
    setSelectedAddress(data);
    setStep(2);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setPaymentScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const clearScreenshot = () => {
    setPaymentScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error(t('validation.selectAddress'));
      return;
    }

    if (!paymentScreenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('shippingAddress', JSON.stringify(selectedAddress));
    formData.append('paymentMethod', paymentMethod);
    formData.append('notes', '');
    formData.append('screenshot', paymentScreenshot);

    createOrderMutation.mutate(formData);
  };

  if (cartLoading) return <PageLoader />;

  if (!cart || cart.items?.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{t('checkout.title')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="container py-8">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900 mb-6">
          {t('checkout.title')}
        </h1>

        {/* How Payment Works - Compact Banner */}
        <div className="bg-gradient-to-r from-primary-50 to-pink-50 border border-primary-100 rounded-xl p-4 mb-8">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold">1</div>
              <span className="text-gray-700">Pay 50% Now</span>
            </div>
            <div className="text-gray-300">→</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold">2</div>
              <span className="text-gray-700">We Verify & Start</span>
            </div>
            <div className="text-gray-300">→</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold">3</div>
              <span className="text-gray-700">Pay 50% + Shipping on Delivery</span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[
            { num: 1, label: t('checkout.shipping') },
            { num: 2, label: t('checkout.payment') },
            { num: 3, label: t('checkout.review') }
          ].map((s, index) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-medium transition-all ${
                  step >= s.num
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s.num ? <FiCheck /> : s.num}
              </div>
              <span className={`ml-2 hidden sm:inline whitespace-nowrap ${step >= s.num ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {s.label}
              </span>
              {index < 2 && (
                <div className={`w-8 sm:w-16 h-1 mx-2 sm:mx-4 rounded ${step > s.num ? 'bg-primary-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Address */}
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-heading font-semibold mb-6 flex items-center gap-2">
                  <FiMapPin className="w-5 h-5 text-primary-500" />
                  {t('checkout.shippingAddress')}
                </h2>

                {/* Saved Addresses */}
                {addresses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-700 mb-3">{t('checkout.savedAddresses')}</h3>
                    <div className="space-y-3">
                      {addresses.map((addr, index) => (
                        <label
                          key={index}
                          className={`block border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedAddress === addr
                              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="savedAddress"
                            className="sr-only"
                            onChange={() => {
                              setSelectedAddress(addr);
                              reset(addr);
                            }}
                          />
                          <p className="font-medium">{addr.fullName}</p>
                          <p className="text-sm text-gray-600">
                            {addr.address}, {addr.city}, {addr.province || addr.state} {addr.postalCode}
                          </p>
                          <p className="text-sm text-gray-600">{addr.phone}</p>
                        </label>
                      ))}
                    </div>
                    <div className="my-6 flex items-center">
                      <hr className="flex-1" />
                      <span className="px-4 text-gray-500 text-sm">{t('common.or')}</span>
                      <hr className="flex-1" />
                    </div>
                  </div>
                )}

                {/* Address Form */}
                <form onSubmit={handleSubmit(onAddressSubmit)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.fullName')} *
                      </label>
                      <input
                        type="text"
                        {...register('fullName', { required: t('validation.required') })}
                        className={`input ${errors.fullName ? 'input-error' : ''}`}
                        defaultValue={user?.name}
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.phone')} *
                      </label>
                      <input
                        type="tel"
                        {...register('phone', { required: t('validation.required') })}
                        className={`input ${errors.phone ? 'input-error' : ''}`}
                        defaultValue={user?.phone}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout.address')} *
                    </label>
                    <input
                      type="text"
                      {...register('address', { required: t('validation.required') })}
                      className={`input ${errors.address ? 'input-error' : ''}`}
                      placeholder={t('checkout.addressPlaceholder')}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.city')} *
                      </label>
                      <input
                        type="text"
                        {...register('city', { required: t('validation.required') })}
                        className={`input ${errors.city ? 'input-error' : ''}`}
                      />
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.province')} *
                      </label>
                      <select
                        {...register('province', { required: t('validation.required') })}
                        className={`input ${errors.province ? 'input-error' : ''}`}
                      >
                        <option value="">{t('common.select')}</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Sindh">Sindh</option>
                        <option value="KPK">KPK</option>
                        <option value="Balochistan">Balochistan</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="AJK">Azad Kashmir</option>
                        <option value="GB">Gilgit-Baltistan</option>
                      </select>
                      {errors.province && (
                        <p className="text-red-500 text-sm mt-1">{errors.province.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.postalCode')}
                      </label>
                      <input
                        type="text"
                        {...register('postalCode')}
                        className="input"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary w-full mt-6">
                    {t('checkout.continueToPayment')}
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
                  <FiCreditCard className="w-5 h-5 text-primary-500" />
                  {t('checkout.paymentMethod')}
                </h2>

                {/* Amount to Pay */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-700 mb-1">Amount to pay now (50% advance):</p>
                  <p className="text-2xl font-bold text-green-800">Rs. {advanceAmount.toLocaleString()}</p>
                </div>

                {/* Payment Options */}
                <div className="space-y-3 mb-6">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`block border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-primary-500"
                        />
                        <span className="font-semibold text-gray-900">{method.name}</span>
                      </div>

                      {paymentMethod === method.id && (
                        <div className={`mt-3 p-3 rounded-lg ${method.color} text-sm`}>
                          {method.bankName && (
                            <p className="mb-1"><span className="text-gray-600">Bank:</span> <span className="font-medium">{method.bankName}</span></p>
                          )}
                          <p className="mb-1">
                            <span className="text-gray-600">Account:</span>{' '}
                            <span className="font-mono font-bold text-gray-900">{method.account}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(method.account);
                                toast.success('Account number copied!');
                              }}
                              className="ml-2 text-primary-600 hover:text-primary-700 text-xs"
                            >
                              Copy
                            </button>
                          </p>
                          <p><span className="text-gray-600">Name:</span> <span className="font-medium">{method.accountHolder}</span></p>
                        </div>
                      )}
                    </label>
                  ))}
                </div>

                {/* Screenshot Upload */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FiUpload className="w-5 h-5 text-primary-500" />
                    Upload Payment Screenshot *
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Transfer Rs. {advanceAmount.toLocaleString()} to the account above, then upload the screenshot.
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {screenshotPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={screenshotPreview}
                        alt="Payment screenshot"
                        className="max-h-48 rounded-lg border-2 border-green-300 shadow-sm"
                      />
                      <button
                        onClick={clearScreenshot}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <FiCheck className="w-4 h-4" />
                        Screenshot uploaded successfully
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors"
                    >
                      <FiUpload className="w-10 h-10 text-gray-400" />
                      <span className="text-gray-700 font-medium">Click to upload screenshot</span>
                      <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="btn btn-outline flex-1"
                  >
                    {t('common.back')}
                  </button>
                  <button
                    onClick={() => {
                      if (!paymentScreenshot) {
                        toast.error('Please upload payment screenshot first');
                        return;
                      }
                      setStep(3);
                    }}
                    className="btn btn-primary flex-1"
                  >
                    {t('checkout.reviewOrder')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Shipping Address */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FiMapPin className="w-4 h-4 text-primary-500" />
                      Shipping Address
                    </h3>
                    <button onClick={() => setStep(1)} className="text-primary-600 text-sm hover:underline">
                      Edit
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{selectedAddress?.fullName}</p>
                    <p>{selectedAddress?.address}</p>
                    <p>{selectedAddress?.city}, {selectedAddress?.province} {selectedAddress?.postalCode}</p>
                    <p>{selectedAddress?.phone}</p>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FiCreditCard className="w-4 h-4 text-primary-500" />
                      Payment
                    </h3>
                    <button onClick={() => setStep(2)} className="text-primary-600 text-sm hover:underline">
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-600">
                      {paymentMethods.find(m => m.id === paymentMethod)?.name}
                    </p>
                    {screenshotPreview && (
                      <img src={screenshotPreview} alt="Payment" className="h-12 rounded border" />
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <FiPackage className="w-4 h-4 text-primary-500" />
                    Order Items ({cart?.items?.length})
                  </h3>
                  <div className="space-y-3">
                    {cart?.items?.map((item) => (
                      <div key={item._id} className="flex gap-3">
                        <img
                          src={getImageUrl(item.product?.images?.[0]?.url)}
                          alt={item.product?.name?.[language] || item.product?.name?.en}
                          className="w-14 h-14 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.product?.name?.[language] || item.product?.name?.en}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.ageRange} {item.color && `• ${item.color.name}`} • Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium text-sm">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <FiInfo className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">What happens next?</p>
                      <ul className="space-y-1 text-yellow-700">
                        <li>• We'll verify your payment within 24 hours</li>
                        <li>• Your order will be prepared with care</li>
                        <li>• Pay remaining Rs. {finalAmount.toLocaleString()} + shipping (Rs 350/kg) on delivery</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="btn btn-outline flex-1"
                  >
                    {t('common.back')}
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="btn btn-primary flex-1"
                  >
                    {loading ? <Loader size="sm" /> : t('checkout.placeOrder')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-heading font-semibold mb-4">
                {t('cart.orderSummary')}
              </h2>

              {/* Cart Items Preview */}
              <div className="space-y-3 mb-4 pb-4 border-b">
                {cart?.items?.slice(0, 3).map((item) => (
                  <div key={item._id} className="flex gap-3">
                    <img
                      src={getImageUrl(item.product?.images?.[0]?.url)}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.product?.name?.[language] || item.product?.name?.en}
                      </p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
                {cart?.items?.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">+{cart.items.length - 3} more items</p>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('cart.subtotal')}</span>
                  <span className="font-medium">Rs. {cart?.subtotal?.toLocaleString()}</span>
                </div>

                {cart?.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('cart.discount')}</span>
                    <span>-Rs. {cart?.discount?.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">{t('cart.shipping')}</span>
                  <span className="text-gray-500 text-xs">{t('checkout.onDelivery') || 'On delivery (Rs 350/kg)'}</span>
                </div>

                <hr className="my-3" />

                <div className="flex justify-between text-lg font-semibold">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary-600">Rs. {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="mt-4 pt-4 border-t space-y-3">
                <p className="text-xs text-gray-500 uppercase font-semibold">{t('checkout.paymentBreakdown') || 'Payment Breakdown'}</p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">{t('checkout.advancePayment') || 'Advance (50%)'}</span>
                  <span className="font-medium text-sm">Rs. {advanceAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">{t('checkout.finalPayment') || 'Final (50%)'}</span>
                  <span className="font-medium text-sm">Rs. {finalAmount.toLocaleString()} + {t('cart.shipping')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
