import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { setProfile, logout } from './slices/userSlice';
import BouncingLoader from "./pages/BouncingLoader";
import MainLayout from "./components/ui/MainLayout";
import { Upload } from "lucide-react";

// Lazy Imports
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Cart = lazy(() => import("./pages/Cart"));
const Search = lazy(() => import("./pages/Search"));
const PageNotFound = lazy(() => import("./pages/PageNotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Payment = lazy(() => import("./pages/Payment"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess")); 

// Dashboards
const AdminDashboard = lazy(() => import("./dashboards/AdminDashboard"));
const UserDashboard = lazy(() => import("./dashboards/UserDashboard"));
// --- NEW IMPORT ---
const SuperAdminDashboard = lazy(() => import("./dashboards/SuperAdminDashboard")); 

const LoadingFallback = () => (
   <BouncingLoader/>
);

function App() {
  const dispatch = useDispatch();

  // --- SYNC FIREBASE AUTH WITH REDUX ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 1. User is signed in, fetch extra details from Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        let userData = {};
        if (docSnap.exists()) {
          userData = docSnap.data();
        }

        // 2. Dispatch to Redux
        dispatch(setProfile({
          uid: user.uid,
          email: user.email,
          fullname: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          mobile: userData.mobile || '',
          address: userData.address || '',
          profileImage: userData.profileImage || ''
        }));
      } else {
        // 3. User is signed out, clear Redux
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<Cart />} />
          
          {/* --- Checkout Routes --- */}
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/order-success" element={<OrderSuccess />} />

          {/* --- Dashboard Routes --- */}
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/userdashboard" element={<UserDashboard />} />
          <Route path="/superadmindashboard" element={<SuperAdminDashboard />} /> 
          
          <Route path="/upload" element={<Upload/>}/>
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <ToastContainer />
    </Suspense>
  );
}

export default App;