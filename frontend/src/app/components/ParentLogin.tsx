import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Stethoscope, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./ui/LanguageSwitcher";

export default function ParentLogin() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error(t("parent.invalidPhone"));
      return;
    }
    setLoading(true);
    try {
      await api.parentRequestOtp(phone);
      setOtpSent(true);
      toast.success(t("parent.codeSent"));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t("parent.failedSendCode"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 4) {
      toast.error(t("parent.invalidCode"));
      return;
    }
    setLoading(true);
    try {
      await api.parentVerifyOtp(phone, otp);
      navigate("/parent");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t("parent.invalidCode"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-sm space-y-8">
        <div className="text-center relative">
          <div className="absolute top-0 right-0 -mr-4">
            <LanguageSwitcher />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Stethoscope className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1>{t("parent.portal")}</h1>
          <p className="text-muted-foreground text-[14px] mt-1">{t("parent.portalDesc")}</p>
        </div>

        <AnimatePresence mode="wait">
          {!otpSent ? (
            <motion.div key="phone" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
              <div>
                <label className="text-[13px] mb-1 block">{t("parent.phoneNumber")}</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 7XX XXX XXXX" className="w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
              </div>
              <button onClick={handleSendOtp} disabled={loading} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("parent.sendCode")}
              </button>
            </motion.div>
          ) : (
            <motion.div key="otp" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
              <div className="bg-accent/50 rounded-xl p-3 text-center">
                <p className="text-[13px] text-muted-foreground">{t("parent.codeSentTo")} <span className="text-foreground">{phone}</span></p>
              </div>
              <div>
                <label className="text-[13px] mb-1 block">{t("parent.enterCode")}</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="• • • •" maxLength={4} className="w-full px-3 py-3 rounded-xl bg-input-background text-[18px] outline-none focus:ring-2 focus:ring-primary/30 text-center tracking-[0.6em] transition-all" />
              </div>
              <button onClick={handleVerifyOtp} disabled={loading} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("parent.verifySignIn")}
              </button>
              <button onClick={() => setOtpSent(false)} className="w-full text-[13px] text-muted-foreground hover:underline">
                {t("parent.changePhone")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="bg-background px-3 text-[12px] text-muted-foreground">{t("common.or")}</span></div>
        </div>
        <p className="text-center text-[13px] text-muted-foreground">
          {t("parent.areYouTherapist")}{" "}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline">{t("parent.therapistLogin")}</button>
        </p>
      </motion.div>
    </div>
  );
}
