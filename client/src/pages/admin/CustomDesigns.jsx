import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiSearch, FiFilter, FiEye, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { managementAPI } from '../../services/api';
import { PageLoader } from '../../components/common/Loader';
import { getImageUrl } from '../../utils/imageUrl';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  quoted: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const CustomDesigns = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-custom-designs', page, search, statusFilter],
    queryFn: () => managementAPI.getCustomDesigns({ page, search, status: statusFilter !== 'all' ? statusFilter : undefined })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => managementAPI.updateCustomDesign(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-custom-designs']);
      toast.success(t('admin.designUpdated'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const designs = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{t('admin.customDesigns')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          {t('admin.customDesigns')}
        </h1>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('admin.searchDesigns')}
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
                <option value="all">{t('admin.allDesigns')}</option>
                <option value="pending">{t('customDesign.status.pending')}</option>
                <option value="reviewing">{t('customDesign.status.reviewing')}</option>
                <option value="quoted">{t('customDesign.status.quoted')}</option>
                <option value="accepted">{t('customDesign.status.accepted')}</option>
                <option value="in_progress">{t('customDesign.status.in_progress')}</option>
                <option value="completed">{t('customDesign.status.completed')}</option>
                <option value="cancelled">{t('customDesign.status.cancelled')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Designs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <div key={design._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {design.images?.[0]?.url ? (
                  <img
                    src={getImageUrl(design.images[0].url)}
                    alt="Design"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${statusColors[design.status]}`}>
                  {t(`customDesign.status.${design.status}`)}
                </span>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">
                    #{design._id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(design.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="font-medium text-gray-900">{design.user?.name}</p>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                  {design.description}
                </p>

                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span>{t('common.size')}: {design.size}</span>
                  <span>{t('common.quantity')}: {design.quantity}</span>
                </div>

                {design.quotedPrice && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-sm text-gray-500">{t('customDesign.quotedPrice')}: </span>
                    <span className="font-bold text-primary-600">Rs. {design.quotedPrice.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <select
                    value={design.status}
                    onChange={(e) => updateMutation.mutate({ id: design._id, status: e.target.value })}
                    disabled={updateMutation.isPending}
                    className="input flex-1 text-sm"
                  >
                    <option value="pending">{t('customDesign.status.pending')}</option>
                    <option value="reviewing">{t('customDesign.status.reviewing')}</option>
                    <option value="quoted">{t('customDesign.status.quoted')}</option>
                    <option value="accepted">{t('customDesign.status.accepted')}</option>
                    <option value="in_progress">{t('customDesign.status.in_progress')}</option>
                    <option value="completed">{t('customDesign.status.completed')}</option>
                    <option value="cancelled">{t('customDesign.status.cancelled')}</option>
                  </select>
                  <Link
                    to={`/admin/custom-designs/${design._id}`}
                    className="btn btn-outline btn-sm"
                  >
                    <FiEye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {designs.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">{t('admin.noDesignsFound')}</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2">
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

export default CustomDesigns;
