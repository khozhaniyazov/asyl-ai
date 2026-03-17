import { useState } from "react";
import { motion } from "motion/react";
import { DollarSign, TrendingUp, AlertTriangle, MessageCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { transactions, patients } from "./mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const tabs = ["Overview", "Transactions", "Debtors"] as const;

const chartData = [
  { month: "Oct", amount: 120000 },
  { month: "Nov", amount: 135000 },
  { month: "Dec", amount: 105000 },
  { month: "Jan", amount: 150000 },
  { month: "Feb", amount: 142500 },
  { month: "Mar", amount: 97500 },
];

export default function Finance() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");

  const totalEarned = 97500;
  const projected = 150000;
  const outstanding = patients.reduce((sum, p) => sum + p.outstanding, 0);
  const debtors = patients.filter((p) => p.outstanding > 0);
  const changePercent = -31.6; // vs last month

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1>Finance</h1>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-[13px] transition-all ${activeTab === tab ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Earned This Month",
                value: `${totalEarned.toLocaleString()} KZT`,
                icon: DollarSign,
                color: "text-green-600",
                bg: "bg-green-100",
                change: changePercent,
              },
              {
                label: "Projected Income",
                value: `${projected.toLocaleString()} KZT`,
                icon: TrendingUp,
                color: "text-blue-600",
                bg: "bg-blue-100",
                change: null,
              },
              {
                label: "Outstanding Debts",
                value: `${outstanding.toLocaleString()} KZT`,
                icon: AlertTriangle,
                color: "text-red-600",
                bg: "bg-red-100",
                change: null,
                subtitle: `${debtors.length} patient${debtors.length > 1 ? "s" : ""}`,
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  {card.change !== null && (
                    <span className={`flex items-center gap-0.5 text-[12px] px-2 py-0.5 rounded-full ${
                      card.change >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {card.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(card.change)}%
                    </span>
                  )}
                </div>
                <p className={`text-[22px] mt-3 ${card.color}`}>{card.value}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {card.subtitle || card.label}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3>Monthly Revenue</h3>
              <span className="text-[12px] text-muted-foreground">Last 6 months</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} KZT`, "Revenue"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar dataKey="amount" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === "Transactions" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-[12px] text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-[12px] text-muted-foreground">Patient</th>
                  <th className="px-4 py-3 text-[12px] text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-[12px] text-muted-foreground hidden sm:table-cell">Method</th>
                  <th className="px-4 py-3 text-[12px] text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3.5 text-[14px]">{t.date}</td>
                    <td className="px-4 py-3.5 text-[14px]">{t.patientName}</td>
                    <td className="px-4 py-3.5 text-[14px]">{t.amount.toLocaleString()} KZT</td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-lg text-[11px] ${
                        t.method === "kaspi" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {t.method === "kaspi" ? "Kaspi" : "Cash"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-1 rounded-lg text-[11px] ${
                        t.status === "completed" ? "bg-green-100 text-green-700" : t.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === "Debtors" && (
        <div className="space-y-3">
          {debtors.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
              <h2>All paid up!</h2>
              <p className="text-muted-foreground text-[14px] mt-1">No outstanding debts. Great job!</p>
            </div>
          ) : (
            debtors.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-[13px] shrink-0">
                    {d.parentName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[14px]">{d.parentName}</p>
                    <p className="text-[12px] text-muted-foreground">Parent of {d.name}</p>
                    <p className="text-[14px] text-red-600 mt-0.5">{d.outstanding.toLocaleString()} KZT outstanding</p>
                  </div>
                </div>
                <button
                  onClick={() => toast.success(`WhatsApp reminder sent to ${d.parentName}`)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors self-start shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-[13px]">Send Reminder</span>
                </button>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
