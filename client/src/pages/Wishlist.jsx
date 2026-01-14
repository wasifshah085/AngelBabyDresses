import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiHeart, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI, cartAPI } from '../services/api';
import { useAuthStore, useCartStore, useLanguageStore, useUIStore } from '../store/useStore';
import { PageLoader } from '../components/common/Loader';

const Wishlist = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const { openCartDrawer } = useUIStore();
  const queryClient = useQueryClient();

  const { data: wishlistData, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => authAPI.getWishlist(),
    enabled: isAuthenticated
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: (productId) => authAPI.toggleWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success(t('messages.removedFromWishlist'));
    }
  });

  const addToCartMutation = useMutation({
    mutationFn: (data) => cartAPI.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success(t('messages.addedToCart'));
      openCartDrawer();
    }
  });

  const wishlist = wishlistData?.data?.data || [];

  const handleRemove = (productId) => {
    removeFromWishlistMutation.mutate(productId);
  };

  const handleAddToCart = (product) => {
    const defaultSize = product.sizes?.[0];
    const defaultColor = product.colors?.[0];

    if (isAuthenticated) {
      addToCartMutation.mutate({
        productId: product._id,
        size: defaultSize,
        color: defaultColor,
        quantity: 1
      });
    } else {
      addItem({
        id: `${product._id}-${defaultSize}-${defaultColor?.name || 'default'}`,
        productId: product._id,
        name: product.name?.[language] || product.name?.en,
        image: product.images?.[0]?.url,
        price: product.salePrice || product.price,
        size: defaultSize,
        color: defaultColor,
        quantity: 1,
        slug: product.slug
      });
      toast.success(t('messages.addedToCart'));
      openCartDrawer();
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{t('wishlist.title')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="container py-8">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900 mb-8">
          {t('wishlist.title')}
        </h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <FiHeart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">{t('wishlist.empty')}</h2>
            <p className="text-gray-500 mb-6">{t('wishlist.emptyMessage')}</p>
            <Link to="/shop" className="btn btn-primary">
              {t('wishlist.browseProducts')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((product) => {
              const productName = product.name?.[language] || product.name?.en;
              const currentPrice = product.salePrice || product.price;
              const discount = product.salePrice
                ? Math.round((1 - product.salePrice / product.price) * 100)
                : 0;

              return (
                <div key={product._id} className="bg-white rounded-xl shadow-sm overflow-hidden group">
                  <div className="relative aspect-square">
                    <Link to={`/product/${product.slug}`}>
                      <img
                        src={product.images?.[0]?.url}
                        alt={productName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                    {discount > 0 && (
                      <span className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
                        -{discount}%
                      </span>
                    )}
                    <button
                      onClick={() => handleRemove(product._id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4">
                    <Link
                      to={`/product/${product.slug}`}
                      className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2 mb-2"
                    >
                      {productName}
                    </Link>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-semibold text-primary-600">
                        Rs. {currentPrice?.toLocaleString()}
                      </span>
                      {discount > 0 && (
                        <span className="text-sm text-gray-400 line-through">
                          Rs. {product.price?.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addToCartMutation.isPending}
                      className="btn btn-primary w-full btn-sm"
                    >
                      <FiShoppingCart className="w-4 h-4 mr-2" />
                      {t('common.addToCart')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Wishlist;
