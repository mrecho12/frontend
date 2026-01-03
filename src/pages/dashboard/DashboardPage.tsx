import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  UserCheck, 
  Receipt, 
  FileBarChart, 
  CreditCard, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface DashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalReceipts: number;
  totalChallans: number;
  totalTransactions: number;
  monthlyRevenue: number;
  pendingApprovals: number;
  activeSubscriptions: number;
}

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentStore } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', currentStore?.id],
    queryFn: () => apiService.getDashboardStats(),
    enabled: !!currentStore,
  });

  const statsCards = [
    {
      title: t('navigation.users'),
      value: stats?.DDMS_data?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: t('navigation.customers'),
      value: stats?.DDMS_data?.totalCustomers || 0,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: t('navigation.receipts'),
      value: stats?.DDMS_data?.totalReceipts || 0,
      icon: Receipt,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: t('navigation.challans'),
      value: stats?.DDMS_data?.totalChallans || 0,
      icon: FileBarChart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: t('navigation.transactions'),
      value: stats?.DDMS_data?.totalTransactions || 0,
      icon: CreditCard,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats?.DDMS_data?.monthlyRevenue?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Pending Approvals',
      value: stats?.DDMS_data?.pendingApprovals || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Active Subscriptions',
      value: stats?.DDMS_data?.activeSubscriptions || 0,
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-secondary-200 rounded-lg"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-secondary-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome to {currentStore?.name || 'Daanoday'}
        </h1>
        <p className="text-primary-100">
          Manage your temple donations and operations efficiently
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Receipts</CardTitle>
          </CardHeader>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-secondary-100 last:border-0">
                  <div>
                    <p className="font-medium text-secondary-900">Receipt #{1000 + i}</p>
                    <p className="text-sm text-secondary-600">Customer Name</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-secondary-900">₹{(i * 500).toLocaleString()}</p>
                    <p className="text-sm text-green-600">Paid</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-secondary-100 last:border-0">
                  <div>
                    <p className="font-medium text-secondary-900">Receipt #{2000 + i}</p>
                    <p className="text-sm text-secondary-600">Awaiting approval</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-secondary-900">₹{(i * 750).toLocaleString()}</p>
                    <p className="text-sm text-orange-600">Pending</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};