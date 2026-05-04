import { Activity, BarChart3, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StatsData {
  totalLogins: number;
  chartData: { date: string; logins: number }[];
}

interface DeveloperStatsProps {
  stats: StatsData;
  activeClientsCount: number;
}

export function DeveloperStats({ stats, activeClientsCount }: DeveloperStatsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
       <div className="lg:col-span-1 glass-card p-6 rounded-2xl flex flex-col justify-center border border-white/5">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <Activity className="w-4 h-4 text-brand-primary" />
            <span className="text-xs uppercase font-bold tracking-wider">Total Active Clients</span>
          </div>
          <div className="text-4xl font-bold text-white mb-6">{activeClientsCount}</div>
          
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-xs uppercase font-bold tracking-wider">Logins (7 Days)</span>
          </div>
          <div className="text-4xl font-bold text-white">{stats.totalLogins}</div>
       </div>

       <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5 h-[200px]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 text-gray-400">
              <BarChart3 className="w-4 h-4 text-brand-primary" />
              <span className="text-xs uppercase font-bold tracking-wider">Usage Trend</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">LATEST 7 DAYS</span>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                />
                <Bar dataKey="logins" radius={[4, 4, 0, 0]}>
                  {stats.chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={0.6 + (index / stats.chartData.length) * 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
       </div>
    </div>
  );
}
