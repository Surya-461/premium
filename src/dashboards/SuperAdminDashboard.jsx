import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, Shield, LayoutDashboard, 
  ArrowRight, Search, CheckCircle, XCircle, Loader, 
  UserPlus, Globe, Key, Power, RefreshCw,
  TrendingUp, DollarSign, ShoppingCart, Percent, BarChart3, Filter, Calendar
} from 'lucide-react';
import { db, auth } from "../firebase"; 
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- DATA UTILS IMPORT ---
import { 
  customers as initialCustomers, 
  orders as initialStaticOrders,
} from "../data/dataUtils.js";

// --- CHART IMPORTS ---
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Charts
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';

// --- SUB-COMPONENT: PORTAL CARD ---
const PortalCard = ({ title, description, icon: Icon, color, onClick, buttonText }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all group relative overflow-hidden h-full min-h-[220px]">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon size={80} />
    </div>
    <div>
        <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-20 flex items-center justify-center mb-4 text-white`}>
            <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{description}</p>
    </div>
    <button onClick={onClick} className="w-full py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-slate-700">
        {buttonText} <ArrowRight size={14} />
    </button>
  </div>
);

// --- MAIN COMPONENT ---
const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // --- FILTER STATES ---
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");

  // --- MODAL STATES ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("admin");

  // Constants for Filters
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const months = [
    { val: '0', label: 'January' }, { val: '1', label: 'February' }, { val: '2', label: 'March' },
    { val: '3', label: 'April' }, { val: '4', label: 'May' }, { val: '5', label: 'June' },
    { val: '6', label: 'July' }, { val: '7', label: 'August' }, { val: '8', label: 'September' },
    { val: '9', label: 'October' }, { val: '10', label: 'November' }, { val: '11', label: 'December' }
  ];
  const weeks = [1, 2, 3, 4];

  // Fetch Current User
  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) setCurrentUser(user);
      });
      return () => unsubscribe();
  }, []);

  // Fetch Data (Firebase + Static)
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. PROCESS USERS
      const usersSnap = await getDocs(collection(db, "users"));
      const firebaseUsers = usersSnap.docs.map(doc => ({ 
          id: doc.id, 
          source: 'firebase',
          isActive: true, 
          ...doc.data() 
      }));

      const staticUsers = initialCustomers.map(c => ({
          id: `static_${c.customer_id}`,
          email: c.customer_email,
          firstName: c.first_name,
          lastName: c.last_name,
          role: 'user', 
          source: 'static',
          isActive: true,
          profileImage: c.customer_image_url
      }));

      setUsers([...firebaseUsers, ...staticUsers]);

      // 2. PROCESS ORDERS
      const ordersSnap = await getDocs(collection(db, "OrderItems"));
      const firebaseOrders = ordersSnap.docs.map(doc => {
         const d = doc.data();
         return {
             id: doc.id,
             totalAmount: Number(d.totalAmount || d.order_total_amount || 0),
             order_status: d.orderStatus || d.order_status || 'Pending', 
             createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
             source: 'firebase',
             ...d
         };
      });

      const staticOrders = initialStaticOrders.map(o => ({
          id: `static_order_${o.order_id}`,
          totalAmount: Number(o.order_total_amount || 0),
          order_status: o.order_status,
          createdAt: new Date(o.order_created_date),
          source: 'static',
          customer_id: o.customer_id
      }));

      setOrders([...firebaseOrders, ...staticOrders]);

    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FILTER & CALCULATE METRICS ---
  const metrics = useMemo(() => {
      // 1. Apply Date Filters
      const filteredOrders = orders.filter(order => {
          const d = new Date(order.createdAt);
          const yearMatch = selectedYear ? d.getFullYear() === parseInt(selectedYear) : true;
          const monthMatch = selectedMonth ? d.getMonth() === parseInt(selectedMonth) : true;
          const weekMatch = selectedWeek ? Math.ceil(d.getDate() / 7) === parseInt(selectedWeek) : true;
          return yearMatch && monthMatch && weekMatch;
      });

      // 2. Financials based on Filtered Data
      const totalRevenue = filteredOrders
        .filter(o => o.order_status !== "Cancelled")
        .reduce((sum, order) => sum + order.totalAmount, 0);

      const netRevenue = filteredOrders
        .filter(o => o.order_status !== "Cancelled" && o.order_status !== "Returned")
        .reduce((sum, order) => sum + order.totalAmount, 0);

      const profit = netRevenue * 0.35; // 35% Margin

      // 3. Counts
      const totalOrders = filteredOrders.length;
      const returnedOrders = filteredOrders.filter(o => o.order_status === "Returned").length;
      const returnRate = totalOrders > 0 ? ((returnedOrders / totalOrders) * 100).toFixed(2) : 0;
      
      const totalUsers = users.length; // Users generally aren't filtered by order date

      // 4. Chart Data: Revenue by Time (Dynamic Labels)
      let chartLabels = [];
      let chartData = [];

      // Sort chronologically
      const sortedChartOrders = [...filteredOrders].sort((a,b) => a.createdAt - b.createdAt);

      if (selectedMonth && selectedYear) {
          // Show by Day if month selected
          const daysInMonth = new Date(selectedYear, parseInt(selectedMonth) + 1, 0).getDate();
          chartLabels = Array.from({length: daysInMonth}, (_, i) => `Day ${i + 1}`);
          chartData = new Array(daysInMonth).fill(0);
          
          sortedChartOrders.forEach(order => {
             if(order.order_status !== "Cancelled" && order.order_status !== "Returned") {
                 const day = order.createdAt.getDate();
                 chartData[day - 1] += order.totalAmount;
             }
          });
      } else {
          // Show by Month (Default)
          // We use a Map to keep order and accumulate values
          const monthlyRevenue = new Map();
          
          sortedChartOrders.forEach(order => {
              if(order.order_status !== "Cancelled" && order.order_status !== "Returned") {
                // Format: "Jan 24" or just "Jan" if year is selected
                const label = order.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
                monthlyRevenue.set(label, (monthlyRevenue.get(label) || 0) + order.totalAmount);
              }
          });
          
          chartLabels = Array.from(monthlyRevenue.keys());
          chartData = Array.from(monthlyRevenue.values());
      }

      return { 
          totalRevenue, 
          netRevenue, 
          profit, 
          totalOrders, 
          totalUsers, 
          returnRate, 
          chartLabels,
          chartData
      };
  }, [users, orders, selectedYear, selectedMonth, selectedWeek]);

  // Chart Configs
  const revenueChartData = {
    labels: metrics.chartLabels,
    datasets: [{
      label: 'Net Revenue (₹)',
      data: metrics.chartData,
      borderColor: '#f43f5e', // Rose
      backgroundColor: 'rgba(244, 63, 94, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4
    }]
  };

  // Chart Options for Clean Axis
  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
            borderWidth: 1,
        }
    },
    scales: {
        y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { 
                callback: (value) => `₹${value.toLocaleString()}`, // Format Y-axis as currency
                color: '#94a3b8',
                font: { size: 10 }
            },
            border: { display: false }
        },
        x: {
            grid: { display: false },
            ticks: {
                color: '#94a3b8',
                font: { size: 10 },
                maxRotation: 0, // Prevent diagonal text
                autoSkip: true, // Skip labels if they are too crowded
                maxTicksLimit: 12 // Limit number of X-axis labels
            },
            border: { display: false }
        }
    }
  };

  // --- ACTIONS HANDLERS ---
  const handleGrantAccess = async (e) => {
    e.preventDefault();
    const targetUser = users.find(u => u.source === 'firebase' && u.email.toLowerCase() === newUserEmail.toLowerCase());
    
    if (targetUser) {
      if (window.confirm(`Grant ${newUserRole.toUpperCase()} privileges to ${targetUser.email}?`)) {
        try {
            await updateDoc(doc(db, "users", targetUser.id), { role: newUserRole, updatedAt: serverTimestamp() });
            setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newUserRole } : u));
            toast.success(`${targetUser.email} promoted.`);
            setShowAddModal(false);
            setNewUserEmail("");
        } catch (err) { toast.error("Failed to update role"); }
      }
    } else { toast.error("User email not found in Firebase database."); }
  };

  const toggleUserStatus = async (user) => {
      if(user.source === 'static') return toast.info("Cannot modify static demo data.");
      const newStatus = user.isActive === false ? true : false;
      try {
          await updateDoc(doc(db, "users", user.id), { isActive: newStatus });
          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
          toast.info(`Account ${newStatus ? 'Enabled' : 'Disabled'}`);
      } catch (err) { toast.error("Action failed"); }
  };

  const handleForceLogout = async (userId) => {
      if(String(userId).startsWith('static')) return toast.info("Cannot logout demo user.");
      if(!window.confirm("Force logout?")) return;
      try {
          await updateDoc(doc(db, "users", userId), { forceLogout: true, lastForceLogout: serverTimestamp() });
          toast.warning("Logout command sent.");
      } catch (err) { toast.error("Failed"); }
  };

  const handleResetPassword = async (email) => {
      if(!email) return;
      if(!window.confirm(`Send reset link to ${email}?`)) return;
      try {
          await sendPasswordResetEmail(auth, email);
          toast.success("Reset link sent.");
      } catch (err) { toast.error("Failed to send email"); }
  };

  const handleRoleChange = async (user) => {
      if(user.source === 'static') return toast.info("Cannot modify static demo data.");
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      try {
          await updateDoc(doc(db, "users", user.id), { role: newRole });
          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
          toast.success(`Role changed to ${newRole}`);
      } catch (err) { toast.error("Failed"); }
  };

  const filteredUsers = users.filter(u => 
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <ToastContainer position="top-right" theme="dark" />
      {/* Top Navigation */}
      <nav className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md top-0 z-50 px-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="bg-gradient-to-tr from-rose-600 to-orange-600 p-2 rounded-lg">
                 <Shield size={20} className="text-white"/>
             </div>
             <h1 className="text-lg font-bold text-white tracking-wide">SUPER<span className="text-rose-500">ADMIN</span></h1>
         </div>
         
         <div className="flex items-center gap-4">
             {/* Welcome Message */}
             <div className="text-right hidden md:block">
                 <p className="text-xs text-slate-400">Welcome back,</p>
                 <p className="text-sm font-bold text-white">{currentUser?.email || "Master Admin"}</p>
             </div>
         </div>
      </nav>
      {/* Main Content with padding-top for fixed nav */}
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 pt-20 md:pt-24">
        
        {/* --- FILTERS --- */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold mb-2 md:mb-0">
                <Filter size={16} /> Data Filters
            </div>
            
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Year Filter */}
                <div className="relative group w-full sm:w-auto">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth(""); setSelectedWeek(""); }} 
                        className="w-full sm:w-auto bg-slate-950 border border-slate-700 text-white text-xs rounded-lg pl-9 pr-8 py-2.5 outline-none focus:border-rose-500 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                        <option value="">All Years</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                {/* Month Filter */}
                <div className="relative group w-full sm:w-auto">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => { setSelectedMonth(e.target.value); setSelectedWeek(""); }} 
                        className="w-full sm:w-auto bg-slate-950 border border-slate-700 text-white text-xs rounded-lg pl-9 pr-8 py-2.5 outline-none focus:border-rose-500 appearance-none cursor-pointer hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!selectedYear}
                    >
                        <option value="">All Months</option>
                        {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                </div>

                {/* Week Filter */}
                {selectedMonth && (
                    <div className="relative group w-full sm:w-auto">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                        <select 
                            value={selectedWeek} 
                            onChange={(e) => setSelectedWeek(e.target.value)} 
                            className="w-full sm:w-auto bg-slate-950 border border-slate-700 text-white text-xs rounded-lg pl-9 pr-8 py-2.5 outline-none focus:border-rose-500 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                        >
                            <option value="">All Weeks</option>
                            {weeks.map(w => <option key={w} value={w}>Week {w}</option>)}
                        </select>
                    </div>
                )}

                {/* Reset Button */}
                {(selectedYear || selectedMonth) && (
                    <button 
                        onClick={() => { setSelectedYear(""); setSelectedMonth(""); setSelectedWeek(""); }} 
                        className="text-xs text-rose-400 hover:text-white underline px-2 transition-colors self-end sm:self-center"
                    >
                        Reset
                    </button>
                )}
            </div>
        </div>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
                { label: 'Total Revenue', value: `₹${metrics.totalRevenue.toLocaleString()}`, sub: 'Gross Income', icon: DollarSign },
                { label: 'Net Revenue', value: `₹${metrics.netRevenue.toLocaleString()}`, sub: 'After Returns', icon: TrendingUp },
                { label: 'Total Profit', value: `₹${metrics.profit.toLocaleString()}`, sub: 'Est. Margin (35%)', icon: BarChart3 },
                { label: 'Total Orders', value: metrics.totalOrders, sub: 'All Status', icon: ShoppingCart },
                { label: 'Total Users', value: metrics.totalUsers.toLocaleString(), sub: 'Active Base', icon: Users },
                { label: 'Return Rate %', value: `${metrics.returnRate}%`, sub: 'Of Total Orders', icon: Percent },
            ].map((stat, idx) => (
                <div key={idx} className="bg-slate-900 border border-rose-900/30 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition-colors">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-400 opacity-80"></div>
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl lg:text-2xl font-bold text-white mt-1 group-hover:scale-105 transition-transform origin-left">{stat.value}</h3>
                        <stat.icon size={18} className="text-rose-500/50"/>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">{stat.label}</p>
                    <p className="text-rose-400/60 text-[10px] mt-1">{stat.sub}</p>
                </div>
            ))}
        </div>

        {/* --- MAIN CHARTS ROW --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart - Taking 2/3 width on Desktop, Full on Mobile */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="text-rose-500"/> Revenue Trend
                </h3>
                <div className="h-64 w-full">
                    {/* UPDATED: Added chartOptions to remove long timestamp text */}
                    <Line data={revenueChartData} options={chartOptions} />
                </div>
            </div>

            {/* Portal Link - Taking 1/3 width */}
            <div className="h-full">
                <PortalCard 
                    title="Admin Dashboard"
                    description="Launch the store inventory & sales management console."
                    icon={LayoutDashboard}
                    color="bg-violet-600"
                    buttonText="Launch Admin Portal"
                    onClick={() => navigate('/admindashboard')} 
                />
            </div>
        </div>

        {/* --- USER MANAGEMENT TABLE --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in-up">
            <div className="p-4 md:p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="text-rose-500"/> User Management
                    </h3>
                    <p className="text-xs text-slate-400">Recent 5 users. Search for more.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:border-rose-500 outline-none"
                        />
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap">
                        <UserPlus size={14}/> Add
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
                    <thead>
                        <tr className="bg-slate-950/50 text-xs uppercase text-slate-400 font-semibold tracking-wider border-b border-slate-800">
                            <th className="p-3 md:p-4">User</th>
                            <th className="p-3 md:p-4">Role</th>
                            <th className="p-3 md:p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                        {loading ? <tr><td colSpan="3" className="p-8 text-center"><Loader className="animate-spin mx-auto text-rose-500"/></td></tr> : 
                        filteredUsers.slice(0, 5).map(user => ( 
                            <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-3 md:p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg overflow-hidden ${user.role === 'super_admin' ? 'bg-gradient-to-r from-rose-500 to-orange-500' : user.role === 'admin' ? 'bg-violet-600' : 'bg-slate-700'}`}>
                                            {user.profileImage ? <img src={user.profileImage} alt="p" className="w-full h-full object-cover"/> : (user.firstName ? user.firstName[0] : user.email[0].toUpperCase())}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-xs">{user.firstName} {user.lastName}</p>
                                            <p className="text-[10px] text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 md:p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                            user.role === 'super_admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                                            user.role === 'admin' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                                            'bg-slate-700/30 text-slate-400 border-slate-700'
                                        }`}>
                                            {user.role || 'User'}
                                        </span>
                                        {/* Quick Role Toggle */}
                                        {user.role !== 'super_admin' && user.source !== 'static' && (
                                            <button onClick={() => handleRoleChange(user)} className="opacity-100 md:opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition-opacity" title="Toggle Admin/User">
                                                <RefreshCw size={10}/>
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="p-3 md:p-4 text-center whitespace-nowrap">
                                    <div className="flex justify-center gap-2">
                                        {user.role !== 'super_admin' && user.source !== 'static' && (
                                            <button onClick={() => toggleUserStatus(user)} className={`p-1.5 rounded border transition-all ${user.isActive === false ? 'text-red-400 border-red-500/30 hover:bg-red-500/20' : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'}`} title={user.isActive === false ? 'Enable' : 'Disable'}>
                                                {user.isActive === false ? <XCircle size={12}/> : <CheckCircle size={12}/>}
                                            </button>
                                        )}
                                        <button onClick={() => handleResetPassword(user.email)} className="p-1.5 bg-slate-800 text-blue-400 hover:bg-blue-600 hover:text-white rounded border border-slate-700 transition-colors" title="Reset Password"><Key size={12} /></button>
                                        <button onClick={() => handleForceLogout(user.id)} className="p-1.5 bg-slate-800 text-amber-400 hover:bg-amber-600 hover:text-white rounded border border-slate-700 transition-colors" title="Force Logout"><Power size={12} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-500 italic">No users found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>

      </div>

      {/* --- GRANT ACCESS MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Grant Admin Access</h3>
                    <button onClick={() => setShowAddModal(false)}><XCircle className="text-slate-500 hover:text-white"/></button>
                </div>
                <form onSubmit={handleGrantAccess} className="p-6 space-y-4">
                    <p className="text-xs text-slate-400">Select an existing registered user to promote.</p>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Target Email</label>
                        <input type="email" required placeholder="user@example.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-rose-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Assign Role</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setNewUserRole('admin')} className={`py-2 rounded-lg border text-sm font-bold ${newUserRole === 'admin' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}>Admin</button>
                            <button type="button" onClick={() => setNewUserRole('super_admin')} className={`py-2 rounded-lg border text-sm font-bold ${newUserRole === 'super_admin' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}>Super Admin</button>
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-rose-900/20 mt-4">Confirm Promotion</button>
                </form>
             </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminDashboard;