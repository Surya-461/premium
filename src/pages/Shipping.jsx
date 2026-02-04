import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaShippingFast, FaMapMarkerAlt, FaSpinner, FaArrowRight } from 'react-icons/fa';

const Shipping = () => {
  const navigate = useNavigate();
  const [loadingLoc, setLoadingLoc] = useState(false);
  
  const [address, setAddress] = useState({
    fullName: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    mobile: ''
  });

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  // --- 📍 GEOLOCATION LOGIC ---
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLoc(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Using OpenStreetMap (Nominatim) - Free, No Key Required
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            setAddress((prev) => ({
              ...prev,
              street: addr.road || addr.suburb || addr.neighbourhood || '',
              city: addr.city || addr.town || addr.village || addr.county || '',
              postalCode: addr.postcode || '',
              country: addr.country || ''
            }));
            toast.success("Location fetched successfully!");
          } else {
            toast.error("Address details not found.");
          }
        } catch (error) {
          console.error(error);
          toast.error("Failed to fetch address details.");
        } finally {
          setLoadingLoc(false);
        }
      },
      (error) => {
        setLoadingLoc(false);
        if (error.code === 1) toast.error("Location permission denied.");
        else toast.error("Unable to retrieve location.");
      }
    );
  };

  const submitHandler = (e) => {
    e.preventDefault();
    // Simple Validation
    if (!address.fullName || !address.street || !address.city || !address.postalCode || !address.country || !address.mobile) {
      toast.error("Please fill all fields");
      return;
    }
    // Navigate to payment
    navigate('/payment', { state: { shippingAddress: address } });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 flex justify-center items-center font-sans">
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-slate-800/50 p-6 md:p-8 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-500">
              <FaShippingFast size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Shipping Details</h2>
              <p className="text-slate-400 text-sm">Where should we deliver your order?</p>
            </div>
          </div>
          
          {/* Current Location Button */}
          <button 
            onClick={handleCurrentLocation}
            disabled={loadingLoc}
            className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-blue-600/20 w-full md:w-auto justify-center"
          >
            {loadingLoc ? <FaSpinner className="animate-spin" /> : <FaMapMarkerAlt />}
            {loadingLoc ? "Locating..." : "Use Current Location"}
          </button>
        </div>

        {/* Form Section */}
        <form onSubmit={submitHandler} className="p-6 md:p-8 space-y-6">
          
          {/* Row 1: Name & Mobile (Responsive Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Full Name</label>
              <input 
                type="text" name="fullName" value={address.fullName} onChange={handleChange} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Mobile Number</label>
              <input 
                type="text" name="mobile" value={address.mobile} onChange={handleChange} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* Row 2: Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 ml-1">Street Address</label>
            <input 
              type="text" name="street" value={address.street} onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              placeholder="Flat No, Building, Area"
            />
          </div>

          {/* Row 3: City & Zip (Responsive Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">City</label>
              <input 
                type="text" name="city" value={address.city} onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Postal Code</label>
              <input 
                type="text" name="postalCode" value={address.postalCode} onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 4: Country */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 ml-1">Country</label>
            <input 
              type="text" name="country" value={address.country} onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group mt-4"
          >
            Continue to Payment <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Shipping;