import React, { useState, useEffect } from 'react';
import { Save, Globe, Monitor, Loader, CheckCircle } from 'lucide-react';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const AdminSettings = () => {
  const [settings, setSettings] = useState({ siteName: 'Vajra Store', maintenanceMode: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "global"));
        if(snap.exists()) setSettings(snap.data());
      } catch(e) { console.error(e); }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "global"), settings, { merge: true });
      setMsg('Configuration saved successfully!');
      setTimeout(()=>setMsg(''), 3000);
    } catch(e) { 
      alert("Failed to update settings."); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-10 relative">
      
      {/* --- SUCCESS NOTIFICATION --- */}
      {msg && (
        <div className="fixed top-24 right-4 sm:right-10 z-[60] bg-emerald-500/20 text-emerald-300 px-6 py-3 rounded-2xl flex items-center gap-3 border border-emerald-500/30 backdrop-blur-xl animate-bounce shadow-2xl">
          <CheckCircle size={20}/> 
          <span className="text-sm font-semibold">{msg}</span>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="bg-white/5 p-4 md:p-6 rounded-3xl border border-white/5 backdrop-blur-md shadow-xl">
        <h2 className="text-2xl font-bold text-white px-2">Platform Settings</h2>
        <p className="text-slate-400 text-sm px-2 mt-1">Configure global store behavior and branding.</p>
      </div>

      {/* --- SETTINGS GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* General Branding Card */}
        <div className="bg-white/5 border border-white/5 p-6 md:p-8 rounded-3xl backdrop-blur-md shadow-2xl transition-all hover:border-white/10">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <Globe size={22} className="text-blue-400"/> General Configuration
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Store Display Name</label>
              <input 
                value={settings.siteName} 
                onChange={e=>setSettings({...settings, siteName: e.target.value})} 
                placeholder="e.g. Vajra Premium"
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white outline-none transition-all focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 placeholder-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode Card */}
        <div className={`p-6 md:p-8 rounded-3xl backdrop-blur-md border shadow-2xl transition-all duration-500 ${settings.maintenanceMode ? 'bg-amber-500/10 border-amber-500/30 shadow-amber-900/20' : 'bg-white/5 border-white/5'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h3 className={`text-lg font-bold flex items-center gap-3 ${settings.maintenanceMode ? 'text-amber-400' : 'text-white'}`}>
                <Monitor size={22}/> Maintenance Mode
              </h3>
              <p className="text-sm text-slate-400 max-w-[280px]">
                Activating this will hide the public storefront and show a "Under Construction" page to customers.
              </p>
            </div>
            
            {/* Custom Styled Toggle */}
            <label className="relative inline-flex items-center cursor-pointer scale-110 sm:scale-125">
              <input 
                type="checkbox" 
                checked={settings.maintenanceMode} 
                onChange={()=>setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} 
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
            </label>
          </div>
          
          {settings.maintenanceMode && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3 items-center animate-pulse">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-xs text-amber-500/80 font-medium">Store is currently invisible to the public</span>
            </div>
          )}
        </div>

      </div>

      {/* --- ACTION BAR --- */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-500 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-violet-900/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader className="animate-spin" size={20}/>
              <span>Applying Changes...</span>
            </>
          ) : (
            <>
              <Save size={20}/>
              <span>Save All Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;