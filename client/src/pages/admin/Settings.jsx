import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiSave, FiGlobe, FiTruck, FiMail, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { managementAPI } from '../../services/api';
import { PageLoader } from '../../components/common/Loader';
import Loader from '../../components/common/Loader';

const Settings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => managementAPI.getSettings()
  });

  useEffect(() => {
    if (data?.data?.data) {
      const settings = data.data.data;
      reset({
        siteName: settings.siteName,
        siteDescription: settings.siteDescription,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        whatsappNumber: settings.whatsappNumber,
        address: settings.address,
        freeShippingThreshold: settings.freeShippingThreshold,
        defaultShippingCost: settings.defaultShippingCost,
        currency: settings.currency,
        facebookUrl: settings.socialLinks?.facebook,
        instagramUrl: settings.socialLinks?.instagram,
        twitterUrl: settings.socialLinks?.twitter
      });
      if (settings.logo?.url) {
        setLogo({ url: settings.logo.url, existing: true });
      }
    }
  }, [data, reset]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) {
      setLogo({
        file: acceptedFiles[0],
        preview: URL.createObjectURL(acceptedFiles[0])
      });
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.svg'] },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024
  });

  const updateMutation = useMutation({
    mutationFn: (data) => managementAPI.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-settings']);
      toast.success(t('admin.settingsUpdated'));
      setLoading(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setLoading(false);
    }
  });

  const onSubmit = (data) => {
    setLoading(true);
    const settingsData = {
      siteName: data.siteName,
      siteDescription: data.siteDescription,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      whatsappNumber: data.whatsappNumber,
      address: data.address,
      freeShippingThreshold: Number(data.freeShippingThreshold),
      defaultShippingCost: Number(data.defaultShippingCost),
      currency: data.currency,
      socialLinks: {
        facebook: data.facebookUrl,
        instagram: data.instagramUrl,
        twitter: data.twitterUrl
      },
      logo: logo?.file
    };

    updateMutation.mutate(settingsData);
  };

  const tabs = [
    { id: 'general', label: t('admin.generalSettings'), icon: FiGlobe },
    { id: 'shipping', label: t('admin.shippingSettings'), icon: FiTruck },
    { id: 'contact', label: t('admin.contactSettings'), icon: FiMail }
  ];

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{t('admin.settings')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          {t('admin.settings')}
        </h1>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="border-b">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-2xl">
                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('admin.siteLogo')}
                  </label>
                  <div className="flex items-start gap-6">
                    <div
                      {...getRootProps()}
                      className="border-2 border-dashed rounded-xl p-6 cursor-pointer hover:border-primary-400 flex-1"
                    >
                      <input {...getInputProps()} />
                      {logo ? (
                        <div className="relative inline-block">
                          <img
                            src={logo.preview || logo.url}
                            alt="Logo"
                            className="max-h-20 object-contain"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogo(null);
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full"
                          >
                            <FiX className="w-4 h-4 mx-auto" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <FiUpload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">{t('admin.uploadLogo')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.siteName')} *
                  </label>
                  <input
                    type="text"
                    {...register('siteName', { required: t('validation.required') })}
                    className={`input ${errors.siteName ? 'input-error' : ''}`}
                  />
                  {errors.siteName && (
                    <p className="text-red-500 text-sm mt-1">{errors.siteName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.siteDescription')}
                  </label>
                  <textarea
                    {...register('siteDescription')}
                    rows={3}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.currency')}
                  </label>
                  <select {...register('currency')} className="input">
                    <option value="PKR">Pakistani Rupee (PKR)</option>
                    <option value="USD">US Dollar (USD)</option>
                  </select>
                </div>

                {/* Social Links */}
                <div className="pt-6 border-t">
                  <h3 className="font-heading font-semibold text-gray-900 mb-4">
                    {t('admin.socialLinks')}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Facebook URL
                      </label>
                      <input
                        type="url"
                        {...register('facebookUrl')}
                        className="input"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instagram URL
                      </label>
                      <input
                        type="url"
                        {...register('instagramUrl')}
                        className="input"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twitter URL
                      </label>
                      <input
                        type="url"
                        {...register('twitterUrl')}
                        className="input"
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Settings */}
            {activeTab === 'shipping' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.freeShippingThreshold')} (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('freeShippingThreshold')}
                    className="input"
                    placeholder="3000"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('admin.freeShippingNote')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.defaultShippingCost')} (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('defaultShippingCost')}
                    className="input"
                    placeholder="200"
                  />
                </div>
              </div>
            )}

            {/* Contact Settings */}
            {activeTab === 'contact' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.contactEmail')} *
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      {...register('contactEmail', { required: t('validation.required') })}
                      className={`input pl-10 ${errors.contactEmail ? 'input-error' : ''}`}
                    />
                  </div>
                  {errors.contactEmail && (
                    <p className="text-red-500 text-sm mt-1">{errors.contactEmail.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.contactPhone')}
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      {...register('contactPhone')}
                      className="input pl-10"
                      placeholder="03001234567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.whatsappNumber')}
                  </label>
                  <input
                    type="tel"
                    {...register('whatsappNumber')}
                    className="input"
                    placeholder="923001234567"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('admin.whatsappNote')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.address')}
                  </label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="input"
                    placeholder={t('admin.addressPlaceholder')}
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <Loader size="sm" />
                ) : (
                  <>
                    <FiSave className="w-5 h-5 mr-2" />
                    {t('admin.saveSettings')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Settings;
