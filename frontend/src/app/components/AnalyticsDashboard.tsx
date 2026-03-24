import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BarChart3, Users, Calendar, TrendingUp, Loader2, AlertTriangle } from "lucide-react";
import { api } from "../api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useTranslation } from "react-i18next";

export default function AnalyticsDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, tr] = await Promise.all([api.getAnalyticsSummary(), api.getAnalyticsTrends()]);
        setSummary(s);
        setTrends(tr);
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("analytics.title")}</h1>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("analytics.sessionsWeek"), value: summary.sessions_this_week, icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
            { label: t("analytics.sessionsMonth"), value: summary.sessions_this_month, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-100" },
            { label: t("analytics.totalPatients"), value: summary.total_patients, icon: Users, color: "text-green-600", bg: "bg-green-100" },
            { label: t("analytics.cancellationRate"), value: `${summary.cancellation_rate}%`, icon: AlertTriangle, color: summary.cancellation_rate > 15 ? "text-red-600" : "text-yellow-600", bg: summary.cancellation_rate > 15 ? "bg-red-100" : "bg-yellow-100" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border rounded-xl p-4">
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center ${card.color} mb-2`}><card.icon className="w-4 h-4" /></div>
              <p className="text-xl font-semibold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{t("analytics.revenueMonth")}</p>
            <p className="text-xl font-semibold text-green-600">{summary.revenue_this_month.toLocaleString()} ₸</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{t("analytics.avgSessions")}</p>
            <p className="text-xl font-semibold">{summary.avg_sessions_per_patient}</p>
          </div>
          {summary.patient_counts && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2">{t("analytics.patientsByStatus")}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.patient_counts).map(([status, count]) => (
                  <span key={status} className="text-xs bg-accent px-2 py-0.5 rounded-full">{status}: {count as number}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      {trends && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-medium mb-4">{t("analytics.weeklySessions")}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.weekly_sessions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-medium mb-4">{t("analytics.monthlyRevenue")}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.monthly_revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} ₸`]} />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
            <h3 className="text-sm font-medium mb-4">{t("analytics.newPatients")}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.new_patients}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
