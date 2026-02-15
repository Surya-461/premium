import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast'; 
import { FaShoppingCart, FaBolt, FaStar, FaUndo, FaSearch } from "react-icons/fa";
import { auth } from "../firebase"; 

import { addItem } from "../slices/cartSlice";
import products from "../data/product.js";

const Search = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const query = searchParams.get("q") || "";
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- Check Admin ---
  useEffect(() => {
    const checkAdmin = () => {
      if (auth.currentUser && auth.currentUser.email === "harigudipati666@gmail.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
    const timer = setTimeout(checkAdmin, 1000); 
    return () => clearTimeout(timer);
  }, []);

  // --- Helper: Get Image ---
  const getProductImage = (product) => {
    if (product.image_url) return product.image_url;
    if (product.product_category === "Accessories") return "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?q=80&w=2070&auto=format&fit=crop";
    else if (product.product_department === "Men") return "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=2148&auto=format&fit=crop";
    else if (product.product_department === "Women") return "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=2135&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop";
  };

  // --- Helper: Render Stars ---
  const renderStars = (rating = 4.5) => (
    [...Array(5)].map((_, i) => (
      <FaStar 
        key={i} 
        size={10} 
        className={`${i < Math.round(rating) ? "text-yellow-400" : "text-slate-600"}`} 
      />
    ))
  );

  // --- Filter Logic ---
  useEffect(() => {
    if (!query.trim()) {
      setFilteredProducts([]);
      return;
    }
    const result = products.filter((product) =>
      product.product_id?.toString() === query ||
      [
        product.product_name,
        product.product_brand,
        product.product_category,
      ].some((field) =>
        field?.toLowerCase().includes(query.toLowerCase())
      )
    );
    setFilteredProducts(result.slice(0, 20));
  }, [query]);

  // --- Handlers ---
  const handleAddToCart = (product) => {
    dispatch(addItem({
        product_id: product.product_id,
        product_name: product.product_name,
        selling_unit_price: product.selling_unit_price,
        image_url: getProductImage(product),
        quantity: 1,
    }));
    toast.success("Added to cart", {
       style: { background: '#1e293b', color: '#fff' }
    });
  };

  const handleBuyNow = (product) => {
    dispatch(addItem({
        product_id: product.product_id,
        product_name: product.product_name,
        selling_unit_price: product.selling_unit_price,
        image_url: getProductImage(product),
        quantity: 1,
    }));
    navigate("/cart");
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 font-sans pb-12 selection:bg-blue-500 selection:text-white">
      
      <Toaster position="top-center" />

      <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
               <span className="bg-slate-800 p-3 rounded-full border border-slate-700"><FaSearch className="text-blue-500 text-xl"/></span>
               <span>Search Results</span>
            </h2>
            <p className="text-slate-400 mt-2">
                Found {filteredProducts.length} items for <span className="text-white font-bold">"{query}"</span>
            </p>
        </div>

        {filteredProducts.length > 0 ? (
          /* ✅ FIXED GRID: grid-cols-2 for mobile (matches Home) */
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
            {filteredProducts.map((p) => (
              
              <div 
                key={p.product_id} 
                className="group bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col h-full relative"
              >
                
                {/* Image Section - ✅ FIXED HEIGHT: h-48 for mobile (matches Home) */}
                <div className="relative h-48 sm:h-64 overflow-hidden bg-slate-700">
                  <img 
                    src={getProductImage(p)} 
                    alt={p.product_name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop"; }} 
                  />
                  
                  {/* Department Badge */}
                  <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-slate-200 text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 uppercase tracking-wider shadow-lg">
                    {p.product_department}
                  </span>
                </div>

                {/* Content Section */}
                <div className="p-3 sm:p-4 flex flex-col flex-grow">
                  
                  <div className="mb-2">
                      <p className="text-[10px] sm:text-xs text-slate-400 mb-1 capitalize">{p.product_category}</p>
                      <h3 className="text-sm sm:text-base font-bold text-white leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-blue-400 transition-colors">
                          {p.product_name}
                      </h3>
                    <p className="inline-block mt-1 text-[9px] sm:text-[11px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                      ID: {p.product_id}
                    </p>
                  </div>

                  {/* Price & Rating */}
                  <div className="flex items-center justify-between mb-4 mt-auto">
                      <div className="flex flex-col">
                          <span className="text-lg sm:text-xl font-bold text-white">₹{p.selling_unit_price.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                          <div className="flex gap-0.5 mb-1">{renderStars(p.product_rating || 4.5)}</div>
                          <span className="text-[10px] text-slate-400">({p.product_rating || "4.5"})</span>
                      </div>
                  </div>

                  {/* VISIBLE BUTTONS GRID */}
                  {!isAdmin ? (
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-700/50">
                          <button 
                              onClick={() => handleAddToCart(p)}
                              className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-[10px] sm:text-sm font-semibold py-2 sm:py-2.5 rounded-lg transition-all active:scale-95 border border-slate-600"
                          >
                              <FaShoppingCart size={12} className="text-blue-400 sm:text-sm"/> <span className="hidden sm:inline">Add</span>
                          </button>
                          
                          <button 
                              onClick={() => handleBuyNow(p)}
                              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-sm font-bold py-2 sm:py-2.5 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                          >
                              <FaBolt size={12} className="sm:text-sm" /> Buy
                          </button>
                      </div>
                  ) : (
                    <div className="mt-2 pt-3 border-t border-slate-700/50 text-center">
                        <span className="text-xs font-mono text-slate-500">Admin Mode</span>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        ) : (
          /* --- Empty State --- */
          <div className="flex flex-col items-center justify-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
            <FaUndo className="text-4xl text-slate-500 mb-4 opacity-50" />
            <p className="text-xl text-slate-400 font-medium">No matches found for "{query}"</p>
            <p className="text-sm text-slate-500 mt-2">Try checking your spelling or use different keywords.</p>
            <button 
                onClick={() => navigate('/')} 
                className="mt-6 px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-blue-500/20"
            >
                Browse All Products
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default Search;