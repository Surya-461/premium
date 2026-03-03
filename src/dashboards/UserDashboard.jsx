import React, { useContext, useState, useEffect, useMemo } from "react";
import { db } from "../firebase"; 
import { AuthContext } from "../context/AuthContext";

// --- REDUX IMPORTS ---
import { useDispatch } from 'react-redux';
import { addItem } from '../slices/cartSlice'; 

// --- DATA IMPORTS ---
import { 
  customers, 
  payments as staticPayments, 
  caddress as staticAddresses, 
  orders as staticOrders, 
  orderItems as staticItems, 
  products 
} from "../data/dataUtils.js";

// --- FIREBASE IMPORTS ---
import { 
  doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, onSnapshot, serverTimestamp 
} from "firebase/firestore";

// --- REACT HOT TOAST (Updated) ---
import toast, { Toaster } from 'react-hot-toast';

// --- ICONS ---
import { 
  Loader, User, ShoppingBag, CreditCard, LayoutDashboard, 
  TrendingUp, Package, DollarSign, MapPin, Phone, 
  AlertCircle, CheckCircle, ChevronRight, ShoppingCart, Star, Camera, Filter, Calendar
} from 'lucide-react';

// --- CHART JS IMPORTS ---
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
ChartJS.defaults.font.family = "'Inter', sans-serif";

// ==========================================
//  SUB-COMPONENT: FEATURED PRODUCTS
// ==========================================
const FeaturedProducts = ({ products, onAddToCart }) => {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star key={i} size={10} className={`${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-slate-600"}`} />
    ));
  };

  return (
    <div className="mb-8 animate-fade-in-up">
      <div className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Package size={20} className="text-violet-500"/> Best Selling</h3>
          <span className="text-xs text-slate-500 flex items-center gap-1">Swipe <ChevronRight size={12}/></span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-violet-900/50 scrollbar-track-slate-900/0">
          {products.slice(0, 15).map((prod) => (
            <div key={prod.product_id} className="min-w-[160px] max-w-[160px] md:min-w-[240px] md:max-w-[240px] bg-slate-950/80 border border-slate-800 rounded-xl p-3 hover:border-violet-500/50 transition-all group hover:scale-[1.02] shadow-lg flex flex-col justify-between">
              <div>
                <div className="h-28 md:h-40 bg-slate-900 rounded-lg mb-3 overflow-hidden relative">
                  <img src={prod.image_url} alt={prod.product_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                  <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-emerald-400 border border-emerald-500/30">
                    ${prod.selling_unit_price.toFixed(2)}
                  </div>
                </div>
                <h4 className="text-xs md:text-sm font-semibold text-white truncate mb-2" title={prod.product_name}>{prod.product_name}</h4>
                <div className="flex items-center gap-1 mb-3">
                    <div className="flex">{renderStars(prod.product_rating || 0)}</div>
                    <span className="text-[10px] text-slate-400">({prod.product_rating})</span>
                </div>
              </div>
              <button onClick={() => onAddToCart(prod)} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                <ShoppingCart size={14} /> Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
//  SUB-COMPONENT: OVERVIEW TAB
// ==========================================
const OverviewTab = ({ orders, displayData, filters, setFilters, availableMonths, yearsList, availableCategories }) => {
    const kpiTotalSpend = orders.filter(o => !['Cancelled', 'Returned'].includes(o.order_status)).reduce((acc, curr) => acc + curr.order_total_amount, 0);
    const formatRupees = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  
    // --- CHARTS DATA PREP ---
    const validOrders = orders.filter(o => !['Cancelled', 'Returned'].includes(o.order_status));
    const dailySpendData = {};
    validOrders.forEach(o => {
        const dateKey = new Date(o.order_date).toLocaleDateString('en-US', {month:'short', day:'numeric'});
        dailySpendData[dateKey] = (dailySpendData[dateKey] || 0) + o.order_total_amount;
    });
    const lineChartData = { labels: Object.keys(dailySpendData), datasets: [{ label: 'Spend', data: Object.values(dailySpendData), borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', fill: true, tension: 0.4, pointRadius: 2 }] };
  
    const statusCounts = {};
    orders.forEach(o => statusCounts[o.order_status] = (statusCounts[o.order_status] || 0) + 1);
    const donutChartData = { labels: Object.keys(statusCounts), datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#f43f5e', '#6366f1'], borderWidth: 0 }] };
  
    const returnsByProduct = {}; const spendByProduct = {}; const activeByProduct = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            const pName = item.product_name;
            if(['Returned', 'Return Requested'].includes(order.order_status)) returnsByProduct[pName] = (returnsByProduct[pName] || 0) + (item.quantity || 1);
            if(!['Cancelled', 'Returned'].includes(order.order_status)) spendByProduct[pName] = (spendByProduct[pName] || 0) + (Number(item.selling_unit_price) * (item.quantity || 1));
            if(['Pending', 'Processing', 'Shipped'].includes(order.order_status)) activeByProduct[pName] = (activeByProduct[pName] || 0) + (item.quantity || 1);
        });
    });
  
    const getTop5 = (data) => Object.entries(data).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const horizontalChartOptions = { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(148, 163, 184, 0.05)' }, ticks: { font: {size: 10} } }, y: { grid: { display: false }, ticks: { color: '#e2e8f0', font: {size: 10} } } } };
  
    return (
      <div className="animate-fade-in-up">
        {/* UPDATED FILTERS */}
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl mb-8 backdrop-blur-sm shadow-lg flex flex-col gap-3">
            <div className="flex items-center gap-2 text-violet-400 font-bold uppercase text-xs tracking-widest border-b border-slate-800/50 pb-2 mb-1">
              <Filter size={14}/> Data Filters
            </div>
            
            <div className="flex overflow-x-auto pb-2 gap-3 w-full scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
               {/* Year */}
               <div className="min-w-[130px] flex-1 md:min-w-0">
                  <label className="text-xs text-slate-500 mb-1 block ml-1">Year</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                    <select value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})} className="w-full pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-violet-500 hover:bg-slate-700/80 transition-colors cursor-pointer appearance-none">
                      <option value="All">All Years</option>{yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
               </div>
               {/* Month */}
               <div className="min-w-[130px] flex-1 md:min-w-0">
                  <label className="text-xs text-slate-500 mb-1 block ml-1">Month</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                    <select value={filters.month} onChange={(e) => setFilters({...filters, month: e.target.value})} className="w-full pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-violet-500 hover:bg-slate-700/80 transition-colors cursor-pointer appearance-none">
                      <option value="All">All Months</option>{availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
               </div>
               {/* Category */}
               <div className="min-w-[130px] flex-1 md:min-w-0">
                  <label className="text-xs text-slate-500 mb-1 block ml-1">Category</label>
                  <div className="relative">
                    <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                    <select value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})} className="w-full pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-violet-500 hover:bg-slate-700/80 transition-colors cursor-pointer appearance-none">
                      {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
               </div>
            </div>
        </div>
  
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
            {[
              { title: 'Orders', value: orders.length, icon: Package, color: 'text-violet-400', bg: 'bg-violet-500/10' },
              { title: 'Spend', value: formatRupees(kpiTotalSpend), icon: DollarSign, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { title: 'Returns', value: orders.filter(o => ['Returned', 'Return Requested'].includes(o.order_status)).length, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
              { title: 'Active', value: orders.filter(o => ['Pending', 'Processing', 'Shipped'].includes(o.order_status)).length, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { title: 'Delivered', value: orders.filter(o => o.order_status === 'Delivered').length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <div className={`p-2 w-fit rounded-lg mb-3 ${kpi.bg} ${kpi.color}`}><kpi.icon size={18} /></div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-1 truncate" title={kpi.value}>{kpi.value}</h2>
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.title}</p>
                  </div>
              </div>
            ))}
        </div>
  
        {/* Charts Grid */}
        <div className="space-y-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-violet-500"/> Spend Trend</h3>
                  <div className="h-56 md:h-64"><Line data={lineChartData} options={{maintainAspectRatio: false, plugins: {legend: {display: false}}, scales: {x: {grid: {display: false}, ticks: {font:{size:10}}}, y: {grid: {color: 'rgba(255,255,255,0.05)'}, ticks: {font:{size:10}}}}}} /></div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Package size={16} className="text-amber-500"/> Status</h3>
                  <div className="h-56 md:h-64 relative flex items-center justify-center">
                    <Doughnut data={donutChartData} options={{maintainAspectRatio: false, cutout: '70%', plugins: {legend: {position: 'bottom', labels: {color: '#94a3b8', boxWidth: 10, padding: 15}}}}} />
                  </div>
              </div>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[{t:'Returns', d:getTop5(returnsByProduct), c:'#f43f5e'}, {t:'Spend', d:getTop5(spendByProduct), c:'#10b981'}, {t:'Active', d:getTop5(activeByProduct), c:'#3b82f6'}].map((chart, i) => (
                 <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-2">{chart.t} by Product</h3>
                    <div className="h-48"><Bar data={{labels: chart.d.map(x=>x[0].substring(0,12)+'...'), datasets:[{data:chart.d.map(x=>x[1]), backgroundColor: chart.c, borderRadius:3}]}} options={horizontalChartOptions} /></div>
                 </div>
               ))}
            </div>
  
            <div className="bg-gradient-to-r from-violet-900/40 to-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between shadow-lg gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="p-3 bg-violet-500/20 rounded-full text-violet-400 shrink-0"><MapPin size={24}/></div>
                    <div className="text-left">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Primary Delivery Address</p>
                        <p className="text-lg text-white font-medium break-words">{displayData.address}, {displayData.city}</p>
                        <p className="text-sm text-slate-400">{displayData.country}</p>
                    </div>
                </div>
                <div className="px-4 py-2 bg-slate-800 rounded-lg text-sm text-slate-300 border border-slate-700">
                    {displayData.mobile || 'No contact info'}
                </div>
            </div>
        </div>
      </div>
    );
};

// ==========================================
//  SUB-COMPONENT: ORDERS TAB
// ==========================================
const OrdersTab = ({ orders, onReturnClick }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl animate-fade-in-up shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <th className="p-4 md:p-5">Order ID</th><th className="p-4 md:p-5">Date</th><th className="p-4 md:p-5">Items</th><th className="p-4 md:p-5">Amount</th><th className="p-4 md:p-5">Status</th><th className="p-4 md:p-5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {orders.length > 0 ? orders.map(order => (
              <tr key={order.order_id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 md:p-5 font-mono text-violet-300">#{order.order_id.toString().slice(0,8)}</td>
                <td className="p-4 md:p-5 text-slate-300">{new Date(order.order_date).toLocaleDateString()}</td>
                <td className="p-4 md:p-5 text-slate-400">{order.items.length}</td>
                <td className="p-4 md:p-5 font-bold text-white">${order.order_total_amount.toFixed(2)}</td>
                <td className="p-4 md:p-5"><span className={`px-2 py-1 text-xs rounded border ${order.order_status === 'Delivered' ? 'border-emerald-500 text-emerald-400' : 'border-violet-500 text-violet-400'}`}>{order.order_status}</span></td>
                <td className="p-4 md:p-5 text-center">
                  <button onClick={() => onReturnClick(order)} disabled={['Returned', 'Cancelled', 'Return Requested'].includes(order.order_status)} className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded text-xs font-bold disabled:opacity-30">Return</button>
                </td>
              </tr>
            )) : <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
//  SUB-COMPONENT: PAYMENTS TAB
// ==========================================
const PaymentsTab = ({ orders }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden animate-fade-in-up shadow-xl">
       <div className="p-5 border-b border-slate-800"><h3 className="text-lg font-bold text-white flex items-center gap-2"><CreditCard size={20} className="text-emerald-500"/> Payment History</h3></div>
       <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
              <thead><tr className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800"><th className="p-4 md:p-5">Ref ID</th><th className="p-4 md:p-5">Order</th><th className="p-4 md:p-5">Method</th><th className="p-4 md:p-5 text-right">Amount</th><th className="p-4 md:p-5 text-center">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                  {orders.map(o => (
                      <tr key={o.order_id} className="hover:bg-slate-800/30">
                          <td className="p-4 md:p-5 font-mono text-slate-500">TXN-{o.order_id.toString().slice(0,6)}</td>
                          <td className="p-4 md:p-5 text-violet-400">#{o.order_id.toString().slice(0,8)}</td>
                          <td className="p-4 md:p-5 text-white">{o.payment_method}</td>
                          <td className="p-4 md:p-5 text-right font-bold text-white">${o.order_total_amount.toFixed(2)}</td>
                          <td className="p-4 md:p-5 text-center"><span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold uppercase">Paid</span></td>
                      </tr>
                  ))}
              </tbody>
          </table>
       </div>
    </div>
  );
};

// ==========================================
//  SUB-COMPONENT: PROFILE TAB
// ==========================================
const ProfileTab = ({ displayData, handleProfileSave, isEditing, setIsEditing, editData, setEditData }) => {
  const handleImageChange = (e) => { const f=e.target.files[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setEditData(p=>({...p,profileImage:r.result})); r.readAsDataURL(f);} };

  return (
    <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-fade-in-up shadow-2xl">
      <div className="h-32 md:h-40 bg-gradient-to-r from-violet-800 to-indigo-900 relative">
        <div className="absolute -bottom-10 md:-bottom-12 left-6 md:left-8">
            <div className="relative group w-20 h-20 md:w-24 md:h-24">
                <div className="w-full h-full rounded-full bg-slate-950 p-1 ring-4 ring-slate-900 overflow-hidden">
                    {(isEditing?editData.profileImage:displayData.profileImage)?<img src={isEditing?editData.profileImage:displayData.profileImage} className="w-full h-full rounded-full object-cover" alt="p"/>:<div className="w-full h-full bg-slate-800 flex items-center justify-center"><User size={28} className="text-slate-500"/></div>}
                </div>
                {isEditing && <label className="absolute bottom-0 right-0 bg-violet-600 p-2 rounded-full cursor-pointer"><Camera size={12} className="text-white"/><input type="file" className="hidden" onChange={handleImageChange}/></label>}
            </div>
        </div>
      </div>
      <div className="pt-14 md:pt-16 px-6 md:px-8 pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
          <div><h2 className="text-xl md:text-2xl font-bold text-white">{displayData.fullName}</h2><p className="text-sm text-slate-400">{displayData.email}</p></div>
          <button onClick={()=>setIsEditing(!isEditing)} className="text-sm bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700">{isEditing?'Cancel':'Edit Profile'}</button>
        </div>
        {isEditing ? (
          <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['firstName', 'lastName', 'mobile', 'address'].map(f=><input key={f} value={editData[f]} onChange={e=>setEditData({...editData,[f]:e.target.value})} placeholder={f} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"/>)}
            <button type="submit" className="md:col-span-2 bg-violet-600 text-white py-3 rounded-lg font-bold">Update Profile</button>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700"><h4 className="text-sm text-slate-400 font-bold uppercase mb-2">Address</h4><p className="text-white">{displayData.address}</p></div>
            <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700"><h4 className="text-sm text-slate-400 font-bold uppercase mb-2">Phone</h4><p className="text-white">{displayData.mobile || "N/A"}</p></div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
//  MAIN COMPONENT
// ==========================================
const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch(); 
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [firebaseProfile, setFirebaseProfile] = useState(null);
  const [liveOrders, setLiveOrders] = useState([]); 
  const [topProducts, setTopProducts] = useState([]); 
  const currentYear = new Date().getFullYear();
  const yearsList = [currentYear, currentYear - 1, currentYear - 2];
  const [filters, setFilters] = useState({ year: 'All', month: 'All', category: 'All' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState("Wrong Size");

  // ... (useEffect for data fetching - KEEP EXISTING) ...
  useEffect(() => {
    let unsubscribeOrders = () => {}; 
    const init = async () => {
      setLoading(true);
      if (user?.uid) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
             const data = docSnap.data();
             setFirebaseProfile(data);
             setEditFormData({ firstName: data.firstName||"", lastName: data.lastName||"", email: data.email||user.email||"", mobile: data.mobile||"", address: data.address||"", city: data.city||"", country: data.country||"", profileImage: data.profileImage||"" });
          }
          const q = query(collection(db, "OrderItems"), where("userId", "==", user.uid));
          unsubscribeOrders = onSnapshot(q, (snapshot) => {
              const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date() }));
              fetched.sort((a, b) => b.createdAt - a.createdAt);
              setLiveOrders(fetched);
              setLoading(false);
          });
        } catch (e) { setLoading(false); }
      } else { setLoading(false); }
    };
    init();
    return () => unsubscribeOrders();
  }, [user]);

  // ... (useEffect for products - KEEP EXISTING) ...
  useEffect(() => {
    if (products.length > 0 && staticItems.length > 0) {
        const productSales = {};
        staticItems.forEach(item => productSales[item.product_id] = (productSales[item.product_id] || 0) + (item.ordered_quantity || 1));
        const sorted = products.map(p => ({ ...p, sales_count: productSales[p.product_id] || 0 })).sort((a, b) => (b.sales_count - a.sales_count) || (b.product_rating - a.product_rating));
        setTopProducts(sorted);
    }
  }, []);

  // ... (memos for displayData, rawData, filteredOrders - KEEP EXISTING) ...
  const matchedCustomer = useMemo(() => user?.email ? customers.find(c => c.customer_email.toLowerCase() === user.email.toLowerCase()) : null, [user]);
  const customerAddressObj = useMemo(() => matchedCustomer ? staticAddresses.find(a => a.customer_id === matchedCustomer.customer_id) : null, [matchedCustomer]);
  const displayData = useMemo(() => ({
    customerId: matchedCustomer?.customer_id || (user?.uid ? user.uid.substring(0, 8).toUpperCase() : 'N/A'),
    firstName: firebaseProfile?.firstName || matchedCustomer?.first_name || 'Guest',
    fullName: `${firebaseProfile?.firstName||matchedCustomer?.first_name||''} ${firebaseProfile?.lastName||matchedCustomer?.last_name||''}`.trim()||'User',
    email: firebaseProfile?.email || matchedCustomer?.customer_email || user?.email,
    address: firebaseProfile?.address || customerAddressObj?.address_line || 'N/A',
    city: firebaseProfile?.city || customerAddressObj?.city || '',
    country: firebaseProfile?.country || customerAddressObj?.country || '',
    mobile: firebaseProfile?.mobile || '',
    profileImage: firebaseProfile?.profileImage || matchedCustomer?.customer_image_url || ''
  }), [firebaseProfile, matchedCustomer, user, customerAddressObj]);

  const rawData = useMemo(() => {
    const customerId = matchedCustomer?.customer_id;
    const staticUserOrders = customerId ? staticOrders.filter(o => o.customer_id === customerId) : [];
    const formattedStatic = staticUserOrders.map(o => ({ order_id: String(o.order_id), order_date: o.order_created_date, order_total_amount: o.order_total_amount, order_status: o.order_status, source: 'static', payment_method: staticPayments.find(p => p.order_id === o.order_id)?.payment_method || 'Card', items: staticItems.filter(i => i.order_id === o.order_id).map(i => ({ ...i, product_name: products.find(p => p.product_id === i.product_id)?.product_name || 'Item', category: products.find(p => p.product_id === i.product_id)?.product_category || 'Uncategorized' })) }));
    const formattedLive = liveOrders.map(order => ({ order_id: order.id, order_date: order.createdAt, order_total_amount: Number(order.totalAmount) || 0, order_status: order.orderStatus || 'Pending', source: 'live', payment_method: 'Online', items: (order.items || []).map(i => ({ ...i, product_name: i.name || i.product_name || 'Item', category: i.category || 'Uncategorized', quantity: i.quantity || 1 })) }));
    return [...formattedLive, ...formattedStatic].sort((a,b) => new Date(b.order_date) - new Date(a.order_date));
  }, [matchedCustomer, liveOrders]);

  const filteredOrders = useMemo(() => rawData.filter(order => {
      const d = new Date(order.order_date);
      return (filters.year === 'All' || d.getFullYear() === parseInt(filters.year)) && (filters.month === 'All' || d.toLocaleString('default', { month: 'short' }) === filters.month) && (filters.category === 'All' || order.items.some(i => i.category === filters.category));
  }), [rawData, filters]);

  // ... (handleAddToCart, handleProfileSave, openReturnModal - KEEP EXISTING) ...
  const handleAddToCart = (product) => { 
      dispatch(addItem({ product_id: product.product_id, product_name: product.product_name, image_url: product.image_url, selling_unit_price: product.selling_unit_price })); 
      toast.success("Added to cart!", { 
          style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' },
          position: "bottom-right", 
          duration: 1000 
      }); 
  };

  const handleProfileSave = async (e) => { 
      e.preventDefault(); 
      if (user?.uid) { 
          try { 
              await setDoc(doc(db, 'users', user.uid), editFormData, { merge: true }); 
              setFirebaseProfile(prev => ({ ...prev, ...editFormData })); 
              setIsEditingProfile(false); 
              toast.success("Profile Updated!", { style: { background: '#1e293b', color: '#fff' } }); 
          } catch { 
              toast.error("Update Failed.", { style: { background: '#1e293b', color: '#fff' } }); 
          } 
      } 
  };

  const openReturnModal = (order) => { setSelectedReturnOrder(order); setReturnModalOpen(true); };
  
  // ✅ UPDATED: Include reason in Notification AND Order document
  const handleReturnSubmit = async () => { 
      if (selectedReturnOrder?.source === 'live') { 
          try { 
              // 1. Update Order Status and Save Reason
              await updateDoc(doc(db, "OrderItems", selectedReturnOrder.order_id), { 
                  orderStatus: "Return Requested", 
                  returnReason: returnReason, // Saving to order doc for Admin Table
                  returnDate: serverTimestamp() 
              }); 

              // 2. Send Notification to Admin
              await addDoc(collection(db, "notifications"), { 
                  type: "admin", 
                  subType: "return_request", 
                  message: `Return Req: Order #${selectedReturnOrder.order_id.slice(0,6)}`, 
                  orderId: selectedReturnOrder.order_id, 
                  customerId: user.uid, 
                  customerName: displayData.fullName, 
                  returnReason: returnReason, // Saving to notification doc for Admin Navbar
                  createdAt: serverTimestamp(), 
                  isRead: false, 
                  fullOrderId: selectedReturnOrder.order_id, 
                  senderId: user.uid, 
                  senderName: displayData.fullName 
              }); 

              toast.success("Return Requested Successfully!", { style: { background: '#1e293b', color: '#fff' } }); 
          } catch { 
              toast.error("Request Failed.", { style: { background: '#1e293b', color: '#fff' } }); 
          } 
      } else { 
          toast("This is a demo order. Cannot return.", { icon: 'ℹ️', style: { background: '#1e293b', color: '#fff' } }); 
      } 
      setReturnModalOpen(false); 
  };

  // ... (Return JSX - KEEP EXISTING) ...
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader size={32} className="animate-spin text-violet-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden pb-20">
      
      <Toaster position="top-right" reverseOrder={false} />

      <div className="fixed inset-0 pointer-events-none"><div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px]" /><div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px]" /></div>

      <div className="relative z-10 p-4 max-w-[1600px] mx-auto">
        
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-6 border-b border-slate-800 pb-4">
            <div>
                <h1 className="text-xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">Hello, {displayData.firstName}</h1>
                <p className="text-xs text-slate-400 mt-1">ID: <span className="font-mono text-white bg-slate-800 px-1 rounded">{displayData.customerId}</span></p>
            </div>
            <div className="w-full lg:w-auto overflow-x-auto scrollbar-hide">
                <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-800 backdrop-blur-md w-max">
                    {[{id:'overview', label:'Dashboard', icon:LayoutDashboard}, {id:'orders', label:'Orders', icon:ShoppingBag}, {id:'payments', label:'Payments', icon:CreditCard}, {id:'profile', label:'Profile', icon:User}].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                            <tab.icon size={14} /> <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </header>

        {activeTab === 'overview' && <FeaturedProducts products={topProducts} onAddToCart={handleAddToCart} />}
        
        {activeTab === 'overview' && (
           <OverviewTab 
              orders={filteredOrders} displayData={displayData} filters={filters} setFilters={setFilters} 
              availableMonths={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]} 
              yearsList={yearsList} availableCategories={['All', ...new Set(products.map(p => p.product_category))]} 
           />
        )}

        {activeTab === 'orders' && <OrdersTab orders={filteredOrders} onReturnClick={openReturnModal} />}
        {activeTab === 'payments' && <PaymentsTab orders={filteredOrders} />}
        {activeTab === 'profile' && <ProfileTab displayData={displayData} handleProfileSave={handleProfileSave} isEditing={isEditingProfile} setIsEditing={setIsEditingProfile} editData={editFormData} setEditData={setEditFormData} />}

        {returnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-xl p-5 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-3">Return Item</h3>
              <div className="space-y-2 mb-4">
                {['Wrong Size', 'Damaged', 'Changed Mind', 'Other'].map(r => (
                  <label key={r} className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${returnReason === r ? 'bg-violet-600/20 border-violet-500' : 'bg-slate-800 border-slate-700'}`}>
                    <input type="radio" value={r} checked={returnReason === r} onChange={e => setReturnReason(e.target.value)} className="accent-violet-500" />
                    <span className="text-xs text-white">{r}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setReturnModalOpen(false)} className="flex-1 py-1.5 bg-slate-800 rounded text-xs text-slate-300">Cancel</button>
                <button onClick={handleReturnSubmit} className="flex-1 py-1.5 bg-rose-600 text-white rounded text-xs font-bold">Submit</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;