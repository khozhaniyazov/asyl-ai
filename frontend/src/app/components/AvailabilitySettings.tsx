import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Clock, Plus, Trash2 } from "lucide-react";
import { api } from "../api";
import type { Availability } from "../types";
import { useTranslation } from "react-i18next";

const DAYS = [
  { value: 0, label: "Пн" },
  { value: 1, label: "Вт" },
  { value: 2, label: "Ср" },
  { value: 3, label: "Чт" },
  { value: 4, label: "Пт" },
  { value: 5, label: "Сб" },
  { value: 6, label: "Вс" },
];

export default function AvailabilitySettings() {
  const { t } = useTranslation();
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ day_of_week: 0, start_time: "09:00", end_time: "17:00" });

  const load = async () => {
    try {
      const data = await api.getAvailability();
      setSlots(data);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    try {
      await api.createAvailability(form);
      setAdding(false);
      load();
    } catch { /* empty */ }
  };

  const handleDelete = async (id: number) => {
    try { await api.deleteAvailability(id); load(); } catch { /* empty */ }
  };

  const handleToggle = async (slot: Availability) => {
    try {
      await api.updateAvailability(slot.id, { is_active: !slot.is_active });
      load();
    } catch { /* empty */ }
  };

  // Group by day
  const byDay = DAYS.map((day) => ({
    ...day,
    slots: slots.filter((s) => s.day_of_week === day.value),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">{t("availability.title")}</h3>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90">
          <Plus className="w-3 h-3" />{t("availability.addSlot")}
        </button>
      </div>

      {adding && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-accent/50 rounded-xl p-4 flex items-end gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{t("availability.day")}</label>
            <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })} className="px-3 py-2 bg-input-background rounded-lg text-sm">
              {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{t("availability.from")}</label>
            <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="px-3 py-2 bg-input-background rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{t("availability.to")}</label>
            <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="px-3 py-2 bg-input-background rounded-lg text-sm" />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">{t("common.save")}</button>
          <button onClick={() => setAdding(false)} className="px-4 py-2 border border-border rounded-lg text-sm">{t("common.cancel")}</button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {byDay.map((day) => (
            <div key={day.value} className="space-y-2">
              <div className="text-center text-xs font-medium text-muted-foreground py-1">{day.label}</div>
              {day.slots.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground/50 py-4">—</div>
              ) : (
                day.slots.map((slot) => (
                  <div key={slot.id} className={`rounded-lg p-2 text-xs border transition-colors ${slot.is_active ? "bg-primary/10 border-primary/20" : "bg-muted border-border opacity-50"}`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {slot.start_time}–{slot.end_time}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <button onClick={() => handleToggle(slot)} className="text-[10px] text-muted-foreground hover:text-foreground">
                        {slot.is_active ? t("availability.disable") : t("availability.enable")}
                      </button>
                      <button onClick={() => handleDelete(slot.id)} className="text-[10px] text-destructive hover:text-destructive/80">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
