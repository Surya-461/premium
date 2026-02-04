import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast'; 

// Firebase & Redux
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { addItem } from '../slices/cartSlice';

// Icons
import { 
  FaShoppingCart, FaBolt, FaTruck, FaShieldAlt, FaUndo, 
  FaStar, FaArrowRight, FaQuoteLeft, FaCheck, FaClock, FaFire, FaTimes, FaTags, FaUserFriends
} from "react-icons/fa";

// Data
import { products } from "../data/dataUtils";

// --- COMPONENT: PRODUCT CARD (RESPONSIVE) ---
const ProductCard = ({ product, isAdmin, onAddToCart, onBuyNow }) => {
  
  const getProductImage = (p) => {
    if (p.image_url) return p.image_url;
    // Fallback logic
    if (p.product_category === "Accessories") return "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?q=80&w=2070&auto=format&fit=crop";
    else if (p.product_category === "Jeans") return "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1974&auto=format&fit=crop";
    else if (p.product_category === "Dresses") return "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=2083&auto=format&fit=crop";
    else if (p.product_department === "Men") return "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=2148&auto=format&fit=crop";
    else if (p.product_department === "Women") return "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=2135&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop";
  };

  const renderStars = (rating) => (
    [...Array(5)].map((_, i) => (
      <FaStar 
        key={i} 
        size={10} 
        className={`${i < Math.round(rating) ? "text-yellow-400" : "text-slate-600"}`} 
      />
    ))
  );

  return (
    <div className="group bg-slate-800 rounded-xl sm:rounded-2xl overflow-hidden hover:scale-105 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col h-full relative">
      
      {/* --- Image Section --- */}
      <div className="relative h-40 sm:h-64 overflow-hidden bg-slate-700">
        <img 
          src={getProductImage(product)} 
          alt={product.product_name} 
          className="w-full h-full object-cover" 
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop"; }} 
        />
        
        {/* Department Badge (Top Left) */}
        <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-slate-200 text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md border border-white/10 uppercase tracking-wider">
           {product.product_department}
        </span>
      </div>

      {/* --- Content Section --- */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        
        {/* Category & Title */}
        <div className="mb-2">
            <p className="text-[10px] sm:text-xs text-slate-400 mb-0.5 sm:mb-1 capitalize">{product.product_category}</p>
            <h3 className="text-xs sm:text-base font-bold text-white leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] group-hover:text-blue-400 transition-colors">
                {product.product_name}
            </h3>
        </div>

        {/* Price & Rating Row */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 mt-auto">
            <div className="flex flex-col">
                <span className="text-sm sm:text-xl font-bold text-white">₹{product.selling_unit_price.toFixed(2)}</span>
            </div>
            {/* Rating */}
            <div className="flex flex-col items-end">
                <div className="flex gap-0.5 mb-1">{renderStars(product.product_rating || 0)}</div>
                <span className="text-[8px] sm:text-[10px] text-slate-400">({product.product_rating || 0} Reviews)</span>
            </div>
        </div>

        {/* --- VISIBLE ACTION BUTTONS --- */}
        {!isAdmin ? (
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 pt-2 sm:pt-3 border-t border-slate-700/50">
                <button 
                    onClick={() => onAddToCart(product)}
                    className="flex items-center justify-center gap-1 sm:gap-2 bg-slate-700 hover:bg-slate-600 text-white text-[10px] sm:text-sm font-semibold py-2 sm:py-2.5 rounded-lg transition-all active:scale-95 border border-slate-600 hover:border-slate-500"
                >
                    <FaShoppingCart className="text-blue-400 w-3 h-3 sm:w-3.5 sm:h-3.5"/> 
                    <span>Add</span>
                </button>
                
                <button 
                    onClick={() => onBuyNow(product)}
                    className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-sm font-bold py-2 sm:py-2.5 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                >
                    <FaBolt className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 
                    <span>Buy</span>
                </button>
            </div>
        ) : (
            <div className="mt-2 pt-3 border-t border-slate-700/50 text-center">
                <span className="text-xs font-mono text-slate-500">Admin Mode (Read Only)</span>
            </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // State
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [popupProduct, setPopupProduct] = useState(null);
  const [isOfferClaimed, setIsOfferClaimed] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Lists
  const departments = ["All", "Men", "Women", "Kids"];
  const shopCategories = [
    "Jeans", "Shorts", "Dresses", "Skirts", "Swim", "Socks", 
    "Maternity", "Suits", "Intimates", "Pants & Capris", 
    "Fashion Hoodies & Sweatshirts", "Plus"
  ];

  // Admin Check
  useEffect(() => {
    const checkAdmin = () => {
      setIsAdmin(auth.currentUser?.email === "harigudipati666@gmail.com");
    };
    checkAdmin();
    const timer = setTimeout(checkAdmin, 1000); 
    return () => clearTimeout(timer);
  }, []);

  // Fetch Coupons
  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const q = query(collection(db, "coupons"), where("isActive", "==", true));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const allCoupons = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          allCoupons.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

          const latestCoupon = allCoupons[0];
          const expiry = latestCoupon.expiryDate?.toDate ? latestCoupon.expiryDate.toDate() : new Date(latestCoupon.expiryDate);
          
          if (expiry > new Date()) {
             setActiveCoupon({ code: latestCoupon.code, discount: latestCoupon.discount, expiry });
             const diff = Math.floor((expiry - new Date()) / 1000);
             setTimeLeft(diff > 0 ? diff : 0);
          }
        }
      } catch (e) {
        console.error("Error fetching coupon:", e);
      }
    };
    fetchCoupon();
  }, []);

  // Timer
  useEffect(() => {
    if (!activeCoupon) return;
    const interval = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [activeCoupon]);

  const formatTime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- DATA FILTERING ---
  const filteredProducts = selectedCategory === "All"
      ? products.slice(0,8)
      : products.filter((p) => 
          p.product_department === selectedCategory || 
          p.product_category === selectedCategory
        ).slice(0, 8);

  const trendingProducts = products.slice(8, 16);

  // Handlers
  const handleAddToCart = (product) => {
    dispatch(addItem({
        product_id: product.product_id,
        product_name: product.product_name,
        selling_unit_price: product.selling_unit_price,
        image_url: product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
        quantity: 1,
    }));
    setPopupProduct(product);
    setShowCartPopup(true);
  };

  const handleBuyNow = (product) => {
    dispatch(addItem({
        product_id: product.product_id,
        product_name: product.product_name,
        selling_unit_price: product.selling_unit_price,
        image_url: product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
        quantity: 1,
    }));
    navigate("/cart");
  };

  const handleClaimOffer = () => {
    if (activeCoupon && !isOfferClaimed) {
        setIsOfferClaimed(true);
        navigator.clipboard.writeText(activeCoupon.code);
        toast.success(`Code ${activeCoupon.code} copied!`, {
           style: { background: '#1e293b', color: '#fff' }
        });
    } else if (isOfferClaimed) {
        toast("Already claimed.", { icon: 'ℹ️', style: { background: '#1e293b', color: '#fff' } });
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      
      <Toaster position="top-center" />

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[500px] md:h-[90vh] flex items-center justify-center text-center px-4">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat md:bg-fixed" style={{ backgroundImage: 'url("https://wallpapercave.com/wp/wp8036239.jpg")' }}></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40"></div>
        
        <div className="relative z-20 max-w-4xl animate-fade-in-up px-2 sm:px-4">
          <span className="inline-block py-1 px-3 sm:px-4 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] sm:text-xs md:text-sm font-bold tracking-wider uppercase mb-4 sm:mb-6 backdrop-blur-md">New Season Arrival</span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight mb-4 sm:mb-6">
            Redefine your <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-blue-500">digital style.</span>
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8 max-w-xl sm:max-w-2xl mx-auto font-light leading-relaxed px-4">
            Premium dark aesthetics for the modern minimalist. Curated fashion for those who dare to stand out.
          </p>
          <div className="flex justify-center">
            <button onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })} className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.7)] text-sm sm:text-base">
              Explore Collection <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* --- FLOATING TRUST BAR --- */}
      <section className="relative z-30 px-4 -mt-12 sm:-mt-16 md:-mt-24 mb-12 sm:mb-16 md:mb-24">
        <div className="max-w-6xl mx-auto bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/10">
            {[ { icon: FaTruck, title: "Free Shipping", desc: "Orders > ₹999" }, { icon: FaShieldAlt, title: "Secure Payment", desc: "100% Protected" }, { icon: FaUndo, title: "Easy Returns", desc: "30-day Policy" }, { icon: FaStar, title: "Top Rated", desc: "4.9/5 Stars" } ].map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center p-2">
                <item.icon className="text-blue-500 text-2xl md:text-3xl mb-2 md:mb-3" />
                <h4 className="text-white font-bold text-sm md:text-base">{item.title}</h4>
                <p className="text-slate-400 text-xs md:text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 1: SHOP BY DEPARTMENT --- */}
      <section id="shop" className="px-4 mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
            <FaUserFriends className="text-blue-500" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Shop by Department</h2>
        </div>
        <div className="flex flex-nowrap overflow-x-auto gap-2 sm:gap-3 pb-4 justify-start sm:justify-center px-2 touch-pan-x">
          <div className="flex gap-2 bg-slate-800 p-1.5 sm:p-2 rounded-xl sm:rounded-full border border-slate-700 min-w-max mx-auto">
            {departments.map((dept) => (
                <button 
                  key={dept} 
                  onClick={() => setSelectedCategory(dept)} 
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${selectedCategory === dept ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
                >
                {dept}
                </button>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 2: SHOP BY CATEGORY --- */}
      <section className="px-4 mb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
            <FaTags className="text-emerald-500" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Shop by Category</h2>
        </div>
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-2 sm:gap-3">
            {shopCategories.map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-slate-700 text-[10px] sm:text-xs font-medium transition-all duration-300 hover:scale-105 ${selectedCategory === cat ? "bg-emerald-600 border-emerald-500 text-white" : "bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white"}`}
                >
                {cat}
                </button>
            ))}
        </div>
      </section>

      {/* --- MAIN PRODUCT GRID --- */}
      <section className="max-w-7xl mx-auto px-2 sm:px-6 pb-16">
        {/* Dynamic Title based on selection */}
        <h3 className="text-base sm:text-lg font-bold text-slate-400 mb-4 sm:mb-6 border-l-4 border-blue-500 pl-3 mx-2 sm:mx-0">
            Showing results for: <span className="text-white">{selectedCategory}</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {filteredProducts.map((p) => (
            <ProductCard 
              key={p.product_id} 
              product={p} 
              isAdmin={isAdmin} 
              onAddToCart={handleAddToCart} 
              onBuyNow={handleBuyNow} 
            />
          ))}
          
          {filteredProducts.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                <FaUndo className="text-3xl mb-3 opacity-50"/>
                <p>No products found in <span className="text-white font-bold">"{selectedCategory}"</span>.</p>
                <button onClick={() => setSelectedCategory("All")} className="mt-4 text-blue-400 hover:underline text-sm">Clear Filter</button>
             </div>
          )}
        </div>
      </section>

      {/* --- PROMO SECTION --- */}
      {activeCoupon && timeLeft > 0 && (
        <section className="max-w-5xl mx-auto px-4 mb-20 sm:mb-24 animate-fade-in-up"> 
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-900 to-slate-900 border border-slate-700 p-6 sm:p-16 text-center shadow-2xl"> 
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div> 
            <div className="relative z-10"> 
              <h2 className="text-2xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"> Flat {activeCoupon.discount}% OFF </h2> 
              
              <div className="flex items-center justify-center gap-2 text-blue-200 mb-6 font-mono text-sm sm:text-lg bg-black/30 w-fit mx-auto px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-blue-500/30">
                <FaClock className="text-blue-400 animate-pulse" />
                <span>Expires in: <span className="text-white font-bold">{formatTime(timeLeft)}</span></span>
              </div>

              <p className="text-slate-300 text-sm sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto">Use code <strong className="text-white bg-slate-700/50 border border-slate-600 px-2 py-0.5 rounded mx-1">{activeCoupon.code}</strong> at checkout.</p> 
              
              <button 
                onClick={handleClaimOffer} 
                disabled={isOfferClaimed}
                className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 mx-auto text-sm sm:text-base ${isOfferClaimed ? 'bg-emerald-600 text-white cursor-default' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'}`}
              > 
                  {isOfferClaimed ? <><FaCheck /> Copied!</> : 'Claim Offer'} 
              </button> 
            </div> 
          </div> 
        </section> 
      )}
       
      {/* --- TRENDING SECTION --- */}
      <section className="max-w-7xl mx-auto px-2 sm:px-4 pb-24 border-t border-slate-800 pt-12 sm:pt-16">
         <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 justify-center">
            <FaFire className="text-orange-500 text-xl sm:text-2xl"/>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Trending Now</h2>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {trendingProducts.map((p) => (
               <ProductCard key={p.product_id} product={p} isAdmin={isAdmin} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
            ))}
         </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="max-w-7xl mx-auto px-4 mb-24 hidden md:block"> 
        <h2 className="text-3xl font-bold text-center mb-12">What They Say</h2> 
        <div className="grid grid-cols-3 gap-8"> 
          {[1, 2, 3].map((i) => ( 
            <div key={i} className="bg-slate-800 p-8 rounded-2xl border border-slate-700 relative"> 
              <FaQuoteLeft className="text-blue-500/20 text-4xl absolute top-6 left-6" /> 
              <p className="text-slate-300 relative z-10 mb-6 mt-4"> "Absolutely love the quality. The dark aesthetic fits perfectly with my setup." </p> 
              <div className="flex items-center gap-4"> 
                <div className="w-10 h-10 bg-slate-600 rounded-full overflow-hidden"> <img src={`https://i.pravatar.cc/150?img=${i + 10}`} alt="User" /> </div> 
                <div> <h5 className="font-bold text-white text-sm">User {i}</h5> <div className="flex text-yellow-500 text-xs"> <FaStar /><FaStar /><FaStar /><FaStar /><FaStar /> </div> </div> 
              </div> 
            </div> 
          ))} 
        </div> 
      </section> 
       
      {/* --- TRUSTED BRANDS --- */}
      <section className="py-10 border-t border-slate-800"> 
        <p className="text-center text-slate-500 text-xs sm:text-sm tracking-[0.2em] font-bold mb-8 uppercase">Trusted By</p> 
        <div className="flex flex-wrap justify-center gap-6 sm:gap-16 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all px-4"> 
          {[
            "https://images-platform.99static.com//c60-ZrzNS_3CeTpUcVrHuXehJzo=/27x0:1034x1007/fit-in/500x500/99designs-contests-attachments/63/63177/attachment_63177734",
            "https://img.freepik.com/free-vector/ecological-market-logo-design_23-2148468229.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRekbNCEfc1AZgGsQy6kjmeYR-HcwL5iqjzjg&s"
          ].map((src, idx) => (
             <img key={idx} src={src} alt="Brand" className="h-8 sm:h-12 w-auto object-contain bg-white/10 rounded-lg p-1" />
          ))}
        </div> 
      </section>

      {/* --- ADD TO CART POPUP (MODAL STYLE) --- */}
      {showCartPopup && popupProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCartPopup(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100 animate-fade-in-up">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3 text-emerald-400">
                <div className="bg-emerald-500/10 p-2 rounded-full ring-1 ring-emerald-500/50">
                   <FaCheck size={16} />
                </div>
                <h3 className="font-bold text-white text-lg">Added to Cart</h3>
              </div>
              <button 
                onClick={() => setShowCartPopup(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Product Info */}
            <div className="flex gap-4 mb-6 bg-slate-700/50 p-3 rounded-xl border border-slate-600/50">
              <img 
                src={popupProduct.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop"} 
                alt={popupProduct.product_name} 
                className="w-16 h-16 object-cover rounded-lg shadow-sm" 
              />
              <div className="flex flex-col justify-center">
                <h4 className="font-semibold text-sm text-white line-clamp-1 pr-2">{popupProduct.product_name}</h4>
                <p className="text-slate-400 text-xs mb-1">{popupProduct.product_department}</p>
                <span className="text-blue-400 font-bold">₹{popupProduct.selling_unit_price.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowCartPopup(false)} 
                className="px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-sm font-semibold"
              >
                Keep Shopping
              </button>
              <button 
                onClick={() => navigate('/cart')} 
                className="px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all text-sm font-semibold flex items-center justify-center gap-2"
              >
                <FaShoppingCart size={14}/> View Cart
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default Home;