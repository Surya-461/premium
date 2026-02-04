import React from 'react';

const GSHStoreLoader = () => {
  return (
    // Main Container - Full screen, dark background, centered content
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050110]">
      
      {/* FIX: Changed <style jsx> to standard <style> 
        and wrapped content in curly braces and backticks 
      */}
      <style>{`
        /* Animation to move the stroke along the SVG path */
        @keyframes trace {
          0% { stroke-dashoffset: 300; }
          100% { stroke-dashoffset: 0; }
        }

        /* Animation for the ellipsis dots */
        @keyframes dots {
          0%, 20% { content: '.'; }
          40% { content: '..'; }
          60%, 100% { content: '...'; }
        }

        .animate-trace {
          /* 300 is roughly the length of the path. 75 is the length of the visible dash */
          stroke-dasharray: 75 300; 
          animation: trace 2s linear infinite;
        }

        /* Using ::after pseudoelement for the dots animation */
        .loading-dots::after {
          content: '.';
          display: inline-block;
          text-align: left;
          width: 1.5em; /* ensure width doesn't jump */
          animation: dots 1.5s steps(1) infinite;
        }
      `}</style>

      {/* Infinity Symbol SVG */}
      <svg 
        width="140" 
        height="70" 
        viewBox="0 0 130 60" 
        xmlns="http://www.w3.org/2000/svg" 
        className="mb-6"
      >
        {/* Define the Glow Filter */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            {/* Blur the source graphic to create the glow spread */}
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            {/* Merge the original sharp line on top of the blurred glow */}
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* The Background Track (Dim Purple) */}
        <path
          d="M35,30 C35,10 65,10 65,30 C65,50 95,50 95,30 C95,10 125,10 125,30 C125,50 95,50 95,30 C95,10 65,10 65,30 C65,50 35,50 35,30 z"
          fill="none"
          stroke="#3b0764" // Deep purple (Tailwind purple-950ish)
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* The Animated Glowing Trace (Bright Purple/White) */}
        <path
          className="animate-trace"
          d="M35,30 C35,10 65,10 65,30 C65,50 95,50 95,30 C95,10 125,10 125,30 C125,50 95,50 95,30 C95,10 65,10 65,30 C65,50 35,50 35,30 z"
          fill="none"
          stroke="#d8b4fe" // Light purple (Tailwind purple-300)
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#glow)" // Apply the glow defined above
        />
      </svg>

      {/* Text Container */}
      <div className="text-purple-200 font-medium tracking-wider text-sm sm:text-base relative">
        Loading GSH Store
        {/* The span that handles the animated dots */}
        <span className="loading-dots absolute ml-1"></span>
      </div>
    </div>
  );
};

export default GSHStoreLoader;