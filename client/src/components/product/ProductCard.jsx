import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { useLanguageStore, useAuthStore } from '../../store/useStore';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { getProductImageUrl } from '../../utils/imageUrl';

const ProductCard = ({ product }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { language } = useLanguageStore();
  const { isAuthenticated, user } = useAuthStore();

  const name = product.name?.[language] || product.name?.en || product.name;

  // Check if product has age-based pricing
  const hasAgePricing = product.agePricing && product.agePricing.length > 0;

  // Calculate price display
  let currentPrice, hasDiscount, discountPercent, priceRange;

  if (hasAgePricing) {
    // Get price range from age-based pricing
    const prices = product.agePricing.map(ap => ap.salePrice || ap.price);
    priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
    currentPrice = priceRange.min;
    // Check if any age has a sale price
    hasDiscount = product.agePricing.some(ap => ap.salePrice && ap.salePrice < ap.price);
    discountPercent = hasDiscount ? 'SALE' : 0;
  } else {
    currentPrice = product.salePrice && product.salePrice < product.price
      ? product.salePrice
      : product.price;
    hasDiscount = product.salePrice && product.salePrice < product.price;
    discountPercent = hasDiscount
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;
  }

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => authAPI.getWishlist(),
    enabled: isAuthenticated
  });

  const wishlist = wishlistData?.data?.data || [];
  const isInWishlist = wishlist.some((item) => item._id === product._id);

  const wishlistMutation = useMutation({
    mutationFn: () => authAPI.toggleWishlist(product._id),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      queryClient.invalidateQueries(['products']);
      toast.success(
        isInWishlist ? t('messages.removedFromWishlist') : t('messages.addedToWishlist')
      );
    },
    onError: () => {
      toast.error(t('messages.messageError'));
    }
  });

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error(t('messages.loginRequired') || 'Please login to add to wishlist');
      return;
    }
    wishlistMutation.mutate();
  };

  return (
    <Link to={`/product/${product.slug}`} className="product-card group">
      {/* Image Container - fixed aspect ratio prevents layout shift */}
      <div className="relative overflow-hidden bg-gray-100 aspect-square">
        <img
          src={getProductImageUrl(product.images)}
          alt={name}
          className="product-image"
          loading="lazy"
          // Prevent layout shift by setting explicit dimensions
          width="400"
          height="400"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.activeSale ? (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {product.activeSale.saleName?.[language] || product.activeSale.saleName?.en || 'SALE'}
            </span>
          ) : hasDiscount ? (
            <span className="sale-badge">
              {discountPercent === 'SALE' ? 'SALE' : `-${discountPercent}%`}
            </span>
          ) : null}
          {product.isNewArrival && product.createdAt &&
            (Date.now() - new Date(product.createdAt).getTime()) < 5 * 24 * 60 * 60 * 1000 && (
            <span className="bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded">
              NEW
            </span>
          )}
        </div>

        {/* Actions - visible on mobile, hover on desktop */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity">
          <button
            onClick={handleWishlistToggle}
            disabled={wishlistMutation.isPending}
            className={`w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md ${
              isInWishlist ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            <FiHeart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Quick Add - hidden on mobile (tap goes to product page), visible on hover for desktop */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full md:group-hover:translate-y-0 hidden md:block md:transition-transform">
          <button className="w-full btn btn-primary btn-sm flex items-center justify-center gap-2">
            <FiShoppingBag className="w-4 h-4" />
            <span>{t('common.addToCart')}</span>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Category */}
        {product.category && (
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.category.name?.[language] || product.category.name?.en || product.category.name}
          </p>
        )}

        {/* Name */}
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
          {name}
        </h3>

        {/* Rating */}
        {product.ratings?.count > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(product.ratings.average)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.ratings.count})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasAgePricing && priceRange ? (
            priceRange.min === priceRange.max ? (
              <span className="price-sale text-lg">
                Rs. {priceRange.min.toLocaleString()}
              </span>
            ) : (
              <span className="price-sale text-lg">
                Rs. {priceRange.min.toLocaleString()} - {priceRange.max.toLocaleString()}
              </span>
            )
          ) : (
            <>
              <span className="price-sale text-lg">
                Rs. {currentPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="price-original">
                  Rs. {product.price.toLocaleString()}
                </span>
              )}
            </>
          )}
        </div>

      </div>
    </Link>
  );
};

export default ProductCard;
