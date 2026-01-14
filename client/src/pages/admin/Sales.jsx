import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiPercent, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { managementAPI } from '../../services/api';
import { useLanguageStore } from '../../store/useStore';
import { PageLoader } from '../../components/common/Loader';
import Loader from '../../components/common/Loader';

const Sales = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sales'],
    queryFn: () => managementAPI.getSales()
  });

  const sales = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data) => managementAPI.createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-sales']);
      toast.success(t('admin.saleCreated'));
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setLoading(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => managementAPI.updateSale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-sales']);
      toast.success(t('admin.saleUpdated'));
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setLoading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => managementAPI.deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-sales']);
      toast.success(t('admin.saleDeleted'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const openModal = (sale = null) => {
    if (sale) {
      setEditingSale(sale);
      reset({
        name: sale.name?.en || sale.name,
        discount: sale.discountValue || sale.discount,
        startDate: sale.startDate?.split('T')[0],
        endDate: sale.endDate?.split('T')[0],
        isActive: sale.isActive
      });
    } else {
      setEditingSale(null);
      reset({ name: '', discount: '', startDate: '', endDate: '', isActive: true });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSale(null);
    reset();
    setLoading(false);
  };

  const onSubmit = (data) => {
    setLoading(true);
    const saleData = {
      name: { en: data.name, ur: data.name },
      type: 'percentage',
      discountValue: Number(data.discount),
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive
    };

    if (editingSale) {
      updateMutation.mutate({ id: editingSale._id, data: saleData });
    } else {
      createMutation.mutate(saleData);
    }
  };

  const handleDelete = (sale) => {
    const saleName = sale.name?.[language] || sale.name?.en || sale.name;
    if (window.confirm(t('admin.confirmDeleteSale', { name: saleName }))) {
      deleteMutation.mutate(sale._id);
    }
  };

  const isActive = (sale) => {
    const now = new Date();
    const start = new Date(sale.startDate);
    const end = new Date(sale.endDate);
    return sale.isActive && now >= start && now <= end;
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{t('admin.sales')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            {t('admin.sales')}
          </h1>
          <button onClick={() => openModal()} className="btn btn-primary">
            <FiPlus className="w-5 h-5 mr-2" />
            {t('admin.createSale')}
          </button>
        </div>

        {/* Sales List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sales.map((sale) => (
            <div key={sale._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className={`h-2 ${isActive(sale) ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-gray-900 text-lg">
                    {sale.name?.[language] || sale.name?.en || sale.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isActive(sale) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isActive(sale) ? t('admin.active') : t('admin.inactive')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-2xl font-bold text-primary-600 mb-4">
                  <FiPercent className="w-6 h-6" />
                  {sale.discountValue || sale.discount}% OFF
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4 text-gray-400" />
                    {t('admin.starts')}: {new Date(sale.startDate).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US')}
                  </p>
                  <p className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4 text-gray-400" />
                    {t('admin.ends')}: {new Date(sale.endDate).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US')}
                  </p>
                </div>

                {sale.productsCount !== undefined && (
                  <p className="text-sm text-gray-500 mt-3">
                    {sale.productsCount} {t('admin.productsInSale')}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openModal(sale)}
                    className="btn btn-outline btn-sm flex-1"
                  >
                    <FiEdit2 className="w-4 h-4 mr-1" />
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(sale)}
                    disabled={deleteMutation.isPending}
                    className="btn btn-outline btn-sm text-red-500 border-red-300 hover:bg-red-50"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sales.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">{t('admin.noSalesFound')}</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-heading font-bold text-gray-900 mb-6">
              {editingSale ? t('admin.editSale') : t('admin.createSale')}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.saleName')} *
                </label>
                <input
                  type="text"
                  {...register('name', { required: t('validation.required') })}
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder={t('admin.saleNamePlaceholder')}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.discountPercent')} *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  {...register('discount', {
                    required: t('validation.required'),
                    min: { value: 1, message: t('validation.minValue', { min: 1 }) },
                    max: { value: 100, message: t('validation.maxValue', { max: 100 }) }
                  })}
                  className={`input ${errors.discount ? 'input-error' : ''}`}
                />
                {errors.discount && (
                  <p className="text-red-500 text-sm mt-1">{errors.discount.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.startDate')} *
                  </label>
                  <input
                    type="date"
                    {...register('startDate', { required: t('validation.required') })}
                    className={`input ${errors.startDate ? 'input-error' : ''}`}
                  />
                  {errors.startDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.endDate')} *
                  </label>
                  <input
                    type="date"
                    {...register('endDate', { required: t('validation.required') })}
                    className={`input ${errors.endDate ? 'input-error' : ''}`}
                  />
                  {errors.endDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-5 h-5 rounded text-primary-500"
                />
                <span className="font-medium text-gray-700">{t('admin.activeSale')}</span>
              </label>

              <div className="flex gap-4">
                <button type="button" onClick={closeModal} className="btn btn-outline flex-1">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                  {loading ? <Loader size="sm" /> : (editingSale ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sales;
