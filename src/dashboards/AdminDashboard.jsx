import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Line, Pie, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import {
  LayoutDashboard, ShoppingBag, Users, Package, Settings, FileText,
  BarChart2, User, Camera, Loader, Calendar, Ticket, MapPin, 
  Trophy, TrendingUp, AlertTriangle, Search, Crown, X // Removed Menu icon
} from 'lucide-react';
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";

import {
  customers as initialCustomers,
  products as initialProducts,
  orderItems as initialOrderItems,
  orders as initialStaticOrders,
  payments as initialPayments,
  caddress as initialAddresses 
} from "../data/dataUtils.js";

import AdminOrders from './AdminOrders';
import AdminProducts from './AdminProducts';
import AdminCustomers from './AdminCustomers';
import AdminAnalytics from './AdminAnalytics';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';

// ChartJS Setup
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
ChartJS.defaults.font.family = "'Inter', sans-serif";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);
  // Removed isMobileMenuOpen state

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  
  const [pincodeSearch, setPincodeSearch] = useState('');
  const [returnSearch, setReturnSearch] = useState('');

  const [adminProfile, setAdminProfile] = useState({ firstName: '', lastName: '', email: '', role: 'Admin', profileImage: '' });
  const [editFormData, setEditFormData] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState(initialCustomers);
  const [addresses, setAddresses] = useState(initialAddresses); 
  const [loadingData, setLoadingData] = useState(true);
    
  const [allItems, setAllItems] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', expiry: '' });

  const extractPincode = useCallback((addrString) => {
    if(!addrString) return "Unknown";
    const str = typeof addrString === 'string' ? addrString : JSON.stringify(addrString);
    const match = str.match(/\b\d{6}\b/);
    return match ? match[0] : (str.match(/\b\d{5}\b/) ? str.match(/\b\d{5}\b/)[0] : "Unknown");
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoadingData(true);
    try {
      const custSnap = await getDocs(collection(db, "customers"));
      const dbCust = custSnap.docs.map(d => ({ ...d.data(), customer_id: parseInt(d.id) || d.id }));
      const userSnap = await getDocs(collection(db, "users"));
      const realUsers = userSnap.docs.map(d => ({
        customer_id: d.id,
        customer_full_name: `${d.data().firstName || ''} ${d.data().lastName || ''}`.trim() || 'Unknown User',
        customer_email: d.data().email,
        customer_image_url: d.data().profileImage,
        customer_city: d.data().city || 'Hyderabad',
        customer_country: d.data().country || 'India',
        address: d.data().address || '',
        customer_created_date: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toLocaleDateString() : 'N/A',
        customer_is_active: true,
        type: 'User'
      }));
      const existingIds = new Set([...dbCust, ...realUsers].map(c => c.customer_id));
      const allCustomers = [...realUsers, ...dbCust, ...initialCustomers.filter(c => !existingIds.has(c.customer_id))];
      setCustomers(allCustomers);

      const customerNameMap = {};
      allCustomers.forEach(c => { 
          customerNameMap[c.customer_id] = c.customer_full_name || `Customer ${c.customer_id}`;
      });

      const prodSnap = await getDocs(collection(db, "products"));
      const dbProds = prodSnap.docs.map(d => ({ ...d.data(), product_id: parseInt(d.id) || d.id }));
      const dbProdIds = new Set(dbProds.map(p => p.product_id));
      const finalProducts = [...dbProds, ...initialProducts.filter(p => !dbProdIds.has(p.product_id))];
      setProducts(finalProducts);

      const staticOrderUserMap = {};
      if (initialStaticOrders) {
        initialStaticOrders.forEach(o => { staticOrderUserMap[o.order_id] = o.customer_id; });
      }

      const staticOrdersAggregation = {};
      const staticItemsArray = []; 

      if (initialOrderItems && initialOrderItems.length > 0) {
        initialOrderItems.forEach(item => {
          staticItemsArray.push(item);
          const oId = item.order_id;
          if (!staticOrdersAggregation[oId]) {
            let realCustId = staticOrderUserMap[oId];
            if (!realCustId && allCustomers.length > 0) {
              const index = oId % allCustomers.length;
              realCustId = allCustomers[index].customer_id;
            }
            const custName = customerNameMap[realCustId] || `Customer ${realCustId || oId}`;
            const originalOrder = initialStaticOrders.find(o => o.order_id === oId);
            const orderDate = originalOrder ? originalOrder.order_created_date : new Date().toISOString();
            
            const shippingAddrId = originalOrder ? originalOrder.shipping_address_id : null;

            staticOrdersAggregation[oId] = {
              order_id: oId,
              order_date: new Date(orderDate).toISOString().split('T')[0],
              customer_id: custName,
              order_status: item.is_returned ? "Returned" : "Delivered",
              order_total_amount: 0,
              payment_status: "Paid",
              isFirebase: false,
              payment_method: "Credit Card",
              shipping_address_id: shippingAddrId 
            };
            const payment = initialPayments.find(p => p.order_id === oId);
            if (payment) staticOrdersAggregation[oId].payment_method = payment.payment_method;
          }
          staticOrdersAggregation[oId].order_total_amount += (item.total_amount || 0);
          if (item.is_returned) staticOrdersAggregation[oId].order_status = "Returned";
        });
      }
      const calculatedStaticOrders = Object.values(staticOrdersAggregation);

      const firebaseSnap = await getDocs(collection(db, "OrderItems"));
      const firebaseItemsArray = [];
      const firebaseOrders = firebaseSnap.docs.map(d => {
        const data = d.data();
        const custName = customerNameMap[data.userId] || data.email || 'Guest';
        
        if(data.items && Array.isArray(data.items)) {
            data.items.forEach(i => {
                firebaseItemsArray.push({
                    product_id: i.product_id || i.id,
                    quantity: i.quantity || 1,
                    product_name: i.name || i.product_name
                });
            });
        }

        return {
          order_id: d.id,
          order_date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          order_status: data.orderStatus || 'Pending',
          order_total_amount: Number(data.totalAmount) || 0,
          customer_id: custName,
          payment_status: data.paymentStatus || 'Paid',
          isFirebase: true,
          payment_method: data.paymentMethod || 'Unknown',
          address_snapshot: data.address,
          userId: data.userId 
        };
      });

      setOrders([...calculatedStaticOrders, ...firebaseOrders].sort((a, b) => new Date(b.order_date) - new Date(a.order_date)));
      setAllItems([...staticItemsArray, ...firebaseItemsArray]);

      const couponsSnap = await getDocs(collection(db, "coupons"));
      setCoupons(couponsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (err) { console.error("Error fetching data:", err); } finally { setLoadingData(false); }
  }, []);

  // ✅ UPDATED PROFILE FETCHING FOR ADMIN
  useEffect(() => {
    fetchAllData();
    const fetchProfile = async () => {
      if (auth.currentUser) {
        try {
          // Look in 'adminDetails' collection first
          const snap = await getDoc(doc(db, "adminDetails", auth.currentUser.uid));
          if (snap.exists()) {
            setAdminProfile({ ...snap.data(), role: 'Admin' });
          } else {
            console.log("Admin profile not found in adminDetails.");
          }
        } catch (e) { console.error("Error fetching admin profile", e); }
      }
    };
    fetchProfile();
  }, [fetchAllData]);

  // ✅ UPDATED PROFILE SAVING FOR ADMIN
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      if (auth.currentUser) {
        // Update 'adminDetails' collection
        await updateDoc(doc(db, "adminDetails", auth.currentUser.uid), editFormData);
        setAdminProfile(p => ({ ...p, ...editFormData }));
        setShowProfileModal(false);
      }
    } catch (e) { alert("Error updating profile"); } finally { setIsSavingProfile(false); }
  };

  const handleAddCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount || !newCoupon.expiry) return alert("Fill all fields");
    try {
      await addDoc(collection(db, "coupons"), {
        code: newCoupon.code.toUpperCase(),
        discount: Number(newCoupon.discount),
        expiryDate: new Date(newCoupon.expiry),
        createdAt: serverTimestamp(),
        isActive: true
      });

      await addDoc(collection(db, "notifications"), {
        type: "user",
        subType: "coupon",
        recipientId: "all",
        message: `🔥 New Coupon Alert! Use code ${newCoupon.code.toUpperCase()} for ${newCoupon.discount}% OFF! Expires: ${new Date(newCoupon.expiry).toLocaleDateString()}`,
        createdAt: serverTimestamp(),
        read: false
      });

      setNewCoupon({ code: '', discount: '', expiry: '' });
      fetchAllData();
      alert("Coupon Created & Notification Sent!");
    } catch (error) { console.error(error); }
  };

  const handleDeleteCoupon = async (id) => {
    if (window.confirm("Delete this coupon?")) {
      await deleteDoc(doc(db, "coupons", id));
      fetchAllData();
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus, userId) => {
      let recipientId = userId;
      if (!recipientId) {
          try {
              const orderSnap = await getDoc(doc(db, "OrderItems", orderId));
              if(orderSnap.exists()) recipientId = orderSnap.data().userId;
          } catch(e) { console.error(e); }
      }

      if(recipientId) {
          try {
              await addDoc(collection(db, "notifications"), {
                  type: "user",
                  subType: "order_update",
                  recipientId: recipientId,
                  message: `Your Order #${orderId.toString().slice(0,8)} status has been updated to: ${newStatus}`,
                  createdAt: serverTimestamp(),
                  read: false
              });
          } catch(e) { console.error("Error sending notification:", e); }
      }
      fetchAllData(); 
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const d = new Date(o.order_date);
      const yearMatch = selectedYear ? d.getFullYear().toString() === selectedYear : true;
      const monthMatch = selectedMonth ? (d.getMonth() + 1).toString().padStart(2, '0') === selectedMonth : true;
      const weekMatch = selectedWeek ? Math.ceil(d.getDate() / 7).toString() === selectedWeek : true;
      const dayMatch = selectedDay ? d.getDate().toString() === selectedDay : true;
      return yearMatch && monthMatch && weekMatch && dayMatch;
    });
  }, [orders, selectedYear, selectedMonth, selectedWeek, selectedDay]);

  const addressIdMap = useMemo(() => {
    const map = new Map();
    addresses.forEach(a => map.set(a.address_id, a.pincode));
    return map;
  }, [addresses]);

  const recentReturns = useMemo(() => {
    let returns = filteredOrders
      .filter(o => o.order_status === "Returned")
      .map(order => {
        let pincode = "Unknown";
        if (order.shipping_address_id && addressIdMap.has(order.shipping_address_id)) {
          pincode = addressIdMap.get(order.shipping_address_id);
        } else if (order.address_snapshot) {
          pincode = extractPincode(order.address_snapshot);
        }
        return { ...order, pincode };
      });

    if (returnSearch) {
      const lowerSearch = returnSearch.toLowerCase();
      returns = returns.filter(o => 
        (o.pincode && o.pincode.toLowerCase().includes(lowerSearch)) ||
        (o.customer_id && o.customer_id.toLowerCase().includes(lowerSearch)) ||
        o.order_id.toString().includes(lowerSearch)
      );
    }
    return returns.sort((a, b) => new Date(b.order_date) - new Date(a.order_date)).slice(0, 5);
  }, [filteredOrders, addressIdMap, extractPincode, returnSearch]);

  const advancedStats = useMemo(() => {
      const itemCounts = {};
      allItems.forEach(item => {
          const pid = String(item.product_id); 
          const qty = parseInt(item.ordered_quantity || item.quantity || 1);
          itemCounts[pid] = (itemCounts[pid] || 0) + qty;
      });

      let topProductId = null;
      let maxQty = 0;
      Object.entries(itemCounts).forEach(([pid, qty]) => {
          if(qty > maxQty) { maxQty = qty; topProductId = pid; }
      });

      const topProduct = products.find(p => String(p.product_id) === topProductId);

      const pincodeStatsData = {};
      filteredOrders.forEach(order => {
          let pincode = "Unknown";
          if(order.shipping_address_id && addressIdMap.has(order.shipping_address_id)) {
              pincode = addressIdMap.get(order.shipping_address_id);
          } else if(order.address_snapshot) {
              pincode = extractPincode(order.address_snapshot);
          }

          if(pincode !== "Unknown") {
              if(!pincodeStatsData[pincode]) {
                  pincodeStatsData[pincode] = { sales: 0, count: 0, returns: 0, profit: 0 };
              }
              if(order.order_status !== "Cancelled" && order.order_status !== "Returned") {
                  const amount = Number(order.order_total_amount);
                  pincodeStatsData[pincode].sales += amount;
                  pincodeStatsData[pincode].profit += (amount * 0.35);
              }
              if(order.order_status === "Returned") {
                  pincodeStatsData[pincode].returns += 1;
              }
              pincodeStatsData[pincode].count += 1;
          }
      });

      const pincodeStats = Object.entries(pincodeStatsData)
        .map(([pin, data]) => ({ pincode: pin, ...data }))
        .sort((a,b) => b.sales - a.sales);

      const customerStats = {};
      filteredOrders.forEach(o => {
          if(o.order_status !== 'Cancelled' && o.order_status !== 'Returned') {
              const key = o.userId || o.customer_id; 
              if(!customerStats[key]) {
                  customerStats[key] = { spend: 0, orders: 0, name: o.customer_id, id: o.userId };
              }
              customerStats[key].spend += Number(o.order_total_amount);
              customerStats[key].orders += 1;
          }
      });

      let topCustKey = null;
      let maxCustSpend = 0;
      Object.entries(customerStats).forEach(([key, stats]) => {
          if(stats.spend > maxCustSpend) {
              maxCustSpend = stats.spend;
              topCustKey = key;
          }
      });

      let topCustomer = null;
      if(topCustKey) {
          const stats = customerStats[topCustKey];
          const custDetails = customers.find(c => String(c.customer_id) === String(stats.id)) 
                            || customers.find(c => c.customer_full_name === stats.name);
          
          topCustomer = {
              firstName: custDetails ? custDetails.customer_full_name.split(' ')[0] : stats.name.split(' ')[0],
              lastName: custDetails ? (custDetails.customer_full_name.split(' ').slice(1).join(' ') || '') : '',
              profileImage: custDetails?.customer_image_url || null,
              spend: stats.spend,
              orders: stats.orders
          };
      }

      return { topProduct, maxQty, pincodeStats, topCustomer };
  }, [allItems, products, filteredOrders, addressIdMap, extractPincode, customers]);

  const displayedPincodeStats = useMemo(() => {
    if (!pincodeSearch) return advancedStats.pincodeStats.slice(0, 5);
    return advancedStats.pincodeStats.filter(item => item.pincode.includes(pincodeSearch));
  }, [advancedStats.pincodeStats, pincodeSearch]);

  const visualData = useMemo(() => {
    let labels = [];
    let revenueData = [];
    let ordersData = [];
    const paymentMethodRevenue = {};
    const categoryRevenue = {};

    const year = selectedYear ? parseInt(selectedYear) : new Date().getFullYear();
    const month = selectedMonth ? parseInt(selectedMonth) : new Date().getMonth() + 1;

    if (selectedMonth) {
      const daysInMonth = new Date(year, month, 0).getDate();
      if (selectedWeek) {
        const weekNum = parseInt(selectedWeek);
        const startDay = (weekNum - 1) * 7 + 1;
        const endDay = Math.min(startDay + 6, daysInMonth);
        labels = Array.from({ length: (endDay - startDay + 1) }, (_, i) => `${startDay + i}`);
        revenueData = new Array(labels.length).fill(0);
        ordersData = new Array(labels.length).fill(0);
        filteredOrders.forEach(o => {
          const d = new Date(o.order_date);
          const idx = d.getDate() - startDay;
          if (idx >= 0 && idx < revenueData.length) {
            ordersData[idx] += 1;
            if (o.order_status !== 'Returned' && o.order_status !== 'Cancelled') revenueData[idx] += Number(o.order_total_amount);
          }
        });
      } else if (selectedDay) {
        labels = [`${selectedMonth}/${selectedDay}`];
        ordersData = [filteredOrders.length];
        revenueData = [filteredOrders.filter(o => o.order_status !== 'Returned' && o.order_status !== 'Cancelled').reduce((sum, o) => sum + Number(o.order_total_amount), 0)];
      } else {
        labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
        revenueData = new Array(daysInMonth).fill(0);
        ordersData = new Array(daysInMonth).fill(0);
        filteredOrders.forEach(o => {
          const day = new Date(o.order_date).getDate();
          ordersData[day - 1] += 1;
          if (o.order_status !== 'Returned' && o.order_status !== 'Cancelled') revenueData[day - 1] += Number(o.order_total_amount);
        });
      }
    } else {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      revenueData = new Array(12).fill(0);
      ordersData = new Array(12).fill(0);
      filteredOrders.forEach(o => {
        const mIdx = new Date(o.order_date).getMonth();
        ordersData[mIdx] += 1;
        if (o.order_status !== 'Returned' && o.order_status !== 'Cancelled') revenueData[mIdx] += Number(o.order_total_amount);
      });
    }
    const validOrderIds = new Set(filteredOrders.filter(o => o.order_status !== 'Returned' && o.order_status !== 'Cancelled').map(o => o.order_id));
    filteredOrders.forEach(o => { if (validOrderIds.has(o.order_id)) { const pm = o.payment_method; if (pm && pm !== 'Unknown') paymentMethodRevenue[pm] = (paymentMethodRevenue[pm] || 0) + Number(o.order_total_amount); } });
    const productMap = new Map(products.map(p => [p.product_id, p.product_category || 'Other']));
    initialOrderItems.forEach(item => { if (validOrderIds.has(item.order_id)) { const cat = productMap.get(item.product_id); if (cat && cat !== 'Other' && cat !== 'Unknown') categoryRevenue[cat] = (categoryRevenue[cat] || 0) + Number(item.total_amount); } });
    const sortedCategories = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { trend: { labels, revenue: revenueData, orders: ordersData }, paymentMethod: { labels: Object.keys(paymentMethodRevenue), data: Object.values(paymentMethodRevenue) }, categoryRevenue: { labels: sortedCategories.map(c => c[0]), data: sortedCategories.map(c => c[1]) } };
  }, [filteredOrders, selectedYear, selectedMonth, selectedWeek, selectedDay, products]);

  const totalRevenue = filteredOrders.filter(o => o.order_status !== "Cancelled" && o.order_status !== "Returned").reduce((sum, o) => sum + (Number(o.order_total_amount) || 0), 0);
  const netRevenue = totalRevenue;
  const profit = netRevenue * 0.35;
  const totalOrders = filteredOrders.length;
  const returnedOrders = filteredOrders.filter(o => o.order_status === "Returned").length;
  const returnRate = totalOrders > 0 ? ((returnedOrders / totalOrders) * 100).toFixed(2) : 0;

  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const months = [{ value: '01', label: 'January' }, { value: '02', label: 'February' }, { value: '03', label: 'March' }, { value: '04', label: 'April' }, { value: '05', label: 'May' }, { value: '06', label: 'June' }, { value: '07', label: 'July' }, { value: '08', label: 'August' }, { value: '09', label: 'September' }, { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }];
  const weeks = [1, 2, 3, 4];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const navItems = [{ id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' }, { id: 'orders', icon: ShoppingBag, label: 'Orders' }, { id: 'products', icon: Package, label: 'Products' }, { id: 'customers', icon: Users, label: 'Customers' }, { id: 'analytics', icon: BarChart2, label: 'Analytics' }, { id: 'reports', icon: FileText, label: 'Reports' }, { id: 'coupons', icon: Ticket, label: 'Coupons' }, { id: 'settings', icon: Settings, label: 'Settings' }];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full font-sans text-slate-200 bg-[#0f172a] selection:bg-cyan-500/30 relative">
      
      {/* --- DESKTOP TOP NAVBAR --- */}
      <nav className="h-20 bg-[#1e293b]/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-10 shrink-0 relative z-20">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-white">GSH&nbsp;<span className="text-cyan-400">Admin</span></h2>
        </div>

        <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1.5 rounded-full border border-white/5">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${activeSection === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon size={16} /> <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setEditFormData(adminProfile); setShowProfileModal(true); }}>
            <div className="text-right hidden md:block"><div className="text-sm font-semibold text-white">{adminProfile.firstName} {adminProfile.lastName}</div><div className="text-[10px] text-slate-500 uppercase tracking-wider">{adminProfile.role}</div></div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-[2px]">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">{adminProfile.profileImage ? <img src={adminProfile.profileImage} className="w-full h-full object-cover" alt="p" /> : <span className="font-bold text-white text-sm">{adminProfile.firstName?.[0]}</span>}</div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- ✅ NEW: MOBILE HORIZONTAL TOGGLE MENU --- */}
      <div className="lg:hidden sticky top-0 z-30 w-full bg-[#1e293b]/95 backdrop-blur-xl border-b border-white/10 overflow-x-auto flex items-center gap-3 px-4 py-3 scrollbar-hide">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveSection(item.id)} 
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-all duration-200 
                ${activeSection === item.id 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
            >
              <item.icon size={14} /> <span>{item.label}</span>
            </button>
          ))}
      </div>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative z-10 bg-[#0f172a]">
        {loadingData ? (
          <div className="flex h-full items-center justify-center flex-col gap-4 text-slate-500 animate-pulse">
            <Loader className="animate-spin text-cyan-500" size={40} /> <span className="text-sm tracking-widest uppercase">Syncing Database...</span>
          </div>
        ) : (
          <div className="max-w-[1600px] mx-auto">
            {activeSection === 'dashboard' && (
              <div className="space-y-6 animate-fade-in-up">
                
                {/* Header & Filters */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Executive Overview</h1>
                    <p className="text-slate-400 text-sm">{selectedDay ? `Daily: ${selectedMonth}/${selectedDay}/${selectedYear}` : selectedYear ? `Filtered: ${selectedYear}` : "All-Time Overview"}</p>
                  </div>
                  {/* Single Line Filters for Mobile */}
                  <div className="flex overflow-x-auto gap-2 bg-[#1e293b] p-1.5 rounded-lg border border-white/5 shadow-sm items-center scrollbar-hide w-full sm:w-auto">
                      <select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth(''); setSelectedWeek(''); setSelectedDay(''); }} className="bg-transparent text-white text-xs font-medium px-2 py-1 outline-none cursor-pointer [&>option]:bg-slate-900 min-w-fit"><option value="">All Years</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                      <div className="w-px bg-white/10 h-4 mx-1 shrink-0"></div>
                      <select value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setSelectedWeek(''); setSelectedDay(''); }} className="bg-transparent text-white text-xs font-medium px-2 py-1 outline-none cursor-pointer [&>option]:bg-slate-900 min-w-fit"><option value="">All Months</option>{months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
                      {selectedMonth && <><div className="w-px bg-white/10 h-4 mx-1 shrink-0"></div><select value={selectedWeek} onChange={(e) => { setSelectedWeek(e.target.value); setSelectedDay(''); }} className="bg-transparent text-white text-xs font-medium px-2 py-1 outline-none cursor-pointer [&>option]:bg-slate-900 min-w-fit"><option value="">All Weeks</option>{weeks.map(w => <option key={w} value={w}>Week {w}</option>)}</select></>}
                      {selectedMonth && <><div className="w-px bg-white/10 h-4 mx-1 shrink-0"></div><select value={selectedDay} onChange={(e) => { setSelectedDay(e.target.value); setSelectedWeek(''); }} className="bg-transparent text-white text-xs font-medium px-2 py-1 outline-none cursor-pointer [&>option]:bg-slate-900 min-w-fit"><option value="">All Days</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select></>}
                      {(selectedMonth || selectedYear) && <button onClick={() => { setSelectedYear(''); setSelectedMonth(''); setSelectedWeek(''); setSelectedDay(''); }} className="text-[10px] text-slate-500 hover:text-white px-2 border-l border-white/10 ml-1 shrink-0">Reset</button>}
                  </div>
                 </div>

                 {/* KPI Cards Grid - Responsive */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: 'Gross Income' },
                    { label: 'Net Revenue', value: `₹${netRevenue.toLocaleString('en-IN')}`, sub: 'After Returns' },
                    { label: 'Total Profit', value: `₹${profit.toLocaleString('en-IN')}`, sub: 'Est. Margin' },
                    { label: 'Total Orders', value: totalOrders, sub: 'All Status' },
                    { label: 'Total Customers', value: customers.length.toLocaleString('en-IN'), sub: 'Active Base' },
                    { label: 'Return Rate %', value: `${returnRate}%`, sub: 'Of Total Orders' },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-[#1e293b] border border-blue-900/30 p-4 rounded-xl shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80"></div>
                      <h3 className="text-2xl font-bold text-white mt-1 group-hover:scale-105 transition-transform origin-left">{stat.value}</h3>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mt-1">{stat.label}</p>
                    </div>
                  ))}
                 </div>

                 {/* Top Performer Cards */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Highest Purchased Customer */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex items-center gap-6 shadow-xl">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Users size={120} /></div>
                        {advancedStats.topCustomer ? (
                            <>
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-slate-800 p-1 border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                                        {advancedStats.topCustomer.profileImage ? 
                                            <img src={advancedStats.topCustomer.profileImage} alt="User" className="w-full h-full rounded-full object-cover"/> :
                                            <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400">{advancedStats.topCustomer.firstName?.[0]}</div>
                                        }
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-amber-500 text-black p-1.5 rounded-full shadow-lg"><Crown size={14} fill="black"/></div>
                                </div>
                                <div>
                                    <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-1">Highest Spender</p>
                                    <h3 className="text-2xl font-bold text-white">{advancedStats.topCustomer.firstName} {advancedStats.topCustomer.lastName}</h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div><p className="text-xs text-slate-400">Total Spent</p><p className="text-lg font-bold text-emerald-400">₹{advancedStats.topCustomer.spend.toLocaleString()}</p></div>
                                        <div className="w-px h-8 bg-slate-700"></div>
                                        <div><p className="text-xs text-slate-400">Orders</p><p className="text-lg font-bold text-white">{advancedStats.topCustomer.orders}</p></div>
                                    </div>
                                </div>
                            </>
                        ) : <div className="text-slate-500 flex items-center gap-2"><Loader className="animate-spin"/> Calculating Top Customer...</div>}
                    </div>
                    {/* Placeholder for second card if needed */}
                    <div className="hidden lg:block"></div> 
                 </div>

                 {/* Charts Grid - Responsive Stacking */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-[#1e293b] border border-blue-900/20 rounded-xl p-5 shadow-xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h4 className="text-slate-300 text-sm font-bold">Net Revenue Trend</h4>
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div><span className="text-emerald-400 text-xs font-bold">Revenue</span></div>
                        </div>
                        <div className="h-64 w-full relative z-10">
                            <Line data={{ labels: visualData.trend.labels, datasets: [{ label: 'Net Revenue', data: visualData.trend.revenue, borderColor: '#34d399', borderWidth: 3, backgroundColor: 'rgba(52, 211, 153, 0.1)', fill: true, tension: 0.4, pointRadius: 4 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255, 255, 255, 0.05)', borderDash: [5, 5] }, ticks: { color: '#64748b', font: { size: 10 }, callback: (val) => '₹' + val.toLocaleString('en-IN') } }, x: { grid: { display: false }, ticks: { color: '#64748b' } } } }} />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border border-indigo-500/30 rounded-xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
                        <div className="absolute top-0 right-0 p-3"><Trophy className="text-yellow-400 animate-pulse" size={24}/></div>
                        <h4 className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-4">Most Saleable Item</h4>
                        
                        {advancedStats.topProduct ? (
                            <>
                                <div className="w-32 h-32 rounded-lg bg-slate-900 border-2 border-indigo-500/50 mb-4 overflow-hidden shadow-lg relative group">
                                    <img src={advancedStats.topProduct.image_url} alt="Top Product" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{advancedStats.topProduct.product_name}</h3>
                                <p className="text-indigo-300 text-sm mb-3">{advancedStats.topProduct.product_category}</p>
                                <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-full border border-indigo-500/20">
                                    <div className="text-center"><p className="text-[10px] text-slate-400 uppercase">Sold</p><p className="text-lg font-bold text-white">{advancedStats.maxQty}</p></div>
                                    <div className="w-px h-6 bg-white/10"></div>
                                    <div className="text-center"><p className="text-[10px] text-slate-400 uppercase">Revenue</p><p className="text-lg font-bold text-emerald-400">₹{(advancedStats.maxQty * advancedStats.topProduct.selling_unit_price).toLocaleString('en-IN')}</p></div>
                                </div>
                            </>
                        ) : (
                            <div className="text-slate-500 italic">No sales data available</div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#1e293b] border border-blue-900/20 rounded-xl p-5 shadow-xl h-72">
                        <h4 className="text-slate-300 text-sm font-bold mb-4">Revenue by Payment Method</h4>
                        <div className="h-full pb-6"><Doughnut data={{ labels: visualData.paymentMethod.labels, datasets: [{ data: visualData.paymentMethod.data, backgroundColor: ['#3b82f6', '#06b6d4', '#8b5cf6', '#d946ef', '#f43f5e'], borderWidth: 0 }] }} options={{ maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 10 } } } } }} /></div>
                    </div>
                    <div className="bg-[#1e293b] border border-blue-900/20 rounded-xl p-5 shadow-xl h-72">
                          <h4 className="text-slate-300 text-sm font-bold mb-4">Revenue by Category</h4>
                          <div className="h-full pb-6"><Bar data={{ labels: visualData.categoryRevenue.labels, datasets: [{ label: 'Revenue', data: visualData.categoryRevenue.data, backgroundColor: '#06b6d4', borderRadius: 4 }] }} options={{ indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { grid: { display: false }, ticks: { color: '#94a3b8' } } } }} /></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Regional Performance - Scrollable Table */}
                    <div className="bg-[#1e293b] border border-blue-900/20 rounded-xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                               <h3 className="text-lg font-bold text-white flex items-center gap-2"><MapPin size={20} className="text-blue-500"/> Regional Performance</h3>
                               <p className="text-xs text-slate-400 mt-1">Breakdown of Sales & Profitability by delivery area</p>
                            </div>
                            <div className="relative group w-full md:w-auto">
                               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                 <Search size={14} className="text-slate-400 group-focus-within:text-blue-500 transition-colors"/>
                               </div>
                               <input 
                                 type="text" 
                                 placeholder="Search Pincode..." 
                                 value={pincodeSearch}
                                 onChange={(e) => setPincodeSearch(e.target.value)}
                                 className="bg-slate-900/50 border border-white/10 text-white text-xs rounded-full pl-9 pr-4 py-2 outline-none focus:border-blue-500 focus:bg-slate-900 transition-all w-full md:w-48"
                               />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead>
                                    <tr className="bg-slate-900/50 text-xs uppercase text-slate-400 font-semibold tracking-wider">
                                        <th className="p-4">Pincode</th>
                                        <th className="p-4 text-center">Orders</th>
                                        <th className="p-4 text-right">Total Sales</th>
                                        <th className="p-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {displayedPincodeStats.length > 0 ? (
                                        displayedPincodeStats.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-mono text-slate-300"><span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{row.pincode}</span></td>
                                                <td className="p-4 text-center text-white">{row.count}</td>
                                                <td className="p-4 text-right font-bold text-emerald-400">₹{row.sales.toLocaleString('en-IN')}</td>
                                                <td className="p-4 text-center">
                                                    {row.returns > 2 ? <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-1 rounded border border-rose-500/20 font-bold uppercase">High Returns</span> 
                                                    : <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 font-bold uppercase">Healthy</span>}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" className="p-8 text-center text-slate-500 italic">No data found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Returns - Scrollable Table */}
                    <div className="bg-[#1e293b] border border-rose-900/20 rounded-xl overflow-hidden shadow-xl">
                      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <AlertTriangle size={20} className="text-rose-500" /> Recent Return Items
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">Latest orders marked as Returned</p>
                        </div>
                        <div className="relative group w-full md:w-auto">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                             <Search size={14} className="text-slate-400 group-focus-within:text-rose-500 transition-colors"/>
                           </div>
                           <input 
                             type="text" 
                             placeholder="Search ID/Pincode..." 
                             value={returnSearch}
                             onChange={(e) => setReturnSearch(e.target.value)}
                             className="bg-slate-900/50 border border-white/10 text-white text-xs rounded-full pl-9 pr-4 py-2 outline-none focus:border-rose-500 focus:bg-slate-900 transition-all w-full md:w-48"
                           />
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                          <thead>
                            <tr className="bg-rose-900/10 text-xs uppercase text-rose-200/70 font-semibold tracking-wider">
                              <th className="p-4">Pincode</th>
                              <th className="p-4">Customer</th>
                              <th className="p-4">Refund</th>
                              <th className="p-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm">
                            {recentReturns.length > 0 ? (
                              recentReturns.map((order) => (
                                <tr key={order.order_id} className="hover:bg-white/5 transition-colors group">
                                  <td className="p-4 font-mono text-slate-300">
                                    <span className="text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">{order.pincode}</span>
                                  </td>
                                  <td className="p-4 text-white font-medium max-w-[100px] truncate" title={order.customer_id}>{order.customer_id}</td>
                                  <td className="p-4 font-bold text-white">₹{Number(order.order_total_amount).toLocaleString('en-IN')}</td>
                                  <td className="p-4 text-center">
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/20">
                                      Returned
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="p-8 text-center text-slate-500 italic">No recent returns found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                </div>

              </div>
            )}

            {activeSection === 'products' && <AdminProducts initialProducts={products} orders={orders} orderItems={initialOrderItems} payments={initialPayments} onUpdate={fetchAllData} />}
            {activeSection === 'orders' && <AdminOrders initialOrders={orders} onUpdate={fetchAllData} onStatusChange={handleOrderStatusUpdate} />}
            {activeSection === 'customers' && <AdminCustomers initialCustomers={customers} orders={orders} onUpdate={fetchAllData} />}
            {activeSection === 'analytics' && <AdminAnalytics orders={filteredOrders} />}
            {activeSection === 'reports' && <AdminReports orders={filteredOrders} products={products} customers={customers} />}
            {activeSection === 'settings' && <AdminSettings />}

            {activeSection === 'coupons' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="bg-[#1e293b] border border-white/10 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-white mb-4">Create New Coupon</h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input type="text" placeholder="Code (e.g. SUMMER50)" value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })} className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg flex-1 outline-none focus:border-blue-500" />
                    <input type="number" placeholder="Discount %" value={newCoupon.discount} onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })} className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg w-32 outline-none focus:border-blue-500" />
                    <input type="datetime-local" value={newCoupon.expiry} onChange={(e) => setNewCoupon({ ...newCoupon, expiry: e.target.value })} className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg outline-none focus:border-blue-500" />
                    <button onClick={handleAddCoupon} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-colors">Create</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="bg-[#1e293b] border border-white/10 p-4 rounded-xl flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                      <div><h4 className="font-bold text-xl text-white tracking-wider">{coupon.code}</h4><p className="text-emerald-400 font-bold">{coupon.discount}% OFF</p><p className="text-xs text-slate-500 mt-1">Expires: {coupon.expiryDate?.toDate ? coupon.expiryDate.toDate().toLocaleString() : new Date(coupon.expiryDate).toLocaleString()}</p></div>
                      <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 bg-slate-800 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 flex justify-end relative z-10">
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
            </div>
            <div className="px-8 pb-8 overflow-y-auto space-y-6 relative z-10 -mt-6">
              <div className="flex flex-col items-center">
                <div className="relative group w-28 h-28 mb-4">
                  <div className="w-full h-full rounded-full border-4 border-[#0f172a] shadow-xl overflow-hidden bg-slate-800">{editFormData.profileImage ? <img src={editFormData.profileImage} className="w-full h-full object-cover" alt="p" /> : <User className="w-full h-full p-6 text-slate-600" />}</div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-500 shadow-lg border-4 border-[#0f172a]"><Camera size={16} className="text-white" /><input type="file" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) { const r = new FileReader(); r.onloadend = () => setEditFormData(p => ({ ...p, profileImage: r.result })); r.readAsDataURL(file) } }} /></label>
                </div>
                <h3 className="text-xl font-bold text-white">Edit Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input value={editFormData.firstName || ''} onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })} placeholder="First Name" className="bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
                <input value={editFormData.lastName || ''} onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })} placeholder="Last Name" className="bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
              </div>
              <input value={editFormData.mobile || ''} onChange={e => setEditFormData({ ...editFormData, mobile: e.target.value })} placeholder="Phone Number" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
              <input value={editFormData.address || ''} onChange={e => setEditFormData({ ...editFormData, address: e.target.value })} placeholder="Address" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
              <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all">{isSavingProfile ? <Loader className="animate-spin m-auto" size={20} /> : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 

export default AdminDashboard;