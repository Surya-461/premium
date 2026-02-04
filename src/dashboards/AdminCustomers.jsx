import React, { useState, useMemo, useEffect } from 'react';
import { Search, Mail, MapPin, Calendar, Plus, X, User, ShieldCheck, Loader, ChevronLeft, ChevronRight, Filter, CheckCircle, XCircle } from 'lucide-react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, BarElement, Filler
} from 'chart.js';

import { caddress } from "../data/dataUtils"; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, Filler);

const THEME = {
  bg: '#041528',       
  card: '#0c2543',     
  border: '#163a66',   
  textMain: '#ffffff', 
  textSub: '#94a3b8',  
  cyan: '#06b6d4',     
  blue: '#3b82f6',     
};

const AdminCustomers = ({ initialCustomers, orders = [], onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- FILTERS ---
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDay, setFilterDay] = useState('');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', 
    mobile: '', city: '', country: '', address: '', role: 'user'
  });

  // ==================================================================================
  // 1. DATA PREPARATION: MERGE CUSTOMERS + ADDRESSES
  // ==================================================================================
  const allMergedCustomers = useMemo(() => {
      const customerMap = new Map();
      initialCustomers.forEach(c => {
          customerMap.set(String(c.customer_id), { ...c });
      });

      if (caddress && Array.isArray(caddress)) {
          caddress.forEach(addr => {
              const addrUserId = String(addr.customer_id);
              if (customerMap.has(addrUserId)) {
                  const existing = customerMap.get(addrUserId);
                  customerMap.set(addrUserId, {
                      ...existing,
                      customer_city: addr.city,
                      customer_state: addr.state,
                      customer_country: addr.country,
                      address_line: addr.address_line,
                      has_custom_address: true
                  });
              } else {
                  customerMap.set(addrUserId, {
                      customer_id: addr.customer_id,
                      customer_full_name: `User ${addr.customer_id}`,
                      customer_email: 'no-email@record.com',
                      customer_image_url: '',
                      customer_created_date: addr.address_created_date || new Date().toISOString(),
                      customer_city: addr.city,
                      customer_state: addr.state,
                      customer_country: addr.country,
                      address_line: addr.address_line,
                      customer_is_active: true,
                      type: 'Manual',
                      is_placeholder: true
                  });
              }
          });
      }
      return Array.from(customerMap.values());
  }, [initialCustomers]);

  // ==================================================================================
  // 2. FILTER LOGIC (SEPARATE STREAMS)
  // ==================================================================================
  
  // Stream A: Filter ORDERS by Order Date (For Charts & Revenue)
  const filteredOrders = useMemo(() => {
      return orders.filter(o => {
          if (!filterYear && !filterMonth && !filterDay) return true;
          const d = new Date(o.order_date);
          if (isNaN(d.getTime())) return false;

          let matches = true;
          if (filterYear && d.getFullYear().toString() !== filterYear) matches = false;
          if (filterMonth && (d.getMonth() + 1).toString() !== filterMonth) matches = false;
          if (filterDay && d.getDate().toString() !== filterDay) matches = false;
          return matches;
      });
  }, [orders, filterYear, filterMonth, filterDay]);

  // Stream B: Filter CUSTOMERS by Join Date (For Total Customers KPI only)
  const filteredNewCustomers = useMemo(() => {
      return allMergedCustomers.filter(c => {
          if (!filterYear && !filterMonth && !filterDay) return true;
          const d = new Date(c.customer_created_date);
          if (isNaN(d.getTime())) return false;

          let matches = true;
          if (filterYear && d.getFullYear().toString() !== filterYear) matches = false;
          if (filterMonth && (d.getMonth() + 1).toString() !== filterMonth) matches = false;
          if (filterDay && d.getDate().toString() !== filterDay) matches = false;
          return matches;
      });
  }, [allMergedCustomers, filterYear, filterMonth, filterDay]);


  // ==================================================================================
  // 3. KPI & CHART CALCULATIONS (Driven by Filtered Data)
  // ==================================================================================
  const { kpis, chartData } = useMemo(() => {
    
    // KPI: Total Customers (Joined in selected period)
    const totalCustomers = filteredNewCustomers.length;

    // KPI: Active Customers (Status = true) - From the filtered cohort
    const activeCustomers = filteredNewCustomers.filter(c => c.customer_is_active === true).length;

    // --- CHARTS & REVENUE LOGIC (Uses Filtered ORDERS) ---
    const orderCounts = {};
    const revByMonth = {}; 
    const repeatCustByMonth = {};
    const customerRevenue = {}; 
    let returnedOrdersCount = 0;

    const nameMap = {};
    allMergedCustomers.forEach(c => {
        nameMap[String(c.customer_id)] = c.customer_full_name || `ID: ${c.customer_id}`;
    });

    filteredOrders.forEach(o => {
        const amount = Number(o.order_total_amount) || 0;
        const cid = String(o.customer_id);
        
        orderCounts[cid] = (orderCounts[cid] || 0) + 1;
        if(o.order_status === 'Returned') returnedOrdersCount++;

        const d = new Date(o.order_date);
        const monthKey = d.toLocaleString('default', { month: 'short' });
        
        if (o.order_status !== 'Cancelled' && o.order_status !== 'Returned') {
            revByMonth[monthKey] = (revByMonth[monthKey] || 0) + amount;
            let resolvedName = nameMap[cid] || cid;
            customerRevenue[resolvedName] = (customerRevenue[resolvedName] || 0) + amount;
        }
        repeatCustByMonth[monthKey] = (repeatCustByMonth[monthKey] || 0) + 1;
    });

    const repeatCustomers = Object.values(orderCounts).filter(count => count > 1).length;
    const returnRate = filteredOrders.length > 0 ? ((returnedOrdersCount / filteredOrders.length) * 100).toFixed(2) : 0;
    
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const topRevenueList = Object.entries(customerRevenue)
        .map(([name, val]) => ({ name, val })).sort((a,b) => b.val - a.val).slice(0, 5);
    const topOrderVolume = Object.entries(orderCounts)
        .map(([id, count]) => ({ name: nameMap[id] || id, count })).sort((a,b) => b.count - a.count).slice(0, 5);

    return {
        kpis: { totalCustomers, activeCustomers, repeatCustomers, returnRate },
        chartData: {
            revenueLine: { labels: monthLabels, data: monthLabels.map(m => revByMonth[m] || 0) },
            repeatBar: { labels: monthLabels, data: monthLabels.map(m => repeatCustByMonth[m] || 0) },
            topRevenue: { labels: topRevenueList.map(i => i.name), data: topRevenueList.map(i => i.val) },
            orderCount: { labels: topOrderVolume.map(i => i.name), data: topOrderVolume.map(i => i.count) }
        }
    };
  }, [filteredOrders, filteredNewCustomers, allMergedCustomers]);


  // ==================================================================================
  // 4. ZONE B: CUSTOMER LIST (SEARCH ONLY - Unfiltered by Date)
  // ==================================================================================
  const displayedCustomers = useMemo(() => {
      const lowerSearch = searchTerm.toLowerCase();
      const list = allMergedCustomers.filter(c => 
          (c.customer_full_name && c.customer_full_name.toLowerCase().includes(lowerSearch)) || 
          (c.customer_email && c.customer_email.toLowerCase().includes(lowerSearch)) ||
          (c.customer_id && String(c.customer_id).toLowerCase().includes(lowerSearch))
      );

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      return { 
          data: list.slice(startIndex, endIndex), 
          total: list.length 
      };
  }, [allMergedCustomers, searchTerm, currentPage]);

  const totalPages = Math.ceil(displayedCustomers.total / itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleCreateUser = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        firstName: formData.firstName, lastName: formData.lastName, email: formData.email,
        mobile: formData.mobile, city: formData.city, country: formData.country, address: formData.address,
        role: 'user', createdAt: new Date(), profileImage: '', customer_is_active: true
      });
      alert("Created Successfully!"); if(onUpdate) onUpdate(); setIsModalOpen(false);
    } catch(e){ alert(e.message); } finally{ setSaving(false); }
  };

  const years = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
  const months = Array.from({length: 12}, (_, i) => (i + 1).toString());
  const days = Array.from({length: 31}, (_, i) => (i + 1).toString());

  return (
    <div className="space-y-6 animate-fade-in-up font-sans pb-10" style={{ backgroundColor: THEME.bg }}>
      
      {/* HEADER + FILTERS */}
      <div className="flex flex-col gap-4 p-5 rounded-3xl border shadow-lg" style={{ backgroundColor: THEME.card, borderColor: THEME.border }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-xl font-bold px-2" style={{ color: THEME.textMain }}>Customer Database</h2>
                <p className="px-2 text-xs text-slate-400">Manage users and view cohort analytics</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: THEME.textSub }} />
                    <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search customers..." className="w-full pl-10 pr-4 py-2 rounded-xl focus:outline-none transition-all border" style={{ backgroundColor: '#041528', borderColor: THEME.border, color: THEME.textMain, caretColor: THEME.cyan }}/>
                </div>
                <button onClick={()=>setIsModalOpen(true)} className="px-4 py-2 rounded-xl font-bold shadow-lg flex gap-2 items-center justify-center transition-all w-full sm:w-auto text-white hover:opacity-90" style={{ backgroundColor: THEME.blue }}>
                    <Plus size={18}/> <span className="whitespace-nowrap">New User</span>
                </button>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center border-t pt-4 mt-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="text-xs font-semibold uppercase flex items-center gap-2" style={{ color: THEME.textSub }}><Filter size={14} className="text-cyan-400"/> Filter Analytics:</div>
            <div className="flex flex-wrap gap-2">
                <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="px-3 py-2 rounded-lg text-xs font-medium outline-none border cursor-pointer hover:bg-white/5 transition-colors" style={{ backgroundColor: THEME.bg, borderColor: THEME.border, color: THEME.textMain }}>
                    <option value="">Year: All</option>
                    {years.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="px-3 py-2 rounded-lg text-xs font-medium outline-none border cursor-pointer hover:bg-white/5 transition-colors" style={{ backgroundColor: THEME.bg, borderColor: THEME.border, color: THEME.textMain }}>
                    <option value="">Month: All</option>
                    {months.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
                <select value={filterDay} onChange={e=>setFilterDay(e.target.value)} className="px-3 py-2 rounded-lg text-xs font-medium outline-none border cursor-pointer hover:bg-white/5 transition-colors" style={{ backgroundColor: THEME.bg, borderColor: THEME.border, color: THEME.textMain }}>
                    <option value="">Day: All</option>
                    {days.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
                {(filterYear || filterMonth || filterDay) && <button onClick={()=>{setFilterYear(''); setFilterMonth(''); setFilterDay('');}} className="px-3 py-2 rounded-lg text-xs font-bold text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 border border-rose-400/20 transition-colors">Reset Filters</button>}
            </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[ 
            { label: 'Total Customers', val: kpis.totalCustomers, sub: filterYear ? `Joined in ${filterYear}` : 'Total Database' }, 
            { label: 'Active Customers', val: kpis.activeCustomers, sub: 'Status: Active' }, 
            { label: 'Repeat Customers', val: kpis.repeatCustomers, sub: '>1 Order' }, 
            { label: 'Return Rate %', val: kpis.returnRate, sub: 'Cohort Return Rate' },
        ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-3xl shadow-lg border text-center relative overflow-hidden group" style={{ backgroundColor: THEME.card, borderColor: THEME.border }}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-50"></div>
                <h3 className="text-3xl font-bold mb-1 transition-transform group-hover:scale-110" style={{ color: THEME.textMain }}>{item.val}</h3>
                <p className="text-sm font-medium uppercase tracking-wide" style={{ color: THEME.textSub }}>{item.label}</p>
                <p className="text-[10px] mt-1 opacity-60" style={{ color: THEME.textSub }}>{item.sub}</p>
            </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl shadow-lg border" style={{ backgroundColor: THEME.card, borderColor: THEME.border }}>
              <h4 className="text-sm font-bold uppercase mb-4 text-center" style={{ color: THEME.textMain }}>Customer Revenue by Month</h4>
              <div className="h-64 w-full"><Line key={JSON.stringify(chartData.revenueLine)} data={{ labels: chartData.revenueLine.labels, datasets: [{ label: 'Revenue', data: chartData.revenueLine.data, borderColor: THEME.blue, borderWidth: 2, tension: 0.4, pointRadius: 2, backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { display: false }, ticks: { color: THEME.textSub } }, x: { grid: { display: false }, ticks: { color: THEME.textSub } } } }} /></div>
          </div>
          <div className="p-5 rounded-3xl shadow-lg border" style={{ backgroundColor: THEME.card, borderColor: THEME.border }}>
              <h4 className="text-xs font-bold uppercase mb-4 text-center" style={{ color: THEME.textMain }}>Top Revenue by Customer</h4>
              <div className="h-64"><Bar key={JSON.stringify(chartData.topRevenue)} data={{ labels: chartData.topRevenue.labels, datasets: [{ data: chartData.topRevenue.data, backgroundColor: THEME.blue, barThickness: 15, borderRadius: 4 }] }} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display:false }, y: { grid: { display:false }, ticks:{ color:THEME.textSub, font:{size:10} } } } }} /></div>
          </div>
          <div className="p-5 rounded-3xl shadow-lg border" style={{ backgroundColor: THEME.card, borderColor: THEME.border }}>
              <h4 className="text-xs font-bold uppercase mb-4 text-center" style={{ color: THEME.textMain }}>Orders Per Customer</h4>
              <div className="h-64"><Bar key={JSON.stringify(chartData.orderCount)} data={{ labels: chartData.orderCount.labels, datasets: [{ data: chartData.orderCount.data, backgroundColor: THEME.blue, barThickness: 25, borderRadius: 4 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: {display:false}, ticks:{color:THEME.textSub, font:{size:10}} }, y: { ticks: {color:THEME.textSub}, grid: {display:false} } } }} /></div>
          </div>
          <div className="p-5 rounded-3xl shadow-lg border" style={{ backgroundColor: THEME.card, borderColor: THEME.border }}>
              <h4 className="text-xs font-bold uppercase mb-4 text-center" style={{ color: THEME.textMain }}>Activity by Month</h4>
              <div className="h-64"><Bar key={JSON.stringify(chartData.repeatBar)} data={{ labels: chartData.repeatBar.labels, datasets: [{ data: chartData.repeatBar.data, backgroundColor: THEME.cyan, barThickness: 25, borderRadius: 4 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: {display:false}, ticks:{color:THEME.textSub, font:{size:10}} }, y: { display:false } } }} /></div>
          </div>
      </div>

      {/* CUSTOMER LIST */}
      <div className="flex items-center justify-between mt-6 px-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
             All Customers <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-normal">{displayedCustomers.total}</span>
          </h3>
          <div className="flex gap-2">
              <button onClick={()=>setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors text-white"><ChevronLeft size={16}/></button>
              <button onClick={()=>setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors text-white"><ChevronRight size={16}/></button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
        {displayedCustomers.data.map((c) => (
            // --- UPDATED CARD CONTAINER: h-full allows cards to stretch equally ---
            <div key={c.customer_id} className="p-5 rounded-3xl border shadow-lg flex flex-col gap-4 relative group hover:-translate-y-1 transition-all duration-300 h-full" style={{ backgroundColor: THEME.card, borderColor: THEME.border }}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0"> {/* min-w-0 allows truncation in flex child */}
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0 border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: THEME.border, color: THEME.cyan }}>
                            {c.customer_image_url ? <img src={c.customer_image_url} className="w-full h-full object-cover" alt="user"/> : (c.customer_full_name?.[0] || 'U')}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-bold text-base truncate" title={c.customer_full_name} style={{ color: THEME.textMain }}>{c.customer_full_name}</div>
                            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: THEME.textSub }}>ID: {c.customer_id}</div>
                        </div>
                    </div>
                    {/* Fixed width for badges so they don't jump around */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        {c.type === 'User' ? 
                            <span className="px-2 py-0.5 rounded-full text-[10px] border flex gap-1 items-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}><ShieldCheck size={10}/> Reg</span> : 
                            <span className="px-2 py-0.5 rounded-full text-[10px] border flex gap-1 items-center" style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)', borderColor: THEME.border, color: THEME.textSub }}><User size={10}/> Man</span>
                        }
                        {c.customer_is_active ? 
                            <span className="px-2 py-0.5 rounded-full text-[10px] border flex gap-1 items-center bg-green-500/10 border-green-500/30 text-green-400"><CheckCircle size={10}/> Active</span> :
                            <span className="px-2 py-0.5 rounded-full text-[10px] border flex gap-1 items-center bg-rose-500/10 border-rose-500/30 text-rose-400"><XCircle size={10}/> Inactive</span>
                        }
                    </div>
                </div>
                
                <div className="w-full h-px bg-white/5"></div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm" style={{ color: THEME.textSub }}>
                        <Mail size={14} className="text-blue-500 shrink-0"/> <span className="truncate" title={c.customer_email}>{c.customer_email}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm" style={{ color: THEME.textSub }}>
                        <MapPin size={14} className="text-cyan-500 mt-1 shrink-0"/> 
                        <span className="line-clamp-2 text-xs leading-relaxed" title={c.address_line || `${c.customer_city}, ${c.customer_country}`}>
                            {c.address_line ? (
                                <span className="text-white font-medium">{c.address_line},<br/>{c.customer_city}, {c.customer_state}</span>
                            ) : (
                                <>{c.customer_city || 'Unknown'}, {c.customer_country}</>
                            )}
                        </span>
                    </div>
                </div>

                {/* mt-auto pushes this footer to the bottom of the card */}
                <div className="mt-auto pt-3 border-t flex justify-between items-center text-xs" style={{ borderColor: 'rgba(255,255,255,0.05)', color: THEME.textSub }}>
                    <span>Joined:</span>
                    <div className="flex items-center gap-1 font-medium text-white"><Calendar size={12}/> {c.customer_created_date?.substring(0,10) || 'N/A'}</div>
                </div>
            </div>
        ))}
        {displayedCustomers.data.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-10"><p>No customers found matching search.</p></div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
          <div className="flex justify-center mt-4">
              <span className="text-xs text-slate-500">Page {currentPage} of {totalPages}</span>
          </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg shadow-2xl p-6 md:p-8 animate-fade-in-up max-h-[90vh] overflow-y-auto scrollbar-none rounded-3xl border" style={{ backgroundColor: THEME.card, borderColor: THEME.border }}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b" style={{ borderColor: THEME.border }}>
                <h3 className="text-xl font-bold" style={{ color: THEME.textMain }}>Create New User</h3>
                <button onClick={()=>setIsModalOpen(false)} className="p-2 rounded-full transition-colors hover:bg-white/5" style={{ color: THEME.textSub }}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input placeholder="First Name" onChange={e=>setFormData({...formData, firstName:e.target.value})} className="w-full p-3 rounded-xl focus:outline-none border" style={{ backgroundColor: THEME.bg, borderColor: THEME.border, color: THEME.textMain }} required/>
                <input placeholder="Last Name" onChange={e=>setFormData({...formData, lastName:e.target.value})} className="w-full p-3 rounded-xl focus:outline-none border" style={{ backgroundColor: THEME.bg, borderColor: THEME.border, color: THEME.textMain }} required/>
              </div>
              <input placeholder="Email Address" type="email" onChange={e=>setFormData({...formData, email:e.target.value})} className="w-full p-3 rounded-xl focus:outline-none border" style={{ backgroundColor: THEME.bg, borderColor: THEME.border, color: THEME.textMain }} required/>
              <input placeholder="Password (Min 6 chars)" type="password" onChange={e=>setFormData({...formData, password:e.target.value})} className="w-full p-3 rounded-xl focus:outline-none border" style={{ backgroundColor: THEME.bg, borderColor: THEME.border, color: THEME.textMain }} required/>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input placeholder="City" onChange={e=>setFormData({...formData, city:e.target.value})} className="w-full p-3 rounded-xl focus:outline-none border" style={{ backgroundColor: THEME.bg, borderColor: THEME.border, color: THEME.textMain }}/>
                <input placeholder="Country" onChange={e=>setFormData({...formData, country:e.target.value})} className="w-full p-3 rounded-xl focus:outline-none border" style={{ backgroundColor: THEME.bg, borderColor: THEME.border, color: THEME.textMain }}/>
              </div>
              <div className="pt-4"><button type="submit" disabled={saving} className="w-full font-bold py-3.5 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 text-white hover:opacity-90" style={{ backgroundColor: THEME.blue }}>{saving ? <Loader className="animate-spin" size={20}/> : 'Create Account'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;