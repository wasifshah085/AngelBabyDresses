import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import Loader from '../components/common/Loader';

const ResetPassword = () => {
  const { token } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const mutation = useMutation({
    mutationFn: (password) => authAPI.resetPassword(token, password),
    onSuccess: (response) => {
      toast.success(response.data?.message || t('auth.passwordResetSuccess'));
      navigate('/login');
    },
    onError: (error) => {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;

      if (errorCode === 'TOKEN_EXPIRED') {
        setIsTokenExpired(true);
      } else if (errorCode === 'TOKEN_INVALID') {
        setIsTokenInvalid(true);
      } else {
        toast.error(errorMessage || t('messages.error'));
      }
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data.password);
  };

  // Show expired token message
  if (isTokenExpired) {
    return (
      <>
        <Helmet>
          <title>Link Expired | Angel Baby Dresses</title>
        </Helmet>

        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-100 flex items-center justify-center">
              <FiAlertCircle className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Reset Link Expired
            </h1>
            <p className="text-gray-600 mb-8">
              This password reset link has expired for your security.
              Don't worry, you can request a new one!
            </p>
            <div className="space-y-3">
              <Link to="/forgot-password" className="btn btn-primary w-full">
                Request New Reset Link
              </Link>
              <Link to="/login" className="btn btn-outline w-full">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show invalid token message
  if (isTokenInvalid) {
    return (
      <>
        <Helmet>
          <title>Invalid Link | Angel Baby Dresses</title>
        </Helmet>

        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <FiAlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Invalid Reset Link
            </h1>
            <p className="text-gray-600 mb-8">
              This password reset link is not valid. It may have already been used
              or the link is incorrect. Please request a new password reset.
            </p>
            <div className="space-y-3">
              <Link to="/forgot-password" className="btn btn-primary w-full">
                Request New Reset Link
              </Link>
              <Link to="/login" className="btn btn-outline w-full">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create New Password | Angel Baby Dresses</title>
      </Helmet>

      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
              <FiLock className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              Create New Password
            </h1>
            <p className="text-gray-600 mt-2">
              Please enter a new password for your Angel Baby Dresses account.
              Make sure it's at least 6 characters long.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Please enter a new password',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className={`input pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your new password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  className={`input pl-12 pr-12 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary w-full"
            >
              {mutation.isPending ? <Loader size="sm" /> : (
                <>
                  <FiCheck className="w-5 h-5 mr-2" />
                  Set New Password
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Remember your password?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
