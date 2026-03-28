import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Phone, Calendar, FileText, Package, TrendingUp, Loader2, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "../api";
import type { Patient, Appointment, SessionPackage, HomeworkAssignment, SoundProgress } from "../types";
import PackageCard from "./PackageCard";
import SoundProgressChart from "./SoundProgressChart";
import TreatmentPlanView from "./TreatmentPlanView";
import AddSoundProgressModal from "./AddSoundProgressModal";
import AssignHomeworkModal from "./AssignHomeworkModal";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

const tabs = ["Info", "History", "Financials", "Documents"] as const;

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Info");
  const { t } = useTranslation();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [homework, setHomework] = useState<HomeworkAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [isHwModalOpen, setIsHwModalOpen] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    const patientId = parseInt(id);
    try {
      const [p, appts, pkgs, hw] = await Promise.all([
        api.getPatient(patientId),
        api.getAppointments(0, 500),
        api.getPackages(patientId),
        api.getHomeworkAssignments(patientId),
      ]);
      setPatient(p);
      setAppointments(appts.filter((a: Appointment) => a.patient_id === patientId));
      setPackages(pkgs);
      setHomework(hw);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id, refreshKey]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (!patient) {
    return (
      <div className="text-center py-20">
        <h2>{t("patientProfile.patientNotFound")}</h2>
        <button onClick={() => navigate("/dashboard/patients")} className="mt-4 text-primary hover:underline text-[14px]">
          {t("patientProfile.backToPatients")}
        </button>
      </div>
    );
  }

  const fullName = `${patient.first_name} ${patient.last_name}`;
  const initials = `${patient.first_name[0]}${patient.last_name[0]}`;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const nextAppt = appointments.find((a) => a.status === "planned" || a.status === "paid");

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/dashboard/patients")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-[14px] transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("patientProfile.backToPatients")}
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-[18px]">{initials}</div>
            <div>
              <h1>{fullName}</h1>
              <p className="text-muted-foreground text-[14px]">
                {patient.diagnosis || t("patientProfile.noDiagnosis")}
                {patient.date_of_birth && ` · ${t("patientProfile.dob")}: ${patient.date_of_birth}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <span className={`px-3 py-1 rounded-lg text-[12px] ${patient.status === "active" ? "bg-green-100 text-green-700" : patient.status === "paused" ? "bg-yellow-100 text-yellow-700" : patient.status === "discharged" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700"}`}>
              {t(`patientProfile.status_${patient.status}`)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-[13px] whitespace-nowrap transition-all ${activeTab === tab ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
            {tab === "Info" ? t("patientProfile.info") : tab === "History" ? t("patientProfile.history") : tab === "Financials" ? t("patientProfile.financials") : t("patientProfile.documents")}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {activeTab === "Info" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: t("patientProfile.fullName"), value: fullName },
                { label: t("patientProfile.diagnosis"), value: patient.diagnosis || "—" },
                { label: t("patientProfile.status"), value: patient.status, capitalize: true },
                { label: t("patientProfile.parentPhone"), value: patient.parent_phone || "—", icon: Phone },
                { label: t("patientProfile.nextAppointment"), value: nextAppt ? new Date(nextAppt.start_time).toLocaleString("ru-RU") : t("patientProfile.noneScheduled"), icon: Calendar },
                { label: t("patientProfile.totalSessions"), value: String(completedCount) },
              ].map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-card border border-border rounded-xl p-4">
                  <p className="text-[12px] text-muted-foreground">{item.label}</p>
                  <p className={`text-[14px] mt-1 flex items-center gap-2 ${item.capitalize ? "capitalize" : ""}`}>
                    {item.icon && <item.icon className="w-4 h-4 text-muted-foreground" />}
                    {item.value}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Sound Progress */}
            <div className="bg-card border border-border rounded-2xl p-5 relative">
              <button 
                onClick={() => setIsSoundModalOpen(true)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all shadow-sm"
                title={t("soundProgress.addRecord")}
              >
                <Plus className="w-5 h-5" />
              </button>
              <SoundProgressChart patientId={patient.id} refreshKey={refreshKey} />
            </div>

            {/* Treatment Plans */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <TreatmentPlanView patientId={patient.id} />
            </div>

            {/* Export */}
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-[12px] text-muted-foreground mb-2">{t("patientProfile.exportData")}</p>
              <div className="flex flex-wrap gap-2">
                <a href={api.exportPatientRecord(patient.id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-[13px] hover:bg-accent transition-colors">
                  <Download className="w-4 h-4" />{t("patientProfile.exportRecord")}
                </a>
                <a href={api.getProgressReport(patient.id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-[13px] hover:bg-accent transition-colors">
                  <FileText className="w-4 h-4" />{t("patientProfile.progressReport")}
                </a>
                <a href={api.getPmpkReport(patient.id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-[13px] hover:bg-accent transition-colors">
                  <FileText className="w-4 h-4" />{t("patientProfile.pmpkReport")}
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === "History" && (
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-[14px]">{t("patientProfile.noHistory")}</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
                {appointments.map((apt, i) => {
                  const start = new Date(apt.start_time);
                  const end = new Date(apt.end_time);
                  return (
                    <motion.div key={apt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative pl-14 pb-4">
                      <div className={`absolute left-[18px] top-1 w-3 h-3 rounded-full border-2 border-card ${
                        apt.status === "completed" ? "bg-gray-400" : apt.status === "paid" ? "bg-green-500" : apt.status === "cancelled" ? "bg-red-500" : apt.status === "no_show" ? "bg-orange-500" : "bg-yellow-500"
                      }`} />
                      <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[14px]">{start.toLocaleDateString("ru-RU")} · {start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</p>
                            {apt.session_number && <p className="text-[12px] text-muted-foreground mt-0.5">{t("patientProfile.sessionNum")} #{apt.session_number}</p>}
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[11px] capitalize ${
                            apt.status === "completed" ? "bg-gray-100 text-gray-600" : apt.status === "paid" ? "bg-green-100 text-green-700" : apt.status === "cancelled" ? "bg-red-100 text-red-700" : apt.status === "no_show" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "Financials" && (
          <div className="space-y-4">
            <PackageCard patientId={patient.id} />
            {packages.length > 0 && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-accent/30">
                  <h3 className="text-[13px]">{t("patientProfile.allPackages")}</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 text-[12px] text-muted-foreground">{t("patientProfile.sessions")}</th>
                      <th className="px-4 py-3 text-[12px] text-muted-foreground">{t("patientProfile.price")}</th>
                      <th className="px-4 py-3 text-[12px] text-muted-foreground">{t("finance.statusCol")}</th>
                      <th className="px-4 py-3 text-[12px] text-muted-foreground">{t("finance.dateCol")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((pkg) => (
                      <tr key={pkg.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-[14px]">{pkg.used_sessions}/{pkg.total_sessions}</td>
                        <td className="px-4 py-3 text-[14px]">{Number(pkg.total_price).toLocaleString()} ₸</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-[11px] ${pkg.payment_status === "paid" ? "bg-green-100 text-green-700" : pkg.payment_status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                            {pkg.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[14px]">{new Date(pkg.purchased_at).toLocaleDateString("ru-RU")}</td>
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
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[14px] font-medium">{t("patientProfile.homeworkTitle") || "Homework"}</h3>
              <button 
                onClick={() => setIsHwModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" /> {t("patientProfile.assignHomework") || "Assign"}
              </button>
            </div>
            {homework.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-[14px]">{t("patientProfile.noNotes")}</p>
              </div>
            ) : (
              homework.map((hw, i) => (
                <motion.div key={hw.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border bg-accent/30 flex items-center justify-between">
                    <p className="text-[13px]">{new Date(hw.assigned_at).toLocaleDateString("ru-RU")}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${hw.status === "verified" ? "bg-green-100 text-green-700" : hw.status === "completed" ? "bg-blue-100 text-blue-700" : hw.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {hw.status}
                    </span>
                  </div>
                  <div className="p-5">
                    {hw.custom_instructions && <p className="text-[14px]">{hw.custom_instructions}</p>}
                    {hw.due_date && (() => {
                      const d = new Date(hw.due_date);
                      return d.getFullYear() > 1900 && d.getFullYear() < 2100
                        ? <p className="text-[12px] text-muted-foreground mt-2">{t("patientProfile.dueDate")}: {d.toLocaleDateString("ru-RU")}</p>
                        : null;
                    })()}
                    {hw.therapist_feedback && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-[11px] text-green-600 uppercase tracking-wider mb-1">{t("patientProfile.feedback")}</p>
                        <p className="text-[14px]">{hw.therapist_feedback}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AddSoundProgressModal 
        patientId={patient.id}
        isOpen={isSoundModalOpen}
        onClose={() => setIsSoundModalOpen(false)}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />
      <AssignHomeworkModal
        patientId={patient.id}
        isOpen={isHwModalOpen}
        onClose={() => setIsHwModalOpen(false)}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />
    </div>
  );
}
