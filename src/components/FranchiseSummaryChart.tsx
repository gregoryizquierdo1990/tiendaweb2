import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { FranchiseTenant, FranchiseTopupReport } from '../types';

interface FranchiseSummaryChartProps {
  franchises: FranchiseTenant[];
  topups: FranchiseTopupReport[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const FranchiseSummaryChart: React.FC<FranchiseSummaryChartProps> = ({ franchises, topups }) => {
  const activeFranchises = useMemo(() => franchises.filter(f => f.status === 'active'), [franchises]);

  const chartData = useMemo(() => {
    return activeFranchises.map(franchise => {
      // Calculate total approved topups as "Sales" proxy
      const totalSales = topups
        .filter(t => t.franchiseId === franchise.id && t.status === 'approved')
        .reduce((sum, t) => sum + t.amountUsd, 0);

      return {
        name: franchise.businessName,
        sales: totalSales,
        balance: franchise.availableMasterBalanceUsd,
      };
    });
  }, [activeFranchises, topups]);

  if (activeFranchises.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
        <p className="text-slate-500 text-sm">No hay franquicias activas para mostrar estadísticas.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Distribution of Sales (Pie Chart) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Distribución de Ventas (Topups Aprobados)
        </h4>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="sales"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, 'Ventas']}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accumulated Balances (Bar Chart) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Saldos Acumulados Master
        </h4>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, 'Saldo Master']}
              />
              <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-bar-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
