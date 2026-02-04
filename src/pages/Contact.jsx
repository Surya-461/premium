import React, { useState } from "react";
import { motion } from "framer-motion";
import emailjs from "emailjs-com";
import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    subject: "",
    category: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, contact, subject, category, message } = form;

    if (!name || !contact || !subject || !category || !message) {
      setStatus("⚠️ Please fill in all fields.");
      return;
    }

    setStatus("Sending...");

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: name,
          contact_info: contact,
          subject,
          category,
          message,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      setStatus("✅ Message sent successfully!");
      setForm({ name: "", contact: "", subject: "", category: "", message: "" });
    } catch (error) {
      setStatus("❌ Failed to send. Please try again later.");
    }
  };

  return (
    // Use min-h-[100dvh] for better mobile browser support
    <section className="min-h-[100dvh] bg-slate-950 relative flex items-center justify-center p-4 md:p-8 overflow-x-hidden font-sans selection:bg-blue-500 selection:text-white pb-24 md:pb-8">
      
      {/* --- Ambient Background Glows --- */}
      {/* Reduced size on mobile to prevent visual clutter */}
      <div className="absolute top-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-900/20 rounded-full blur-[80px] md:blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-900/20 rounded-full blur-[80px] md:blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      {/* --- Main Glass Container --- */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        // margin-y added for vertical spacing on scrollable mobile screens
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative z-10 my-4 lg:my-0"
      >

        {/* --- LEFT: INFO SECTION --- */}
        {/* Adjusted padding: smaller on mobile, larger on desktop */}
        <div className="p-6 md:p-10 lg:p-16 flex flex-col justify-center bg-slate-900/40 relative border-b lg:border-b-0 lg:border-r border-white/10">
          
          <div className="mb-6 md:mb-8">
            {/* Responsive text sizes */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 md:mb-4">Let's Connect</h2>
            <div className="h-1.5 w-16 md:w-24 bg-blue-600 rounded-full"></div>
          </div>
          
          <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-8 md:mb-10">
            Have questions about your order, payments, or just want to say hello? 
            Our support team is ready to assist you.
          </p>

          <div className="space-y-6 md:space-y-8 mb-8 md:mb-10">
            {/* Contact Cards */}
            {[
              { icon: Mail, title: "Email Us", text: "easystore@gsh.com" },
              { icon: Phone, title: "Call Us", text: "+91 6303125585" },
              { icon: MapPin, title: "Visit Us", text: "Hyderabad, Telangana, India" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 md:gap-5 group">
                {/* Smaller icon box on mobile */}
                <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl bg-blue-600/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-blue-600/30">
                  <item.icon size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider mb-0.5 md:mb-1">{item.title}</h4>
                  <p className="text-white text-base md:text-lg font-medium">{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dark Map */}
          <div className="w-full h-40 md:h-48 rounded-xl md:rounded-2xl overflow-hidden border border-white/10 shadow-lg relative">
            <iframe
              title="Store Location"
              className="w-full h-full grayscale invert contrast-[0.9] opacity-80 hover:opacity-100 transition-opacity duration-500"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.270921473634!2d78.36979407493617!3d17.44673628345028!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93dc8c5d69df%3A0x19688eb5c5508549!2sHyderabad%2C%20Telangana!5e0!3m2!1sen!2sin!4v1709283746285!5m2!1sen!2sin"
              loading="lazy"
              allowFullScreen=""
            />
          </div>
        </div>

        {/* --- RIGHT: FORM SECTION --- */}
        <motion.div 
          className="p-6 md:p-10 lg:p-16 bg-white/5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">Send a Message</h3>
            
            <div className="space-y-4 md:space-y-5">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                // Text-base prevents iOS zooming on input focus
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 md:px-5 md:py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />

              <input
                type="text"
                name="contact"
                placeholder="Email or Phone Number"
                value={form.contact}
                onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 md:px-5 md:py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />

              <div className="relative">
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 md:px-5 md:py-4 text-base text-white appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                  style={{ color: form.category ? 'white' : '#64748b' }}
                >
                  <option value="" disabled className="text-slate-500">Select Support Type</option>
                  <option value="Order Issue" className="bg-slate-800 text-white">Order Issue</option>
                  <option value="Payment Problem" className="bg-slate-800 text-white">Payment Problem</option>
                  <option value="Delivery Delay" className="bg-slate-800 text-white">Delivery Delay</option>
                  <option value="General Inquiry" className="bg-slate-800 text-white">General Inquiry</option>
                </select>
                <div className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              
              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={form.subject}
                onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 md:px-5 md:py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />

              <textarea
                name="message"
                rows="4"
                placeholder="How can we help you?"
                value={form.message}
                onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 md:px-5 md:py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3 md:py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 text-base md:text-lg"
            >
              <span>Send Message</span> <Send size={18} />
            </button>

            {/* Status Message */}
            {status && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 md:p-4 rounded-xl text-center font-medium border text-sm md:text-base ${
                  status.includes("✅") 
                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {status}
              </motion.div>
            )}
          </form>
        </motion.div>
      </motion.div>

      {/* --- FLOATING CHAT BUTTON --- */}
      <a
        href="https://wa.me/916303125585"
        target="_blank"
        rel="noreferrer"
        // ✅ CHANGED: Moved 'bottom-6' to 'bottom-24' for Mobile to avoid overlap with navbars/content
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-[#25D366]/40 hover:scale-110 hover:rotate-12 transition-all duration-300 z-50"
        title="Chat with us"
      >
        <MessageCircle size={28} className="md:w-8 md:h-8" />
      </a>
    </section>
  );
}