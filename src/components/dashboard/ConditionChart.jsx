import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  'Mint': 'hsl(142, 71%, 45%)',
  'Perfect': 'hsl(142, 71%, 45%)',
  'Good': 'hsl(173, 58%, 39%)',
  'Fair': 'hsl(38, 92%, 50%)',
  'Poor': 'hsl(0, 72%, 51%)',
};

const DEFAULT_COLOR = 'hsl(215, 16%, 47%)';

export function ConditionChart({ data = [] }) {
  // If no data, show a message or empty state
  const hasData = data && data.length > 0;

  // Process data to add colors
  const chartData = data.map(item => ({
    ...item,
    color: COLORS[item.name] || DEFAULT_COLOR
  }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="stat-card">
      <h3 className="text-lg font-semibold text-foreground mb-6">Condition Breakdown</h3>
      <div className="h-72">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg">
            No condition data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)'
                }}
                formatter={(value, name) => {
                  const percentage = ((value / total) * 100).toFixed(1);
                  return [`${value} (${percentage}%)`, name];
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
