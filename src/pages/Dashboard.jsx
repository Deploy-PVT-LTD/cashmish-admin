import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SubmissionsChart } from '@/components/dashboard/SubmissionsChart';
import { BrandChart } from '@/components/dashboard/BrandChart';
import { ConditionChart } from '@/components/dashboard/ConditionChart';
import { RecentSubmissions } from '@/components/dashboard/RecentSubmissions';
import api, { formApi, authApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Users,
  Banknote,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingOrders: 0,
    acceptedDeals: 0,
    rejectedDeals: 0,
    totalRevenue: 0,
    totalUsers: 0,
    chartData: [],
    brandData: [],
    conditionData: [],
    recentSubmissions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await formApi.getStats();

        // Ensure data exists before setting state
        if (data) {
          setStats({
            totalSubmissions: data.totalSubmissions || 0,
            pendingOrders: data.pendingOrders || 0,
            acceptedDeals: data.acceptedDeals || 0,
            rejectedDeals: data.rejectedDeals || 0,
            totalPurchase: data.totalPurchase || 0,
            totalSale: data.totalSale || 0,
            totalUsers: data.totalUsers || 0,
            chartData: data.chartData || [],
            brandData: data.brandData || [],
            conditionData: data.conditionData || [],
            recentSubmissions: data.recentSubmissions || [],
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };
  const formatPakCurrency = (value) => {
    if (value >= 1000) {
      return `Rs${(value / 1000).toFixed(0)}K`;
    }
    return `Rs${value}`;
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Welcome back, Admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back, Admin">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <StatCard
          title="Total Submissions"
          value={stats.totalSubmissions.toLocaleString()}
          icon={FileText}
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders.toString()}
          icon={Clock}
          iconBgColor="bg-warning/10"
          iconColor="text-warning"
        />
        <StatCard
          title="Bids Placed"
          value={stats.acceptedDeals.toString()}
          icon={CheckCircle}
          iconBgColor="bg-success/10"
          iconColor="text-success"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toString()}
          icon={Users}
          iconBgColor="bg-info/10"
          iconColor="text-info"
        />
        <StatCard
          title="Total Purchase"
          value={formatCurrency(stats.totalPurchase)}
          icon={DollarSign}
          iconBgColor="bg-accent"
          iconColor="text-accent-foreground"
        />
        <StatCard
          title="Total Sale"
          value={formatPakCurrency(stats.totalSale)}
          icon={Banknote}
          iconBgColor="bg-accent/5"
          iconColor="text-accent-foreground"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="lg:col-span-2">
          <SubmissionsChart data={stats.chartData} />
        </div>
        <ConditionChart data={stats.conditionData} />
      </div>

      {/* Brand Chart & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <BrandChart data={stats.brandData} />
        <RecentSubmissions submissions={stats.recentSubmissions} />
      </div>
    </AdminLayout>
  );
}
