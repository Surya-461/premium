import React from "react";
import { FaBullseye, FaEye, FaHandshake, FaGem, FaCheckCircle, FaLightbulb, FaUsers } from "react-icons/fa";

const About = () => {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-20 selection:bg-blue-500 selection:text-white">
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center text-center overflow-hidden px-4">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed z-0"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=80")' }}
        ></div>
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900 z-10"></div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-4xl mx-auto mt-[-50px]">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 drop-shadow-2xl leading-tight">
            Redefining Retail
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 font-light tracking-wide px-4">
            Experience the future of shopping with GSH Retails.
          </p>
        </div>
      </section>

      {/* --- COMPANY OVERVIEW (Glass Cards) --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 md:-mt-24 relative z-30 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {[
            { 
              icon: <FaUsers />, 
              title: "Who We Are", 
              desc: "GSH Retails is a customer-centric e-commerce platform designed to make online shopping simple, affordable, and reliable.",
            },
            { 
              icon: <FaBullseye />, 
              title: "Our Mission", 
              desc: "To empower customers with a seamless shopping experience, transparent pricing, secure payments, and lightning-fast delivery.",
            },
            { 
              icon: <FaEye />, 
              title: "Our Vision", 
              desc: "To become the most trusted retail brand by continuously innovating technology and building lasting relationships with our community.",
            }
          ].map((card, i) => (
            <div 
              key={i} 
              className="group bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-2xl p-8 sm:p-10 text-center transition-all duration-300 hover:-translate-y-2 hover:bg-slate-800 hover:border-blue-500/50 shadow-xl"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-6 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110">
                {card.icon}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">{card.title}</h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --- CORE VALUES --- */}
      <section className="py-12 sm:py-20 text-center px-4">
        <div className="mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Our Core Values</h2>
          <div className="w-16 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[
            { icon: <FaHandshake />, title: "Customer First", desc: "Every decision is focused on your satisfaction.", color: "text-blue-400" },
            { icon: <FaGem />, title: "Quality Assurance", desc: "We ensure products meet global standards.", color: "text-emerald-400" },
            { icon: <FaCheckCircle />, title: "Transparency", desc: "Clear pricing, honest policies, no hidden costs.", color: "text-purple-400" },
            { icon: <FaLightbulb />, title: "Innovation", desc: "Improving our platform with cutting-edge tech.", color: "text-amber-400" }
          ].map((value, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:bg-white/10 hover:-translate-y-2">
              <div className={`text-4xl sm:text-5xl mb-6 flex justify-center ${value.color}`}>
                {value.icon}
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-white mb-3">{value.title}</h4>
              <p className="text-slate-400 text-sm">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- WHY CHOOSE US (Split Panel) --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-10">
        <div className="flex flex-col lg:flex-row bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Content Side */}
          <div className="flex-1 p-8 sm:p-12 lg:p-16 order-2 lg:order-1">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Why Choose GSH.STORE?</h2>
            <p className="text-lg text-slate-400 mb-8 font-light leading-relaxed">
              We don't just sell products; we deliver experiences. Here is why thousands of customers trust us.
            </p>
            
            <ul className="space-y-5">
              {[
                "Secure and simple checkout process",
                "7-Day Easy returns and refunds",
                "Curated range of premium products",
                "24/7 Dedicated customer support"
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-4 text-slate-300 text-base sm:text-lg">
                  <FaCheckCircle className="text-emerald-500 flex-shrink-0 text-xl mt-1" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Image Side */}
          <div className="flex-1 w-full order-1 lg:order-2 h-64 sm:h-80 lg:h-auto min-h-[300px] relative">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1170&auto=format&fit=crop" 
              alt="Team collaboration" 
              className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
        </div>
      </section>

    </main>
  );
};

export default About;