import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Stethoscope, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../AuthContext";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./ui/LanguageSwitcher";
import { loginSchema } from "../validation";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (!authLoading && user) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || t("auth.enterEmailPassword"));
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || t("auth.loginFailed");
      toast.error(msg);
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
          <h1>{t("auth.welcomeBack")}</h1>
          <p className="text-muted-foreground text-[14px] mt-1">{t("auth.signInSubtitle")}</p>
        </div>
        <form onSubmit={handleLogin} noValidate className="space-y-4">
          <div>
            <label className="text-[13px] mb-1 block">{t("auth.email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dana@clinic.kz" autoComplete="email" className="w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
          </div>
          <div>
            <label className="text-[13px] mb-1 block">{t("auth.password")}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.password")} autoComplete="current-password" className="w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("auth.signIn")}
          </button>
        </form>
        <p className="text-center text-[13px] text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <button onClick={() => navigate("/register")} className="text-primary hover:underline">{t("auth.register")}</button>
        </p>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="bg-background px-3 text-[12px] text-muted-foreground">{t("common.or")}</span></div>
        </div>
        <p className="text-center text-[13px] text-muted-foreground">
          {t("auth.areYouParent")}{" "}
          <button onClick={() => navigate("/parent/login")} className="text-primary hover:underline">{t("auth.parentPortal")}</button>
        </p>
      </motion.div>
    </div>
  );
}
