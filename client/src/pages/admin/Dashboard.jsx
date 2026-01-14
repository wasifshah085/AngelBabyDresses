import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  FiPackage,
  FiShoppingCart,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle,
  FiEdit3
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { managementAPI } from '../../services/api';
import { PageLoader } from '../../components/common/Loader';

const COLORS = ['#FFC0CB', '#FF69B4', '#FFB6C1', '#FF1493', '#DB7093'];

const Dashboard = () => {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => managementAPI.getDashboard()
  });

  const dashboard = data?.data?.data;

  if (isLoading) return <PageLoader />;

  const stats = [
    {
      label: t('admin.totalRevenue'),
      value: `Rs. ${dashboard?.revenue?.total?.toLocaleString() || 0}`,
      icon: FiDollarSign,
      color: 'bg-green-100 text-green-600',
      change: dashboard?.revenue?.change
    },
    {
      label: t('admin.totalOrders'),
      value: dashboard?.orders?.total || 0,
      icon: FiShoppingCart,
      color: 'bg-blue-100 text-blue-600',
      change: dashboard?.orders?.change
    },
    {
      label: t('admin.totalProducts'),
      value: dashboard?.products?.total || 0,
      icon: FiPackage,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      label: t('admin.totalCustomers'),
      value: dashboard?.customers?.total || 0,
      icon: FiUsers,
      color: 'bg-orange-100 text-orange-600',
      change: dashboard?.customers?.change
    }
  ];

  return (
    <>
      <Helmet>
        <title>{t('admin.dashboard')} | Angel Baby Dresses</title>
      </Helmet>

      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          {t('admin.dashboard')}
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                {stat.change !== undefined && (
                  <span className={`text-sm font-medium flex items-center gap-1 ${
                    stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <FiTrendingUp className={stat.change < 0 ? 'rotate-180' : ''} />
                    {Math.abs(stat.change)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-heading font-semibold text-gray-900 mb-6">
              {t('admin.revenueOverview')}
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard?.revenueChart || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#FF69B4"
                    strokeWidth={2}
                    dot={{ fill: '#FF69B4' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-heading font-semibold text-gray-900 mb-6">
              {t('admin.ordersByStatus')}
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboard?.ordersByStatus || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {(dashboard?.ordersByStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {(dashboard?.ordersByStatus || []).map((status, index) => (
                <div key={status._id} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="capitalize">{status._id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-gray-900">
                {t('admin.recentOrders')}
              </h2>
              <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                {t('common.viewAll')}
              </Link>
            </div>
            <div className="space-y-4">
              {(dashboard?.recentOrders || []).slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between pb-4 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.user?.name || 'Guest'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">Rs. {order.total?.toLocaleString()}</p>
                    <p className={`text-xs font-medium capitalize px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts & Actions */}
          <div className="space-y-6">
            {/* Low Stock Alert */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <FiAlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-gray-900">
                    {t('admin.lowStockAlert')}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {dashboard?.lowStockProducts?.length || 0} {t('admin.productsLowStock')}
                  </p>
                </div>
              </div>
              {(dashboard?.lowStockProducts || []).slice(0, 3).map((product) => (
                <div key={product._id} className="flex items-center justify-between py-2">
                  <span className="text-gray-700">{product.name?.en}</span>
                  <span className="text-red-600 font-medium">{product.stock} left</span>
                </div>
              ))}
              {(dashboard?.lowStockProducts?.length || 0) > 3 && (
                <Link to="/admin/products?filter=low-stock" className="text-primary-600 text-sm font-medium mt-2 block">
                  {t('common.viewAll')}
                </Link>
              )}
            </div>

            {/* Pending Custom Designs */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FiEdit3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-gray-900">
                    {t('admin.pendingDesigns')}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {dashboard?.pendingDesigns || 0} {t('admin.designsWaiting')}
                  </p>
                </div>
              </div>
              <Link to="/admin/custom-designs" className="btn btn-outline btn-sm w-full">
                {t('admin.viewDesigns')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
