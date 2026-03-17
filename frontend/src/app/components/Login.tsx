import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Stethoscope } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Stethoscope className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1>Welcome back</h1>
          <p className="text-muted-foreground text-[14px] mt-1">Sign in to your Logoped account</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[13px] mb-1 block">Email or Phone</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dana@clinic.kz"
              className="w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <div>
            <label className="text-[13px] mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <div className="text-right">
            <button type="button" className="text-[13px] text-primary hover:underline">Forgot Password?</button>
          </div>
          <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            Sign In
          </button>
        </form>
        <p className="text-center text-[13px] text-muted-foreground">
          Don't have an account?{" "}
          <button onClick={() => navigate("/register")} className="text-primary hover:underline">Register</button>
        </p>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="bg-background px-3 text-[12px] text-muted-foreground">or</span></div>
        </div>
        <p className="text-center text-[13px] text-muted-foreground">
          Are you a parent?{" "}
          <button onClick={() => navigate("/parent/login")} className="text-primary hover:underline">Parent Portal →</button>
        </p>
      </motion.div>
    </div>
  );
}
