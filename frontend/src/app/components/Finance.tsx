import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { DollarSign, TrendingUp, AlertTriangle, MessageCircle, ArrowUpRight, ArrowDownRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

const tabs = ["Overview", "Transactions", "Debtors"] as const;

export default function Finance() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ earned_this_month: 0, outstanding: 0, change_percent: 0, sessions_this_month: 0, total_earned: 0 });
  const [chartData, setChartData] = useState<{ month: string; amount: number }[]>([]);
  const [debtors, setDebtors] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, chart, d, p] = await Promise.all([
          api.getFinanceSummary(),
          api.getRevenueChart(),
          api.getDebtors(),
          api.getFinancePackages(),
        ]);
        setSummary(s);
        setChartData(chart);
        setDebtors(d);
        setPackages(p);
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1>{t("finance.title")}</h1>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-[13px] transition-all ${activeTab === tab ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              {tab === "Overview" ? t("finance.overview") : tab === "Transactions" ? t("finance.transactions") : t("finance.debtors")}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: t("finance.earnedThisMonth"), value: `${summary.earned_this_month.toLocaleString()} ₸`, icon: DollarSign, color: "text-green-600", bg: "bg-green-100", change: summary.change_percent },
              { label: t("finance.sessionsThisMonth"), value: String(summary.sessions_this_month), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100", change: null },
              { label: t("finance.outstandingDebts"), value: `${summary.outstanding.toLocaleString()} ₸`, icon: AlertTriangle, color: summary.outstanding > 0 ? "text-red-600" : "text-green-600", bg: summary.outstanding > 0 ? "bg-red-100" : "bg-green-100", change: null, subtitle: `${debtors.length} ${t("finance.patients")}` },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  {card.change !== null && card.change !== 0 && (
                    <span className={`flex items-center gap-0.5 text-[12px] px-2 py-0.5 rounded-full ${card.change >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {card.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(card.change)}%
                    </span>
                  )}
                </div>
                <p className={`text-[22px] mt-3 ${card.color}`}>{card.value}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{card.subtitle || card.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3>{t("finance.monthlyRevenue")}</h3>
              <span className="text-[12px] text-muted-foreground">{t("finance.last6Months")}</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} ₸`, t("finance.revenue")]} contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="amount" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === "Transactions" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl overflow-hidden">
          {packages.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{t("finance.noTransactions")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-[12px] text-muted-foreground">{t("finance.dateCol")}</th>
                    <th className="px-4 py-3 text-[12px] text-muted-foreground">{t("finance.patientCol")}</th>
                    <th className="px-4 py-3 text-[12px] text-muted-foreground">{t("patientProfile.sessions")}</th>
                    <th className="px-4 py-3 text-[12px] text-muted-foreground">{t("finance.amountCol")}</th>
                    <th className="px-4 py-3 text-[12px] text-muted-foreground">{t("finance.statusCol")}</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((p: any) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3.5 text-[14px]">{p.purchased_at ? new Date(p.purchased_at).toLocaleDateString("ru-RU") : "—"}</td>
                      <td className="px-4 py-3.5 text-[14px]">{p.patient_name}</td>
                      <td className="px-4 py-3.5 text-[14px]">{p.used_sessions}/{p.total_sessions}</td>
                      <td className="px-4 py-3.5 text-[14px]">{p.total_price.toLocaleString()} ₸</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-1 rounded-lg text-[11px] ${p.payment_status === "paid" ? "bg-green-100 text-green-700" : p.payment_status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                          {p.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "Debtors" && (
        <div className="space-y-3">
          {debtors.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
              <h2>{t("finance.allPaidUp")}</h2>
              <p className="text-muted-foreground text-[14px] mt-1">{t("finance.noDebts")}</p>
            </div>
          ) : (
            debtors.map((d: any, i: number) => (
              <motion.div key={d.package_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-[13px] shrink-0">
                    {d.patient_name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[14px]">{d.patient_name}</p>
                    {d.parent_phone && <p className="text-[12px] text-muted-foreground">{d.parent_phone}</p>}
                    <p className="text-[14px] text-red-600 mt-0.5">{d.amount.toLocaleString()} ₸ {t("finance.outstanding")}</p>
                  </div>
                </div>
                <button onClick={() => toast.info(t("finance.reminderQueued"))} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors self-start shadow-sm">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-[13px]">{t("finance.sendReminder")}</span>
                </button>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
