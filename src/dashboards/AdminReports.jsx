import React, { useState } from 'react';
import { FileText, Download, Printer, Filter, Search } from 'lucide-react';

const AdminReports = ({ orders = [], products = [], customers = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calculate Metrics for Report
  const totalRevenue = orders
    .filter(o => o.order_status !== "Cancelled")
    .reduce((sum, o) => sum + (parseFloat(o.order_total_amount) || 0), 0);
  const activeProducts = products.filter(p => p.is_product_active).length;

  const chartDataSummary = `
  Jan: $12,000 | Feb: $19,000 | Mar: $15,000 
  Apr: $25,000 | May: $22,000 | Jun: $30,000`;

  const generateReport = () => {
    return `
    VAJRA E-COMMERCE - EXECUTIVE REPORT
    -----------------------------------
    Generated: ${new Date().toLocaleString()}

    1. KEY PERFORMANCE INDICATORS
    -----------------------------
    • Total Revenue:       $${totalRevenue.toLocaleString()}
    • Total Orders:        ${orders.length}
    • Total Customers:     ${customers.length}
    • Active Products:     ${activeProducts} / ${products.length}
    • Total Growth:        +24.5% (Est)
    • Bounce Rate:         12.3%
    • Active Sessions:     1,432

    2. REVENUE CHART DATA (YTD)
    ---------------------------
    ${chartDataSummary}

    3. RECENT ORDERS (SNAPSHOT)
    ---------------------------
    ID      | Status      | Amount
    ${orders.slice(0, 5).map(o => `#${o.order_id}   | ${o.order_status.padEnd(10)} | $${o.order_total_amount}`).join('\n    ')}

    -----------------------------------
    End of Report
    `;
  };

  const handleDownload = (name) => {
    const blob = new Blob([generateReport()], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const handlePrint = () => {
    const win = window.open('','','height=600,width=800');
    win.document.write(`<html><body style="font-family:monospace;white-space:pre-wrap;padding:20px;">${generateReport()}</body></html>`);
    win.document.close();
    win.print();
  };

  const reports = [
    { id: 1, name: 'Full System Overview', date: 'Live', size: '2 KB', type: 'TXT' },
    { id: 2, name: 'Sales Performance', date: 'Q3 2025', size: '4 KB', type: 'PDF' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      {/* Header System: Flexible Stack */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 md:p-6 rounded-3xl border border-white/5 backdrop-blur-md">
        <h2 className="text-2xl font-bold text-white px-2">Reports Center</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
            <input 
              value={searchTerm} 
              onChange={e=>setSearchTerm(e.target.value)} 
              placeholder="Search reports..." 
              className="w-full bg-black/20 border border-white/10 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:border-violet-500 outline-none transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-all">
            <Filter size={18}/> <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Reports List: Glass Container */}
      <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="p-5 md:p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5">
          <h3 className="text-lg font-semibold text-white">Available Documents</h3>
          <button 
            onClick={handlePrint} 
            className="text-violet-400 text-sm font-medium hover:text-violet-300 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-violet-500/10 transition-all"
          >
            <Printer size={16}/> Quick Print Summary
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {reports.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
            reports.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
              <div key={r.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-white/5 transition-all gap-5">
                <div className="flex items-center gap-5">
                  <div className="p-4 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/20 shadow-inner">
                    <FileText size={24}/>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg">{r.name}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {r.date}
                      </p>
                      <p className="text-xs text-slate-500 uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {r.type} • {r.size}
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={()=>handleDownload(r.name)} 
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 text-violet-400 hover:bg-violet-600 hover:text-white rounded-2xl transition-all duration-300 border border-violet-500/30 group shadow-lg active:scale-95"
                >
                  <span className="font-semibold">Download</span>
                  <Download size={18} className="group-hover:translate-y-0.5 transition-transform"/>
                </button>
              </div>
            ))
          ) : (
            <div className="p-20 text-center text-slate-500">
              <FileText size={48} className="mx-auto mb-4 opacity-20"/>
              <p className="text-lg italic">No reports matching your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;