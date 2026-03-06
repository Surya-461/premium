import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft, ChevronRight,
  Filter, Loader2,
  MessageSquare,
  Package,
  Search,
  User
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { db } from "../firebase";
// prediction helper
import { Link } from 'react-router-dom';
import { predictOrderRisk } from "../utils/mlPrediction";

// ─── Risk Badge Component ────────────────────────────────────────────────────
const AdminOrders = ({ initialOrders, onUpdate, customers = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isUpdating, setIsUpdating] = useState(null);

  const [searchPrediction, setSearchPrediction] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ── Sorting ────────────────────────────────────────────────────────────────
  const sortedOrders = useMemo(() => {
    if (!initialOrders) return [];
    return [...initialOrders].sort((a, b) => {
      if (a.isFirebase && !b.isFirebase) return -1;
      if (!a.isFirebase && b.isFirebase) return 1;
      return new Date(b.order_date) - new Date(a.order_date);
    });
  }, [initialOrders]);

  // when admin types an order ID into searchTerm, fetch prediction for first matching order
  React.useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSearchPrediction(null);
      return;
    }
    const match = sortedOrders.find(o => String(o.order_id).includes(trimmed));
    if (match) {
      setSearchLoading(true);
      predictOrderRisk(match.order_id, match)
        .then(res => setSearchPrediction(res))
        .catch(err => {
          console.error("prediction error", err);
          setSearchPrediction(null);
        })
        .finally(() => setSearchLoading(false));
    } else {
      setSearchPrediction(null);
    }
  }, [searchTerm, sortedOrders]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return sortedOrders.filter(order => {
      const sTerm = searchTerm.toLowerCase();
      const idMatch = order.order_id?.toString().toLowerCase().includes(sTerm);
      const statusMatch = statusFilter === 'All' || order.order_status === statusFilter;
      return idMatch && statusMatch;
    });
  }, [sortedOrders, searchTerm, statusFilter]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // ── Status Change ──────────────────────────────────────────────────────────
  const handleStatusChange = async (id, newStatus, isFirebase, customerId) => {
    if (!isFirebase) {
      alert("This is a demo order. Changes won't persist to the database.");
      return;
    }
    setIsUpdating(id);
    try {
      await updateDoc(doc(db, "OrderItems", String(id)), {
        orderStatus: newStatus,
        ...(newStatus === 'Returned' && { refundProcessedDate: serverTimestamp() })
      });
      if (newStatus === 'Returned' || newStatus === 'Refunded') {
        const refundQ = query(collection(db, "refunds"), where("orderId", "==", id));
        const refundSnap = await getDocs(refundQ);
        refundSnap.forEach(async (d) => {
          await updateDoc(doc(db, "refunds", d.id), { status: "Approved" });
        });
      }
      if (customerId) {
        let message = `Your Order #${String(id).slice(0, 8)} status has been updated to: ${newStatus}`;
        let subType = "order_update";
        if (newStatus === 'Returned') {
          message = `Refund Successfully credited into your  account for Order #${String(id).slice(0, 8)}.`;
          subType = "refund_approved";
        }
        await addDoc(collection(db, "notifications"), {
          type: "user", recipientId: customerId, subType,
          status: newStatus, message, createdAt: serverTimestamp(), read: false
        });
      }
      if (onUpdate) await onUpdate();
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
    } finally {
      setIsUpdating(null);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getStatusColor = (s) => {
    switch (s) {
      case 'Delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Processing': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Shipped': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Cancelled': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'Returned': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Return Requested': return 'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const ActionDropdown = ({ o }) => (
    <div className="relative inline-block w-full sm:w-36 group/select">
      {isUpdating === o.order_id ? (
        <div className="flex items-center justify-center py-2 bg-slate-800 rounded-lg border border-slate-700">
          <Loader2 size={16} className="text-violet-500 animate-spin" />
        </div>
      ) : (
        <>
          <select
            value={o.order_status}
            onChange={(e) => handleStatusChange(o.order_id, e.target.value, o.isFirebase, o.userId || o.customer_id)}
            className={`w-full appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg px-3 py-2 outline-none cursor-pointer focus:border-violet-500 transition-colors ${o.order_status === 'Return Requested' ? 'border-orange-500 text-orange-400 font-bold' : ''}`}
          >
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Return Requested">Return Requested</option>
            <option value="Returned">Approve Refund</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover/select:text-violet-400 transition-colors" />
        </>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in px-2 sm:px-0 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package className="text-violet-500" /> Order Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage, track and update customer orders.</p>
          <Link to={"/pre"}><button className='text-slate-500 text-xs mt-2 hover:text-violet-400 transition'> <b>View Return Prediction</b></button></Link> <br></br>


          <Link to={"/can"}><button className='text-slate-500 text-xs mt-2 hover:text-violet-400 transition'> <b>View Cancelled Orders</b></button></Link>
        </div>




        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search Order ID..."
              className="bg-slate-950 border border-slate-700 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl w-full sm:w-64 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-950 border border-slate-700 text-slate-200 pl-4 pr-10 py-2.5 rounded-xl outline-none cursor-pointer appearance-none w-full sm:w-auto focus:ring-2 focus:ring-violet-500/50 text-sm font-medium"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Return Requested">Return Requests</option>
              <option value="Returned">Returned / Refunded</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── DESKTOP TABLE ─────────────────────────────────────────────── */}
      <div className="hidden sm:block bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
                <th className="p-5 font-semibold">ID</th>
                <th className="p-5 font-semibold">Date</th>
                <th className="p-5 font-semibold">Customer</th>
                <th className="p-5 font-semibold">Status / Reason</th>
                <th className="p-5 font-semibold text-center">Return Prediction</th>
                <th className="p-5 font-semibold text-center">Cancel Prediction</th>
                <th className="p-5 font-semibold text-right">Total</th>
                <th className="p-5 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {currentItems.length > 0 ? (
                currentItems.map(o => {
                  return (
                    <tr
                      key={o.order_id}
                      className={`hover:bg-slate-800/30 transition-all group ${o.order_status === 'Return Requested' ? 'bg-orange-500/5' : ''}`}
                    >
                      {/* Order ID */}
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="text-violet-400 font-mono font-bold text-xs select-all bg-violet-500/10 px-2 py-1 rounded border border-violet-500/20 w-fit">
                            #{String(o.order_id).slice(0, 8)}
                          </span>
                          {o.isFirebase && <span className="text-[10px] text-emerald-500 mt-1 font-bold uppercase tracking-wider">Live Order</span>}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-5">
                        <div className="text-slate-300 text-sm flex items-center gap-2">
                          <Calendar size={14} className="text-slate-500" /> {o.order_date}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-5">
                        <div className="text-slate-300 text-sm flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600 shadow-sm">
                            <User size={14} className="text-slate-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="truncate max-w-[120px] font-medium text-white" title={o.customer_id}>{o.customer_id}</span>
                            <span className="text-[10px] text-slate-500">Customer</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-5">
                        <div className="flex flex-col items-start gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border tracking-wide uppercase shadow-sm ${getStatusColor(o.order_status)}`}>
                            {o.order_status === 'Return Requested' && <AlertCircle size={12} className="mr-1.5" />}
                            {o.order_status}
                          </span>
                          {o.order_status === 'Return Requested' && o.returnReason && (
                            <div className="flex items-start gap-2 mt-1 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 max-w-[220px]">
                              <MessageSquare size={14} className="text-orange-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] text-orange-400 font-bold uppercase mb-0.5">Reason:</p>
                                <p className="text-xs text-orange-200 leading-tight italic">"{o.returnReason}"</p>
                              </div>
                            </div>
                          )}
                          {o.order_status === 'Returned' && (
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
                              <CheckCircle size={12} /> Refund Processed
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Return Prediction */}
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center">
                          {(() => {
                            const cust = customers.find(c => c.customer_full_name === o.customer_id);
                            const returnRate = cust?.customer_return_rate || 0;
                            const returnColor = returnRate >= 0.7 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                              returnRate >= 0.4 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                'bg-green-500/10 border-green-500/30 text-green-400';
                            return (
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${returnColor} inline-block`}>
                                {returnRate.toFixed(2)}
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Cancel Prediction */}
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center">
                          {(() => {
                            const cust = customers.find(c => c.customer_full_name === o.customer_id);
                            const cancelRate = cust?.customer_cancel_rate || 0;
                            const cancelColor = cancelRate >= 0.7 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                              cancelRate >= 0.4 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                'bg-green-500/10 border-green-500/30 text-green-400';
                            return (
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cancelColor} inline-block`}>
                                {cancelRate.toFixed(2)}
                              </span>
                            );
                          })()}
                        </div>
                      </td>


                      {/* Total */}
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-1 font-bold text-white font-mono text-sm">
                          <span className="text-slate-500">₹</span>
                          {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(o.order_total_amount))}
                        </div>
                      </td>

                      {/* Status dropdown */}
                      <td className="p-5 text-center">
                        <ActionDropdown o={o} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="6" className="p-10 text-center text-slate-500 italic">No orders found matching your criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MOBILE CARD VIEW ──────────────────────────────────────────────── */}
      <div className="sm:hidden grid grid-cols-1 gap-4">
        {currentItems.length > 0 ? (
          currentItems.map(o => {
            return (
              <div key={o.order_id} className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden ${o.order_status === 'Return Requested' ? 'border-orange-500/30' : ''}`}>
                {o.order_status === 'Return Requested' && <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-bl-full -mr-8 -mt-8 z-0" />}

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <span className="text-violet-400 font-mono font-bold text-xs bg-violet-500/10 px-2 py-1 rounded border border-violet-500/20">#{String(o.order_id).slice(0, 8)}</span>
                    {o.isFirebase && <span className="ml-2 text-[10px] text-emerald-500 font-bold uppercase">Live</span>}
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Calendar size={12} /> {o.order_date}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-lg font-bold text-white">₹{new Intl.NumberFormat('en-IN').format(Number(o.order_total_amount))}</span>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(o.order_status)}`}>{o.order_status}</span>
                  </div>
                </div>



                <div className="flex items-center gap-3 mb-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0">
                    <User size={14} className="text-slate-400" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm text-white font-medium truncate">{o.customer_id}</p>
                    <p className="text-[10px] text-slate-500">Customer ID</p>
                  </div>
                </div>

                {o.order_status === 'Return Requested' && o.returnReason && (
                  <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <MessageSquare size={14} className="text-orange-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-orange-400 font-bold uppercase">Return Reason</p>
                        <p className="text-xs text-orange-200 italic">"{o.returnReason}"</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <ActionDropdown o={o} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl">
            <Package size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 italic">No orders found.</p>
          </div>
        )}
      </div>

      {/* ── PAGINATION ────────────────────────────────────────────────────── */}
      {filteredOrders.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-4 mt-6 bg-slate-900/80 p-2 rounded-2xl w-fit mx-auto border border-slate-800 backdrop-blur-sm shadow-xl sticky bottom-4 z-20">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-xl bg-slate-800 text-white hover:bg-violet-600 disabled:opacity-30 disabled:hover:bg-slate-800 transition-all active:scale-95 border border-slate-700 hover:border-violet-500"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest px-2">
            Page <span className="text-white text-sm">{currentPage}</span> / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-xl bg-slate-800 text-white hover:bg-violet-600 disabled:opacity-30 disabled:hover:bg-slate-800 transition-all active:scale-95 border border-slate-700 hover:border-violet-500"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;