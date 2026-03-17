import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Stethoscope } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", clinic: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!form.name) newErrors.name = true;
    if (!form.email) newErrors.email = true;
    if (!form.password) newErrors.password = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }
    navigate("/onboarding");
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
          <h1>Create Account</h1>
          <p className="text-muted-foreground text-[14px] mt-1">Start managing your practice</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          {[
            { key: "name", label: "Therapist Name *", placeholder: "Dr. Dana Karimova" },
            { key: "clinic", label: "Clinic Name", placeholder: "SpeechCare Almaty" },
            { key: "email", label: "Email *", placeholder: "dana@clinic.kz", type: "email" },
            { key: "password", label: "Password *", placeholder: "Create a password", type: "password" },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-[13px] mb-1 block">{field.label}</label>
              <input
                type={field.type || "text"}
                value={(form as any)[field.key]}
                onChange={(e) => { setForm({ ...form, [field.key]: e.target.value }); setErrors({ ...errors, [field.key]: false }); }}
                placeholder={field.placeholder}
                className={`w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors[field.key] ? "ring-2 ring-destructive" : ""}`}
              />
              {errors[field.key] && <p className="text-[11px] text-destructive mt-1">This field is required</p>}
            </div>
          ))}
          <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 transition-opacity">
            Create Account
          </button>
        </form>
        <p className="text-center text-[13px] text-muted-foreground">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline">Sign In</button>
        </p>
      </motion.div>
    </div>
  );
}
