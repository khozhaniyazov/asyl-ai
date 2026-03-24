import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, CreditCard, BookOpen, TrendingUp, LogOut, Stethoscope, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { sessionNotes } from "./mockData";
import { useTranslation } from "react-i18next";

const tabs = ["Home", "Homework", "Progress"] as const;

export default function ParentPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Home");
  const { t } = useTranslation();

  const childName = "Aibek Nurlan";
  const nextSession = "Wednesday, March 18 at 10:00 AM";
  const unpaidAmount = 15000;
  const therapistName = "Dr. Dana Karimova";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <span className="text-[14px] block leading-tight">{childName}</span>
            <span className="text-[11px] text-muted-foreground">{therapistName}</span>
          </div>
        </div>
        <button onClick={() => navigate("/parent/login")} className="text-muted-foreground p-2">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "Home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Billing Alert */}
              {unpaidAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center gap-2 text-red-700">
                    <CreditCard className="w-5 h-5" />
                    <span className="text-[14px]">{t("parent.paymentDue")}</span>
                  </div>
                  <p className="text-[28px] text-red-700">{unpaidAmount.toLocaleString()} KZT</p>
                  <p className="text-[12px] text-red-600">Session on March 15 — unpaid</p>
                  <button
                    onClick={() => toast.success("Redirecting to Kaspi payment...")}
                    className="w-full py-3.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-[14px] shadow-sm"
                  >
                    {t("parent.payViaKaspi")}
                  </button>
                </motion.div>
              )}

              {/* Next Appointment */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-[12px] uppercase tracking-wider">{t("parent.nextSession")}</span>
                </div>
                <p className="text-[16px]">{nextSession}</p>
                <p className="text-[13px] text-muted-foreground mt-1">with {therapistName}</p>
                <div className="mt-3 flex items-center gap-2 text-[12px] text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t("parent.confirmed")}</span>
                </div>
              </motion.div>

              {/* Recent Homework */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-[12px] uppercase tracking-wider">{t("parent.latestHomework")}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("Homework")}
                    className="text-[12px] text-primary hover:underline"
                  >
                    {t("parent.viewAll")}
                  </button>
                </div>
                {sessionNotes[0] && (
                  <>
                    <p className="text-[12px] text-muted-foreground mb-2">{sessionNotes[0].date}</p>
                    <div className="bg-accent/50 rounded-xl p-3">
                      <p className="text-[14px] whitespace-pre-line">{sessionNotes[0].homework}</p>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}

          {activeTab === "Homework" && (
            <motion.div
              key="homework"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <h2>{t("parent.homeworkFeed")}</h2>
              <p className="text-[13px] text-muted-foreground -mt-2">All homework assignments from past sessions</p>
              {sessionNotes
                .filter((n) => n.patientId === "1")
                .map((note, i) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden"
                  >
                    <div className="px-5 py-3 border-b border-border bg-accent/30">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px]">{note.date}</p>
                        <span className="text-[11px] text-muted-foreground">Session #{sessionNotes.length - i}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-[14px] whitespace-pre-line">{note.homework}</p>
                    </div>
                  </motion.div>
                ))}
            </motion.div>
          )}

          {activeTab === "Progress" && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <h2>{t("parent.progress")}</h2>
              <p className="text-[13px] text-muted-foreground -mt-2">{childName}'s speech therapy progress</p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-[12px] uppercase tracking-wider">{t("parent.therapistSummary")}</span>
                </div>
                <p className="text-[14px]">
                  Aibek has shown excellent progress over the past 3 weeks. His /s/ sound accuracy has improved from 30% to 70% in initial word position. We are now introducing /s/ blends and expect continued improvement with daily practice at home.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-card border border-border rounded-2xl p-5 space-y-4"
              >
                <h3>{t("parent.skillProgress")}</h3>
                {[
                  { label: "/s/ in isolation", progress: 90, color: "bg-green-500" },
                  { label: "/s/ initial position", progress: 70, color: "bg-primary" },
                  { label: "/s/ blends (sp, st, sk)", progress: 40, color: "bg-yellow-500" },
                  { label: "/r/ sounds", progress: 25, color: "bg-orange-500" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <div className="flex justify-between text-[13px] mb-1.5">
                      <span>{item.label}</span>
                      <span className="text-muted-foreground">{item.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-primary/5 border border-primary/10 rounded-2xl p-5"
              >
                <p className="text-[13px] text-primary">
                  💡 <span className="text-[13px]">Tip: Consistent daily practice for 10-15 minutes produces the best results. Focus on the exercises marked in the latest homework.</span>
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around py-2 max-w-lg mx-auto">
          {([
            { key: "Home", icon: CalendarDays },
            { key: "Homework", icon: BookOpen },
            { key: "Progress", icon: TrendingUp },
          ] as const).map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl transition-all ${
                activeTab === item.key ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[11px]">{item.key === "Home" ? t("parent.home") : item.key === "Homework" ? t("parent.homeworkTab") : t("parent.progress")}</span>
              {activeTab === item.key && (
                <motion.div
                  layoutId="parent-tab-indicator"
                  className="w-5 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
