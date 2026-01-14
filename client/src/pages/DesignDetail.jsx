import { useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useDropzone } from 'react-dropzone';
import { FiArrowLeft, FiSend, FiImage, FiX, FiCheck, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { customDesignAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';
import { PageLoader } from '../components/common/Loader';
import Loader from '../components/common/Loader';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  quoted: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const DesignDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['design', id],
    queryFn: () => customDesignAPI.getById(id)
  });

  const design = data?.data?.data;

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setAttachments(prev => [...prev, ...newFiles].slice(0, 3));
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 3,
    maxSize: 5 * 1024 * 1024
  });

  const messageMutation = useMutation({
    mutationFn: (data) => customDesignAPI.addMessage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['design', id]);
      setMessage('');
      setAttachments([]);
      setSending(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
      setSending(false);
    }
  });

  const acceptMutation = useMutation({
    mutationFn: () => customDesignAPI.acceptQuote(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['design', id]);
      toast.success(t('customDesign.quoteAccepted'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => customDesignAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['design', id]);
      toast.success(t('customDesign.designCancelled'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const handleSendMessage = () => {
    if (!message.trim() && attachments.length === 0) return;
    setSending(true);
    messageMutation.mutate({
      message: message.trim(),
      attachments: attachments.map(a => a.file)
    });
  };

  if (isLoading) return <PageLoader />;

  if (!design) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-xl font-medium text-gray-900 mb-4">
          {t('customDesign.notFound')}
        </h2>
        <Link to="/my-designs" className="btn btn-primary">
          {t('customDesign.backToDesigns')}
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('customDesign.designDetails')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="container py-8">
        <Link
          to="/my-designs"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft />
          {t('customDesign.backToDesigns')}
        </Link>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Design Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-heading font-bold text-gray-900">
                  {t('customDesign.designId')}: #{design._id.slice(-6).toUpperCase()}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[design.status]}`}>
                  {t(`customDesign.status.${design.status}`)}
                </span>
              </div>

              {/* Design Images */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {design.images?.map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={`Design ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(image.url, '_blank')}
                  />
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {t('customDesign.description')}
                  </h3>
                  <p className="text-gray-900">{design.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      {t('common.size')}
                    </h3>
                    <p className="text-gray-900">{design.size}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      {t('common.quantity')}
                    </h3>
                    <p className="text-gray-900">{design.quantity}</p>
                  </div>
                </div>

                {design.preferredColors && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      {t('customDesign.preferredColors')}
                    </h3>
                    <p className="text-gray-900">{design.preferredColors}</p>
                  </div>
                )}

                {design.fabricPreference && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      {t('customDesign.fabricPreference')}
                    </h3>
                    <p className="text-gray-900 capitalize">{design.fabricPreference}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Conversation */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-heading font-semibold text-gray-900 mb-4">
                {t('customDesign.conversation')}
              </h2>

              {/* Messages */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {design.conversation?.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    {t('customDesign.noMessages')}
                  </p>
                ) : (
                  design.conversation?.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-xl p-4 ${
                        msg.sender === 'customer'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="mb-2">{msg.message}</p>
                        {msg.attachments?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {msg.attachments.map((att, i) => (
                              <img
                                key={i}
                                src={att.url}
                                alt=""
                                className="w-16 h-16 object-cover rounded cursor-pointer"
                                onClick={() => window.open(att.url, '_blank')}
                              />
                            ))}
                          </div>
                        )}
                        <p className={`text-xs mt-2 ${
                          msg.sender === 'customer' ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {new Date(msg.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              {!['completed', 'cancelled'].includes(design.status) && (
                <div className="border-t pt-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t('customDesign.typeMessage')}
                        className="input resize-none"
                        rows={2}
                      />
                      {attachments.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {attachments.map((att, index) => (
                            <div key={index} className="relative">
                              <img
                                src={att.preview}
                                alt=""
                                className="w-12 h-12 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div {...getRootProps()}>
                        <input {...getInputProps()} />
                        <button type="button" className="btn btn-outline px-3">
                          <FiImage className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={sending || (!message.trim() && attachments.length === 0)}
                        className="btn btn-primary px-3"
                      >
                        {sending ? <Loader size="sm" /> : <FiSend className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="mt-6 lg:mt-0">
            <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
              {/* Quote Info */}
              {design.quotedPrice && (
                <div className="mb-6 pb-6 border-b">
                  <h3 className="font-heading font-semibold text-gray-900 mb-3">
                    {t('customDesign.quote')}
                  </h3>
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    Rs. {design.quotedPrice.toLocaleString()}
                  </div>
                  {design.estimatedDays && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FiClock className="w-4 h-4" />
                      {t('customDesign.estimatedDays', { days: design.estimatedDays })}
                    </p>
                  )}

                  {design.status === 'quoted' && (
                    <button
                      onClick={() => {
                        if (window.confirm(t('customDesign.confirmAccept'))) {
                          acceptMutation.mutate();
                        }
                      }}
                      disabled={acceptMutation.isPending}
                      className="btn btn-primary w-full mt-4"
                    >
                      {acceptMutation.isPending ? (
                        <Loader size="sm" />
                      ) : (
                        <>
                          <FiCheck className="w-5 h-5 mr-2" />
                          {t('customDesign.acceptQuote')}
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Design Details */}
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('customDesign.designType')}</span>
                  <span className="font-medium capitalize">{design.designType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common.createdAt')}</span>
                  <span className="font-medium">
                    {new Date(design.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {design.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('common.updatedAt')}</span>
                    <span className="font-medium">
                      {new Date(design.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Cancel Button */}
              {['pending', 'reviewing'].includes(design.status) && (
                <button
                  onClick={() => {
                    if (window.confirm(t('customDesign.confirmCancel'))) {
                      cancelMutation.mutate();
                    }
                  }}
                  disabled={cancelMutation.isPending}
                  className="btn btn-outline w-full mt-6 text-red-500 border-red-300 hover:bg-red-50"
                >
                  {cancelMutation.isPending ? <Loader size="sm" /> : t('customDesign.cancelDesign')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DesignDetail;
