import React from 'react';
import { useNavigate } from 'react-router-dom';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    // Background Container - Using 100dvh avoids scrollbars on mobile browsers with address bars
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-gray-800 to-black p-4 font-sans">
      
      {/* Glass Card - Responsive Width and Padding */}
      <div className="relative w-full max-w-lg p-6 md:p-12 text-center text-white bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl md:rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.1)]">
        
        {/* Typography - Responsive Text Sizes */}
        <h1 className="text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-widest text-white/20 select-none transition-all duration-300">
          404
        </h1>
        
        {/* Badge - Positioned relatively to the responsive text size */}
        <div className="absolute top-14 sm:top-20 md:top-24 left-0 right-0 flex justify-center">
          <span className="bg-blue-600 text-white px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm font-bold rounded uppercase tracking-widest shadow-lg transform translate-y-2">
            Page Not Found
          </span>
        </div>
        
        <h2 className="text-xl md:text-3xl font-bold mt-6 md:mt-8 mb-3">Something's missing</h2>
        
        <p className="text-slate-300 text-sm md:text-lg mb-8 leading-relaxed px-2 md:px-0">
          Oops! The page you are looking for does not exist. It might have been moved or deleted.
        </p>
        
        {/* Buttons - Stack on mobile, Row on tablet+ */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
          <button 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3 md:px-8 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-all shadow-lg hover:scale-105 active:scale-95 text-sm md:text-base"
          >
            Go Home
          </button>
          
          <button 
            onClick={() => navigate(-1)} 
            className="w-full sm:w-auto px-6 py-3 md:px-8 border border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95 text-sm md:text-base"
          >
            Go Back
          </button>
        </div>

      </div>
    </div>
  );
};

export default PageNotFound;