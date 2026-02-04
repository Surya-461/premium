import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaArrowRight, FaUser } from 'react-icons/fa';

const OrderSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Success Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 max-w-lg w-full text-center shadow-2xl shadow-green-900/10 animate-fade-in-up">
        
        {/* Animated Icon */}
        <div className="flex justify-center mb-8">
          <div className="rounded-full bg-green-500/10 p-6 ring-1 ring-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <FaCheckCircle className="text-green-500 text-6xl drop-shadow-lg" />
          </div>
        </div>

        {/* Text Content */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
          Order Placed!
        </h2>
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
          Thank you for your purchase. Your order has been securely processed and we have sent a confirmation email to you.
        </p>

        {/* Info Box */}
        <div className="bg-slate-950 rounded-xl p-4 mb-8 border border-slate-800 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <p className="text-sm text-slate-400">Order Status: <span className="text-white font-medium">Processing</span></p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => navigate('/userdashboard')} 
            className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-semibold transition-all flex items-center justify-center gap-2 group"
          >
            <FaUser className="text-slate-400 group-hover:text-white transition-colors" />
            Go to My Dashboard
          </button>

          <button 
            onClick={() => navigate('/')} 
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            Continue Shopping <FaArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderSuccess;