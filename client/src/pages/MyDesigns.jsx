import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiEdit3, FiEye, FiChevronRight, FiPlus, FiClock } from 'react-icons/fi';
import { customDesignAPI } from '../services/api';
import { PageLoader } from '../components/common/Loader';
import { getImageUrl } from '../utils/imageUrl';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  quoted: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  awaitingVerification: 'bg-orange-100 text-orange-800'
};

const MyDesigns = () => {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['my-designs'],
    queryFn: () => customDesignAPI.getMyDesigns()
  });

  const designs = data?.data?.data || [];

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{t('customDesign.myDesigns')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900">
            {t('customDesign.myDesigns')}
          </h1>
          <Link to="/custom-design" className="btn btn-primary">
            <FiPlus className="w-5 h-5 mr-2" />
            {t('customDesign.newDesign')}
          </Link>
        </div>

        {designs.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <FiEdit3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              {t('customDesign.noDesigns')}
            </h2>
            <p className="text-gray-500 mb-6">{t('customDesign.noDesignsMessage')}</p>
            <Link to="/custom-design" className="btn btn-primary">
              {t('customDesign.createFirst')}
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <Link
                key={design._id}
                to={`/my-designs/${design._id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Design Image */}
                <div className="aspect-video bg-gray-100 relative">
                  {design.uploadedImages?.[0]?.url ? (
                    <img
                      src={getImageUrl(design.uploadedImages[0].url)}
                      alt={t('customDesign.designImage')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiEdit3 className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${statusColors[design.status]}`}>
                    {t(`customDesign.status.${design.status}`)}
                  </span>
                </div>

                {/* Design Info */}
                <div className="p-4">
                  <p className="text-sm text-gray-500 mb-2">
                    {t('customDesign.designId')}: #{design._id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-gray-700 line-clamp-2 mb-3">
                    {design.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-500">
                      <span>{t('common.size')}: {design.size}</span>
                      <span className="mx-2">|</span>
                      <span>{t('common.quantity')}: {design.quantity}</span>
                    </div>
                  </div>

                  {design.quotedPrice && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">{t('customDesign.quotedPrice')}</span>
                        <span className="font-heading font-bold text-primary-600">
                          Rs. {design.quotedPrice.toLocaleString()}
                        </span>
                      </div>
                      {design.estimatedDays && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <FiClock className="w-4 h-4" />
                          <span>{t('customDesign.estimatedDaysValue', { days: design.estimatedDays }) || `Estimated: ${design.estimatedDays} days`}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-primary-600 group-hover:text-primary-700">
                    <span className="flex items-center gap-1 font-medium">
                      <FiEye className="w-4 h-4" />
                      {t('common.viewDetails')}
                    </span>
                    <FiChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyDesigns;
