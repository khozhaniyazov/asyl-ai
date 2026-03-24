import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Stethoscope, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../AuthContext";
import { useTranslation } from "react-i18next";

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register, login, user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ name: "", clinic: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  if (!authLoading && user) {
    navigate("/", { replace: true });
    return null;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!form.name) newErrors.name = true;
    if (!form.email) newErrors.email = true;
    if (!form.password) newErrors.password = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      toast.error(t("auth.fillRequired"));
      return;
    }
    setLoading(true);
    try {
      await register({ email: form.email, password: form.password, full_name: form.name, clinic_name: form.clinic || undefined });
      await login(form.email, form.password);
      toast.success(t("auth.accountCreated"));
      navigate("/onboarding");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t("auth.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Stethoscope className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1>{t("auth.createAccount")}</h1>
          <p className="text-muted-foreground text-[14px] mt-1">{t("auth.startManaging")}</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          {[
            { key: "name", label: t("auth.therapistName"), placeholder: "Dr. Dana Karimova" },
            { key: "clinic", label: t("auth.clinicName"), placeholder: "SpeechCare Almaty" },
            { key: "email", label: t("auth.emailRequired"), placeholder: "dana@clinic.kz", type: "email" },
            { key: "password", label: t("auth.passwordRequired"), placeholder: t("auth.createPassword"), type: "password" },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-[13px] mb-1 block">{field.label}</label>
              <input type={field.type || "text"} value={(form as any)[field.key]} onChange={(e) => { setForm({ ...form, [field.key]: e.target.value }); setErrors({ ...errors, [field.key]: false }); }} placeholder={field.placeholder} className={`w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors[field.key] ? "ring-2 ring-destructive" : ""}`} />
              {errors[field.key] && <p className="text-[11px] text-destructive mt-1">{t("auth.fieldRequired")}</p>}
            </div>
          ))}
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("auth.createAccount")}
          </button>
        </form>
        <p className="text-center text-[13px] text-muted-foreground">
          {t("auth.alreadyHaveAccount")}{" "}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline">{t("auth.signInLink")}</button>
        </p>
      </motion.div>
    </div>
  );
}
