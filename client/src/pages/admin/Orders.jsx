import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiSearch, FiFilter, FiEye, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { managementAPI } from '../../services/api';
import { useLanguageStore } from '../../store/useStore';
import { PageLoader } from '../../components/common/Loader';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const paymentStatusColors = {
  pending_advance: 'bg-gray-100 text-gray-700',
  advance_submitted: 'bg-orange-100 text-orange-700',
  advance_approved: 'bg-blue-100 text-blue-700',
  pending_final: 'bg-yellow-100 text-yellow-700',
  final_submitted: 'bg-orange-100 text-orange-700',
  fully_paid: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

const paymentStatusLabels = {
  pending_advance: 'Awaiting Advance',
  advance_submitted: 'Review Advance',
  advance_approved: 'Advance Paid',
  pending_final: 'Awaiting Final',
  final_submitted: 'Review Final',
  fully_paid: 'Fully Paid',
  rejected: 'Rejected'
};

const Orders = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, search, statusFilter, paymentFilter],
    queryFn: () => managementAPI.getOrders({
      page,
      search,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined
    })
  });

  const orders = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{t('admin.orders')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          {t('admin.orders')}
        </h1>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('admin.searchOrders')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">{t('admin.allOrders')}</option>
                <option value="pending">{t('orders.status.pending')}</option>
                <option value="confirmed">{t('orders.status.confirmed')}</option>
                <option value="processing">{t('orders.status.processing')}</option>
                <option value="shipped">{t('orders.status.shipped')}</option>
                <option value="delivered">{t('orders.status.delivered')}</option>
                <option value="cancelled">{t('orders.status.cancelled')}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Payments</option>
                <option value="needs_review">⚠️ Needs Review</option>
                <option value="pending_advance">Awaiting Advance</option>
                <option value="advance_approved">Advance Paid</option>
                <option value="pending_final">Awaiting Final</option>
                <option value="fully_paid">Fully Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('orders.orderNumber')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.customer')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('orders.items')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('orders.total')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.status')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    {t('admin.date')}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                    {t('admin.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{order.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{order.user?.name || order.shippingAddress?.fullName}</p>
                        <p className="text-sm text-gray-500">{order.shippingAddress?.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">Rs. {order.total?.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium rounded-full px-3 py-1 ${statusColors[order.status]}`}>
                        {t(`orders.status.${order.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {(order.advancePayment?.status === 'submitted' || order.finalPayment?.status === 'submitted') && (
                          <FiAlertCircle className="w-4 h-4 text-orange-500" />
                        )}
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                          {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/orders/${order._id}`}
                        className={`p-2 hover:bg-gray-100 rounded-lg inline-flex ${
                          (order.advancePayment?.status === 'submitted' || order.finalPayment?.status === 'submitted')
                            ? 'text-orange-500 hover:text-orange-600 bg-orange-50'
                            : 'text-gray-600 hover:text-primary-600'
                        }`}
                      >
                        <FiEye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {t('admin.noOrdersFound')}
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

export default Orders;
