import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, CreditCard, BookOpen, TrendingUp, LogOut, Stethoscope, CheckCircle, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";
import SoundProgressChart from "./SoundProgressChart";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./ui/LanguageSwitcher";

const tabs = ["Home", "Homework", "Progress"] as const;

export default function ParentPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Home");
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const [parentInfo, setParentInfo] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [soundProgress, setSoundProgress] = useState<any[]>([]);

  useEffect(() => {
    if (!api.isParentAuthenticated()) {
      navigate("/parent/login");
      return;
    }
    (async () => {
      try {
        const [me, ch, appts, hw, pkgs, sp] = await Promise.all([
          api.parentGetMe(),
          api.parentGetChildren(),
          api.parentGetAppointments(),
          api.parentGetHomework(),
          api.parentGetPackages(),
          api.parentGetSoundProgress(),
        ]);
        setParentInfo(me);
        setChildren(ch);
        setAppointments(appts);
        setHomework(hw);
        setPackages(pkgs);
        setSoundProgress(sp);
      } catch {
        navigate("/parent/login");
      }
      setLoading(false);
    })();
  }, []);

  const handleLogout = () => {
    api.parentLogout();
    navigate("/parent/login");
  };

  const handleCompleteHomework = async (hwId: number) => {
    try {
      await api.completeHomeworkAssignment(hwId);
      toast.success(t("parent.homeworkCompleted"));
      setHomework((prev) => prev.map((h) => h.id === hwId ? { ...h, status: "completed", parent_completed_at: new Date().toISOString() } : h));
    } catch {
      toast.error(t("parent.failedComplete"));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const childName = children.length > 0 ? `${children[0].first_name} ${children[0].last_name}` : t("parent.child");
  const nextAppt = appointments.find((a: any) => a.status === "planned" || a.status === "paid");
  const unpaidPkgs = packages.filter((p: any) => p.payment_status === "pending");
  const unpaidAmount = unpaidPkgs.reduce((sum: number, p: any) => sum + (p.total_price || 0), 0);
  const pendingHomework = homework.filter((h: any) => h.status === "assigned");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <span className="text-[14px] block leading-tight">{childName}</span>
            <span className="text-[11px] text-muted-foreground">{parentInfo?.full_name || ""}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button onClick={handleLogout} className="text-muted-foreground p-2"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "Home" && (
            <motion.div key="home" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
              {unpaidAmount > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-red-700"><CreditCard className="w-5 h-5" /><span className="text-[14px]">{t("parent.paymentDue")}</span></div>
                  <p className="text-[28px] text-red-700">{unpaidAmount.toLocaleString()} ₸</p>
                </motion.div>
              )}

              {nextAppt && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-muted-foreground mb-3"><CalendarDays className="w-4 h-4" /><span className="text-[12px] uppercase tracking-wider">{t("parent.nextSession")}</span></div>
                  <p className="text-[16px]">{new Date(nextAppt.start_time).toLocaleString("ru-RU", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  {nextAppt.session_number && <p className="text-[13px] text-muted-foreground mt-1">{t("patientProfile.sessionNum")} #{nextAppt.session_number}</p>}
                  <div className="mt-3 flex items-center gap-2 text-[12px] text-green-600"><CheckCircle className="w-4 h-4" /><span>{t("parent.confirmed")}</span></div>
                </motion.div>
              )}

              {pendingHomework.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground"><BookOpen className="w-4 h-4" /><span className="text-[12px] uppercase tracking-wider">{t("parent.latestHomework")}</span></div>
                    <button onClick={() => setActiveTab("Homework")} className="text-[12px] text-primary hover:underline">{t("parent.viewAll")}</button>
                  </div>
                  <div className="bg-accent/50 rounded-xl p-3">
                    <p className="text-[14px] whitespace-pre-line">{pendingHomework[0].custom_instructions || t("parent.noInstructions")}</p>
                  </div>
                  {pendingHomework[0].due_date && <p className="text-[12px] text-muted-foreground mt-2">{t("patientProfile.dueDate")}: {new Date(pendingHomework[0].due_date).toLocaleDateString("ru-RU")}</p>}
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "Homework" && (
            <motion.div key="homework" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
              <h2>{t("parent.homeworkFeed")}</h2>
              {homework.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>{t("parent.noHomework")}</p>
                </div>
              ) : homework.map((hw: any, i: number) => (
                <motion.div key={hw.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border bg-accent/30 flex items-center justify-between">
                    <p className="text-[13px]">{hw.assigned_at ? new Date(hw.assigned_at).toLocaleDateString("ru-RU") : ""}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${hw.status === "verified" ? "bg-green-100 text-green-700" : hw.status === "completed" ? "bg-blue-100 text-blue-700" : hw.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {hw.status}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-[14px] whitespace-pre-line">{hw.custom_instructions || "—"}</p>
                    {hw.therapist_feedback && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-[11px] text-green-600 uppercase tracking-wider mb-1">{t("patientProfile.feedback")}</p>
                        <p className="text-[14px]">{hw.therapist_feedback}</p>
                      </div>
                    )}
                    {hw.status === "assigned" && (
                      <button onClick={() => handleCompleteHomework(hw.id)} className="mt-3 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[13px] hover:bg-primary/90">
                        <Check className="w-4 h-4" />{t("parent.markDone")}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "Progress" && (
            <motion.div key="progress" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
              <h2>{t("parent.progress")}</h2>
              <p className="text-[13px] text-muted-foreground -mt-2">{childName} — {t("parent.speechProgress")}</p>

              {children.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <SoundProgressChart patientId={children[0].id} />
                </div>
              )}

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="w-4 h-4" /><span className="text-[12px] uppercase tracking-wider">{t("parent.sessionsSummary")}</span></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-accent/50 rounded-xl p-3 text-center">
                    <p className="text-[22px]">{appointments.filter((a: any) => a.status === "completed").length}</p>
                    <p className="text-[11px] text-muted-foreground">{t("parent.completedSessions")}</p>
                  </div>
                  <div className="bg-accent/50 rounded-xl p-3 text-center">
                    <p className="text-[22px]">{homework.filter((h: any) => h.status === "verified").length}</p>
                    <p className="text-[11px] text-muted-foreground">{t("parent.verifiedHomework")}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around py-2 max-w-lg mx-auto">
          {([{ key: "Home", icon: CalendarDays }, { key: "Homework", icon: BookOpen }, { key: "Progress", icon: TrendingUp }] as const).map((item) => (
            <button key={item.key} onClick={() => setActiveTab(item.key)} className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl transition-all ${activeTab === item.key ? "text-primary" : "text-muted-foreground"}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[11px]">{item.key === "Home" ? t("parent.home") : item.key === "Homework" ? t("parent.homeworkTab") : t("parent.progress")}</span>
              {activeTab === item.key && <motion.div layoutId="parent-tab-indicator" className="w-5 h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
