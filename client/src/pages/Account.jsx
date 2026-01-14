import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { FiUser, FiMail, FiPhone, FiLock, FiMapPin, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';
import { PageLoader } from '../components/common/Loader';
import Loader from '../components/common/Loader';

const Account = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('profile');
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => authAPI.getMe()
  });

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors }
  } = useForm({
    defaultValues: {
      name: user?.name,
      email: user?.email,
      phone: user?.phone
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch
  } = useForm();

  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    formState: { errors: addressErrors },
    reset: resetAddress
  } = useForm();

  const updateProfileMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data.data);
      toast.success(t('messages.profileUpdated'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data) => authAPI.updatePassword(data),
    onSuccess: () => {
      toast.success(t('messages.passwordUpdated'));
      resetPassword();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const addAddressMutation = useMutation({
    mutationFn: (data) => authAPI.addAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      toast.success(t('messages.addressAdded'));
      setShowAddressForm(false);
      resetAddress();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }) => authAPI.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      toast.success(t('messages.addressUpdated'));
      setEditingAddress(null);
      resetAddress();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id) => authAPI.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      toast.success(t('messages.addressDeleted'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const addresses = userData?.data?.data?.addresses || [];

  const onProfileSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data) => {
    updatePasswordMutation.mutate(data);
  };

  const onAddressSubmit = (data) => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress._id, data });
    } else {
      addAddressMutation.mutate(data);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    resetAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = (id) => {
    if (window.confirm(t('messages.confirmDelete'))) {
      deleteAddressMutation.mutate(id);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success(t('messages.logoutSuccess'));
  };

  if (isLoading) return <PageLoader />;

  const tabs = [
    { id: 'profile', label: t('account.profile'), icon: FiUser },
    { id: 'password', label: t('account.password'), icon: FiLock },
    { id: 'addresses', label: t('account.addresses'), icon: FiMapPin }
  ];

  return (
    <>
      <Helmet>
        <title>{t('account.title')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="container py-8">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900 mb-8">
          {t('account.title')}
        </h1>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar */}
          <div className="mb-8 lg:mb-0">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>

              <button
                onClick={handleLogout}
                className="w-full mt-6 text-red-500 hover:text-red-600 text-sm font-medium"
              >
                {t('common.logout')}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-heading font-semibold mb-6">
                  {t('account.profileInfo')}
                </h2>

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('auth.name')}
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          {...registerProfile('name', { required: t('validation.required') })}
                          className={`input pl-12 ${profileErrors.name ? 'input-error' : ''}`}
                        />
                      </div>
                      {profileErrors.name && (
                        <p className="text-red-500 text-sm mt-1">{profileErrors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('auth.email')}
                      </label>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          {...registerProfile('email', { required: t('validation.required') })}
                          className={`input pl-12 ${profileErrors.email ? 'input-error' : ''}`}
                        />
                      </div>
                      {profileErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{profileErrors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.phone')}
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          {...registerProfile('phone')}
                          className="input pl-12"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn btn-primary"
                  >
                    {updateProfileMutation.isPending ? <Loader size="sm" /> : t('common.save')}
                  </button>
                </form>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-heading font-semibold mb-6">
                  {t('account.changePassword')}
                </h2>

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('account.currentPassword')}
                    </label>
                    <input
                      type="password"
                      {...registerPassword('currentPassword', { required: t('validation.required') })}
                      className={`input ${passwordErrors.currentPassword ? 'input-error' : ''}`}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('account.newPassword')}
                    </label>
                    <input
                      type="password"
                      {...registerPassword('newPassword', {
                        required: t('validation.required'),
                        minLength: { value: 6, message: t('validation.minLength', { min: 6 }) }
                      })}
                      className={`input ${passwordErrors.newPassword ? 'input-error' : ''}`}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('account.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      {...registerPassword('confirmPassword', {
                        required: t('validation.required'),
                        validate: (value) => value === watch('newPassword') || t('validation.passwordMatch')
                      })}
                      className={`input ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    className="btn btn-primary"
                  >
                    {updatePasswordMutation.isPending ? <Loader size="sm" /> : t('account.updatePassword')}
                  </button>
                </form>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-heading font-semibold">
                    {t('account.savedAddresses')}
                  </h2>
                  <button
                    onClick={() => {
                      setEditingAddress(null);
                      resetAddress({});
                      setShowAddressForm(true);
                    }}
                    className="btn btn-outline btn-sm"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    {t('account.addAddress')}
                  </button>
                </div>

                {showAddressForm ? (
                  <form onSubmit={handleAddressSubmit(onAddressSubmit)} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium">
                      {editingAddress ? t('account.editAddress') : t('account.newAddress')}
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('checkout.fullName')} *
                        </label>
                        <input
                          type="text"
                          {...registerAddress('fullName', { required: t('validation.required') })}
                          className={`input ${addressErrors.fullName ? 'input-error' : ''}`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('checkout.phone')} *
                        </label>
                        <input
                          type="tel"
                          {...registerAddress('phone', { required: t('validation.required') })}
                          className={`input ${addressErrors.phone ? 'input-error' : ''}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.address')} *
                      </label>
                      <input
                        type="text"
                        {...registerAddress('address', { required: t('validation.required') })}
                        className={`input ${addressErrors.address ? 'input-error' : ''}`}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('checkout.city')} *
                        </label>
                        <input
                          type="text"
                          {...registerAddress('city', { required: t('validation.required') })}
                          className={`input ${addressErrors.city ? 'input-error' : ''}`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('checkout.state')} *
                        </label>
                        <select
                          {...registerAddress('state', { required: t('validation.required') })}
                          className={`input ${addressErrors.state ? 'input-error' : ''}`}
                        >
                          <option value="">{t('common.select')}</option>
                          <option value="Punjab">Punjab</option>
                          <option value="Sindh">Sindh</option>
                          <option value="KPK">KPK</option>
                          <option value="Balochistan">Balochistan</option>
                          <option value="Islamabad">Islamabad</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('checkout.postalCode')}
                        </label>
                        <input
                          type="text"
                          {...registerAddress('postalCode')}
                          className="input"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...registerAddress('isDefault')}
                        id="isDefault"
                        className="rounded border-gray-300 text-primary-600"
                      />
                      <label htmlFor="isDefault" className="text-sm text-gray-700">
                        {t('account.setAsDefault')}
                      </label>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddress(null);
                        }}
                        className="btn btn-outline"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={addAddressMutation.isPending || updateAddressMutation.isPending}
                        className="btn btn-primary"
                      >
                        {(addAddressMutation.isPending || updateAddressMutation.isPending) ? (
                          <Loader size="sm" />
                        ) : (
                          t('common.save')
                        )}
                      </button>
                    </div>
                  </form>
                ) : null}

                {addresses.length === 0 && !showAddressForm ? (
                  <p className="text-gray-500 text-center py-8">{t('account.noAddresses')}</p>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 ${address.isDefault ? 'border-primary-300 bg-primary-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{address.fullName}</p>
                              {address.isDefault && (
                                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">
                                  {t('account.default')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {address.address}, {address.city}, {address.state} {address.postalCode}
                            </p>
                            <p className="text-sm text-gray-600">{address.phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="p-2 text-gray-400 hover:text-primary-600"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address._id)}
                              className="p-2 text-gray-400 hover:text-red-600"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Account;
