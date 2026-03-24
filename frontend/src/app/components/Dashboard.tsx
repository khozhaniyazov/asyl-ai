import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Link2,
  XCircle,
  Plus,
  Users,
  CalendarDays,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AppointmentCard } from "./AppointmentCard";
import { api } from "../api";
import type { AppointmentWithPatient, Patient, Appointment } from "../types";
import { statusDot } from "../types";

function enrichAppointments(
  appointments: Appointment[],
  patientsMap: Map<number, Patient>
): AppointmentWithPatient[] {
  return appointments.map((a) => {
    const patient = patientsMap.get(a.patient_id);
    const start = parseISO(a.start_time);
    const end = parseISO(a.end_time);
    return {
      ...a,
      patientName: patient
        ? `${patient.first_name} ${patient.last_name}`
        : `Patient #${a.patient_id}`,
      date: format(start, "yyyy-MM-dd"),
      startTimeStr: format(start, "HH:mm"),
      endTimeStr: format(end, "HH:mm"),
    };
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<"week" | "day">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPatient | null>(null);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [newAppt, setNewAppt] = useState({ patientId: "", date: format(new Date(), "yyyy-MM-dd"), startTime: "09:00" });

  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [appts, pts] = await Promise.all([
        api.getAppointments(0, 500),
        api.getPatients(0, 500),
      ]);
      const pMap = new Map<number, Patient>();
      pts.forEach((p: Patient) => pMap.set(p.id, p));
      setPatients(pts);
      setAppointments(enrichAppointments(appts, pMap));
    } catch {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 10 }, (_, i) => i + 8);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayAppointments = appointments.filter((a) => a.date === todayStr);
  const totalToday = todayAppointments.length;
  const completedToday = todayAppointments.filter((a) => a.status === "COMPLETED").length;

  const dayAppointments = useMemo(() => {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    return appointments.filter((a) => a.date === dateStr);
  }, [currentDate, appointments]);

  const navigate_prev = () => setCurrentDate((d) => addDays(d, view === "week" ? -7 : -1));
  const navigate_next = () => setCurrentDate((d) => addDays(d, view === "week" ? 7 : 1));

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return appointments.filter((a) => a.date === dateStr);
  };

  const handleQuickAction = async (action: string, apt: AppointmentWithPatient) => {
    setSelectedAppointment(null);
    if (action === "start") {
      navigate(`/session/${apt.id}`);
    } else if (action === "payment") {
      try {
        await api.generateKaspiLink(apt.id);
        toast.success("Payment link generated!");
        fetchData();
      } catch {
        toast.error("Failed to generate payment link.");
      }
    } else if (action === "cancel") {
      try {
        await api.updateAppointment(apt.id, { status: "CANCELLED" });
        toast.info("Appointment cancelled.");
        fetchData();
      } catch {
        toast.error("Failed to cancel appointment.");
      }
    }
  };

  const handleCreateAppointment = async () => {
    if (!newAppt.patientId) {
      toast.error("Please select a patient.");
      return;
    }
    setCreating(true);
    try {
      const startDt = `${newAppt.date}T${newAppt.startTime}:00`;
      const [h, m] = newAppt.startTime.split(":").map(Number);
      const endDt = `${newAppt.date}T${String(h).padStart(2, "0")}:${String(m + 45).padStart(2, "0")}:00`;
      await api.createAppointment({
        patient_id: parseInt(newAppt.patientId),
        start_time: startDt,
        end_time: endDt,
      });
      toast.success("Appointment created!");
      setShowNewAppt(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to create appointment.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">Today's Sessions</p>
              <p className="text-[22px]">{completedToday}/{totalToday}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">Total Patients</p>
              <p className="text-[22px]">{patients.length}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">Total Appointments</p>
              <p className="text-[22px]">{appointments.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1>Calendar</h1>
          <p className="text-muted-foreground text-[14px]">{format(currentDate, "EEEE, MMMM d, yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNewAppt(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            <span className="text-[13px]">New Appointment</span>
          </button>
          <div className="flex bg-muted rounded-xl p-1">
            <button onClick={() => setView("week")} className={`px-3 py-1.5 rounded-lg text-[13px] transition-all ${view === "week" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Week</button>
            <button onClick={() => setView("day")} className={`px-3 py-1.5 rounded-lg text-[13px] transition-all ${view === "day" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Day</button>
          </div>
          <button onClick={navigate_prev} className="p-2 rounded-xl hover:bg-accent transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-[13px] rounded-xl hover:bg-accent transition-colors">Today</button>
          <button onClick={navigate_next} className="p-2 rounded-xl hover:bg-accent transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[12px]">
        {(["PLANNED", "PAID", "COMPLETED", "CANCELLED"] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${statusDot[s]}`} />
            <span className="capitalize text-muted-foreground">{s.toLowerCase()}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        {view === "week" ? (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
              <div className="p-2" />
              {weekDays.map((d) => {
                const isToday = isSameDay(d, new Date());
                return (
                  <button key={d.toISOString()} onClick={() => { setCurrentDate(d); setView("day"); }} className={`p-3 text-center border-l border-border hover:bg-accent/50 transition-colors ${isToday ? "bg-primary/5" : ""}`}>
                    <p className="text-[11px] text-muted-foreground">{format(d, "EEE")}</p>
                    <div className={`text-[16px] mt-0.5 ${isToday ? "w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto" : ""}`}>{format(d, "d")}</div>
                  </button>
                );
              })}
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-0">
                  <div className="p-2 text-[11px] text-muted-foreground text-right pr-3 pt-3">{`${hour}:00`}</div>
                  {weekDays.map((d) => {
                    const dayApts = getAppointmentsForDay(d);
                    const hourApts = dayApts.filter((a) => parseInt(a.startTimeStr) === hour);
                    return (
                      <div key={d.toISOString()} className="border-l border-border min-h-[65px] p-1">
                        {hourApts.map((apt) => (
                          <AppointmentCard key={apt.id} appointment={apt} variant="compact" onClick={() => setSelectedAppointment(apt)} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              {hours.map((hour) => {
                const hourApts = dayAppointments.filter((a) => parseInt(a.startTimeStr) === hour);
                return (
                  <div key={hour} className="flex border-b border-border last:border-0">
                    <div className="w-16 shrink-0 p-3 text-[12px] text-muted-foreground text-right">{`${hour}:00`}</div>
                    <div className="flex-1 border-l border-border min-h-[70px] p-2 space-y-2">
                      {hourApts.map((apt) => (
                        <AppointmentCard key={apt.id} appointment={apt} variant="full" onClick={() => setSelectedAppointment(apt)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* Quick Action Modal */}
      <AnimatePresence>
        {selectedAppointment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAppointment(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }} className="bg-card rounded-2xl border border-border w-full max-w-sm p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[13px]">
                    {selectedAppointment.patientName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3>{selectedAppointment.patientName}</h3>
                    <p className="text-[13px] text-muted-foreground">{selectedAppointment.startTimeStr} - {selectedAppointment.endTimeStr}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAppointment(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] ${
                selectedAppointment.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                selectedAppointment.status === "PLANNED" ? "bg-yellow-100 text-yellow-700" :
                selectedAppointment.status === "PAID" ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                <span className={`w-2 h-2 rounded-full ${statusDot[selectedAppointment.status]}`} />
                <span className="capitalize">{selectedAppointment.status.toLowerCase()}</span>
              </div>
              <div className="space-y-2">
                <button onClick={() => handleQuickAction("start", selectedAppointment)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  <Play className="w-4 h-4" /><span className="text-[14px]">Start Session</span>
                </button>
                <button onClick={() => handleQuickAction("payment", selectedAppointment)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors">
                  <Link2 className="w-4 h-4" /><span className="text-[14px]">Generate Kaspi Payment Link</span>
                </button>
                <button onClick={() => handleQuickAction("cancel", selectedAppointment)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-red-50 transition-colors text-destructive">
                  <XCircle className="w-4 h-4" /><span className="text-[14px]">Cancel Appointment</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Appointment Modal */}
      <AnimatePresence>
        {showNewAppt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNewAppt(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }} className="bg-card rounded-2xl border border-border w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3>New Appointment</h3>
                <button onClick={() => setShowNewAppt(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div>
                <label className="text-[13px] mb-1 block">Patient</label>
                <select value={newAppt.patientId} onChange={(e) => setNewAppt({ ...newAppt, patientId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[13px] mb-1 block">Date</label>
                <input type="date" value={newAppt.date} onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-[13px] mb-1 block">Start Time</label>
                <input type="time" value={newAppt.startTime} onChange={(e) => setNewAppt({ ...newAppt, startTime: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <button onClick={handleCreateAppointment} disabled={creating} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-[14px] flex items-center justify-center gap-2 disabled:opacity-60">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Appointment
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
