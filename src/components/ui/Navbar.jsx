import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  doc, getDoc, collection, query, where, onSnapshot, deleteDoc, updateDoc, addDoc, serverTimestamp 
} from "firebase/firestore";
import { auth, db } from '../../firebase'; 
import { 
  FaUser, FaSearch, FaShoppingCart, FaHome, FaThLarge, FaUserCircle, FaSignOutAlt, FaBell, FaPhone 
} from 'react-icons/fa';
import { clearCart, setCart } from "../../slices/cartSlice";
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Ticket, Package, Info, X, Loader, CheckCircle, Truck, AlertTriangle, Trash2 } from 'lucide-react';

// --- Notifications Component (Best Mobile Version) ---
const NavbarNotifications = ({ user, isAdmin, isSuperAdmin, onUpdateData }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    let q;
    if (isAdmin || isSuperAdmin) {
      q = query(collection(db, "notifications"), where("type", "==", "admin"));
    } else {
      q = query(
        collection(db, "notifications"), 
        where("recipientId", "in", [user.uid, "all"])
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredNotes = (isAdmin || isSuperAdmin) ? notes : notes.filter(n => n.type !== 'admin');
      filteredNotes.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(filteredNotes);
    });
    return () => unsubscribe();
  }, [user, isAdmin, isSuperAdmin]);

  const markAsRead = async (id) => {
    try { await deleteDoc(doc(db, "notifications", id)); } 
    catch (e) { console.error("Error clearing notification", e); }
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;
    try {
      const deletePromises = notifications.map(note => deleteDoc(doc(db, "notifications", note.id)));
      await Promise.all(deletePromises);
      toast.success("All notifications cleared", { style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } });
    } catch (e) {
      console.error("Error clearing notifications", e);
    }
  };

  const handleAcceptReturn = async (notification) => {
    if (!notification.fullOrderId || !notification.senderId) return;
    setProcessingId(notification.id);

    try {
      const orderRef = doc(db, "OrderItems", notification.fullOrderId);
      await updateDoc(orderRef, { orderStatus: "Returned", returnAcceptedAt: new Date() });

      await addDoc(collection(db, "notifications"), {
        type: "user",
        recipientId: notification.senderId,
        subType: "order_update",
        status: "Returned",
        message: `Your return request for Order #${notification.fullOrderId.slice(0,8)} has been ACCEPTED.`,
        createdAt: serverTimestamp(),
        read: false
      });

      await deleteDoc(doc(db, "notifications", notification.id));
      if(onUpdateData) onUpdateData();
      toast.success("Return Accepted", { style: { background: '#1e293b', color: '#fff' } });

    } catch (error) {
      console.error("Error accepting return:", error);
      toast.error("Failed to update order");
    } finally {
      setProcessingId(null);
    }
  };

  const getNotificationStyle = (note) => {
    const status = note.status || '';
    const subType = note.subType || '';

    if (subType === 'return_request') {
       return { bg: 'bg-orange-500/10', border: 'border-l-orange-500', text: 'text-orange-200', icon: <AlertTriangle size={18} className="text-orange-500" />, title: 'Return Request' };
    }
    if (subType === 'coupon') {
        return { bg: 'bg-purple-500/10', border: 'border-l-purple-500', text:'text-purple-200', icon: <Ticket size={18} className="text-purple-400"/>, title: 'New Coupon' };
    }
    if (status === 'Delivered') {
        return { bg: 'bg-emerald-500/10', border: 'border-l-emerald-500', text:'text-emerald-200', icon: <CheckCircle size={18} className="text-emerald-500"/>, title: 'Order Delivered' };
    }
    if (status === 'Shipped') {
        return { bg: 'bg-blue-500/10', border: 'border-l-blue-500', text:'text-blue-200', icon: <Truck size={18} className="text-blue-500"/>, title: 'Order Shipped' };
    }
    if (status === 'Returned' || status === 'Cancelled') {
        return { bg: 'bg-rose-500/10', border: 'border-l-rose-500', text:'text-rose-200', icon: <X size={18} className="text-rose-500"/>, title: 'Order Update' };
    }
    return { bg: 'bg-slate-800', border: 'border-l-slate-500', text:'text-slate-300', icon: <Info size={18} className="text-slate-400"/>, title: 'Notification' };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-slate-300 hover:text-white transition-colors">
        <FaBell size={20} />
        {notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900 animate-pulse"></span>}
      </button>

      {isOpen && (
        <div className="absolute top-14 right-[-65px] sm:right-0 w-[94vw] sm:w-[380px] bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-[60] overflow-hidden animate-fade-in-up ring-1 ring-white/10 origin-top-right">
          <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-950/50">
            <h4 className="font-bold text-white text-sm tracking-wide">{(isAdmin || isSuperAdmin) ? 'Admin Alerts' : 'Notifications'}</h4>
            <div className="flex items-center gap-3">
              {notifications.length > 0 && (
                <button onClick={clearAllNotifications} className="text-slate-400 hover:text-rose-500 transition-colors p-1" title="Clear All">
                  <Trash2 size={15} />
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1"><X size={18}/></button>
            </div>
          </div>
            
          <div className="max-h-[65vh] overflow-y-auto custom-scrollbar p-2 space-y-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-500">
                <BellOffIcon />
                <p className="text-xs mt-2 italic">No new notifications</p>
              </div>
            ) : (
              notifications.map(note => {
                const style = getNotificationStyle(note);
                return (
                  <div key={note.id} className={`relative p-3 rounded-lg border-l-[3px] ${style.border} ${style.bg} hover:brightness-110 transition-all group shadow-sm`}>
                    <div className="flex gap-3">
                      <div className="mt-1 shrink-0">{style.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                             <h5 className="text-xs font-bold text-white uppercase tracking-wider">{style.title}</h5>
                             <span className="text-[9px] text-slate-400 whitespace-nowrap ml-2">{note.createdAt?.toDate ? note.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}</span>
                        </div>
                        <p className={`text-xs sm:text-sm leading-relaxed ${style.text} opacity-90 break-words`}>{note.message}</p>
                        {note.returnReason && (
                            <div className="mt-2 text-[10px] sm:text-xs bg-black/30 p-2 rounded text-orange-200 italic border border-orange-500/20">
                                "Reason: {note.returnReason}"
                            </div>
                        )}
                        {(isAdmin || isSuperAdmin) && note.subType === 'return_request' && (
                            <button onClick={() => handleAcceptReturn(note)} disabled={processingId === note.id} className="w-full mt-3 py-2 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors shadow-lg shadow-violet-900/20 flex justify-center items-center gap-2">
                              {processingId === note.id ? <Loader className="animate-spin" size={12}/> : "Approve Return"}
                            </button>
                        )}
                      </div>
                      <button onClick={(e) => {e.stopPropagation(); markAsRead(note.id)}} className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={14}/>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const BellOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
    <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5"/>
    <path d="M17 17H3s3-2 3-9a6 6 0 0 1 1.8-4.3"/>
    <path d="M10.3 21a1.95 1.95 0 0 0 3.4 0"/>
    <path d="m2 2 20 20"/>
  </svg>
);

// --- Main Navbar Component ---
const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuth, setIsAuth] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false); // ✅ State for Mobile Search
  const [currentUser, setCurrentUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
   
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const dropdownRef = useRef(null);
  const userIconRef = useRef(null);
   
  const cart = useSelector(state => state.cart); 
  const totalQuantity = useSelector(state => state.cart.totalQuantity);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuth(true);
        localStorage.setItem("isAuthenticated", "true");
        const savedCart = localStorage.getItem(`cart_${user.uid}`);
        if (savedCart) dispatch(setCart(JSON.parse(savedCart)));
        else dispatch(clearCart()); 

        try {
          const adminRef = doc(db, "adminDetails", user.uid);
          const adminSnap = await getDoc(adminRef);
          if (adminSnap.exists()) {
            const data = adminSnap.data();
            setCurrentUser({ ...user, ...data });
            setProfileImage(data.profileImage);
            setIsAdmin(true); 
            if(user.email === "gudipatisrihari6@gmail.com") setIsSuperAdmin(true);
          } else {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const data = userSnap.data();
              setCurrentUser({ ...user, ...data });
              setProfileImage(data.profileImage);
              setIsAdmin(false);
              setIsSuperAdmin(false);
            } else {
              setCurrentUser(user);
            }
          }
        } catch (error) { 
          console.error("Error fetching profile:", error);
          setCurrentUser(user); 
        }
      } else {
        setIsAuth(false);
        setCurrentUser(null);
        localStorage.removeItem("isAuthenticated");
        setProfileImage(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        dispatch(clearCart());
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    if (currentUser?.uid) {
      localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(cart));
    }
  }, [cart, currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) && userIconRef.current && !userIconRef.current.contains(event.target)) {
          setShowDropdown(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [showDropdown]);

  useEffect(() => { setShowDropdown(false); }, [location]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("isAuthenticated");
    dispatch(clearCart()); 
    toast.success("Logout Successfully", { style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' }, position: "top-center" });
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowMobileSearch(false); // Close mobile search on submit
    }
  };

  const getDesktopClass = (path) => location.pathname === path ? "text-blue-500 font-bold transition-colors" : "text-slate-300 hover:text-white transition-colors";

  const getDashboardLink = () => {
    if (isSuperAdmin) return "/superadmindashboard";
    if (isAdmin) return "/admindashboard";
    return "/userdashboard";
  };

  const displayName = currentUser?.firstName 
    ? `${currentUser.firstName} ${currentUser.lastName || ''}` 
    : currentUser?.email;

  return (
    <>
    <Toaster position="top-right" reverseOrder={false} />
    
    <nav className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 font-sans shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4 md:gap-8">

          {/* LOGO */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-bold tracking-tighter text-white group-hover:text-blue-400 transition-colors whitespace-nowrap">
                GSH<span className="text-blue-500">.</span>STORE
              </span>
              <span className="text-[8px] md:text-[10px] tracking-widest text-slate-400 uppercase -mt-1 hidden sm:block">Premium Collection</span>
            </div>
          </Link>

          {/* SEARCH BAR (Desktop Only) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-auto">
            <form onSubmit={handleSearch} className="w-full relative flex items-center">
              <input type="text" placeholder="Search for products..." className="w-full bg-slate-800 text-slate-200 text-sm rounded-full pl-5 pr-12 py-2.5 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <button type="submit" className="absolute right-2 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full transition-colors"><FaSearch size={14} /></button>
            </form>
          </div>

          {/* DESKTOP NAV */}
          <div className="hidden lg:flex items-center space-x-8 text-sm font-medium">
            <Link to="/" className={getDesktopClass("/")}>Home</Link>
            <Link to="/about" className={getDesktopClass("/about")}>About</Link>
            <Link to="/contact" className={getDesktopClass("/contact")}>Contact</Link>
          </div>

          {/* ICONS (Cart, Profile, Notification) */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* ✅ Search Icon Toggle for Mobile */}
            <button className="md:hidden text-slate-300 p-1" onClick={() => setShowMobileSearch(!showMobileSearch)}>
              {showMobileSearch ? <X size={20} /> : <FaSearch size={20} />}
            </button>

            {isAuth && currentUser && (
              <NavbarNotifications user={currentUser} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />
            )}

            <Link to="/cart" className="relative group text-slate-300 hover:text-white transition-colors p-1">
              <FaShoppingCart size={20} className="md:w-[22px] md:h-[22px]" />
              {totalQuantity > 0 && <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-blue-600 text-white text-[10px] font-bold h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center border-2 border-slate-900">{totalQuantity}</span>}
            </Link>

            {/* Profile Logic */}
            {isAuth ? (
              <div className="relative">
                <button ref={userIconRef} onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 focus:outline-none">
                  <div className="h-8 w-8 md:h-9 md:w-9 rounded-full overflow-hidden border border-slate-600 hover:border-blue-500 transition-all">
                    {profileImage ? <img src={profileImage} alt="User" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-400"><FaUser size={14} /></div>}
                  </div>
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        ref={dropdownRef} 
                        className="absolute right-0 mt-3 w-60 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50 text-sm origin-top-right"
                    >
                      <div className="px-4 py-2 border-b border-slate-700 bg-slate-800/50">
                        <p className="text-slate-400 text-xs">Signed in as</p>
                        <p className="text-white font-medium truncate" title={currentUser?.email}>{displayName}</p>
                        {isSuperAdmin && <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Super Admin</span>}
                        {isAdmin && !isSuperAdmin && <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Admin</span>}
                      </div>
                        
                      <div className="p-1">
                          <Link to={getDashboardLink()} onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors"><FaThLarge className="text-blue-500"/> Dashboard</Link>
                          {/* Edit Profile Removed */}
                          <div className="h-px bg-slate-700 my-1 mx-2"></div>
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-slate-700 hover:text-red-300 rounded-md transition-colors text-left"><FaSignOutAlt/> Sign out</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="text-slate-300 hover:text-white transition-colors p-1">
                 <FaUserCircle size={24} />
              </Link>
            )}
          </div>
        </div>

        {/* ✅ MOBILE SEARCH FIELD (Slide Down) */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-slate-900 border-t border-slate-800"
            >
              <form onSubmit={handleSearch} className="p-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search for products..." 
                    className="w-full bg-slate-800 text-slate-200 text-sm rounded-full pl-5 pr-12 py-3 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-500" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus 
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors">
                    <FaSearch size={14} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>

    {/* --- MOBILE BOTTOM NAVIGATION --- */}
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0f172a]/95 backdrop-blur-xl border-t border-slate-800 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.3)] h-16">
      {/* 1. Home */}
      <Link to="/" className={`flex flex-col items-center gap-1 w-16 ${isActive('/') ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
        <FaHome size={20} />
        <span className="text-[10px] font-medium">Home</span>
      </Link>

      {/* 2. About (Replaced Search) */}
      <Link to="/about" className={`flex flex-col items-center gap-1 w-16 ${isActive('/about') ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
        <Info size={20} />
        <span className="text-[10px] font-medium">About</span>
      </Link>

      {/* 3. Cart */}
      <Link to="/cart" className={`relative flex flex-col items-center gap-1 w-16 ${isActive('/cart') ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
        <div className="relative">
          <FaShoppingCart size={20} />
          {totalQuantity > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-slate-900 animate-in zoom-in">
              {totalQuantity}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium">Cart</span>
      </Link>
      
      {/* 4. Contact (Replaced Profile) */}
      <Link 
        to="/contact" 
        className={`flex flex-col items-center gap-1 w-16 ${isActive('/contact') ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <FaPhone size={20} />
        <span className="text-[10px] font-medium">Contact</span>
      </Link>
    </div>
    </>
  );
};

export default Navbar;