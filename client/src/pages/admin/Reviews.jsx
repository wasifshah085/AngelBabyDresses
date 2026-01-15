import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiSearch, FiFilter, FiStar, FiCheck, FiX, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { managementAPI } from '../../services/api';
import { useLanguageStore } from '../../store/useStore';
import { PageLoader } from '../../components/common/Loader';
import { getImageUrl } from '../../utils/imageUrl';

const Reviews = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, search, statusFilter],
    queryFn: () => managementAPI.getReviews({ page, search, status: statusFilter !== 'all' ? statusFilter : undefined })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => managementAPI.updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reviews']);
      toast.success(t('admin.reviewUpdated'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => managementAPI.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reviews']);
      toast.success(t('admin.reviewDeleted'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const reviews = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const handleApprove = (review) => {
    updateMutation.mutate({ id: review._id, data: { isApproved: true } });
  };

  const handleReject = (review) => {
    updateMutation.mutate({ id: review._id, data: { isApproved: false } });
  };

  const handleDelete = (review) => {
    if (window.confirm(t('admin.confirmDeleteReview'))) {
      deleteMutation.mutate(review._id);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{t('admin.reviews')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          {t('admin.reviews')}
        </h1>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('admin.searchReviews')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">{t('admin.allReviews')}</option>
                <option value="pending">{t('admin.pending')}</option>
                <option value="approved">{t('admin.approved')}</option>
                <option value="rejected">{t('admin.rejected')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Product */}
                <div className="flex gap-3 shrink-0">
                  <img
                    src={getImageUrl(review.product?.images?.[0]?.url)}
                    alt={review.product?.name?.[language] || review.product?.name?.en}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <p className="font-medium text-gray-900 line-clamp-1">
                      {review.product?.name?.[language] || review.product?.name?.en}
                    </p>
                    <p className="text-sm text-gray-500">{review.user?.name}</p>
                  </div>
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-500 ml-2">
                      {new Date(review.createdAt).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US')}
                    </span>
                  </div>

                  {review.title && (
                    <h3 className="font-medium text-gray-900 mb-1">{review.title}</h3>
                  )}
                  <p className="text-gray-600">{review.comment}</p>

                  {/* Review Images */}
                  {review.images?.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((img, index) => (
                        <img
                          key={index}
                          src={getImageUrl(img.url)}
                          alt=""
                          className="w-12 h-12 object-cover rounded cursor-pointer"
                          onClick={() => window.open(getImageUrl(img.url), '_blank')}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    review.isApproved === true ? 'bg-green-100 text-green-600' :
                    review.isApproved === false ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {review.isApproved === true ? t('admin.approved') :
                     review.isApproved === false ? t('admin.rejected') :
                     t('admin.pending')}
                  </span>

                  {review.isApproved !== true && (
                    <button
                      onClick={() => handleApprove(review)}
                      disabled={updateMutation.isPending}
                      className="p-2 hover:bg-green-50 rounded-lg text-gray-600 hover:text-green-600"
                      title={t('admin.approve')}
                    >
                      <FiCheck className="w-5 h-5" />
                    </button>
                  )}

                  {review.isApproved !== false && (
                    <button
                      onClick={() => handleReject(review)}
                      disabled={updateMutation.isPending}
                      className="p-2 hover:bg-red-50 rounded-lg text-gray-600 hover:text-red-600"
                      title={t('admin.reject')}
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(review)}
                    disabled={deleteMutation.isPending}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-red-600"
                    title={t('common.delete')}
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">{t('admin.noReviewsFound')}</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm"
            >
              {t('common.previous')}
            </button>
            <span className="text-gray-600">
              {t('admin.showingPage', { page: pagination.page, total: pagination.pages })}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="btn btn-outline btn-sm"
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Reviews;
