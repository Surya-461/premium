import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, Tag, Loader, DollarSign, 
  Package, TrendingUp, Filter 
} from 'lucide-react';
import { db } from "../firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, BarElement, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement);

// --- COMPONENT: PRODUCT CARD ---
const ProductCard = ({ product, onEdit, onDelete }) => {
  // Safe calculation for display
  const price = Number(product.selling_unit_price) || 0;
  const cost = Number(product.cost_unit_price) || 0;
  const margin = price - cost;
  const marginPercent = price > 0 ? ((margin / price) * 100).toFixed(1) : 0;

  return (
    <div className="group relative bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-violet-500/10 hover:border-violet-500/30 transition-all duration-300 flex flex-col h-full">
      
      {/* Image Section */}
      <div className="relative w-full h-48 bg-black/40 overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.product_name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
            <Package size={40} strokeWidth={1.5} />
            <span className="text-xs mt-2">No Image</span>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm ${
            product.is_product_active 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
          }`}>
            {product.is_product_active ? 'Active' : 'Hidden'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-3">
            <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">
                    {product.product_brand || 'No Brand'}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    <Tag size={10} />
                    {product.product_category}
                </div>
            </div>
            <h3 className="text-white font-bold text-lg leading-tight line-clamp-2" title={product.product_name}>
                {product.product_name}
            </h3>
        </div>

        {/* Financial Grid */}
        <div className="mt-auto grid grid-cols-2 gap-2 bg-white/5 rounded-xl p-3 border border-white/5">
            <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Price</p>
                <p className="text-emerald-400 font-bold text-lg">₹{price}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Profit</p>
                <div className="flex items-center justify-end gap-1 text-cyan-400 font-bold">
                    <span>₹{margin.toFixed(2)}</span>
                    <TrendingUp size={12} />
                </div>
            </div>
            
            <div className="col-span-2 h-px bg-white/10 my-1"></div>
            
            <div className="flex justify-between items-center col-span-2">
                <p className="text-[10px] text-slate-400">Cost: <span className="text-slate-300">₹{cost}</span></p>
                <p className="text-[10px] text-slate-400">Margin: <span className={`${Number(marginPercent) > 20 ? 'text-emerald-400' : 'text-orange-400'}`}>{marginPercent}%</span></p>
            </div>
        </div>
      </div>

      {/* Actions (Hover Reveal) */}
      <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-[-10px] group-hover:translate-y-0">
        <button 
          onClick={() => onEdit(product)} 
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-900/50 transition-colors"
          title="Edit"
        >
          <Edit size={16} />
        </button>
        <button 
          onClick={() => onDelete(product.product_id)} 
          className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 shadow-lg shadow-rose-900/50 transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT: ADMIN PRODUCTS ---
const AdminProducts = ({ initialProducts = [], orders = [], orderItems = [], payments = [], onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // --- ANALYTICS FILTER STATE ---
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterWeek, setFilterWeek] = useState('');

  const [formData, setFormData] = useState({
    product_name: '', product_brand: '', product_category: '', product_department: '', 
    selling_unit_price: '', cost_unit_price: '', product_margin: 0, product_margin_percent: 0,
    product_short_description: '', image_url: '', is_product_active: true
  });

  // ==================================================================================
  // 1. ANALYTICS ENGINE
  // ==================================================================================
  const analytics = useMemo(() => {
    // A. DATA MAPPING
    const productMap = new Map();
    initialProducts.forEach(p => {
        productMap.set(String(p.product_id), {
            name: p.product_name,
            brand: p.product_brand || 'Unknown',
            category: p.product_category || 'Other',
            cost_price: Number(p.cost_unit_price) || 0,
            selling_price: Number(p.selling_unit_price) || 0
        });
    });

    const orderMap = new Map();
    orders.forEach(o => {
        orderMap.set(String(o.order_id), {
            status: o.order_status,
            date: new Date(o.order_date)
        });
    });

    const paymentMap = new Map();
    payments.forEach(p => {
        paymentMap.set(String(p.order_id), p.payment_status);
    });

    // B. AGGREGATION VARIABLES
    const validProductIds = new Set();
    const validOrderIds = new Set();
    
    let totalQtySold = 0;
    let productRevenue = 0; 
    let totalProfit = 0;

    const productPerf = {};  
    const brandPerf = {};    
    const categoryPerf = {}; 

    // C. ITERATE ORDER ITEMS
    orderItems.forEach(item => {
        const orderId = String(item.order_id);
        const prodId = String(item.product_id);

        const order = orderMap.get(orderId);
        const product = productMap.get(prodId);
        const paymentStatus = paymentMap.get(orderId) || 'PAID'; 

        if (!order || !product) return;

        // Date Filters
        if (filterYear && order.date.getFullYear().toString() !== filterYear) return;
        if (filterMonth && (order.date.getMonth() + 1).toString() !== filterMonth) return;
        if (filterWeek) {
            const week = Math.ceil(order.date.getDate() / 7).toString();
            if (week !== filterWeek) return;
        }

        // Business Rules
        if (order.status === 'Cancelled') return;
        if (item.is_returned === true) return; 
        if (paymentStatus === 'REFUNDED') return;

        // Metrics
        const qty = Number(item.ordered_quantity || item.quantity) || 0;
        const revenue = Number(item.net_amount || item.total_amount) || 0; 
        
        // Profit Calculation
        const totalCost = product.cost_price * qty;
        const profit = revenue - totalCost;

        // Aggregates
        totalQtySold += qty;
        productRevenue += revenue; 
        totalProfit += profit;
        
        validProductIds.add(prodId);
        validOrderIds.add(orderId);

        // Visual Aggregates
        if (!productPerf[prodId]) {
            productPerf[prodId] = { name: product.name, revenue: 0, profit: 0 };
        }
        productPerf[prodId].revenue += revenue;
        productPerf[prodId].profit += profit;

        brandPerf[product.brand] = (brandPerf[product.brand] || 0) + revenue;
        categoryPerf[product.category] = (categoryPerf[product.category] || 0) + revenue;
    });

    // D. FORMAT DATA FOR CHARTS
    const topProfitProducts = Object.values(productPerf).sort((a, b) => b.profit - a.profit).slice(0, 10);
    const topRevenueProducts = Object.values(productPerf).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const sortedBrands = Object.entries(brandPerf).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const sortedCategories = Object.entries(categoryPerf).sort((a, b) => b[1] - a[1]).slice(0, 6);

    return {
        kpis: { 
            totalProductsSold: validProductIds.size, 
            totalQtySold, 
            totalOrders: validOrderIds.size, 
            productRevenue, 
            totalProfit 
        },
        charts: {
            topProfit: {
                labels: topProfitProducts.map(p => p.name.substring(0, 15) + '...'),
                data: topProfitProducts.map(p => p.profit)
            },
            topRevenue: {
                labels: topRevenueProducts.map(p => p.name.substring(0, 15) + '...'),
                data: topRevenueProducts.map(p => p.revenue)
            },
            brands: {
                labels: sortedBrands.map(b => b[0]),
                data: sortedBrands.map(b => b[1])
            },
            categories: {
                labels: sortedCategories.map(c => c[0]),
                data: sortedCategories.map(c => c[1])
            }
        }
    };
  }, [initialProducts, orders, orderItems, payments, filterYear, filterMonth, filterWeek]);

  // --- CRUD HELPERS ---
  const filtered = initialProducts.filter(p => (p.product_name?.toLowerCase().includes(searchTerm.toLowerCase())) && (!categoryFilter || p.product_category === categoryFilter));
  const categories = [...new Set(initialProducts.map(p => p.product_category).filter(Boolean))];

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const prodId = currentProduct ? currentProduct.product_id : Math.floor(Math.random() * 900000) + 100000;
    try {
      await setDoc(doc(db, "products", String(prodId)), { ...formData, product_id: Number(prodId), selling_unit_price: Number(formData.selling_unit_price), cost_unit_price: Number(formData.cost_unit_price) }, { merge: true });
      if(onUpdate) onUpdate(); setIsModalOpen(false);
    } catch(err){ alert("Error: " + err.message); } finally{ setSaving(false); }
  };
  const handleDelete = async (id) => { if(window.confirm("Delete?")) { try { await deleteDoc(doc(db, "products", String(id))); if(onUpdate) onUpdate(); } catch(e){ console.error(e); } } };
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target; const val = type === 'checkbox' ? checked : value;
    let u = { ...formData, [name]: val };
    if (name === 'selling_unit_price' || name === 'cost_unit_price') {
      const sell = parseFloat(name === 'selling_unit_price' ? val : formData.selling_unit_price) || 0;
      const cost = parseFloat(name === 'cost_unit_price' ? val : formData.cost_unit_price) || 0;
      if (sell !== 0) { u.product_margin = parseFloat((sell - cost).toFixed(2)); u.product_margin_percent = parseFloat(((sell-cost) / sell).toFixed(3)); }
    }
    setFormData(u);
  };

  const years = ['2019', '2020', '2021', '2022', '2023','2024','2025','2026'];
  const months = Array.from({length: 12}, (_, i) => (i + 1).toString());
  const weeks = ['1', '2', '3', '4'];

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <h1 className="text-2xl font-bold text-white tracking-tight">Products In GSH STORE</h1>
      
      {/* --- FILTERS --- */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-3 bg-[#0c2543] p-3 rounded-2xl border border-[#163a66] shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Filter size={14} className="text-cyan-400"/> Sales Filters:</div>
          <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-[#041528] text-white text-xs px-3 py-2 rounded-lg border border-[#163a66] outline-none"><option value="">Year: All</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
          <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="bg-[#041528] text-white text-xs px-3 py-2 rounded-lg border border-[#163a66] outline-none"><option value="">Month: All</option>{months.map(m=><option key={m} value={m}>{m}</option>)}</select>
          <select value={filterWeek} onChange={e=>setFilterWeek(e.target.value)} className="bg-[#041528] text-white text-xs px-3 py-2 rounded-lg border border-[#163a66] outline-none"><option value="">Week: All</option>{weeks.map(w=><option key={w} value={w}>Week {w}</option>)}</select>
          {(filterYear || filterMonth || filterWeek) && <button onClick={()=>{setFilterYear(''); setFilterMonth(''); setFilterWeek('');}} className="text-xs text-rose-400 hover:text-white font-bold px-2">Clear</button>}
      </div>

      {/* --- KPI CARDS (Aligned in One Line: lg:grid-cols-5) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-[#0c2543] p-5 rounded-3xl border border-[#163a66] shadow-lg flex flex-col justify-center relative overflow-hidden">
              <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Total Products Sold</h4>
              <p className="text-2xl font-bold text-white">{analytics.kpis.totalProductsSold}</p>
              <div className="absolute right-0 top-0 p-4 opacity-10"><Package size={40}/></div>
          </div>
          <div className="bg-[#0c2543] p-5 rounded-3xl border border-[#163a66] shadow-lg flex flex-col justify-center">
              <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Total Quantity Sold</h4>
              <p className="text-2xl font-bold text-white">{(analytics.kpis.totalQtySold / 1000).toFixed(1)}k</p>
          </div>
          <div className="bg-[#0c2543] p-5 rounded-3xl border border-[#163a66] shadow-lg flex flex-col justify-center">
              <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Total Orders</h4>
              <p className="text-2xl font-bold text-white">{analytics.kpis.totalOrders}</p>
          </div>
          <div className="bg-[#0c2543] p-5 rounded-3xl border border-[#163a66] shadow-lg flex flex-col justify-center">
              <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Product Revenue</h4>
              <p className="text-2xl font-bold text-emerald-400">₹{(analytics.kpis.productRevenue).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <div className="bg-[#0c2543] p-5 rounded-3xl border border-[#163a66] shadow-lg flex flex-col justify-center">
              <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Total Profit</h4>
              <p className="text-2xl font-bold text-cyan-400">₹{(analytics.kpis.totalProfit).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
      </div>

      {/* --- CHARTS SECTION --- */}
      <div className="bg-[#0c2543] p-6 rounded-3xl border border-[#163a66] shadow-lg">
          <h4 className="text-sm font-bold text-white mb-4 uppercase text-center">Top 10 Products by Profit</h4>
          <div className="h-64 w-full"><Line data={{ labels: analytics.charts.topProfit.labels, datasets: [{ label: 'Total Profit (₹)', data: analytics.charts.topProfit.data, borderColor: '#3b82f6', backgroundColor: 'transparent', borderWidth: 2, tension: 0.3, pointRadius: 3 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', font: {size: 10} } } } }} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#0c2543] p-5 rounded-3xl border border-[#163a66] shadow-lg"><h4 className="text-xs font-bold text-white mb-4 uppercase text-center">Top 5 Products by Revenue</h4><div className="h-48"><Bar data={{ labels: analytics.charts.topRevenue.labels, datasets: [{ data: analytics.charts.topRevenue.data, backgroundColor: '#3b82f6', borderRadius: 4, barThickness: 15 }] }} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { grid: { display: false }, ticks: { color: '#fff', font: {size: 10} } } } }} /></div></div>
          <div className="bg-[#0c2543] p-5 rounded-3xl border border-[#163a66] shadow-lg"><h4 className="text-xs font-bold text-white mb-4 uppercase text-center">Brand Performance</h4><div className="h-48 flex justify-center relative"><Doughnut data={{ labels: analytics.charts.brands.labels, datasets: [{ data: analytics.charts.brands.data, backgroundColor: ['#3b82f6', '#06b6d4', '#8b5cf6', '#d946ef', '#f43f5e'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: {size: 10}, boxWidth: 10, padding: 10 } } }, cutout: '60%' }} /></div></div>
          <div className="bg-[#0c2543] p-5 rounded-3xl border border-[#163a66] shadow-lg"><h4 className="text-xs font-bold text-white mb-4 uppercase text-center">Revenue by Product Category</h4><div className="h-48 w-full"><Bar data={{ labels: analytics.charts.categories.labels, datasets: [{ label: 'Revenue', data: analytics.charts.categories.data, backgroundColor: '#3b82f6', borderRadius: 4, barThickness: 15 }] }} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', callback: (val) => val/1000 + 'k' } }, y: { grid: { display: false }, ticks: { color: '#fff', font: {size: 10} } } } }} /></div></div>
      </div>

      {/* --- INVENTORY LIST: SEARCH & GRID --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/5 p-4 md:p-6 rounded-3xl border border-white/5 backdrop-blur-md mt-6">
        <h2 className="text-2xl font-bold text-white px-2">Inventory List</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3 w-full lg:w-auto">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/><input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search products..." className="w-full lg:w-64 bg-black/20 border border-white/10 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:border-violet-500 outline-none transition-all"/></div>
          <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="bg-black/20 border border-white/10 text-slate-200 px-4 py-2.5 rounded-xl outline-none cursor-pointer focus:border-violet-500"><option value="" className="bg-slate-900">All Categories</option>{categories.map(c=><option key={c} value={c} className="bg-slate-900">{c}</option>)}</select>
          <button onClick={() => { setCurrentProduct(null); setFormData({ product_department: 'Unisex', is_product_active: true }); setIsModalOpen(true); }} className="sm:col-span-2 lg:col-auto bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95"><Plus size={20}/> Add Product</button>
        </div>
      </div>

      {/* --- PRODUCT GRID (Replaces Table) --- */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(product => (
            <ProductCard 
              key={product.product_id} 
              product={product} 
              onEdit={(p) => { setCurrentProduct(p); setFormData(p); setIsModalOpen(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 text-center bg-white/5 rounded-3xl border border-white/5">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-bold">No Products Found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* --- MODAL FORM --- */}
      {isModalOpen && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"><div className="p-6 border-b border-white/5 flex justify-between items-center"><h3 className="text-xl font-bold text-white">{currentProduct ? 'Edit Product' : 'New Product'}</h3><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"><X size={20}/></button></div><form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 scrollbar-hide"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs text-slate-400 ml-1">Product Name</label><input name="product_name" placeholder="Enter name..." value={formData.product_name || ''} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none" required/></div><div className="flex items-end pb-1"><label className="flex items-center gap-3 cursor-pointer bg-black/20 p-3 rounded-xl border border-white/10 w-full"><input type="checkbox" name="is_product_active" checked={formData.is_product_active} onChange={handleInputChange} className="w-5 h-5 accent-violet-600"/><span className="text-slate-300 text-sm font-medium">Product Active</span></label></div></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div className="space-y-2"><label className="text-xs text-slate-400 ml-1">Brand</label><input name="product_brand" placeholder="Brand" value={formData.product_brand || ''} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none" required/></div><div className="space-y-2"><label className="text-xs text-slate-400 ml-1">Category</label><input name="product_category" placeholder="Category" value={formData.product_category || ''} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none" required/></div><div className="space-y-2"><label className="text-xs text-slate-400 ml-1">Department</label><select name="product_department" value={formData.product_department || 'Unisex'} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none"><option value="Unisex" className="bg-slate-900">Unisex</option><option value="Men" className="bg-slate-900">Men</option><option value="Women" className="bg-slate-900">Women</option><option value="Kids" className="bg-slate-900">Kids</option></select></div></div><div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4"><div className="flex items-center gap-2 text-violet-400 font-bold text-sm uppercase tracking-widest"><DollarSign size={16}/> Pricing & Financials</div><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold">Sale Price (₹)</label><input name="selling_unit_price" type="number" step="0.01" value={formData.selling_unit_price} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-emerald-400 font-bold focus:border-emerald-500 outline-none" required/></div><div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold">Cost Price (₹)</label><input name="cost_unit_price" type="number" step="0.01" value={formData.cost_unit_price} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-rose-400 font-bold focus:border-rose-500 outline-none" required/></div><div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold">Net Margin</label><div className={`p-2.5 rounded-xl bg-black/20 font-mono text-center border border-white/5 ${formData.product_margin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formData.product_margin}</div></div><div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold">Margin %</label><div className={`p-2.5 rounded-xl bg-black/20 font-mono text-center border border-white/5 ${formData.product_margin_percent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{(formData.product_margin_percent * 100).toFixed(1)}%</div></div></div></div><div className="space-y-2"><label className="text-xs text-slate-400 ml-1">Product Media URL</label><input name="image_url" placeholder="Paste image link here..." value={formData.image_url || ''} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none"/></div><div className="space-y-2"><label className="text-xs text-slate-400 ml-1">Product Description</label><textarea name="product_short_description" placeholder="Technical specifications or details..." value={formData.product_short_description || ''} onChange={handleInputChange} rows="3" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none resize-none"/></div><div className="pt-2"><button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98]">{saving ? <Loader className="animate-spin m-auto" size={24}/> : 'Complete Update'}</button></div></form></div></div>)}
    </div>
  );
};

export default AdminProducts;