import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useUIStore, useCartStore, useAuthStore, useLanguageStore } from '../../store/useStore';
import { cartAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

const CartDrawer = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { isCartDrawerOpen, closeCartDrawer } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Local cart store for guest users
  const localCart = useCartStore();

  // Server cart for authenticated users
  const { data: serverCartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.get(),
    enabled: isAuthenticated && isCartDrawerOpen
  });

  const updateMutation = useMutation({
    mutationFn: (data) => cartAPI.update(data),
    onSuccess: () => queryClient.invalidateQueries(['cart'])
  });

  const removeMutation = useMutation({
    mutationFn: (itemId) => cartAPI.remove(itemId),
    onSuccess: () => queryClient.invalidateQueries(['cart'])
  });

  // Get cart items based on auth status
  const serverCart = serverCartData?.data?.data;
  const items = isAuthenticated
    ? (serverCart?.items || []).map(item => ({
        id: item._id,
        productId: item.product?._id,
        name: item.product?.name?.[language] || item.product?.name?.en || 'Product',
        image: item.product?.images?.[0]?.url,
        price: item.price,
        quantity: item.quantity,
        ageRange: item.ageRange,
        color: item.color,
        slug: item.product?.slug
      }))
    : localCart.items;

  const discount = isAuthenticated ? (serverCart?.discount || 0) : localCart.discount;
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - discount;

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={closeCartDrawer} />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
            <FiShoppingBag className="w-5 h-5" />
            {t('cart.yourCart')}
            <span className="text-sm text-gray-500">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
          </h2>
          <button
            onClick={closeCartDrawer}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <FiShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">{t('cart.emptyCart')}</p>
              <Link
                to="/shop"
                onClick={closeCartDrawer}
                className="btn btn-primary"
              >
                {t('cart.startShopping')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={getImageUrl(item.image) || 'https://placehold.co/80x80/FFC0CB/333?text=No+Image'}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      {item.ageRange} {item.color && `/ ${item.color.name}`}
                    </p>
                    <p className="text-primary-600 font-semibold">
                      Rs. {item.price?.toLocaleString()}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() => {
                            const newQty = Math.max(1, item.quantity - 1);
                            if (isAuthenticated) {
                              updateMutation.mutate({ itemId: item.id, quantity: newQty });
                            } else {
                              localCart.updateQuantity(item.id, newQty);
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          disabled={item.quantity <= 1}
                        >
                          <FiMinus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => {
                            const newQty = item.quantity + 1;
                            if (isAuthenticated) {
                              updateMutation.mutate({ itemId: item.id, quantity: newQty });
                            } else {
                              localCart.updateQuantity(item.id, newQty);
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          if (isAuthenticated) {
                            removeMutation.mutate(item.id);
                          } else {
                            localCart.removeItem(item.id);
                          }
                        }}
                        className="p-1 text-red-500 hover:text-red-600"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>{t('common.subtotal')}</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('common.discount')}</span>
                  <span>-Rs. {discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold text-gray-900">
                <span>{t('common.total')}</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                to="/cart"
                onClick={closeCartDrawer}
                className="btn btn-outline w-full"
              >
                {t('cart.yourCart')}
              </Link>
              <Link
                to="/checkout"
                onClick={closeCartDrawer}
                className="btn btn-primary w-full"
              >
                {t('common.checkout')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
