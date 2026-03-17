import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Stethoscope } from "lucide-react";

export default function ParentLogin() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

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
          <h1>Parent Portal</h1>
          <p className="text-muted-foreground text-[14px] mt-1">View homework & pay for sessions</p>
        </div>

        <AnimatePresence mode="wait">
          {!otpSent ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div>
                <label className="text-[13px] mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 7XX XXX XXXX"
                  className="w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <button
                onClick={() => setOtpSent(true)}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 transition-opacity"
              >
                Send Code via WhatsApp
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="bg-accent/50 rounded-xl p-3 text-center">
                <p className="text-[13px] text-muted-foreground">Code sent to <span className="text-foreground">{phone || "+7 7XX XXX XXXX"}</span></p>
              </div>
              <div>
                <label className="text-[13px] mb-1 block">Enter 4-digit Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="• • • •"
                  maxLength={4}
                  className="w-full px-3 py-3 rounded-xl bg-input-background text-[18px] outline-none focus:ring-2 focus:ring-primary/30 text-center tracking-[0.6em] transition-all"
                />
              </div>
              <button
                onClick={() => navigate("/parent")}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 transition-opacity"
              >
                Verify & Sign In
              </button>
              <button onClick={() => setOtpSent(false)} className="w-full text-[13px] text-muted-foreground hover:underline">
                Change phone number
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="bg-background px-3 text-[12px] text-muted-foreground">or</span></div>
        </div>
        <p className="text-center text-[13px] text-muted-foreground">
          Are you a therapist?{" "}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline">← Therapist Login</button>
        </p>
      </motion.div>
    </div>
  );
}
