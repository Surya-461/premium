import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut
} from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaGoogle, FaUserCircle, FaLock, FaEnvelope } from "react-icons/fa";
import toast, { Toaster } from 'react-hot-toast';

const provider = new GoogleAuthProvider();

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // --- MAIN REDIRECT LOGIC ---
  const checkUserRoleAndRedirect = async (user) => {
    const userEmail = user.email;
    const toastId = toast.loading("Verifying Account...");

    try {
      // 1. Check if Email Exists in 'adminDetails'
      const adminQuery = query(collection(db, "adminDetails"), where("email", "==", userEmail));
      const adminSnapshot = await getDocs(adminQuery);

      if (!adminSnapshot.empty) {
        // Admin Profile Found. Now Check for Active Subscription Payment.
        
        // 2. Check 'subscribed_payments' collection
        const paymentQuery = query(collection(db, "subscribed_payments"), where("email", "==", userEmail));
        const paymentSnapshot = await getDocs(paymentQuery);

        // Logic: Must exist in adminDetails AND have a record in subscribed_payments
        if (!paymentSnapshot.empty) {
           toast.success("Welcome Admin!", { id: toastId });
           navigate("/admindashboard");
        } else {
           // Exists in Admin Details but NO Payment Record found
           toast.error("Access Denied: Please purchase a plan to login.", { id: toastId });
           await signOut(auth); // Sign out so they aren't logged in without a plan
           
           // Redirect to home page (or services page) after a short delay so they can see the error
           setTimeout(() => {
             navigate("/"); 
           }, 2000);
        }
        return; // Stop execution here
      }

      // 3. Check Users Collection (if not an admin)
      const userQuery = query(collection(db, "users"), where("email", "==", userEmail));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        toast.success("Welcome User!", { id: toastId });
        navigate("/userdashboard");
        return; 
      }

      // 4. Not Found in Either Collection
      toast.error("Email does not exist. Please Sign Up.", { id: toastId });
      await signOut(auth); // Force logout
      
    } catch (err) {
      console.error(err);
      toast.error("Verification failed. Please try again.", { id: toastId });
    }
  };

  // --- LOGIN HANDLER ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      // 1. Auth with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Run Role & Payment Checks
      await checkUserRoleAndRedirect(userCredential.user);

    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
      toast.error("Invalid credentials");
    }
  };

  // --- GOOGLE LOGIN HANDLER ---
  const handleGoogleLogin = async () => {
    setError("");
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const result = await signInWithPopup(auth, provider);
      
      // Run Checks
      await checkUserRoleAndRedirect(result.user);

    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return; 
      setError("Google login failed.");
      toast.error("Google login failed.");
    }
  };

  const bgStyle = {
    background: `
      radial-gradient(circle at 20% 20%, rgba(65, 20, 60, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(30, 30, 80, 0.8) 0%, transparent 50%),
      linear-gradient(135deg, #2b102f 0%, #151525 100%)
    `,
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-sans overflow-hidden" style={bgStyle}>
      <Toaster position="top-center" />

      <div className="w-full max-w-[320px] sm:max-w-sm md:max-w-md bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-[25px] border border-white/10 rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-8 md:p-10 relative overflow-hidden animate-[fadeUp_0.8s_ease-out]">
        
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)] pointer-events-none" />

        <div className="text-center mb-8 sm:mb-10 relative z-10">
          <FaUserCircle className="text-[60px] sm:text-[80px] text-white/30 mx-auto drop-shadow-md transition-transform duration-500 hover:scale-105" />
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-xs sm:text-sm p-3 mb-5 text-center relative z-10">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="relative z-10">
          
          <div className="relative mb-6 sm:mb-8 flex items-center border-b border-white/40 transition-colors duration-300 focus-within:border-white">
            <span className="text-white text-lg mr-3 sm:mr-4 pb-2"><FaEnvelope /></span>
            <input
              type="email"
              className="w-full bg-transparent border-none outline-none text-white pb-2 text-sm sm:text-base placeholder-white/70 font-light"
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative mb-6 sm:mb-8 flex items-center border-b border-white/40 transition-colors duration-300 focus-within:border-white">
            <span className="text-white text-lg mr-3 sm:mr-4 pb-2"><FaLock /></span>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full bg-transparent border-none outline-none text-white pb-2 text-sm sm:text-base placeholder-white/70 font-light"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="text-white/70 cursor-pointer pb-2 ml-3 hover:text-white transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 text-xs sm:text-sm gap-3 sm:gap-0 relative z-10">
            <div className="flex items-center group">
              <input 
                className="appearance-none w-4 h-4 border border-white/50 rounded bg-white checked:bg-white checked:border-white cursor-pointer mr-2 relative after:content-['✓'] after:absolute after:text-black after:text-xs after:left-[2px] after:top-[-1px] after:hidden checked:after:block transition-all"
                type="checkbox" 
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="text-white font-light cursor-pointer select-none group-hover:text-white/90" htmlFor="rememberMe">
                Remember me
              </label>
            </div>
            <button
              type="button"
              className="text-white/50 hover:text-white font-light italic transition-colors ml-auto sm:ml-0"
              onClick={() => navigate("/reset")}
            >
              Forgot Password?
            </button>
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#4b1d58] to-[#3a3a8a] text-white py-3 rounded-full font-semibold tracking-[1.5px] uppercase shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:from-[#5e246e] hover:to-[#4a4ab5] mb-4 text-sm sm:text-base"
          >
            LOGIN
          </button>
        </form>

        <div className="text-center mt-4 relative z-10">
            <p className="text-white/50 mb-4 text-xs sm:text-sm">Or login with</p>
            <button
              type="button"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/30 text-white flex items-center justify-center mx-auto hover:bg-white/10 hover:border-white transition-all duration-300 group"
              onClick={handleGoogleLogin}
              title="Sign in with Google"
            >
              <FaGoogle className="text-sm sm:text-base group-hover:scale-110 transition-transform" />
            </button>
        </div>

        <p className="text-center mt-6 mb-0 text-white/50 text-xs sm:text-sm relative z-10">
          Don't have an account? <Link to="/signup" className="text-white font-bold ml-1 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;