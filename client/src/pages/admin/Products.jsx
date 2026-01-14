import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiMaximize2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { managementAPI } from '../../services/api';
import { useLanguageStore } from '../../store/useStore';
import { PageLoader } from '../../components/common/Loader';
import ImageLightbox from '../../components/common/ImageLightbox';

const Products = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search, filter],
    queryFn: () => managementAPI.getProducts({ page, search, filter, limit: 10 })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => managementAPI.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success(t('admin.productDeleted'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.error'));
    }
  });

  const products = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const handleDelete = (product) => {
    if (window.confirm(t('admin.confirmDeleteProduct', { name: product.name?.[language] || product.name?.en }))) {
      deleteMutation.mutate(product._id);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{t('admin.products')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            {t('admin.products')}
          </h1>
          <Link to="/admin/products/new" className="btn btn-primary">
            <FiPlus className="w-5 h-5 mr-2" />
            {t('admin.addProduct')}
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('admin.searchProducts')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input"
              >
                <option value="all">{t('admin.allProducts')}</option>
                <option value="active">{t('admin.active')}</option>
                <option value="inactive">{t('admin.inactive')}</option>
                <option value="low-stock">{t('admin.lowStock')}</option>
                <option value="featured">{t('admin.featured')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.product')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.category')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.price')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.stock')}
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
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          <img
                            src={product.images?.[0]?.url || 'https://placehold.co/100x100/FFC0CB/333?text=No+Image'}
                            alt={product.name?.[language] || product.name?.en}
                            className="w-12 h-12 object-cover rounded-lg cursor-pointer"
                            onClick={() => {
                              if (product.images?.length > 0) {
                                setLightboxImages(product.images);
                                setLightboxOpen(true);
                              }
                            }}
                          />
                          {product.images?.length > 0 && (
                            <button
                              onClick={() => {
                                setLightboxImages(product.images);
                                setLightboxOpen(true);
                              }}
                              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FiMaximize2 className="w-4 h-4 text-white" />
                            </button>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {product.name?.[language] || product.name?.en}
                          </p>
                          <p className="text-sm text-gray-500">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {product.category?.name?.[language] || product.category?.name?.en}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          Rs. {product.salePrice?.toLocaleString() || product.price?.toLocaleString()}
                        </p>
                        {product.salePrice && (
                          <p className="text-sm text-gray-400 line-through">
                            Rs. {product.price?.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${
                        product.stock <= 5 ? 'text-red-600' :
                        product.stock <= 20 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.isActive ? t('admin.active') : t('admin.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/products/${product._id}`}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-primary-600"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product)}
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

          {products.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {t('admin.noProductsFound')}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-gray-500">
                {t('admin.showingPage', { page: pagination.page, total: pagination.pages })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-outline btn-sm"
                >
                  {t('common.previous')}
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="btn btn-outline btn-sm"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={0}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

export default Products;
