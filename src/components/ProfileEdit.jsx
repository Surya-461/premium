import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock, FaCamera } from "react-icons/fa";

const ProfileEdit = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    address: '',
    profileImage: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        mobile: initialData.mobile || '',
        address: initialData.address || '',
        profileImage: initialData.profileImage || ''
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 800 * 1024) {
        alert("Image size is too large. Please select an image under 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    
    const dataToSave = {
        fullName: formData.fullName,
        mobile: formData.mobile,
        address: formData.address,
        profileImage: formData.profileImage,
        updatedAt: new Date()
    };

    try {
      await onSave(dataToSave); 
    } catch (error) {
      console.error("Save error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
      
      {/* --- Header --- */}
      <div className="text-center mb-8">
        <h4 className="text-2xl font-bold text-slate-800">Edit Profile Details</h4>
        <p className="text-slate-500 mt-1">Update your personal information and address.</p>
      </div>
      
      {/* --- Avatar Upload Section --- */}
      <div className="flex flex-col items-center mb-10">
        <label htmlFor="file-upload" className="relative w-32 h-32 cursor-pointer group mb-3">
          {formData.profileImage ? (
            <>
              <img 
                src={formData.profileImage} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg" 
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <FaCamera size={24} />
              </div>
            </>
          ) : (
            <div className="w-full h-full rounded-full bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 group-hover:border-blue-400 group-hover:text-blue-500 transition-colors">
              <FaCamera size={24} className="mb-2" />
              <span className="text-xs font-medium">Upload</span>
            </div>
          )}
        </label>
        <label htmlFor="file-upload" className="text-sm font-semibold text-blue-600 cursor-pointer hover:text-blue-700">
          Change Profile Photo
        </label>
        <input 
          id="file-upload" 
          type="file" 
          accept="image/*" 
          onChange={handleImageChange} 
          className="hidden" 
        />
      </div>

      {/* --- Form Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Full Name</label>
          <div className="relative">
            <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="John Doe" 
              name="fullName"
              value={formData.fullName} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        {/* Mobile */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Mobile Number</label>
          <div className="relative">
            <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transform -scale-x-100" />
            <input 
              type="tel" 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="+91 98765 43210" 
              name="mobile"
              value={formData.mobile} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        {/* Email (Full Width) */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Email Address</label>
          <div className="relative">
            <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type="email" 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed"
              value={formData.email} 
              readOnly 
              disabled
            />
          </div>
        </div>

        {/* Address (Full Width) */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Billing Address</label>
          <div className="relative">
            <FaMapMarkerAlt className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
            <textarea
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[80px] resize-y"
              placeholder="Enter your full address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              required
            />
          </div>
        </div>

        {/* --- Security Section Header --- */}
        <div className="col-span-1 md:col-span-2 mt-4">
            <h6 className="text-slate-800 font-bold border-b border-slate-200 pb-2">Security</h6>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">New Password</label>
          <div className="relative">
            <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type={showPassword ? "text" : "password"} 
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="Leave blank to keep current" 
              name="password"
              value={formData.password} 
              onChange={handleChange} 
            />
            <button 
              type="button" 
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
          <div className="relative">
            <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="Re-enter new password" 
              name="confirmPassword"
              value={formData.confirmPassword} 
              onChange={handleChange} 
            />
            <button 
              type="button" 
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

      </div>

      {/* --- Actions --- */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-10 pt-6 border-t border-slate-100">
        <button
          type="button"
          className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default ProfileEdit;