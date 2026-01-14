import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiTag, FiCalendar, FiCopy } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { managementAPI } from '../../services/api';
import { useLanguageStore } from '../../store/useStore';
import { PageLoader } from '../../components/common/Loader';
import Loader from '../../components/common/Loader';

const Coupons = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm();

  const discountType = watch('discountType');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => managementAPI.getCoupons()
  });

  const coupons = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data) => managementAPI.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-coupons']);
      toast.success(t('admin.couponCreated'));
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setLoading(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => managementAPI.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-coupons']);
      toast.success(t('admin.couponUpdated'));
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setLoading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => managementAPI.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-coupons']);
      toast.success(t('admin.couponDeleted'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const openModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      reset({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchase: coupon.minPurchase,
        maxDiscount: coupon.maxDiscount,
        usageLimit: coupon.usageLimit,
        expiresAt: coupon.expiresAt?.split('T')[0],
        isActive: coupon.isActive
      });
    } else {
      setEditingCoupon(null);
      reset({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minPurchase: '',
        maxDiscount: '',
        usageLimit: '',
        expiresAt: '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    reset();
    setLoading(false);
  };

  const onSubmit = (data) => {
    setLoading(true);
    const couponData = {
      code: data.code.toUpperCase(),
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      minPurchase: data.minPurchase ? Number(data.minPurchase) : 0,
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
      expiresAt: data.expiresAt || undefined,
      isActive: data.isActive
    };

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon._id, data: couponData });
    } else {
      createMutation.mutate(couponData);
    }
  };

  const handleDelete = (coupon) => {
    if (window.confirm(t('admin.confirmDeleteCoupon', { code: coupon.code }))) {
      deleteMutation.mutate(coupon._id);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(t('admin.codeCopied'));
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{t('admin.coupons')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            {t('admin.coupons')}
          </h1>
          <button onClick={() => openModal()} className="btn btn-primary">
            <FiPlus className="w-5 h-5 mr-2" />
            {t('admin.createCoupon')}
          </button>
        </div>

        {/* Coupons Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.couponCode')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.discount')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.minPurchase')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.usage')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.expires')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.status')}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                    {t('admin.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FiTag className="w-4 h-4 text-primary-500" />
                        <span className="font-mono font-semibold text-gray-900">{coupon.code}</span>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-primary-600">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : `Rs. ${coupon.discountValue}`}
                      </span>
                      {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                        <p className="text-xs text-gray-500">
                          Max: Rs. {coupon.maxDiscount}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {coupon.minPurchase > 0 ? `Rs. ${coupon.minPurchase.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {coupon.usedCount || 0}
                      {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {coupon.expiresAt ? (
                        <div className="flex items-center gap-1">
                          <FiCalendar className="w-4 h-4 text-gray-400" />
                          {new Date(coupon.expiresAt).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US')}
                        </div>
                      ) : (
                        t('admin.noExpiry')
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        coupon.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {coupon.isActive ? t('admin.active') : t('admin.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(coupon)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-primary-600"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          disabled={deleteMutation.isPending}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-red-600"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {coupons.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {t('admin.noCouponsFound')}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-heading font-bold text-gray-900 mb-6">
              {editingCoupon ? t('admin.editCoupon') : t('admin.createCoupon')}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.couponCode')} *
                </label>
                <input
                  type="text"
                  {...register('code', { required: t('validation.required') })}
                  className={`input uppercase ${errors.code ? 'input-error' : ''}`}
                  placeholder="SUMMER20"
                />
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.discountType')} *
                  </label>
                  <select
                    {...register('discountType')}
                    className="input"
                  >
                    <option value="percentage">{t('admin.percentage')}</option>
                    <option value="fixed">{t('admin.fixedAmount')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.discountValue')} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register('discountValue', { required: t('validation.required'), min: 1 })}
                    className={`input ${errors.discountValue ? 'input-error' : ''}`}
                  />
                  {errors.discountValue && (
                    <p className="text-red-500 text-sm mt-1">{errors.discountValue.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.minPurchase')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('minPurchase')}
                    className="input"
                    placeholder="0"
                  />
                </div>

                {discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.maxDiscount')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register('maxDiscount')}
                      className="input"
                      placeholder={t('admin.noLimit')}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.usageLimit')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register('usageLimit')}
                    className="input"
                    placeholder={t('admin.unlimited')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.expiryDate')}
                  </label>
                  <input
                    type="date"
                    {...register('expiresAt')}
                    className="input"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-5 h-5 rounded text-primary-500"
                />
                <span className="font-medium text-gray-700">{t('admin.activeCoupon')}</span>
              </label>

              <div className="flex gap-4">
                <button type="button" onClick={closeModal} className="btn btn-outline flex-1">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                  {loading ? <Loader size="sm" /> : (editingCoupon ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Coupons;
