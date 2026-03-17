import { useState } from "react";
import { useNavigate } from "react-router";
import { Stethoscope, Clock, DollarSign, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const steps = [
  { title: "Welcome!", description: "Let's set up your practice in under a minute.", icon: Stethoscope },
  { title: "Session Duration", description: "How long are your typical sessions?", icon: Clock },
  { title: "Pricing", description: "Set your default session price.", icon: DollarSign },
  { title: "You're all set!", description: "Your practice is ready to go.", icon: CheckCircle },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [duration, setDuration] = useState("45");
  const [price, setPrice] = useState("15000");

  const canNext = () => {
    if (step === 1) return !!duration;
    if (step === 2) return !!price;
    return true;
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
                <p>We'll help you configure:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Default session duration</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Pricing per session</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> You can change these anytime in Settings</li>
                </ul>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <label className="text-[13px] block">Session duration (minutes)</label>
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
                  placeholder="Custom duration"
                  className="w-full px-3 py-2 rounded-lg bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <label className="text-[13px] block">Price per session (KZT)</label>
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
                  placeholder="Custom price"
                  className="w-full px-3 py-2 rounded-lg bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {step === 3 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2 text-[14px]">
                <p className="text-green-800">Your defaults:</p>
                <p className="text-green-700">Session: <span className="text-green-900">{duration} minutes</span></p>
                <p className="text-green-700">Price: <span className="text-green-900">{parseInt(price).toLocaleString()} KZT</span></p>
              </div>
            )}

            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border hover:bg-accent transition-colors text-[14px]"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              <button
                onClick={() => {
                  if (step < 3) setStep((s) => s + 1);
                  else navigate("/");
                }}
                disabled={!canNext()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-[14px]"
              >
                {step === 3 ? "Go to Dashboard" : "Continue"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
