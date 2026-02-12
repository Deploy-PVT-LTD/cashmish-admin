import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SubmissionsChart } from '@/components/dashboard/SubmissionsChart';
import { BrandChart } from '@/components/dashboard/BrandChart';
import { ConditionChart } from '@/components/dashboard/ConditionChart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Smartphone, DollarSign } from 'lucide-react';

const revenueData = [
  { name: 'Jan', revenue: 12000 },
  { name: 'Feb', revenue: 14500 },
  { name: 'Mar', revenue: 16800 },
  { name: 'Apr', revenue: 15200 },
  { name: 'May', revenue: 18900 },
  { name: 'Jun', revenue: 21000 },
  { name: 'Jul', revenue: 23500 },
];

export default function Analytics() {
  return (
    <AdminLayout title="Analytics" subtitle="Business performance insights">
      {/* Filter */}
      <div className="flex justify-end mb-6">
        <Select defaultValue="7d">
          <SelectTrigger className="w-full sm:w-40 bg-card">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          title="Conversion Rate"
          value="68.5%"
          change={5.2}
          icon={TrendingUp}
          iconBgColor="bg-success/10"
          iconColor="text-success"
        />
        <StatCard
          title="Active Users"
          value="1,248"
          change={12.8}
          icon={Users}
          iconBgColor="bg-info/10"
          iconColor="text-info"
        />
        <StatCard
          title="Avg. Processing Time"
          value="2.4 days"
          change={-15.3}
          icon={Smartphone}
          iconBgColor="bg-warning/10"
          iconColor="text-warning"
        />
        <StatCard
          title="Avg. Deal Value"
          value="$425"
          change={8.7}
          icon={DollarSign}
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
        />
      </div>

      {/* Revenue Chart */}
      <div className="stat-card mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Revenue Trend</h3>
        <div className="h-60 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                }}
                formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="lg:col-span-2">
          <SubmissionsChart />
        </div>
        <ConditionChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <BrandChart />
        
        {/* Top Performers */}
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-foreground mb-6">Top Selling Models</h3>
          <div className="space-y-3 sm:space-y-4">
            {[
              { model: 'iPhone 14 Pro Max', count: 156, revenue: '$142K' },
              { model: 'Samsung S24 Ultra', count: 128, revenue: '$125K' },
              { model: 'iPhone 15 Pro', count: 98, revenue: '$118K' },
              { model: 'iPhone 13', count: 87, revenue: '$52K' },
              { model: 'OnePlus 12', count: 65, revenue: '$42K' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground truncate">{item.model}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-foreground">{item.revenue}</p>
                  <p className="text-xs text-muted-foreground">{item.count} units</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
