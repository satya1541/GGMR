import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '12:00', uv: 590, pv: 800, amt: 1400 },
  { name: '13:00', uv: 868, pv: 967, amt: 1506 },
  { name: '14:00', uv: 1397, pv: 1098, amt: 989 },
  { name: '15:00', uv: 1480, pv: 1200, amt: 1228 },
  { name: '16:00', uv: 1520, pv: 1108, amt: 1100 },
  { name: '17:00', uv: 1400, pv: 680, amt: 1700 },
];

export function SignalDistributionChart() {
  return (
    <div className="glass-card p-6 rounded-2xl h-full flex flex-col">
      <h3 className="text-lg font-bold text-white mb-6">Signal Distribution</h3>
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
            <YAxis stroke="rgba(255,255,255,0.3)" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                borderColor: 'rgba(255,255,255,0.1)', 
                borderRadius: '12px' 
              }}
            />
            <Area type="monotone" dataKey="amt" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" />
            <Bar dataKey="pv" barSize={20} fill="rgba(139, 92, 246, 0.6)" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="uv" stroke="#f59e0b" strokeWidth={2} dot={{fill: '#f59e0b'}} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
