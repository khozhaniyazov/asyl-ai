import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { api } from "../api";
import { useTranslation } from "react-i18next";

interface Props {
  appointmentId: number;
  onClose: () => void;
  onDone: () => void;
}

const REASONS = [
  "illness",
  "schedule_conflict",
  "family_emergency",
  "weather",
  "no_reason",
  "other",
];

export default function CancellationModal({ appointmentId, onClose, onDone }: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState<"cancellation" | "no_show" | "late_cancel">("cancellation");
  const [reason, setReason] = useState("");
  const [cancelledBy, setCancelledBy] = useState<"therapist" | "parent">("parent");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.cancelAppointment({
        appointment_id: appointmentId,
        type,
        reason: reason || undefined,
        cancelled_by: cancelledBy,
      });
      onDone();
    } catch { /* empty */ }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-xl p-5 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium">{t("cancellation.title")}</h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">{t("cancellation.type")}</label>
          <div className="flex gap-2">
            {(["cancellation", "no_show", "late_cancel"] as const).map((v) => (
              <button key={v} onClick={() => setType(v)} className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${type === v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
                {t(`cancellation.type_${v}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">{t("cancellation.cancelledBy")}</label>
          <div className="flex gap-2">
            {(["parent", "therapist"] as const).map((v) => (
              <button key={v} onClick={() => setCancelledBy(v)} className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${cancelledBy === v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
                {t(`cancellation.by_${v}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">{t("cancellation.reason")}</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 bg-input-background rounded-xl text-sm outline-none">
            <option value="">{t("cancellation.selectReason")}</option>
            {REASONS.map((r) => <option key={r} value={r}>{t(`cancellation.reason_${r}`)}</option>)}
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm hover:bg-destructive/90 disabled:opacity-50">
            {submitting ? t("common.saving") : t("cancellation.confirm")}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-xl text-sm hover:bg-accent">
            {t("common.cancel")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
