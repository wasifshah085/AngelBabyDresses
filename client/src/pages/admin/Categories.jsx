import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiX, FiMaximize2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { managementAPI } from '../../services/api';
import { useLanguageStore } from '../../store/useStore';
import { PageLoader } from '../../components/common/Loader';
import Loader from '../../components/common/Loader';
import ImageLightbox from '../../components/common/ImageLightbox';
import { getImageUrl } from '../../utils/imageUrl';

const Categories = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => managementAPI.getCategories()
  });

  const categories = data?.data?.data || [];

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) {
      setImage({
        file: acceptedFiles[0],
        preview: URL.createObjectURL(acceptedFiles[0])
      });
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024
  });

  const createMutation = useMutation({
    mutationFn: (data) => managementAPI.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      toast.success(t('admin.categoryCreated'));
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setLoading(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => managementAPI.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      toast.success(t('admin.categoryUpdated'));
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setLoading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => managementAPI.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      toast.success(t('admin.categoryDeleted'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      reset({
        nameEn: category.name?.en,
        nameUr: category.name?.ur,
        parent: category.parent?._id || ''
      });
      if (category.image?.url) {
        setImage({ url: category.image.url, existing: true });
      }
    } else {
      setEditingCategory(null);
      reset({ nameEn: '', nameUr: '', parent: '' });
      setImage(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setImage(null);
    reset();
    setLoading(false);
  };

  const onSubmit = (data) => {
    setLoading(true);
    const categoryData = {
      name: { en: data.nameEn, ur: data.nameUr || data.nameEn },
      parent: data.parent || null,
      image: image?.file || undefined,
      existingImage: image?.existing ? image.url : undefined
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data: categoryData });
    } else {
      createMutation.mutate(categoryData);
    }
  };

  const handleDelete = (category) => {
    if (window.confirm(t('admin.confirmDeleteCategory', { name: category.name?.[language] || category.name?.en }))) {
      deleteMutation.mutate(category._id);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{t('admin.categories')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            {t('admin.categories')}
          </h1>
          <button onClick={() => openModal()} className="btn btn-primary">
            <FiPlus className="w-5 h-5 mr-2" />
            {t('admin.addCategory')}
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-100 relative group">
                {category.image?.url ? (
                  <>
                    <img
                      src={getImageUrl(category.image.url)}
                      alt={category.name?.[language] || category.name?.en}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => {
                        setLightboxImage(getImageUrl(category.image.url));
                        setLightboxOpen(true);
                      }}
                    />
                    <button
                      onClick={() => {
                        setLightboxImage(getImageUrl(category.image.url));
                        setLightboxOpen(true);
                      }}
                      className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t('common.viewFullSize', { defaultValue: 'View full size' })}
                    >
                      <FiMaximize2 className="w-4 h-4 text-gray-700" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-heading font-semibold text-gray-900">
                  {category.name?.[language] || category.name?.en}
                </h3>
                {category.parent && (
                  <p className="text-sm text-gray-500">
                    Parent: {category.parent?.name?.[language] || category.parent?.name?.en}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {category.productCount || 0} {t('common.products')}
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openModal(category)}
                    className="btn btn-outline btn-sm flex-1"
                  >
                    <FiEdit2 className="w-4 h-4 mr-1" />
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
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

        {categories.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">{t('admin.noCategoriesFound')}</p>
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
              {editingCategory ? t('admin.editCategory') : t('admin.addCategory')}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.categoryImage')}
                </label>
                <div
                  {...getRootProps()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary-400"
                >
                  <input {...getInputProps()} />
                  {image ? (
                    <div className="relative inline-block">
                      <img
                        src={image.preview || image.url}
                        alt=""
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImage(null);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full"
                      >
                        <FiX className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <FiUpload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">{t('admin.uploadImage')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Name English */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.categoryNameEn')} *
                </label>
                <input
                  type="text"
                  {...register('nameEn', { required: t('validation.required') })}
                  className={`input ${errors.nameEn ? 'input-error' : ''}`}
                />
                {errors.nameEn && (
                  <p className="text-red-500 text-sm mt-1">{errors.nameEn.message}</p>
                )}
              </div>

              {/* Name Urdu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.categoryNameUr')}
                </label>
                <input
                  type="text"
                  {...register('nameUr')}
                  className="input"
                  dir="rtl"
                />
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.parentCategory')}
                </label>
                <select {...register('parent')} className="input">
                  <option value="">{t('admin.noParent')}</option>
                  {categories
                    .filter(c => c._id !== editingCategory?._id)
                    .map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name?.[language] || cat.name?.en}
                      </option>
                    ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button type="button" onClick={closeModal} className="btn btn-outline flex-1">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                  {loading ? <Loader size="sm" /> : (editingCategory ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImage ? [{ url: lightboxImage }] : []}
        initialIndex={0}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

export default Categories;
