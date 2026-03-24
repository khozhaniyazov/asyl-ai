import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Clock, Users, Phone, ChevronRight, AlertCircle } from "lucide-react";
import { api } from "../api";
import type { WaitlistEntry, Patient } from "../types";
import { useTranslation } from "react-i18next";

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function WaitlistView() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [patients, setPatients] = useState<Record<number, Patient>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [waitlist, patientList] = await Promise.all([
        api.getWaitlist(),
        api.getPatients(0, 200),
      ]);
      setEntries(waitlist);
      const map: Record<number, Patient> = {};
      for (const p of patientList) map[p.id] = p;
      setPatients(map);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleOffer = async (id: number) => {
    try { await api.offerWaitlistSlot(id); load(); } catch { /* empty */ }
  };

  const handleRemove = async (id: number) => {
    try { await api.removeFromWaitlist(id); load(); } catch { /* empty */ }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("waitlist.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("waitlist.description")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("waitlist.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, idx) => {
            const patient = patients[entry.patient_id];
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">
                      {patient ? `${patient.first_name[0]}${patient.last_name[0]}` : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{patient ? `${patient.first_name} ${patient.last_name}` : `#${entry.patient_id}`}</p>
                      {patient?.diagnosis && <p className="text-xs text-muted-foreground">{patient.diagnosis}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.priority > 0 && (
                      <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />{t("waitlist.priority")}: {entry.priority}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${entry.status === "waiting" ? "bg-yellow-100 text-yellow-700" : entry.status === "offered" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                      {t(`waitlist.status.${entry.status}`)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  {entry.preferred_days && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {entry.preferred_days.map((d) => DAY_NAMES[d]).join(", ")}
                    </span>
                  )}
                  {entry.preferred_times && (
                    <span>{entry.preferred_times.join(", ")}</span>
                  )}
                </div>

                {entry.notes && <p className="mt-2 text-xs text-muted-foreground">{entry.notes}</p>}

                <div className="mt-3 flex gap-2">
                  {entry.status === "waiting" && (
                    <button onClick={() => handleOffer(entry.id)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90">
                      <Phone className="w-3 h-3" />{t("waitlist.offerSlot")}
                    </button>
                  )}
                  <button onClick={() => handleRemove(entry.id)} className="px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-accent">
                    {t("waitlist.remove")}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
