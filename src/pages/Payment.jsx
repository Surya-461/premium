import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
// ✅ 1. Import React Hot Toast
import toast, { Toaster } from 'react-hot-toast';
import { clearCart } from '../slices/cartSlice';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { FaLock, FaShieldAlt, FaTicketAlt, FaTimes, FaCheck, FaCreditCard, FaUniversity } from 'react-icons/fa';

const stripePromise = loadStripe('pk_test_51SwiQp25cm44kEnPYZ1EES9tPRcGrXXegbGkILXrEDPf4JKr3FAvioM4DxkSKIb6NvTDiXNmaIcoKQOloEWVXiI300hwZ3aO5g');

// --- STATIC BANK OFFERS CONFIGURATION ---
const BANK_OFFERS = [
  { id: 'default', name: 'Select Bank Offer', discountPercent: 0 },
  { id: 'HDFC', name: 'HDFC Bank Credit Card - 10% Off', discountPercent: 10 },
  { id: 'SBI', name: 'SBI Debit Card - 5% Off', discountPercent: 5 },
  { id: 'AXIS', name: 'Axis Bank Buzz Card - 15% Off', discountPercent: 15 },
  { id: 'ICICI', name: 'ICICI Amazon Pay - 8% Off', discountPercent: 8 },
];

const CheckoutForm = ({ shippingAddress, totalPrice, cartItems, profile }) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);

  // --- DISCOUNT STATES ---
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedBankOffer, setSelectedBankOffer] = useState('default');

  const finalAmount = totalPrice - discount;

  // --- 1. HANDLE COUPON ---
  const handleApplyCoupon = async () => {
    if (!couponCode) {
      toast("Please enter a coupon code", { icon: '⚠️', style: { background: '#1e293b', color: '#fff' } });
      return;
    }

    const code = couponCode.toUpperCase();

    try {
      const q = query(collection(db, "coupons"), where("code", "==", code), where("isActive", "==", true));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error("Invalid or inactive coupon code.", { style: { background: '#1e293b', color: '#fff' } });
        setDiscount(0);
        setAppliedCoupon(null);
        return;
      }

      const couponData = snapshot.docs[0].data();
      const expiryDate = couponData.expiryDate?.toDate ? couponData.expiryDate.toDate() : new Date(couponData.expiryDate);

      if (new Date() > expiryDate) {
        toast.error("This coupon has expired.", { style: { background: '#1e293b', color: '#fff' } });
        setDiscount(0);
        setAppliedCoupon(null);
        return;
      }

      // RESET BANK OFFER IF COUPON APPLIED (Mutually Exclusive)
      setSelectedBankOffer('default');

      const discountAmount = (totalPrice * couponData.discount) / 100;
      setDiscount(discountAmount);
      setAppliedCoupon(code);
      toast.success(`Coupon applied! Saved ₹${discountAmount.toFixed(2)}`, {
        style: { background: '#1e293b', color: '#fff', border: '1px solid #10b981' }
      });

    } catch (error) {
      console.error("Error validating coupon:", error);
      toast.error("Error checking coupon.", { style: { background: '#1e293b', color: '#fff' } });
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setDiscount(0);
    setAppliedCoupon(null);
    toast("Coupon removed.", { icon: '🗑️', style: { background: '#1e293b', color: '#fff' } });
  };

  // --- 2. HANDLE BANK OFFER SELECTION ---
  const handleBankSelection = (e) => {
    const offerId = e.target.value;
    setSelectedBankOffer(offerId);

    if (offerId === 'default') {
      setDiscount(0);
      return;
    }

    // RESET COUPON IF BANK OFFER SELECTED (Mutually Exclusive)
    if (appliedCoupon) {
      setCouponCode('');
      setAppliedCoupon(null);
      toast("Coupon removed to apply Bank Offer.", { icon: 'ℹ️', style: { background: '#1e293b', color: '#fff' } });
    }

    const offer = BANK_OFFERS.find(o => o.id === offerId);
    if (offer) {
      const discountAmount = (totalPrice * offer.discountPercent) / 100;
      setDiscount(discountAmount);
      toast.success(`${offer.name} applied!`, {
        style: { background: '#1e293b', color: '#fff', border: '1px solid #3b82f6' }
      });
    }
  };

  // --- 3. HANDLE SUBMIT ---
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: shippingAddress.fullName,
        email: profile.email,
        phone: shippingAddress.mobile,
      },
    });

    if (error) {
      toast.error(error.message, { style: { background: '#1e293b', color: '#fff' } });
      setProcessing(false);
    } else {
      try {
        const orderData = {
          email: profile.email,
          userId: profile.uid,
          customerName: shippingAddress.fullName,
          mobile: shippingAddress.mobile || '',
          shippingAddress: shippingAddress,
          items: cartItems,
          amount: finalAmount,
          originalAmount: totalPrice,
          discountApplied: discount,
          couponCode: appliedCoupon || selectedBankOffer, // Record which offer was used
          totalAmount: finalAmount,
          currency: 'inr',
          paymentId: paymentMethod.id,
          paymentStatus: 'Paid',
          orderStatus: 'Processing',
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "OrderItems"), orderData);

        dispatch(clearCart());
        toast.success("Payment Successful! Order placed.", {
          duration: 2000,
          style: { background: '#1e293b', color: '#fff', border: '1px solid #10b981' }
        });

        setTimeout(() => navigate('/order-success'), 1500);

      } catch (err) {
        console.error("Error saving order:", err);
        toast.error("Payment successful, but failed to save order details.", { style: { background: '#1e293b', color: '#fff' } });
      }

      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* --- SECTION A: COUPON CODE --- */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        {/* ✅ FIXED: Removed 'block' to resolve conflict */}
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
          <FaTicketAlt /> Coupon Code
        </label>
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              disabled={!!appliedCoupon || selectedBankOffer !== 'default'}
              placeholder={selectedBankOffer !== 'default' ? "Bank Offer Active" : "Enter Coupon Code"}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-4 pr-4 text-white text-sm outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          {appliedCoupon ? (
            <button type="button" onClick={handleRemoveCoupon} className="bg-rose-600 hover:bg-rose-500 text-white px-4 rounded-lg text-sm font-bold transition-colors">
              <FaTimes />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={selectedBankOffer !== 'default'}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 rounded-lg text-sm font-bold transition-colors"
            >
              Apply
            </button>
          )}
        </div>
        {appliedCoupon && (
          <div className="mt-2 flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <FaCheck size={10} /> Coupon "{appliedCoupon}" applied!
          </div>
        )}
      </div>

      {/* --- SECTION B: BANK OFFERS (ALTERNATIVE) --- */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-800"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-900 px-2 text-xs text-slate-500 uppercase tracking-widest">OR USE CARD OFFER</span>
        </div>
      </div>

      <div className={`bg-slate-950 border ${selectedBankOffer !== 'default' ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-800'} rounded-xl p-4 transition-all duration-300`}>
        {/* ✅ FIXED: Removed 'block' to resolve conflict */}
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
          <FaUniversity /> Bank / Card Offers
        </label>
        <div className="relative">
          <select
            value={selectedBankOffer}
            onChange={handleBankSelection}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-4 pr-8 text-white text-sm outline-none focus:border-blue-500 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
          >
            {BANK_OFFERS.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
            <FaCreditCard />
          </div>
        </div>
        {selectedBankOffer !== 'default' && (
          <div className="mt-2 flex items-center gap-2 text-blue-400 text-xs font-medium bg-blue-500/10 p-2 rounded-lg border border-blue-500/20 animate-fade-in">
            <FaCheck size={10} /> Offer Applied. Discount added to total.
          </div>
        )}
      </div>

      {/* --- PAYMENT ELEMENT --- */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 transition-colors focus-within:border-blue-500 mt-4">
        <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Card Details</label>
        <CardElement options={{
          hidePostalCode: false,
          style: {
            base: {
              fontSize: '16px',
              color: '#ffffff',
              iconColor: '#60a5fa',
              '::placeholder': { color: '#64748b' },
            },
            invalid: { color: '#ef4444' },
          },
        }} />
      </div>

      {/* --- PAY BUTTON --- */}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold shadow-lg shadow-green-900/20 transition-all flex justify-center items-center gap-2 mt-6"
      >
        {processing ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Processing...
          </span>
        ) : (
          <> <FaLock size={14} /> Pay ₹{finalAmount.toFixed(2)} </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4">
        <FaShieldAlt /> TLS Secured Transaction
      </div>
    </form>
  );
};

const Payment = () => {
  const location = useLocation();
  const { items, totalPrice } = useSelector((state) => state.cart || { items: [], totalPrice: 0 });
  const { profile } = useSelector((state) => state.user || { profile: {} });
  const shippingAddress = location.state?.shippingAddress;

  if (!shippingAddress) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-4">
        <p>No shipping information found.</p>
        <button onClick={() => window.history.back()} className="text-blue-400 hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 flex justify-center">
      {/* ✅ 2. Toaster Added */}
      <Toaster position="top-right" />

      <div className="w-full max-w-lg">
        <h2 className="text-3xl font-bold mb-8 text-center text-white">Secure Payment</h2>

        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">

          <div className="mb-8 p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order Summary</h3>

            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400">Customer</span>
              <div className="text-right">
                <p className="text-white font-medium text-sm">{shippingAddress.fullName}</p>
                <p className="text-slate-500 text-xs">{profile.email}</p>
              </div>
            </div>

            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400">Ship to</span>
              <p className="text-slate-500 text-xs text-right truncate max-w-[200px]">
                {shippingAddress.address}, {shippingAddress.city}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 text-sm">Subtotal</span>
                <span className="text-white font-medium">₹{totalPrice}</span>
              </div>
            </div>
          </div>

          <Elements stripe={stripePromise}>
            <CheckoutForm
              shippingAddress={shippingAddress}
              totalPrice={totalPrice}
              cartItems={items}
              profile={profile}
            />
          </Elements>

        </div>
      </div>
    </div>
  );
};

export default Payment;