import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiPlus, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { managementAPI, categoriesAPI } from '../../services/api';
import { PageLoader } from '../../components/common/Loader';
import Loader from '../../components/common/Loader';

// Age ranges for pricing
const AGE_RANGES = [
  '0-6 Months', '6-12 Months',
  '1-2 Years', '2-3 Years', '3-4 Years', '4-5 Years', '5-6 Years',
  '6-7 Years', '7-8 Years', '8-10 Years', '10-12 Years',
  '12-14 Years', '14-16 Years'
];

const ProductForm = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [images, setImages] = useState([]);
  const [colors, setColors] = useState([{ name: '', hex: '#000000' }]);
  const [agePricing, setAgePricing] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const { data: productData, isLoading: loadingProduct } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => managementAPI.getProducts({ id }),
    enabled: isEdit
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoriesAPI.getAllFlat()
  });

  useEffect(() => {
    if (productData?.data?.data) {
      const product = productData.data.data;
      reset({
        nameEn: product.name?.en,
        nameUr: product.name?.ur,
        descriptionEn: product.description?.en,
        descriptionUr: product.description?.ur,
        price: product.price,
        salePrice: product.salePrice,
        category: product.category?._id,
        sku: product.sku,
        featured: product.featured,
        isActive: product.isActive
      });
      setColors(product.colors?.length > 0 ? product.colors : [{ name: '', hex: '#000000' }]);
      setImages(product.images?.map(img => ({ url: img.url, existing: true })) || []);
      // Set age pricing if exists
      if (product.agePricing?.length > 0) {
        setAgePricing(product.agePricing);
      }
    }
  }, [productData, reset]);

  const categories = categoriesData?.data?.data || [];

  const onDrop = useCallback((acceptedFiles) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages].slice(0, 10));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024
  });

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addColor = () => {
    setColors(prev => [...prev, { name: '', hex: '#000000' }]);
  };

  const removeColor = (index) => {
    setColors(prev => prev.filter((_, i) => i !== index));
  };

  const updateColor = (index, field, value) => {
    setColors(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  // Age pricing functions
  const addAgePricing = (ageRange) => {
    if (agePricing.find(ap => ap.ageRange === ageRange)) {
      toast.error('This age range is already added');
      return;
    }
    setAgePricing(prev => [...prev, { ageRange, price: '', salePrice: '' }]);
  };

  const removeAgePricing = (index) => {
    setAgePricing(prev => prev.filter((_, i) => i !== index));
  };

  const updateAgePricing = (index, field, value) => {
    setAgePricing(prev => prev.map((ap, i) =>
      i === index ? { ...ap, [field]: value } : ap
    ));
  };

  const addAllAges = () => {
    const newAgePricing = AGE_RANGES.filter(
      age => !agePricing.find(ap => ap.ageRange === age)
    ).map(ageRange => ({ ageRange, price: '', salePrice: '' }));
    setAgePricing(prev => [...prev, ...newAgePricing]);
  };

  const createMutation = useMutation({
    mutationFn: (data) => managementAPI.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success(t('admin.productCreated'));
      navigate('/admin/products');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setLoading(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => managementAPI.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['admin-product', id]);
      toast.success(t('admin.productUpdated'));
      navigate('/admin/products');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setLoading(false);
    }
  });

  const onSubmit = (data) => {
    if (images.length === 0) {
      toast.error(t('admin.imagesRequired'));
      return;
    }

    // Validate age pricing
    const validAgePricing = agePricing.filter(ap => ap.price && Number(ap.price) > 0);
    if (validAgePricing.length === 0) {
      toast.error('Please add at least one age range with price');
      return;
    }

    setLoading(true);

    const productData = {
      name: { en: data.nameEn, ur: data.nameUr || data.nameEn },
      description: { en: data.descriptionEn, ur: data.descriptionUr || data.descriptionEn },
      price: Number(data.price),
      salePrice: data.salePrice ? Number(data.salePrice) : null,
      category: data.category || null,
      sku: data.sku,
      agePricing: validAgePricing.map(ap => ({
        ageRange: ap.ageRange,
        price: Number(ap.price),
        salePrice: ap.salePrice ? Number(ap.salePrice) : null
      })),
      colors: colors.filter(c => c.name),
      featured: data.featured || false,
      isActive: data.isActive ?? true,
      images: images.filter(img => img.file).map(img => img.file),
      existingImages: images.filter(img => img.existing).map(img => img.url)
    };

    if (isEdit) {
      updateMutation.mutate(productData);
    } else {
      createMutation.mutate(productData);
    }
  };

  if (loadingProduct && isEdit) return <PageLoader />;

  // Get available age ranges not yet added
  const availableAges = AGE_RANGES.filter(
    age => !agePricing.find(ap => ap.ageRange === age)
  );

  return (
    <>
      <Helmet>
        <title>{isEdit ? t('admin.editProduct') : t('admin.addProduct')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft />
          {t('admin.backToProducts')}
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-8">
            {isEdit ? t('admin.editProduct') : t('admin.addProduct')}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('admin.productImages')} *
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                }`}
              >
                <input {...getInputProps()} />
                <FiUpload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">{t('admin.dropImages')}</p>
                <p className="text-sm text-gray-400">{t('admin.maxImages', { max: 10 })}</p>
              </div>

              {images.length > 0 && (
                <div className="flex gap-4 mt-4 flex-wrap">
                  {images.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img.preview || img.url}
                        alt={`Product ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Names */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.productNameEn')} *
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.productNameUr')}
                </label>
                <input
                  type="text"
                  {...register('nameUr')}
                  className="input"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.descriptionEn')} *
                </label>
                <textarea
                  {...register('descriptionEn', { required: t('validation.required') })}
                  rows={4}
                  className={`input ${errors.descriptionEn ? 'input-error' : ''}`}
                />
                {errors.descriptionEn && (
                  <p className="text-red-500 text-sm mt-1">{errors.descriptionEn.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.descriptionUr')}
                </label>
                <textarea
                  {...register('descriptionUr')}
                  rows={4}
                  className="input"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Category & SKU */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.category')}
                </label>
                <select
                  {...register('category')}
                  className="input"
                >
                  <option value="">{t('common.select')}</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name?.en}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.sku')}
                </label>
                <input
                  type="text"
                  {...register('sku')}
                  className="input"
                  placeholder="AUTO-GENERATED"
                />
              </div>
            </div>

            {/* Base Price (for display purposes) */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (Rs.) *
                  <span className="text-xs text-gray-500 block">For display/reference</span>
                </label>
                <input
                  type="number"
                  {...register('price', { required: t('validation.required'), min: 0 })}
                  className={`input ${errors.price ? 'input-error' : ''}`}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Sale Price (Rs.)
                </label>
                <input
                  type="number"
                  {...register('salePrice', { min: 0 })}
                  className="input"
                />
              </div>
            </div>

            {/* Age-Based Pricing */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">Age-Based Pricing *</h3>
                  <p className="text-sm text-gray-500">Set different prices for each age range (0-16 years)</p>
                </div>
                <button
                  type="button"
                  onClick={addAllAges}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Add All Ages
                </button>
              </div>

              {/* Add Age Range Dropdown */}
              {availableAges.length > 0 && (
                <div className="flex gap-2 mb-4">
                  <select
                    id="addAgeSelect"
                    className="input flex-1"
                    defaultValue=""
                  >
                    <option value="" disabled>Select age range to add...</option>
                    {availableAges.map(age => (
                      <option key={age} value={age}>{age}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const select = document.getElementById('addAgeSelect');
                      if (select.value) {
                        addAgePricing(select.value);
                        select.value = '';
                      }
                    }}
                    className="btn btn-outline"
                  >
                    <FiPlus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
              )}

              {/* Age Pricing List */}
              {agePricing.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 px-2">
                    <div className="col-span-4">Age Range</div>
                    <div className="col-span-3">Price (Rs.)</div>
                    <div className="col-span-4">Sale Price</div>
                    <div className="col-span-1"></div>
                  </div>

                  {agePricing.map((ap, index) => (
                    <div key={ap.ageRange} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                      <div className="col-span-4 font-medium text-gray-800">
                        {ap.ageRange}
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={ap.price}
                          onChange={(e) => updateAgePricing(index, 'price', e.target.value)}
                          className="input py-2"
                          placeholder="Price"
                          min="0"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={ap.salePrice || ''}
                          onChange={(e) => updateAgePricing(index, 'salePrice', e.target.value)}
                          className="input py-2"
                          placeholder="Sale"
                          min="0"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeAgePricing(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {agePricing.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No age ranges added yet.</p>
                  <p className="text-sm text-gray-400">Add age ranges to set different prices for each age group.</p>
                </div>
              )}
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('admin.colors')}
              </label>
              <div className="space-y-3">
                {colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => updateColor(index, 'hex', e.target.value)}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color.name}
                      onChange={(e) => updateColor(index, 'name', e.target.value)}
                      placeholder={t('admin.colorName')}
                      className="input flex-1"
                    />
                    {colors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addColor}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <FiPlus className="w-4 h-4" />
                  {t('admin.addColor')}
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('featured')}
                  className="w-5 h-5 rounded text-primary-500"
                />
                <span className="font-medium text-gray-700">{t('admin.featured')}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  defaultChecked
                  className="w-5 h-5 rounded text-primary-500"
                />
                <span className="font-medium text-gray-700">{t('admin.active')}</span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="btn btn-outline flex-1"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                {loading ? <Loader size="sm" /> : (isEdit ? t('admin.updateProduct') : t('admin.createProduct'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ProductForm;
