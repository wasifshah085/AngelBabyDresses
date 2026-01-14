import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { FiMail, FiArrowLeft, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import Loader from '../components/common/Loader';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const mutation = useMutation({
    mutationFn: (email) => authAPI.forgotPassword(email),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data.email);
  };

  if (submitted) {
    return (
      <>
        <Helmet>
          <title>{t('auth.checkEmail')} | Angel Baby Dresses</title>
        </Helmet>

        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <FiCheck className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              {t('auth.checkEmail')}
            </h1>
            <p className="text-gray-600 mb-8">
              {t('auth.resetEmailSent')}
            </p>
            <Link to="/login" className="btn btn-primary">
              <FiArrowLeft className="w-5 h-5 mr-2" />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('auth.forgotPassword')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              {t('auth.forgotPassword')}
            </h1>
            <p className="text-gray-600 mt-2">{t('auth.forgotPasswordDesc')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  {...register('email', {
                    required: t('validation.required'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('validation.email')
                    }
                  })}
                  className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
                  placeholder="email@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary w-full"
            >
              {mutation.isPending ? <Loader size="sm" /> : t('auth.sendResetLink')}
            </button>
          </form>

          <p className="text-center mt-6">
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              {t('auth.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
