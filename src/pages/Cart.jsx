import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeItem, updateQuantity, clearCart } from '../slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { 
  FaTrash, FaMinus, FaPlus, FaArrowLeft, FaShoppingBag, 
  FaCreditCard, FaLock, FaExclamationTriangle, FaUserCircle 
} from 'react-icons/fa';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 1. Get Cart Data from Redux
  const { items, totalQuantity, totalPrice } = useSelector((state) => state.cart || { items: [], totalQuantity: 0, totalPrice: 0 });

  // 2. Get User Login Status from Redux
  const { profile } = useSelector((state) => state.user || { profile: {} });
  const isLoggedIn = profile && profile.uid; 

  // --- Helper: Format Currency to INR ---
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // --- Handlers ---
  const handleRemove = (id) => {
    dispatch(removeItem(id));
    toast.success("Item removed from cart", {
      icon: '🗑️',
      style: {
        borderRadius: '10px',
        background: '#1e293b',
        color: '#fff',
        border: '1px solid #334155'
      },
    });
  };

  const handleDecrease = (id, quantity) => {
    if (quantity <= 1) return;
    dispatch(updateQuantity({ id, quantity: quantity - 1 }));
  };

  const handleIncrease = (id, quantity) => {
    dispatch(updateQuantity({ id, quantity: quantity + 1 }));
  };

  // --- INTERACTIVE TOAST: Clear Cart ---
  const handleClearCartClick = () => {
    toast((t) => (
      <div className="flex flex-col gap-2 min-w-[250px]">
        <div className="flex items-center gap-2">
            <div className="bg-red-500/20 p-2 rounded-full text-red-500"><FaExclamationTriangle /></div>
            <span className="font-bold text-white">Clear entire cart?</span>
        </div>
        <p className="text-xs text-slate-400">This action cannot be undone.</p>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 py-1.5 px-3 rounded-lg border border-slate-600 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              dispatch(clearCart());
              toast.dismiss(t.id);
              toast.success("Cart cleared successfully!", { style: { background: '#1e293b', color: '#fff' } });
            }}
            className="flex-1 py-1.5 px-3 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition-colors"
          >
            Yes, Clear
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      style: {
        background: '#0f172a',
        border: '1px solid #334155',
        color: '#fff',
        padding: '16px',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      },
    });
  };

  // --- UPDATED: Checkout Handler ---
  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty!", {
        style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' }
      });
      return;
    }

    if (isLoggedIn) {
      navigate('/shipping');
    } else {
      // ✅ CHANGED: Removed Guest Option, Enforced Login Message
      toast((t) => (
        <div className="flex flex-col gap-3 min-w-[260px]">
           <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-full text-blue-500"><FaUserCircle size={20} /></div>
              <div>
                  <h4 className="font-bold text-white text-sm">Login Required</h4>
                  <p className="text-[11px] text-slate-400">Please login to checkout your items.</p>
              </div>
           </div>
           
           <div className="flex flex-col gap-2 mt-1">
              <button 
                onClick={() => { toast.dismiss(t.id); navigate('/login'); }}
                className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
              >
                Login to Checkout
              </button>
              {/* ❌ Removed "Continue as Guest" Button here */}
           </div>
        </div>
      ), {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#0f172a',
          border: '1px solid #3b82f6',
          color: '#fff',
          padding: '16px',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-3 sm:py-12 sm:px-4 font-sans selection:bg-blue-500 selection:text-white">
      {/* React Hot Toast Container */}
      <Toaster position="bottom-center" reverseOrder={false} />

      <div className="max-w-6xl mx-auto">
        
        {/* --- Header --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Shopping Cart</h2>
            <span className="bg-blue-600/10 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-600/20">
              {totalQuantity} Items
            </span>
          </div>
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors text-sm sm:text-base">
            <FaArrowLeft size={14} /> Continue Shopping
          </button>
        </div>

        {/* --- Empty State --- */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed text-center px-4">
            <div className="bg-slate-800 p-6 rounded-full mb-6 animate-pulse">
               <FaShoppingBag className="text-slate-600 text-4xl sm:text-5xl" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Your cart is empty</h3>
            <p className="text-slate-400 mb-8 text-sm sm:text-base">Looks like you haven't added anything yet.</p>
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20"
            >
              Add your Items Newly
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* --- Left Column: Cart Items --- */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div 
                  key={item.product_id}
                  className="group flex gap-3 sm:gap-6 bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all relative"
                >
                  
                  {/* Product Image */}
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-xl p-2 flex-shrink-0 self-center">
                    <img 
                      src={item.image_url} 
                      alt={item.product_name} 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Product Content Column */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    
                    {/* Top Row: Title & Category */}
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="text-sm sm:text-lg font-bold text-white leading-tight line-clamp-2">{item.product_name}</h5>
                          <button 
                           onClick={() => handleRemove(item.product_id)}
                           className="text-slate-500 hover:text-red-400 transition-colors p-1"
                           aria-label="Remove item"
                          >
                            <FaTrash size={14} />
                          </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 capitalize">{item.product_category}</p>
                    </div>

                    {/* Bottom Row: Price & Controls */}
                    <div className="flex flex-wrap items-end justify-between gap-2 mt-3">
                      <p className="text-blue-400 font-bold text-base sm:text-lg">
                        {formatPrice(item.selling_unit_price)}
                      </p>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button 
                          onClick={() => handleDecrease(item.product_id, item.quantity)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors"
                        >
                          <FaMinus size={10} />
                        </button>
                        <span className="w-6 text-center font-mono text-sm font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => handleIncrease(item.product_id, item.quantity)}
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <button 
                    onClick={handleClearCartClick}
                    className="text-red-400 text-sm hover:text-red-300 hover:underline py-2 flex items-center gap-2 transition-colors"
                >
                    <FaTrash size={12}/> Clear Cart
                </button>
              </div>
            </div>

            {/* --- Right Column: Order Summary --- */}
            <div className="lg:col-span-1 lg:sticky lg:top-4">
              <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-6">Order Summary</h3>
                
                <div className="space-y-3 mb-6 text-sm sm:text-base">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="text-white font-medium">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping</span>
                    <span className="text-green-400 text-xs sm:text-sm font-medium">Calculated at next step</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax Estimate (18%)</span>
                    <span className="text-white font-medium">{formatPrice(totalPrice * 0.18)}</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-white">Total</span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-400">{formatPrice(totalPrice * 1.18)}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1 text-right">Including all taxes</p>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  {isLoggedIn ? <FaCreditCard /> : <FaLock />}
                  {isLoggedIn ? "Checkout Now" : "Login Required to Checkout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;