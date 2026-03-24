import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Phone, Calendar, MessageCircle, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { patients, appointments, transactions, sessionNotes } from "./mockData";
import { useTranslation } from "react-i18next";

const tabs = ["Info", "History", "Financials", "Documents"] as const;

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Info");
  const { t } = useTranslation();

  const patient = patients.find((p) => p.id === id);
  if (!patient) {
    return (
      <div className="text-center py-20">
        <h2>{t("patientProfile.patientNotFound")}</h2>
        <button onClick={() => navigate("/patients")} className="mt-4 text-primary hover:underline text-[14px]">
          {t("patientProfile.backToPatients")}
        </button>
      </div>
    );
  }

  const patientAppointments = appointments.filter((a) => a.patientId === id);
  const patientTransactions = transactions.filter((t) => t.patientName === patient.name);
  const patientNotes = sessionNotes.filter((n) => n.patientId === id);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/patients")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-[14px] transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("patientProfile.backToPatients")}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-[18px]">
              {patient.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <h1>{patient.name}</h1>
              <p className="text-muted-foreground text-[14px]">{patient.diagnosis} · Age {patient.age}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <span className={`px-3 py-1 rounded-lg text-[12px] ${patient.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {patient.status}
            </span>
            {patient.outstanding > 0 && (
              <span className="px-3 py-1 rounded-lg text-[12px] bg-red-100 text-red-700">
                {patient.outstanding.toLocaleString()} KZT due
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-[13px] whitespace-nowrap transition-all ${activeTab === tab ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            {tab === "Info" ? t("patientProfile.info") : tab === "History" ? t("patientProfile.history") : tab === "Financials" ? t("patientProfile.financials") : t("patientProfile.documents")}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {activeTab === "Info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: t("patientProfile.fullName"), value: patient.name },
              { label: t("patientProfile.age"), value: `${patient.age} years old` },
              { label: t("patientProfile.diagnosis"), value: patient.diagnosis },
              { label: t("patientProfile.status"), value: patient.status, capitalize: true },
              { label: t("patientProfile.parentName"), value: patient.parentName },
              { label: t("patientProfile.parentPhone"), value: patient.parentPhone, icon: Phone },
              { label: t("patientProfile.nextAppointment"), value: patient.nextAppointment ? new Date(patient.nextAppointment).toLocaleString() : t("patientProfile.noneScheduled"), icon: Calendar },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <p className="text-[12px] text-muted-foreground">{item.label}</p>
                <p className={`text-[14px] mt-1 flex items-center gap-2 ${item.capitalize ? "capitalize" : ""}`}>
                  {item.icon && <item.icon className="w-4 h-4 text-muted-foreground" />}
                  {item.value}
                </p>
              </motion.div>
            ))}
            {/* Quick action buttons */}
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
              <p className="text-[12px] text-muted-foreground mb-1">{t("patientProfile.quickActions")}</p>
              <button
                onClick={() => toast.success("WhatsApp message sent!")}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-[13px] hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> {t("patientProfile.messageParent")}
              </button>
            </div>
          </div>
        )}

        {activeTab === "History" && (
          <div className="space-y-3">
            {patientAppointments.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-[14px]">{t("patientProfile.noHistory")}</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
                {patientAppointments.map((apt, i) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative pl-14 pb-4"
                  >
                    <div className={`absolute left-[18px] top-1 w-3 h-3 rounded-full border-2 border-card ${
                      apt.status === "completed" ? "bg-gray-400" :
                      apt.status === "paid" ? "bg-green-500" :
                      apt.status === "unpaid" ? "bg-red-500" :
                      "bg-yellow-500"
                    }`} />
                    <div className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[14px]">{apt.date} · {apt.startTime} – {apt.endTime}</p>
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] capitalize ${
                          apt.status === "completed" ? "bg-gray-100 text-gray-600" :
                          apt.status === "paid" ? "bg-green-100 text-green-700" :
                          apt.status === "unpaid" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Financials" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: t("patientProfile.totalPaid"), value: `${patient.totalPaid.toLocaleString()} KZT`, color: "text-green-600" },
                { label: t("patientProfile.outstanding"), value: `${patient.outstanding.toLocaleString()} KZT`, color: patient.outstanding > 0 ? "text-red-600" : "text-green-600" },
                { label: t("patientProfile.totalSessions"), value: String(patientAppointments.length), color: "text-foreground" },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <p className="text-[12px] text-muted-foreground">{card.label}</p>
                  <p className={`text-[22px] mt-1 ${card.color}`}>{card.value}</p>
                </motion.div>
              ))}
            </div>
            {patientTransactions.length > 0 && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 text-[12px] text-muted-foreground">{t("finance.dateCol")}</th>
                      <th className="px-4 py-3 text-[12px] text-muted-foreground">{t("finance.amountCol")}</th>
                      <th className="px-4 py-3 text-[12px] text-muted-foreground">{t("finance.methodCol")}</th>
                      <th className="px-4 py-3 text-[12px] text-muted-foreground">{t("finance.statusCol")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientTransactions.map((t) => (
                      <tr key={t.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-[14px]">{t.date}</td>
                        <td className="px-4 py-3 text-[14px]">{t.amount.toLocaleString()} KZT</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-[11px] ${t.method === "kaspi" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                            {t.method === "kaspi" ? "Kaspi" : "Cash"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-[11px] ${t.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "Documents" && (
          <div className="space-y-4">
            {patientNotes.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-[14px]">{t("patientProfile.noNotes")}</p>
              </div>
            ) : (
              patientNotes.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden"
                >
                  <div className="px-5 py-3 border-b border-border bg-accent/30 flex items-center justify-between">
                    <p className="text-[13px]">{note.date}</p>
                    <span className="text-[11px] text-muted-foreground">{t("patientProfile.soapNote")}</span>
                  </div>
                  <div className="p-5 space-y-3">
                    {(["subjective", "objective", "assessment", "plan"] as const).map((key) => (
                      <div key={key} className="border-l-2 border-primary/20 pl-3">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{key[0]} — {key}</p>
                        <p className="text-[14px] mt-0.5">{note[key]}</p>
                      </div>
                    ))}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-3">
                      <p className="text-[11px] text-orange-600 uppercase tracking-wider mb-1">{t("patientProfile.homework")}</p>
                      <p className="text-[14px]">{note.homework}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
