import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Reading } from '@shared/schema';

interface SystemMetricsChartProps {
  readings: Reading[];
}

export function SystemMetricsChart({ readings }: SystemMetricsChartProps) {
  // Aggregate data: Count readings per hour for the last 12 hours
  const now = new Date();
  const hourlyData = Array.from({ length: 6 }, (_, i) => {
    const hour = new Date(now.getTime() - (5 - i) * 4 * 60 * 60 * 1000);
    const label = hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const count = readings.filter(r => {
      const rt = new Date(r.timestamp!);
      return rt > new Date(hour.getTime() - 4 * 60 * 60 * 1000) && rt <= hour;
    }).length;

    return { name: label, count };
  });

  return (
    <div className="glass-card p-6 rounded-2xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Data Frequency</h3>
        <span className="text-xs font-mono text-emerald-400 font-bold">LIVE TELEMETRY</span>
      </div>

      <div className="flex-1 w-full min-h-[200px]">
        {readings.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.3)"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px'
                }}
              />
              <Bar
                dataKey="count"
                name="Readings"
                fill="url(#barGradient)"
                radius={[6, 6, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
            Waiting for device activity...
          </div>
        )}
      </div>
    </div>
  );
}
