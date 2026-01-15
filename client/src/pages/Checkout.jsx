import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { FiMapPin, FiCreditCard, FiCheck, FiInfo } from 'react-icons/fi';
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

  // Payment methods - manual payments only
  const paymentMethods = [
    {
      id: 'easypaisa',
      name: 'EasyPaisa',
      icon: FiCreditCard,
      description: t('checkout.easypaisaDescription'),
      account: '03451504434',
      accountHolder: 'Quratulain Syed'
    },
    {
      id: 'jazzcash',
      name: 'JazzCash',
      icon: FiCreditCard,
      description: t('checkout.jazzcashDescription'),
      account: '03451504434',
      accountHolder: 'Quratulain Syed'
    },
    {
      id: 'bank_transfer',
      name: t('checkout.bankTransfer'),
      icon: FiCreditCard,
      description: t('checkout.bankDescription'),
      bankName: 'HBL (Habib Bank Limited)',
      account: '16817905812303',
      accountHolder: 'Quratulain Syed'
    }
  ];

  const shippingCost = cart?.subtotal >= 3000 ? 0 : 200;
  const total = (cart?.total || 0) + shippingCost;
  const advanceAmount = Math.ceil(total / 2);
  const finalAmount = total - advanceAmount;

  const onAddressSubmit = (data) => {
    setSelectedAddress(data);
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error(t('validation.selectAddress'));
      return;
    }

    setLoading(true);

    const orderData = {
      shippingAddress: selectedAddress,
      paymentMethod,
      notes: ''
    };

    createOrderMutation.mutate(orderData);
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
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900 mb-8">
          {t('checkout.title')}
        </h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12 overflow-x-auto">
          {[
            { num: 1, label: t('checkout.shipping') },
            { num: 2, label: t('checkout.payment') },
            { num: 3, label: t('checkout.review') }
          ].map((s, index) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                  step >= s.num
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s.num ? <FiCheck /> : s.num}
              </div>
              <span className={`ml-2 whitespace-nowrap ${step >= s.num ? 'text-gray-900' : 'text-gray-500'}`}>
                {s.label}
              </span>
              {index < 2 && (
                <div className={`w-8 sm:w-16 h-1 mx-2 sm:mx-4 ${step > s.num ? 'bg-primary-500' : 'bg-gray-200'}`} />
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
                          className={`block border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedAddress === addr
                              ? 'border-primary-500 bg-primary-50'
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
                <h2 className="text-lg font-heading font-semibold mb-6 flex items-center gap-2">
                  <FiCreditCard className="w-5 h-5 text-primary-500" />
                  {t('checkout.paymentMethod')}
                </h2>

                {/* Payment Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">{t('checkout.madeToOrderNotice') || 'Made-to-Order Payment'}</p>
                      <p>{t('checkout.advancePaymentInfo') || 'We require 50% advance payment when placing order. The remaining 50% is due when your order is ready for delivery.'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`block border rounded-lg p-4 cursor-pointer transition-colors ${
                        paymentMethod === method.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <method.icon className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">{method.name}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{method.description}</p>

                          {/* Account Details */}
                          {paymentMethod === method.id && (
                            <div className="mt-3 p-3 bg-white rounded border text-sm">
                              {method.bankName && (
                                <p><span className="text-gray-500">Bank:</span> {method.bankName}</p>
                              )}
                              <p><span className="text-gray-500">{t('checkout.accountNumber') || 'Account'}:</span> <span className="font-mono font-medium">{method.account}</span></p>
                              <p><span className="text-gray-500">{t('checkout.accountHolder') || 'Name'}:</span> {method.accountHolder}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="btn btn-outline flex-1"
                  >
                    {t('common.back')}
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="btn btn-primary flex-1"
                  >
                    {t('checkout.reviewOrder')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-heading font-semibold mb-4">
                    {t('checkout.shippingAddress')}
                  </h2>
                  <div className="text-gray-600">
                    <p className="font-medium text-gray-900">{selectedAddress?.fullName}</p>
                    <p>{selectedAddress?.address}</p>
                    <p>{selectedAddress?.city}, {selectedAddress?.province} {selectedAddress?.postalCode}</p>
                    <p>{selectedAddress?.phone}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-primary-600 text-sm mt-2">
                    {t('common.edit')}
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-heading font-semibold mb-4">
                    {t('checkout.paymentMethod')}
                  </h2>
                  <p className="text-gray-600">
                    {paymentMethods.find(m => m.id === paymentMethod)?.name}
                  </p>
                  <button onClick={() => setStep(2)} className="text-primary-600 text-sm mt-2">
                    {t('common.edit')}
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-heading font-semibold mb-4">
                    {t('checkout.orderItems')}
                  </h2>
                  <div className="space-y-4">
                    {cart?.items?.map((item) => (
                      <div key={item._id} className="flex gap-4">
                        <img
                          src={getImageUrl(item.product?.images?.[0]?.url)}
                          alt={item.product?.name?.[language] || item.product?.name?.en}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {item.product?.name?.[language] || item.product?.name?.en}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.ageRange} {item.color && `/ ${item.color.name}`} x {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium whitespace-nowrap">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Info Box */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <h3 className="font-heading font-semibold text-yellow-800 mb-3">
                    {t('checkout.paymentInstructions') || 'Payment Instructions'}
                  </h3>
                  <div className="text-sm text-yellow-800 space-y-2">
                    <p>{t('checkout.paymentStep1') || '1. After placing order, send 50% advance payment to the account shown'}</p>
                    <p>{t('checkout.paymentStep2') || '2. Upload screenshot of payment on the order page'}</p>
                    <p>{t('checkout.paymentStep3') || '3. Once verified, we will start making your order'}</p>
                    <p>{t('checkout.paymentStep4') || '4. When ready, pay remaining 50% and receive your order'}</p>
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

          {/* Order Summary */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-heading font-semibold mb-4">
                {t('cart.orderSummary')}
              </h2>

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
                  <span className="font-medium">
                    {shippingCost === 0 ? t('cart.free') : `Rs. ${shippingCost}`}
                  </span>
                </div>

                <hr className="my-4" />

                <div className="flex justify-between text-lg font-semibold">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary-600">Rs. {total.toLocaleString()}</span>
                </div>

                {/* Payment Breakdown */}
                <div className="mt-4 pt-4 border-t border-dashed">
                  <p className="text-xs text-gray-500 uppercase mb-2">{t('checkout.paymentBreakdown') || 'Payment Breakdown'}</p>
                  <div className="flex justify-between text-green-700 bg-green-50 p-2 rounded mb-2">
                    <span>{t('checkout.advancePayment') || 'Advance (50%)'}</span>
                    <span className="font-semibold">Rs. {advanceAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{t('checkout.finalPayment') || 'On Completion (50%)'}</span>
                    <span className="font-medium">Rs. {finalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {shippingCost === 0 && (
                <p className="text-sm text-green-600 mt-4">
                  {t('checkout.freeShippingApplied')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
