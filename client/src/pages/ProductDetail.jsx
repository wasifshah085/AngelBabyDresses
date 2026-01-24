import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { FiHeart, FiShoppingCart, FiShare2, FiStar, FiMinus, FiPlus, FiChevronRight, FiMaximize2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { productsAPI, reviewsAPI, authAPI, cartAPI, ordersAPI } from '../services/api';
import { useAuthStore, useCartStore, useLanguageStore, useUIStore } from '../store/useStore';
import { PageLoader } from '../components/common/Loader';
import ProductCard from '../components/product/ProductCard';
import ImageLightbox from '../components/common/ImageLightbox';
import { getImageUrl } from '../utils/imageUrl';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

// Age ranges for selection
const AGE_RANGES = [
  '0-6 Months', '6-12 Months',
  '1-2 Years', '2-3 Years', '3-4 Years', '4-5 Years', '5-6 Years',
  '6-7 Years', '7-8 Years', '8-10 Years', '10-12 Years',
  '12-14 Years', '14-16 Years'
];

const ProductDetail = () => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const { language } = useLanguageStore();
  const { isAuthenticated, user } = useAuthStore();
  const { addItem } = useCartStore();
  const { openCartDrawer } = useUIStore();
  const queryClient = useQueryClient();

  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsAPI.getBySlug(slug)
  });
  const product = productData?.data?.data;

  const { data: relatedProducts } = useQuery({
    queryKey: ['products', 'related', slug],
    queryFn: () => productsAPI.getRelated(slug),
    enabled: !!slug
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', slug],
    queryFn: () => reviewsAPI.getByProduct(product?._id),
    enabled: !!product
  });

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => authAPI.getWishlist(),
    enabled: isAuthenticated
  });

  // Fetch user's delivered orders to check if they can review
  const { data: userOrdersData } = useQuery({
    queryKey: ['user-orders-for-review', product?._id],
    queryFn: () => ordersAPI.getMyOrders(),
    enabled: isAuthenticated && !!product
  });

  const wishlist = wishlistData?.data?.data || [];
  const isInWishlist = product && wishlist.some((item) => item._id === product._id);

  // Get delivered orders containing this product that haven't been reviewed
  const deliveredOrdersWithProduct = useMemo(() => {
    if (!userOrdersData?.data?.data || !product) return [];
    return userOrdersData.data.data.filter(order =>
      order.status === 'delivered' &&
      order.items.some(item =>
        item.product === product._id ||
        item.productId === product._id ||
        item.name?.toLowerCase().includes(product.name?.en?.toLowerCase() || '')
      )
    );
  }, [userOrdersData, product]);

  const wishlistMutation = useMutation({
    mutationFn: () => authAPI.toggleWishlist(product._id),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      queryClient.invalidateQueries(['product', slug]);
      toast.success(t('messages.wishlistUpdated'));
    }
  });

  const reviewMutation = useMutation({
    mutationFn: (data) => {
      const formData = new FormData();
      formData.append('productId', data.productId);
      formData.append('orderId', data.orderId);
      formData.append('rating', data.rating);
      formData.append('comment', data.comment);
      return reviewsAPI.create(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews', slug]);
      toast.success(t('messages.reviewSubmitted', { defaultValue: 'Review submitted successfully!' }));
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewComment('');
      setSelectedOrderId('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const addToCartMutation = useMutation({
    mutationFn: (data) => cartAPI.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success(t('messages.addedToCart'));
      openCartDrawer();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const reviews = reviewsData?.data?.data || [];
  const related = relatedProducts?.data?.data || [];

  // Check if user has already reviewed this product
  const hasReviewed = reviews.some(review => review.user?._id === user?._id);
  const canReview = isAuthenticated && deliveredOrdersWithProduct.length > 0 && !hasReviewed;

  // Get available age ranges for this product
  const availableAges = useMemo(() => {
    if (!product) return [];
    if (product.agePricing && product.agePricing.length > 0) {
      return product.agePricing.map(ap => ap.ageRange);
    }
    return AGE_RANGES; // All ages available if no specific pricing set
  }, [product]);

  // Get pricing for selected age
  const selectedPricing = useMemo(() => {
    if (!product || !selectedAge) {
      // Return base price if no age selected
      return {
        price: product?.price || 0,
        salePrice: product?.salePrice,
        currentPrice: product?.salePrice || product?.price || 0
      };
    }

    if (product.agePricing && product.agePricing.length > 0) {
      const agePriceData = product.agePricing.find(ap => ap.ageRange === selectedAge);
      if (agePriceData) {
        return {
          price: agePriceData.price,
          salePrice: agePriceData.salePrice,
          currentPrice: agePriceData.salePrice || agePriceData.price
        };
      }
    }

    return {
      price: product.price,
      salePrice: product.salePrice,
      currentPrice: product.salePrice || product.price
    };
  }, [product, selectedAge]);

  // Get price range for display when no age is selected
  const priceRange = useMemo(() => {
    if (!product) return null;
    if (product.agePricing && product.agePricing.length > 0) {
      const prices = product.agePricing.map(ap => ap.salePrice || ap.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? null : { min, max };
    }
    return null;
  }, [product]);

  if (isLoading) return <PageLoader />;
  if (!product) return <div className="container py-16 text-center">{t('common.productNotFound')}</div>;

  const productName = product.name?.[language] || product.name?.en;
  const productDescription = product.description?.[language] || product.description?.en;
  const discount = selectedPricing.salePrice && selectedPricing.salePrice < selectedPricing.price
    ? Math.round((1 - selectedPricing.salePrice / selectedPricing.price) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!selectedAge) {
      toast.error(t('validation.selectAge', { defaultValue: 'Please select child\'s age' }));
      return;
    }

    if (isAuthenticated) {
      addToCartMutation.mutate({
        productId: product._id,
        ageRange: selectedAge,
        color: selectedColor,
        quantity,
        price: selectedPricing.currentPrice
      });
    } else {
      addItem({
        id: `${product._id}-${selectedAge}-${selectedColor?.name || 'default'}`,
        productId: product._id,
        name: productName,
        image: getImageUrl(product.images?.[0]?.url),
        price: selectedPricing.currentPrice,
        ageRange: selectedAge,
        color: selectedColor,
        quantity,
        slug: product.slug
      });
      toast.success(t('messages.addedToCart'));
      openCartDrawer();
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error(t('messages.loginRequired'));
      return;
    }
    wishlistMutation.mutate();
  };

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      toast.error(t('messages.loginRequired'));
      return;
    }
    if (!canReview) {
      if (hasReviewed) {
        toast.error(t('messages.alreadyReviewed', { defaultValue: 'You have already reviewed this product' }));
      } else {
        toast.error(t('messages.purchaseRequired', { defaultValue: 'You can only review products you have purchased and received' }));
      }
      return;
    }
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (!reviewComment.trim()) {
      toast.error(t('validation.reviewRequired', { defaultValue: 'Please write a review' }));
      return;
    }
    if (!selectedOrderId) {
      toast.error(t('validation.selectOrder', { defaultValue: 'Please select an order' }));
      return;
    }
    reviewMutation.mutate({
      productId: product._id,
      orderId: selectedOrderId,
      rating: reviewRating,
      comment: reviewComment
    });
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <>
      <Helmet>
        <title>{productName} | Angel Baby Dresses</title>
        <meta name="description" content={productDescription?.substring(0, 160)} />
      </Helmet>

      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-primary-600">{t('common.home')}</Link>
          <FiChevronRight className="w-4 h-4" />
          <Link to="/shop" className="hover:text-primary-600">{t('common.products')}</Link>
          <FiChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{productName}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative">
              <Swiper
                spaceBetween={10}
                navigation={true}
                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                modules={[FreeMode, Navigation, Thumbs]}
                className="aspect-square rounded-2xl overflow-hidden bg-gray-100"
                onSlideChange={(swiper) => setLightboxIndex(swiper.activeIndex)}
              >
                {product.images?.length > 0 ? (
                  product.images.map((image, index) => (
                    <SwiperSlide key={index}>
                      <img
                        src={getImageUrl(image.url)}
                        alt={`${productName} - ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => {
                          setLightboxIndex(index);
                          setLightboxOpen(true);
                        }}
                      />
                    </SwiperSlide>
                  ))
                ) : (
                  <SwiperSlide>
                    <img
                      src="https://placehold.co/600x600/FFC0CB/333?text=No+Image"
                      alt={productName}
                      className="w-full h-full object-cover"
                    />
                  </SwiperSlide>
                )}
              </Swiper>

              {/* Full screen button */}
              {product.images?.length > 0 && (
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
                  title={t('common.viewFullSize', { defaultValue: 'View full size' })}
                >
                  <FiMaximize2 className="w-5 h-5 text-gray-700" />
                </button>
              )}
            </div>

            {product.images?.length > 1 && (
              <Swiper
                onSwiper={setThumbsSwiper}
                spaceBetween={10}
                slidesPerView={4}
                freeMode={true}
                watchSlidesProgress={true}
                modules={[FreeMode, Navigation, Thumbs]}
                className="thumbs-swiper"
              >
                {product.images?.map((image, index) => (
                  <SwiperSlide key={index} className="cursor-pointer">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={getImageUrl(image.url)}
                        alt={`${productName} thumbnail - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900 mb-2">
                {productName}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`w-5 h-5 ${star <= averageRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  ({reviews.length} {t('common.reviews')})
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              {!selectedAge && priceRange ? (
                <span className="text-3xl font-bold text-primary-600">
                  Rs. {priceRange.min.toLocaleString()} - Rs. {priceRange.max.toLocaleString()}
                </span>
              ) : (
                <>
                  <span className="text-3xl font-bold text-primary-600">
                    Rs. {selectedPricing.currentPrice?.toLocaleString()}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        Rs. {selectedPricing.price?.toLocaleString()}
                      </span>
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-medium rounded">
                        -{discount}%
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Short Description */}
            <p className="text-gray-600">{productDescription?.substring(0, 200)}</p>

            {/* Age Selection */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                {t('product.selectAge', { defaultValue: "Select Child's Age" })} *
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableAges.map((age) => (
                  <button
                    key={age}
                    onClick={() => setSelectedAge(age)}
                    className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                      selectedAge === age
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'border-gray-300 text-gray-700 hover:border-primary-400'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
              {selectedAge && (
                <p className="text-sm text-primary-600 mt-2">
                  {t('product.selectedAge', { defaultValue: 'Selected' })}: {selectedAge}
                </p>
              )}
            </div>

            {/* Color Selection */}
            {product.colors?.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">{t('common.color')}</h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors?.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor?.name === color.name
                          ? 'ring-2 ring-primary-500 ring-offset-2'
                          : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
                {selectedColor && (
                  <p className="text-sm text-gray-500 mt-2">{selectedColor.name}</p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">{t('common.quantity')}</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-100 transition-colors"
                  >
                    <FiMinus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="p-3 hover:bg-gray-100 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-green-600">
                  {t('common.madeToOrder', { defaultValue: 'Made to order' })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!selectedAge || addToCartMutation.isPending}
                className="btn btn-primary flex-1 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiShoppingCart className="w-5 h-5 mr-2" />
                {t('common.addToCart')}
              </button>
              <button
                onClick={handleWishlist}
                disabled={wishlistMutation.isPending}
                className="btn btn-outline p-4"
              >
                <FiHeart className={`w-5 h-5 ${isInWishlist ? 'text-red-500 fill-current' : ''}`} />
              </button>
              <button className="btn btn-outline p-4">
                <FiShare2 className="w-5 h-5" />
              </button>
            </div>

            {/* SKU */}
            <div className="pt-6 border-t space-y-2 text-sm text-gray-500">
              {product.sku && <p><span className="font-medium text-gray-700">SKU:</span> {product.sku}</p>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="border-b">
            <div className="flex gap-8">
              {['description', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t(`product.${tab}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-600 whitespace-pre-line">{productDescription}</p>

                {/* Material & Care */}
                {(product.material?.en || product.careInstructions?.en) && (
                  <div className="mt-6 grid md:grid-cols-2 gap-6">
                    {product.material?.en && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{t('product.material', { defaultValue: 'Material' })}</h4>
                        <p className="text-gray-600">{product.material?.[language] || product.material?.en}</p>
                      </div>
                    )}
                    {product.careInstructions?.en && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{t('product.careInstructions', { defaultValue: 'Care Instructions' })}</h4>
                        <p className="text-gray-600">{product.careInstructions?.[language] || product.careInstructions?.en}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-heading font-semibold">
                    {t('product.customerReviews')} ({reviews.length})
                  </h3>
                  <button
                    onClick={handleWriteReview}
                    className={`btn ${canReview ? 'btn-primary' : 'btn-outline'}`}
                    disabled={!isAuthenticated || hasReviewed}
                  >
                    {hasReviewed ? t('product.alreadyReviewed', { defaultValue: 'Already Reviewed' }) : t('product.writeReview')}
                  </button>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-gray-500">{t('product.noReviews')}</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review._id} className="border-b pb-6">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {review.user?.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{review.user?.name}</p>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FiStar
                                  key={star}
                                  className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 ml-auto">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-8">
              {t('product.relatedProducts')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={product.images || []}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-heading font-semibold mb-4">
              {t('product.writeReview', { defaultValue: 'Write a Review' })}
            </h3>

            {/* Select Order */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('product.selectOrder', { defaultValue: 'Select Order' })} *
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="input"
              >
                <option value="">{t('product.chooseOrder', { defaultValue: 'Choose an order...' })}</option>
                {deliveredOrdersWithProduct.map((order) => (
                  <option key={order._id} value={order._id}>
                    {order.orderNumber} - {new Date(order.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('product.rating', { defaultValue: 'Rating' })} *
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1"
                  >
                    <FiStar
                      className={`w-8 h-8 ${
                        star <= reviewRating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('product.yourReview', { defaultValue: 'Your Review' })} *
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                className="input resize-none"
                placeholder={t('product.reviewPlaceholder', { defaultValue: 'Share your experience with this product...' })}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="btn btn-outline flex-1"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {reviewMutation.isPending
                  ? t('common.submitting', { defaultValue: 'Submitting...' })
                  : t('product.submitReview', { defaultValue: 'Submit Review' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetail;
