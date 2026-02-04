import React, { useMemo } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, ArcElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { DollarSign, TrendingUp, RefreshCcw, ShoppingCart } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const AdminAnalytics = ({ orders = [] }) => {
  
  // --- 1. LOGIC PROCESSING ---
  const { monthlySales, statusCounts, kpis } = useMemo(() => {
    const mSales = {};
    const sCounts = {};
    let totalRev = 0;
    let returnedCount = 0;

    orders.forEach(order => {
      // 1. Sales Over Time (Monthly)
      if (order.order_status !== 'Cancelled' && order.order_status !== 'Returned') {
        // Parse date from "YYYY-MM-DD" string provided by AdminDashboard
        const dateObj = new Date(order.order_date); 
        const key = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        mSales[key] = (mSales[key] || 0) + Number(order.order_total_amount);
        totalRev += Number(order.order_total_amount);
      }

      // 2. Orders by Status
      sCounts[order.order_status] = (sCounts[order.order_status] || 0) + 1;

      // Track returns
      if (order.order_status === 'Returned') returnedCount++;
    });

    // KPI Calculations
    const avgOrderValue = orders.length > 0 ? (totalRev / orders.length) : 0;
    const returnRate = orders.length > 0 ? ((returnedCount / orders.length) * 100).toFixed(1) : 0;

    return { 
      monthlySales: mSales, 
      statusCounts: sCounts,
      kpis: { totalRev, avgOrderValue, returnRate, returnedCount }
    };
  }, [orders]);

  // Chart Data Preparation
  const salesLabels = Object.keys(monthlySales);
  const salesData = Object.values(monthlySales);
  const statusLabels = Object.keys(statusCounts);
  const statusData = Object.values(statusCounts);

  // --- 2. RENDER ---
  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      
      {/* Header */}
      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
        <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">Real-time financial performance and order statistics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Sales */}
        <div className="bg-white/5 border border-white/5 p-6 rounded-3xl shadow-xl flex items-center justify-between group hover:border-violet-500/30 transition-all">
          <div>
            <h5 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Revenue</h5>
            <h2 className="text-3xl font-bold text-white mt-2">₹{kpis.totalRev.toLocaleString()}</h2>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white/5 border border-white/5 p-6 rounded-3xl shadow-xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
          <div>
            <h5 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Avg Order Value</h5>
            <h2 className="text-3xl font-bold text-white mt-2">₹{kpis.avgOrderValue.toFixed(0)}</h2>
          </div>
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Return Rate */}
        <div className="bg-white/5 border border-white/5 p-6 rounded-3xl shadow-xl flex items-center justify-between group hover:border-rose-500/30 transition-all">
          <div>
            <h5 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Return Rate</h5>
            <h2 className="text-3xl font-bold text-white mt-2">{kpis.returnRate}%</h2>
            <small className="text-xs text-slate-500">{kpis.returnedCount} returns processed</small>
          </div>
          <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-inner">
            <RefreshCcw size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Trend (Line Chart) */}
        <div className="lg:col-span-2 bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
          <h5 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-violet-500"/> Monthly Sales Trend
          </h5>
          <div className="h-72 w-full">
            <Line
              data={{
                labels: salesLabels,
                datasets: [{
                  label: 'Revenue (₹)',
                  data: salesData,
                  borderColor: '#8b5cf6', // Violet-500
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  pointBackgroundColor: '#8b5cf6',
                  pointBorderColor: '#0f172a',
                  tension: 0.4,
                  fill: true
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { color: '#94a3b8' } 
                  },
                  x: { 
                    grid: { display: false }, 
                    ticks: { color: '#94a3b8' } 
                  }
                },
                plugins: {
                  legend: { display: false },
                  tooltip: { backgroundColor: '#1e293b', titleColor: '#fff', bodyColor: '#cbd5e1', padding: 12, cornerRadius: 8 }
                }
              }}
            />
          </div>
        </div>

        {/* Order Status (Doughnut Chart) */}
        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl flex flex-col">
          <h5 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ShoppingCart size={18} className="text-amber-500"/> Order Status
          </h5>
          <div className="h-64 flex-1 flex items-center justify-center relative">
             {/* Center Text Overlay */}
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-white">{orders.length}</span>
                <span className="text-xs text-slate-500 uppercase tracking-widest">Orders</span>
             </div>
            <Doughnut
              data={{
                labels: statusLabels,
                datasets: [{
                  data: statusData,
                  backgroundColor: [
                    '#10b981', // Emerald (Delivered)
                    '#f59e0b', // Amber (Pending)
                    '#3b82f6', // Blue (Shipped)
                    '#ef4444', // Red (Cancelled)
                    '#6366f1'  // Indigo (Returned/Other)
                  ],
                  borderWidth: 0,
                  hoverOffset: 4
                }]
              }}
              options={{
                responsive: true,
                cutout: '75%', // Makes the ring thinner
                plugins: {
                  legend: { 
                    position: 'bottom', 
                    labels: { color: '#94a3b8', usePointStyle: true, padding: 20, font: { size: 11 } } 
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );  
};

export default AdminAnalytics;