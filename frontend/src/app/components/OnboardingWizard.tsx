import { useState } from "react";
import { useNavigate } from "react-router";
import { Stethoscope, Clock, DollarSign, CheckCircle, ArrowRight, ArrowLeft, MapPin, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { KZ_CITIES, SPECIALIZATIONS } from "../types";

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [duration, setDuration] = useState("45");
  const [price, setPrice] = useState("15000");
  const [city, setCity] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const steps = [
    { title: t("onboarding.welcomeTitle"), description: t("onboarding.welcomeDesc"), icon: Stethoscope },
    { title: t("onboarding.sessionDurationTitle"), description: t("onboarding.sessionDurationDesc"), icon: Clock },
    { title: t("onboarding.pricingTitle"), description: t("onboarding.pricingDesc"), icon: DollarSign },
    { title: "Location & Specialization", description: "Help parents find you", icon: MapPin },
    { title: t("onboarding.allSetTitle"), description: t("onboarding.allSetDesc"), icon: CheckCircle },
  ];

  const canNext = () => {
    if (step === 1) return !!duration;
    if (step === 2) return !!price;
    if (step === 3) return city && specializations.length > 0;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await api.completeOnboarding({
        default_session_duration: parseInt(duration),
        default_price: parseFloat(price),
      });
      
      try {
        await api.createMyProfile({
          city,
          specializations,
          is_published: false,
        });
      } catch (e) {
        console.log("Profile creation skipped or failed", e);
      }
      
      navigate("/");
    } catch (error) {
      console.error("Onboarding failed:", error);
      alert("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-2xl p-8 space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                {(() => {
                  const Icon = steps[step].icon;
                  return <Icon className="w-8 h-8 text-primary" />;
                })()}
              </div>
              <h1>{steps[step].title}</h1>
              <p className="text-muted-foreground text-[14px] mt-1">{steps[step].description}</p>
            </div>

            {step === 0 && (
              <div className="bg-accent/50 rounded-xl p-4 space-y-2 text-[14px]">
                <p>{t("onboarding.configureIntro")}</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> {t("onboarding.configDuration")}</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> {t("onboarding.configPricing")}</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> {t("onboarding.configChangeAnytime")}</li>
                </ul>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <label className="text-[13px] block">{t("onboarding.sessionDurationLabel")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {["30", "45", "60"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`py-3 rounded-xl border text-[14px] transition-all ${
                        duration === d
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder={t("onboarding.customDuration")}
                  className="w-full px-3 py-2 rounded-lg bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <label className="text-[13px] block">{t("onboarding.pricePerSession")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {["10000", "15000", "20000"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrice(p)}
                      className={`py-3 rounded-xl border text-[14px] transition-all ${
                        price === p
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {parseInt(p).toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={t("onboarding.customPrice")}
                  className="w-full px-3 py-2 rounded-lg bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <label className="text-[13px] block">{t("onboarding.selectCity") || "Your city"}</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{t("marketplace.allCities")}</option>
                  {KZ_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <label className="text-[13px] block mt-3">{t("onboarding.selectSpecializations") || "Your specializations"}</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                  {SPECIALIZATIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpecializations((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                      )}
                      className={`text-left px-3 py-2 rounded-lg border text-[12px] transition-all ${
                        specializations.includes(s)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {t(`marketplace.spec.${s}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 space-y-2 text-[14px]">
                <p className="text-green-800 dark:text-green-200">{t("onboarding.yourDefaults")}</p>
                <p className="text-green-700 dark:text-green-300">{t("onboarding.session")}: <span className="text-green-900 dark:text-green-100">{duration} {t("onboarding.minutes")}</span></p>
                <p className="text-green-700 dark:text-green-300">{t("onboarding.price")}: <span className="text-green-900 dark:text-green-100">{parseInt(price).toLocaleString()} KZT</span></p>
                <p className="text-green-700 dark:text-green-300"><MapPin className="w-3.5 h-3.5 inline mr-1" />{city}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {specializations.map((s) => (
                    <span key={s} className="text-[10px] bg-green-200 dark:bg-green-900 px-2 py-0.5 rounded-full text-green-800 dark:text-green-200">{t(`marketplace.spec.${s}`)}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border hover:bg-accent transition-colors text-[14px] disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" /> {t("onboarding.back")}
                </button>
              )}
              <button
                onClick={() => {
                  if (step < 4) setStep((s) => s + 1);
                  else handleFinish();
                }}
                disabled={!canNext() || saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-[14px]"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {step === 4 ? t("onboarding.goToDashboard") : t("onboarding.continue")}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
