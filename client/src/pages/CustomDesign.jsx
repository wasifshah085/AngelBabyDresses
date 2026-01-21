import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiImage, FiSend, FiDollarSign, FiCheckCircle, FiTruck } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { customDesignAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';
import Loader from '../components/common/Loader';

const sizes = ['0-3M', '3-6M', '6-12M', '1-2Y', '2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-7Y'];

const CustomDesign = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onDrop = useCallback((acceptedFiles) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages].slice(0, 5));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: (data) => customDesignAPI.create(data),
    onSuccess: (response) => {
      toast.success(t('customDesign.submitSuccess'));
      navigate(`/my-designs/${response.data.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setLoading(false);
    }
  });

  const onSubmit = (data) => {
    if (!isAuthenticated) {
      toast.error(t('messages.loginRequired'));
      navigate('/login', { state: { from: { pathname: '/custom-design' } } });
      return;
    }

    if (images.length === 0) {
      toast.error(t('customDesign.uploadRequired'));
      return;
    }

    setLoading(true);
    createMutation.mutate({
      ...data,
      images: images.map(img => img.file)
    });
  };

  return (
    <>
      <Helmet>
        <title>{t('customDesign.title')} | Angel Baby Dresses</title>
        <meta name="description" content="Create your own custom dress design for your little ones. Upload your design or use our interactive builder." />
      </Helmet>

      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-4">
            {t('customDesign.title')}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('customDesign.subtitle')}
          </p>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-xl font-heading font-semibold text-center text-gray-900 mb-6">
            How Custom Orders Work
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSend className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">1. Submit Design</h3>
              <p className="text-sm text-gray-600">Upload your design idea and tell us what you want</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiDollarSign className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">2. Get Quote</h3>
              <p className="text-sm text-gray-600">We review and send you a price quote within 24-48 hours</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">3. Pay 50% Advance</h3>
              <p className="text-sm text-gray-600">Confirm order by paying 50% via JazzCash/Easypaisa/Bank</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTruck className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">4. Pay Remaining COD</h3>
              <p className="text-sm text-gray-600">Pay remaining 50% + shipping (Rs 350/kg) on delivery</p>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800 text-center">
              <strong>Important:</strong> Your order will only start production after your advance payment is verified. Orders without advance payment will not proceed.
            </p>
          </div>
        </div>

        {/* Design Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            {/* Image Upload */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('customDesign.uploadImages')} *
              </label>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                }`}
              >
                <input {...getInputProps()} />
                <FiImage className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-primary-600">{t('customDesign.dropHere')}</p>
                ) : (
                  <>
                    <p className="text-gray-600 mb-2">{t('customDesign.dragDrop')}</p>
                    <p className="text-sm text-gray-400">{t('customDesign.uploadLimit')}</p>
                  </>
                )}
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="flex gap-4 mt-4 flex-wrap">
                  {images.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img.preview}
                        alt={`Design ${index + 1}`}
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

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('customDesign.description')} *
              </label>
              <textarea
                {...register('description', { required: t('validation.required') })}
                rows={4}
                className={`input ${errors.description ? 'input-error' : ''}`}
                placeholder={t('customDesign.descriptionPlaceholder')}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Size & Quantity */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.size')} *
                </label>
                <select
                  {...register('size', { required: t('validation.required') })}
                  className={`input ${errors.size ? 'input-error' : ''}`}
                >
                  <option value="">{t('common.selectSize')}</option>
                  {sizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                {errors.size && (
                  <p className="text-red-500 text-sm mt-1">{errors.size.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.quantity')} *
                </label>
                <input
                  type="number"
                  min="1"
                  {...register('quantity', {
                    required: t('validation.required'),
                    min: { value: 1, message: t('validation.minQuantity') }
                  })}
                  className={`input ${errors.quantity ? 'input-error' : ''}`}
                  defaultValue="1"
                />
                {errors.quantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
                )}
              </div>
            </div>

            {/* WhatsApp Number */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <FaWhatsapp className="w-4 h-4 text-green-500" />
                  {t('customDesign.whatsappNumber') || 'WhatsApp Number'} *
                </span>
              </label>
              <input
                type="tel"
                {...register('whatsappNumber', {
                  required: t('validation.required'),
                  pattern: {
                    value: /^[0-9+]{10,15}$/,
                    message: t('validation.invalidPhone') || 'Please enter a valid phone number'
                  }
                })}
                className={`input ${errors.whatsappNumber ? 'input-error' : ''}`}
                placeholder="03001234567"
                dir="ltr"
              />
              {errors.whatsappNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.whatsappNumber.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {t('customDesign.whatsappNote') || 'Our designer will contact you on WhatsApp to discuss your design'}
              </p>
            </div>

            {/* Preferred Colors */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('customDesign.preferredColors')}
              </label>
              <input
                type="text"
                {...register('preferredColors')}
                className="input"
                placeholder={t('customDesign.colorsPlaceholder')}
              />
            </div>

            {/* Fabric Preference */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('customDesign.fabricPreference')}
              </label>
              <select {...register('fabricPreference')} className="input">
                <option value="">{t('common.select')}</option>
                <option value="cotton">{t('fabrics.cotton')}</option>
                <option value="silk">{t('fabrics.silk')}</option>
                <option value="linen">{t('fabrics.linen')}</option>
                <option value="velvet">{t('fabrics.velvet')}</option>
                <option value="any">{t('fabrics.any')}</option>
              </select>
            </div>

            {/* Additional Notes */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('customDesign.additionalNotes')}
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="input"
                placeholder={t('customDesign.notesPlaceholder')}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-4 text-lg"
            >
              {loading ? <Loader size="sm" /> : t('customDesign.submitRequest')}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              {t('customDesign.quoteNote')}
            </p>
          </div>
        </form>
      </div>
    </>
  );
};

export default CustomDesign;
