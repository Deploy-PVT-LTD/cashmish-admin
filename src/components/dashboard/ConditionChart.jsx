import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
  { name: 'Perfect', value: 35, color: 'hsl(142, 71%, 45%)' },
  { name: 'Good', value: 28, color: 'hsl(173, 58%, 39%)' },
  { name: 'Fair', value: 22, color: 'hsl(38, 92%, 50%)' },
  { name: 'Poor', value: 15, color: 'hsl(0, 72%, 51%)' },
];

export function ConditionChart() {
  return (
    <div className="stat-card">
      <h3 className="text-lg font-semibold text-foreground mb-6">Condition Breakdown</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
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
              formatter={(value) => [`${value}%`, 'Percentage']}
            />
            <Legend 
              verticalAlign="bottom"
              iconType="circle"
              iconSize={10}
              formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
