import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, X, Clock, Calendar } from "lucide-react";
import { api } from "../api";
import type { ScheduleRequest, Patient } from "../types";
import { useTranslation } from "react-i18next";

export default function ScheduleRequestList() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<ScheduleRequest[]>([]);
  const [patients, setPatients] = useState<Record<number, Patient>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [reqs, patientList] = await Promise.all([
        api.getScheduleRequests("pending"),
        api.getPatients(0, 200),
      ]);
      setRequests(reqs);
      const map: Record<number, Patient> = {};
      for (const p of patientList) map[p.id] = p;
      setPatients(map);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: number) => {
    try { await api.approveScheduleRequest(id); load(); } catch { /* empty */ }
  };

  const handleReject = async (id: number) => {
    try { await api.rejectScheduleRequest(id); load(); } catch { /* empty */ }
  };

  if (loading) return <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (requests.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        {t("scheduleRequests.pending")} ({requests.length})
      </h3>
      {requests.map((req) => {
        const patient = patients[req.patient_id];
        const date = new Date(req.requested_start);
        return (
          <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {patient ? `${patient.first_name} ${patient.last_name}` : `#${req.patient_id}`}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Clock className="w-3 h-3" />
                {date.toLocaleDateString("ru-RU")} {date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px]">
                  {req.type === "new_booking" ? t("scheduleRequests.newBooking") : t("scheduleRequests.reschedule")}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleApprove(req.id)} className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors" title={t("scheduleRequests.approve")}>
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => handleReject(req.id)} className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors" title={t("scheduleRequests.reject")}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
