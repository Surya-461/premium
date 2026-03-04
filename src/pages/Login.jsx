import {
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";

const provider = new GoogleAuthProvider();

const Login = () => {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {

    const savedEmail = localStorage.getItem("rememberedEmail")

    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }

  }, [])



  const checkUserRoleAndRedirect = async (user) => {

    const userEmail = user.email
    const toastId = toast.loading("Verifying account...")

    try {

      const adminQuery = query(collection(db, "adminDetails"), where("email", "==", userEmail))
      const adminSnapshot = await getDocs(adminQuery)

      if (!adminSnapshot.empty) {

        const paymentQuery = query(collection(db, "subscribed_payments"), where("email", "==", userEmail))
        const paymentSnapshot = await getDocs(paymentQuery)

        if (!paymentSnapshot.empty) {

          toast.success("Welcome Admin!", { id: toastId })
          navigate("/admindashboard")

        } else {

          toast.error("Please purchase a plan.", { id: toastId })
          await signOut(auth)
          setTimeout(() => navigate("/"), 2000)

        }

        return
      }

      const userQuery = query(collection(db, "users"), where("email", "==", userEmail))
      const userSnapshot = await getDocs(userQuery)

      if (!userSnapshot.empty) {

        toast.success("Welcome User!", { id: toastId })
        navigate("/userdashboard")
        return

      }

      toast.error("Account not found", { id: toastId })
      await signOut(auth)

    } catch (err) {

      toast.error("Verification failed", { id: toastId })

    }

  }



  const handleLogin = async (e) => {

    e.preventDefault()
    setLoading(true)

    try {

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email)
      } else {
        localStorage.removeItem("rememberedEmail")
      }

      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)

      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      await checkUserRoleAndRedirect(userCredential.user)

    } catch (err) {

      setError("Invalid email or password")
      toast.error("Invalid credentials")

    }

    setLoading(false)

  }



  const handleGoogleLogin = async () => {

    try {

      const result = await signInWithPopup(auth, provider)
      await checkUserRoleAndRedirect(result.user)

    } catch (err) {

      if (err.code === "auth/popup-closed-by-user") return
      toast.error("Google login failed")

    }

  }



  return (

    <div className="min-h-screen flex items-center justify-center bg-[#0b0b13] relative overflow-hidden font-sans">


      {/* gradient mesh background */}

      <div className="absolute inset-0 opacity-40">

        <div className="absolute w-[600px] h-[600px] bg-purple-600 rounded-full blur-[160px] top-[-100px] left-[-100px]" />

        <div className="absolute w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[160px] bottom-[-100px] right-[-100px]" />

        <div className="absolute w-[500px] h-[500px] bg-pink-600 rounded-full blur-[160px] top-[40%] left-[30%]" />

      </div>


      <Toaster position="top-center" />



      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.8)] relative z-10"
      >



        <h2 className="text-white text-2xl font-semibold text-center mb-10">

          Welcome Back

        </h2>



        {error && (

          <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-sm p-3 rounded-lg text-center mb-5">

            {error}

          </div>

        )}



        <form onSubmit={handleLogin} className="space-y-7">



          {/* floating email */}

          <div className="relative">

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="peer w-full bg-white/5 border border-white/20 rounded-xl px-4 pt-6 pb-2 text-white placeholder-transparent focus:border-purple-400 outline-none transition"
            />

            <label className="absolute left-4 top-2 text-xs text-white/50 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/40 transition-all">

              Email Address

            </label>

          </div>



          {/* floating password */}

          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="peer w-full bg-white/5 border border-white/20 rounded-xl px-4 pt-6 pb-2 text-white placeholder-transparent focus:border-purple-400 outline-none transition"
            />

            <label className="absolute left-4 top-2 text-xs text-white/50 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/40 transition-all">

              Password

            </label>

            <span
              className="absolute right-4 top-4 text-white/50 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >

              {showPassword ? <FaEyeSlash /> : <FaEye />}

            </span>

          </div>



          {/* options */}

          <div className="flex justify-between text-sm text-white/60">

            <label className="flex items-center gap-2">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-purple-500"
              />

              Remember me

            </label>

            <button
              type="button"
              onClick={() => navigate("/reset")}
              className="hover:text-white"
            >

              Forgot password?

            </button>

          </div>



          {/* premium button */}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg flex items-center justify-center gap-2"
          >

            {loading ? (

              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />

            ) : "Login"}

          </motion.button>



        </form>



        {/* divider */}

        <div className="flex items-center my-8">

          <div className="flex-1 h-px bg-white/20" />

          <p className="px-3 text-white/40 text-sm">

            or

          </p>

          <div className="flex-1 h-px bg-white/20" />

        </div>



        {/* google */}

        <motion.button
          whileHover={{ scale: 1.03 }}
          onClick={handleGoogleLogin}
          className="w-full py-3 border border-white/20 rounded-xl text-white flex items-center justify-center gap-3 hover:bg-white/10 transition"
        >

          <FaGoogle />

          Sign in with Google

        </motion.button>



        <p className="text-center text-white/50 mt-8 text-sm">

          Don't have an account?{" "}

          <Link to="/signup" className="text-purple-400 hover:underline">

            Sign up

          </Link>

        </p>


      </motion.div>

    </div>

  )

}

export default Login