import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { cartAPI } from '../services/api';
import { useAuthStore, useCartStore, useLanguageStore } from '../store/useStore';
import { PageLoader } from '../components/common/Loader';
import { getImageUrl } from '../utils/imageUrl';

const Cart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    items: guestItems,
    updateQuantity: updateGuestQuantity,
    removeItem: removeGuestItem,
    getSubtotal,
    getTotal,
    couponCode: guestCoupon,
    discount: guestDiscount,
    setCoupon: setGuestCoupon,
    removeCoupon: removeGuestCoupon
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.get(),
    enabled: isAuthenticated
  });

  const updateMutation = useMutation({
    mutationFn: (data) => cartAPI.update(data),
    onSuccess: () => queryClient.invalidateQueries(['cart'])
  });

  const removeMutation = useMutation({
    mutationFn: (itemId) => cartAPI.remove(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success(t('messages.itemRemoved'));
    }
  });

  const applyCouponMutation = useMutation({
    mutationFn: (code) => cartAPI.applyCoupon(code),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['cart']);
      toast.success(t('messages.couponApplied'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.invalidCoupon'));
    }
  });

  const removeCouponMutation = useMutation({
    mutationFn: () => cartAPI.removeCoupon(),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success(t('messages.couponRemoved'));
    }
  });

  const cart = isAuthenticated ? cartData?.data?.data : null;
  const items = isAuthenticated ? (cart?.items || []) : guestItems;
  const subtotal = isAuthenticated ? (cart?.subtotal || 0) : getSubtotal();
  const discount = isAuthenticated ? (cart?.discount || 0) : guestDiscount;
  const total = isAuthenticated ? (cart?.total || 0) : getTotal();
  const coupon = isAuthenticated ? cart?.coupon?.code : guestCoupon;

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;
    if (isAuthenticated) {
      updateMutation.mutate({ itemId: item._id, quantity: newQuantity });
    } else {
      updateGuestQuantity(item.id, newQuantity);
    }
  };

  const handleRemove = (item) => {
    if (isAuthenticated) {
      removeMutation.mutate(item._id);
    } else {
      removeGuestItem(item.id);
      toast.success(t('messages.itemRemoved'));
    }
  };

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    if (isAuthenticated) {
      applyCouponMutation.mutate(couponInput);
    } else {
      // For guest users, we would need to validate coupon via API
      // For now, just show a message
      toast.error(t('messages.loginForCoupon'));
    }
  };

  const handleRemoveCoupon = () => {
    if (isAuthenticated) {
      removeCouponMutation.mutate();
    } else {
      removeGuestCoupon();
      toast.success(t('messages.couponRemoved'));
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error(t('messages.loginToCheckout'));
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
  };

  if (isLoading && isAuthenticated) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{t('cart.title')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="container py-8">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900 mb-8">
          {t('cart.title')}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <FiShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">{t('cart.empty')}</h2>
            <p className="text-gray-500 mb-6">{t('cart.emptyMessage')}</p>
            <Link to="/shop" className="btn btn-primary">
              {t('cart.continueShopping')}
            </Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const itemName = isAuthenticated
                  ? (item.product?.name?.[language] || item.product?.name?.en)
                  : item.name;
                const itemImage = isAuthenticated
                  ? item.product?.images?.[0]?.url
                  : item.image;
                const itemPrice = isAuthenticated ? item.price : item.price;
                const itemSlug = isAuthenticated ? item.product?.slug : item.slug;

                return (
                  <div key={item._id || item.id} className="flex gap-4 p-4 bg-white rounded-xl shadow-sm">
                    <Link to={`/product/${itemSlug}`} className="shrink-0">
                      <img
                        src={getImageUrl(itemImage)}
                        alt={itemName}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${itemSlug}`}
                        className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
                      >
                        {itemName}
                      </Link>

                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                        {item.ageRange && <span>{t('common.age', { defaultValue: 'Age' })}: {item.ageRange}</span>}
                        {item.size && <span>{t('common.size')}: {item.size}</span>}
                        {item.color && <span>{t('common.color')}: {item.color.name || item.color}</span>}
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100"
                            disabled={updateMutation.isPending}
                          >
                            <FiMinus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100"
                            disabled={updateMutation.isPending}
                          >
                            <FiPlus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            Rs. {(itemPrice * item.quantity).toLocaleString()}
                          </p>
                          <button
                            onClick={() => handleRemove(item)}
                            className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 mt-1"
                            disabled={removeMutation.isPending}
                          >
                            <FiTrash2 className="w-4 h-4" />
                            {t('common.remove')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="mt-8 lg:mt-0">
              <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
                <h2 className="text-lg font-heading font-semibold mb-4">
                  {t('cart.orderSummary')}
                </h2>

                {/* Coupon Code */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('cart.couponCode')}
                  </label>
                  {coupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <FiTag className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-700">{coupon}</span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        {t('common.remove')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder={t('cart.enterCoupon')}
                        className="input flex-1"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={applyCouponMutation.isPending}
                        className="btn btn-outline"
                      >
                        {t('common.apply')}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('cart.subtotal')}</span>
                    <span className="font-medium">Rs. {subtotal.toLocaleString()}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t('cart.discount')}</span>
                      <span>-Rs. {discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('cart.shippingTitle')}</span>
                    <span className="font-medium text-sm text-gray-500">{t('cart.shippingInfo')}</span>
                  </div>

                  <hr className="my-4" />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>{t('cart.total')}</span>
                    <span className="text-primary-600">Rs. {total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="btn btn-primary w-full mt-6 py-4"
                >
                  {t('cart.proceedToCheckout')}
                </button>

                <Link
                  to="/shop"
                  className="block text-center text-primary-600 hover:text-primary-700 mt-4"
                >
                  {t('cart.continueShopping')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;
