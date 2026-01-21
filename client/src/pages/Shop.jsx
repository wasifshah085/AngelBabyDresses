import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import ProductCard from '../components/product/ProductCard';
import { PageLoader } from '../components/common/Loader';
import { productsAPI } from '../services/api';

const Shop = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest'
  });

  const query = searchParams.get('q') || '';
  const filterType = searchParams.get('filter') || '';
  const categorySlug = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page')) || 1;

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', filters, query, filterType, categorySlug, page],
    queryFn: () => {
      if (query) {
        return productsAPI.search(query, { ...filters, page });
      }
      if (filterType === 'sale') {
        return productsAPI.getSale({ ...filters, page });
      }
      if (categorySlug) {
        return productsAPI.getByCategory(categorySlug, { ...filters, page });
      }
      return productsAPI.getAll({ ...filters, filter: filterType, page });
    }
  });

  const products = productsData?.data?.data || [];
  const pagination = productsData?.data?.pagination || {};

  const sortOptions = [
    { value: 'newest', label: t('common.newest') },
    { value: 'price_asc', label: t('common.priceAsc') },
    { value: 'price_desc', label: t('common.priceDesc') },
    { value: 'popular', label: t('common.popular') },
    { value: 'rating', label: t('common.rating') }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      sort: 'newest'
    });
    const params = new URLSearchParams();
    if (filterType) params.set('filter', filterType);
    if (query) params.set('q', query);
    setSearchParams(params);
  };

  const getPageTitle = () => {
    if (query) return `${t('common.search')}: "${query}"`;
    if (filterType === 'new') return t('common.newArrivals');
    if (filterType === 'sale') return t('common.sale');
    if (categorySlug) {
      // Show category name from products data if available
      const categoryName = productsData?.data?.category?.name?.en || categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return categoryName;
    }
    return t('common.products');
  };

  return (
    <>
      <Helmet>
        <title>{getPageTitle()} | Angel Baby Dresses</title>
      </Helmet>

      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900">
              {getPageTitle()}
            </h1>
            <p className="text-gray-500 mt-1">
              {pagination.total || 0} {t('common.products', { count: pagination.total })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden btn btn-outline btn-sm"
            >
              <FiFilter className="w-4 h-4 mr-2" />
              {t('common.filter')}
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="input py-2 pr-10 appearance-none cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className={`
            fixed inset-0 z-50 bg-white lg:static lg:z-0 lg:w-64 lg:shrink-0
            transform transition-transform lg:transform-none
            ${filtersOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="flex items-center justify-between p-4 border-b lg:hidden">
              <h2 className="font-heading font-semibold">{t('common.filter')}</h2>
              <button onClick={() => setFiltersOpen(false)}>
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 lg:p-0 space-y-6 overflow-y-auto max-h-[80vh] lg:max-h-none">
              {/* Price Range */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">{t('common.price')}</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="input py-2 w-24"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="input py-2 w-24"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="text-sm text-red-500 hover:text-red-600"
              >
                {t('common.clearFilters', { defaultValue: 'Clear Filters' })}
              </button>
            </div>
          </aside>

          {/* Mobile Overlay */}
          {filtersOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setFiltersOpen(false)}
            />
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <PageLoader />
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500">{t('common.noProducts', { defaultValue: 'No products found' })}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => {
                          const params = new URLSearchParams(searchParams);
                          params.set('page', pageNum.toString());
                          setSearchParams(params);
                        }}
                        className={`w-10 h-10 rounded-lg ${
                          pageNum === page
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Shop;
