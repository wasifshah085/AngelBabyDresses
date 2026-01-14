import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiSearch, FiMail, FiPhone, FiShoppingBag, FiCalendar } from 'react-icons/fi';
import { managementAPI } from '../../services/api';
import { useLanguageStore } from '../../store/useStore';
import { PageLoader } from '../../components/common/Loader';

const Customers = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', page, search],
    queryFn: () => managementAPI.getCustomers({ page, search })
  });

  const customers = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{t('admin.customers')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          {t('admin.customers')}
        </h1>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.searchCustomers')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.customer')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.contact')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.orders')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.totalSpent')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.joined')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="font-medium text-primary-600">
                            {customer.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            customer.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {customer.role}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-gray-600 flex items-center gap-2">
                          <FiMail className="w-4 h-4 text-gray-400" />
                          {customer.email}
                        </p>
                        {customer.phone && (
                          <p className="text-gray-600 flex items-center gap-2">
                            <FiPhone className="w-4 h-4 text-gray-400" />
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiShoppingBag className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{customer.orderCount || 0}</span>
                        <span>{t('admin.orders')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        Rs. {(customer.totalSpent || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiCalendar className="w-4 h-4 text-gray-400" />
                        {new Date(customer.createdAt).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {customers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {t('admin.noCustomersFound')}
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
    </>
  );
};

export default Customers;
