import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { trafficApi } from '@/lib/api';
import { 
  Users, 
  Globe, 
  MapPin, 
  Clock, 
  ArrowUpRight,
  Loader2,
  RefreshCcw,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Traffic() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrafficData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const response = await trafficApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching traffic data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrafficData();
    // Auto refresh every 30 seconds for a "live" feel
    const interval = setInterval(() => fetchTrafficData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Traffic Analytics" subtitle="Monitor your website visitors">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const countryChartData = stats?.countryStats?.map(item => ({
    name: item._id,
    value: item.count
  })).slice(0, 6) || [];

  const regionChartData = stats?.regionStats?.map(item => ({
    name: `${item._id.region}, ${item._id.country}`,
    count: item.count
  })) || [];

  return (
    <AdminLayout 
      title="Traffic Analytics" 
      subtitle="Visitor insights and geographic distribution"
      actions={
        <button 
          onClick={() => fetchTrafficData(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          disabled={refreshing}
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Hits"
          value={stats?.totalVisitors?.toLocaleString() || '0'}
          icon={Activity}
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          title="Unique Visitors"
          value={stats?.uniqueVisitors?.toLocaleString() || '0'}
          icon={Users}
          iconBgColor="bg-success/10"
          iconColor="text-success"
        />
        <StatCard
          title="Countries"
          value={stats?.countryStats?.length || '0'}
          icon={Globe}
          iconBgColor="bg-info/10"
          iconColor="text-info"
        />
        <StatCard
          title="Recent (24h)"
          value={stats?.recentVisitors?.length || '0'}
          icon={Clock}
          iconBgColor="bg-warning/10"
          iconColor="text-warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Country Distribution */}
        <div className="stat-card lg:col-span-1">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Top Countries
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={countryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {countryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {countryChartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Region Distribution */}
        <div className="stat-card lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Top Regions / States
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionChartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={150} 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Visitors Table */}
      <div className="stat-card overflow-hidden">
        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Recent Activity
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">IP Address</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Country</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Region/City</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Path</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats?.recentVisitors?.map((visitor, idx) => (
                <tr key={idx} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{visitor.ip}</td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{visitor.country}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {visitor.region !== 'Unknown' ? `${visitor.region}, ${visitor.city}` : 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[200px]">
                    {visitor.path}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(visitor.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!stats?.recentVisitors || stats.recentVisitors.length === 0) && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                    No recent traffic recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
