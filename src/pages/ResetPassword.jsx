import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaArrowLeft,
  FaExclamationCircle,
  FaCheckCircle,
} from "react-icons/fa";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setInfo("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);

      // ✅ Secure message
      setInfo(
        "If an account exists for this email, a password reset link has been sent."
      );

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error(err);

      if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Unable to send reset email. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Custom complex gradient background style
  const backgroundStyle = {
    background: `
      radial-gradient(at top left, #4a2c44 0%, transparent 50%),
      radial-gradient(at top right, #3a2a52 0%, transparent 50%),
      radial-gradient(at bottom left, #56324a 0%, transparent 50%),
      radial-gradient(at bottom right, #2e2e5e 0%, transparent 50%),
      #0f172a
    `,
  };

  return (
    <div 
      // Changed min-h-screen to min-h-[100dvh] for better mobile browser support
      className="min-h-[100dvh] w-full flex items-center justify-center p-4 md:p-5 font-sans text-white"
      style={backgroundStyle}
    >
      {/* Glass Card - Responsive padding (p-6 mobile, p-10 desktop) */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 md:p-10 rounded-2xl md:rounded-3xl text-center relative overflow-hidden animate-[fadeUp_0.8s_ease-out]">
        
        {/* Header Icon - Responsive sizing */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 md:w-[70px] md:h-[70px] bg-white/10 rounded-full flex items-center justify-center text-2xl md:text-3xl text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <FaLock />
          </div>
        </div>

        {/* Responsive Text Sizes */}
        <h2 className="text-xl md:text-2xl font-bold mb-3 tracking-wide">Forgot Password?</h2>
        <p className="text-slate-400 text-xs md:text-sm mb-8 leading-relaxed">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/20 text-red-300 border border-red-500/30 p-3 rounded-lg mb-6 flex items-center gap-3 text-xs md:text-sm text-left">
            <FaExclamationCircle className="text-base flex-shrink-0" /> {error}
          </div>
        )}

        {info && (
          <div className="bg-green-500/20 text-green-300 border border-green-500/30 p-3 rounded-lg mb-6 flex items-center gap-3 text-xs md:text-sm text-left">
            <FaCheckCircle className="text-base flex-shrink-0" /> {info}
          </div>
        )}

        <form onSubmit={handleReset} className="flex flex-col gap-2">
          {/* Input Group */}
          <div className="relative flex items-center border-b border-white/30 pb-2 mb-6 transition-colors duration-300 focus-within:border-blue-500 group">
            <span className="text-slate-300 text-lg mr-3 group-focus-within:text-blue-400 transition-colors">
              <FaEnvelope />
            </span>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border-none outline-none text-white text-sm md:text-base placeholder-white/50 py-1"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 md:py-3.5 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold text-sm md:text-base shadow-lg shadow-blue-600/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-xs md:text-sm font-medium"
          >
            <FaArrowLeft /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;