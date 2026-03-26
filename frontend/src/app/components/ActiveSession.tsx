import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Loader2, Send, Save, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";
import { SOAPTextArea } from "./SOAPTextArea";
import SoundProgressPicker from "./SoundProgressPicker";
import type { HomeworkTemplate, SoundProgress, Appointment } from "../types";
import { SOUND_STAGES } from "../types";
import { useTranslation } from "react-i18next";
import { soapSchema } from "../validation";

export default function ActiveSession() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [patientName, setPatientName] = useState("Session");
  const [appointmentInfo, setAppointmentInfo] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  const [soap, setSoap] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [homework, setHomework] = useState("");
  const [hwTemplates, setHwTemplates] = useState<HomeworkTemplate[]>([]);
  const [hwDueDate, setHwDueDate] = useState("");
  const [hwAssigning, setHwAssigning] = useState(false);
  const [hwAssigned, setHwAssigned] = useState(false);
  const [soundUpdates, setSoundUpdates] = useState<{ sound: string; stage: any }[]>([]);
  const [soapErrors, setSoapErrors] = useState<Record<string, string>>({});

  // Load appointment info
  useEffect(() => {
    if (!appointmentId) return;
    (async () => {
      try {
        const appt = await api.getAppointment(parseInt(appointmentId));
        setAppointment(appt);
        const patient = await api.getPatient(appt.patient_id);
        setPatientName(`${patient.first_name} ${patient.last_name}`);
        setPatientId(appt.patient_id);
        setAppointmentInfo(new Date(appt.start_time).toLocaleString());

        // Pre-load existing sound progress
        const progress = await api.getSoundProgress(appt.patient_id);
        const soundMap = new Map();
        progress.forEach((r: SoundProgress) => {
          if (!soundMap.has(r.sound)) soundMap.set(r.sound, r);
        });
        setSoundUpdates(
          Array.from(soundMap.values()).map((r) => ({
            sound: r.sound,
            stage: r.stage as (typeof SOUND_STAGES)[number],
          }))
        );

        // Load homework templates
        const templates = await api.getHomeworkTemplates();
        setHwTemplates(templates);
      } catch {
        // Continue if appointment info fails
      }
    })();
  }, [appointmentId]);

  const handleSave = async () => {
    if (!appointmentId) return;
    
    // Validate SOAP notes
    const result = soapSchema.safeParse(soap);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setSoapErrors(errors);
      toast.error(t("session.fillAllSoapFields"));
      return;
    }
    setSoapErrors({});
    
    setSaving(true);
    try {
      // Create or update session with SOAP notes
      const result = await api.createSession(parseInt(appointmentId), {
        soap_subjective: soap.subjective,
        soap_objective: soap.objective,
        soap_assessment: soap.assessment,
        soap_plan: soap.plan,
        homework_for_parents: homework,
      });
      const sid = result.id;
      setSessionId(sid);

      // Create homework assignment if not already assigned
      if (!hwAssigned && homework.trim() && patientId) {
        await api.createHomeworkAssignment({
          session_id: sid,
          patient_id: patientId,
          custom_instructions: homework,
          due_date: hwDueDate || undefined,
        });
      }

      // Save sound progress updates
      if (soundUpdates.length > 0 && patientId) {
        await Promise.all(
          soundUpdates.map((s) =>
            api.createSoundProgress({
              patient_id: patientId,
              session_id: sid,
              sound: s.sound,
              stage: s.stage,
            })
          )
        );
      }

      toast.success(t("session.sessionSaved"));
      navigate("/");
    } catch {
      toast.error(t("session.failedSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSend = async () => {
    if (!appointmentId) return;
    
    // Validate SOAP notes
    const result = soapSchema.safeParse(soap);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setSoapErrors(errors);
      toast.error(t("session.fillAllSoapFields"));
      return;
    }
    setSoapErrors({});
    
    setSaving(true);
    try {
      // Create or update session
      const result = await api.createSession(parseInt(appointmentId), {
        soap_subjective: soap.subjective,
        soap_objective: soap.objective,
        soap_assessment: soap.assessment,
        soap_plan: soap.plan,
        homework_for_parents: homework,
      });
      const sid = result.id;
      setSessionId(sid);

      // Create homework assignment
      if (!hwAssigned && homework.trim() && patientId) {
        await api.createHomeworkAssignment({
          session_id: sid,
          patient_id: patientId,
          custom_instructions: homework,
          due_date: hwDueDate || undefined,
        });
      }

      // Save sound progress updates
      if (soundUpdates.length > 0 && patientId) {
        await Promise.all(
          soundUpdates.map((s) =>
            api.createSoundProgress({
              patient_id: patientId,
              session_id: sid,
              sound: s.sound,
              stage: s.stage,
            })
          )
        );
      }

      // Send homework via WhatsApp
      await api.sendHomework(sid);
      toast.success(t("session.sessionSavedHomework"));
      navigate("/");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || t("session.failedSave");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignFromTemplate = async (template: HomeworkTemplate) => {
    setHwAssigning(true);
    setHomework(template.instructions || template.description || "");
    setHwAssigned(false); // Will be formally created on save
    toast.success(t("session.homeworkAssigned"));
    setHwAssigning(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-[14px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t("session.exitSession")}
        </button>
        <div className="text-right flex items-center gap-3">
          <div>
            <h2>{patientName}</h2>
            <div className="flex flex-col items-end">
              <p className="text-[13px] text-muted-foreground">{appointmentInfo}</p>
              {appointment?.session_type === "ONLINE" && appointment.meeting_link && (
                <a
                  href={appointment.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary hover:underline font-medium mt-1"
                >
                  {t("session.joinVideoCall")}
                </a>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[13px]">
            {patientName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
        </div>
      </div>

      {/* SOAP Notes */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="mb-5">{t("session.soapNotes")}</h3>
        <div className="space-y-5">
          {(["subjective", "objective", "assessment", "plan"] as const).map((key) => (
            <SOAPTextArea
              key={key}
              label={key}
              sectionKey={key}
              value={soap[key]}
              onChange={(v) => setSoap({ ...soap, [key]: v })}
              rows={key === "plan" ? 5 : 3}
              error={soapErrors[key]}
            />
          ))}
        </div>
      </div>

      {/* Sound Progress */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <SoundProgressPicker initialSounds={soundUpdates} onChange={setSoundUpdates} />
      </div>

      {/* Homework */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3>{t("session.homeworkForParent")}</h3>
          </div>
          {hwAssigned && (
            <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {t("session.assigned")}
            </span>
          )}
        </div>

        {/* Template picker */}
        {hwTemplates.length > 0 && !hwAssigned && (
          <div>
            <p className="text-[12px] text-muted-foreground mb-2">{t("session.pickTemplate")}</p>
            <div className="flex flex-wrap gap-2">
              {hwTemplates.slice(0, 6).map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleAssignFromTemplate(tmpl)}
                  disabled={hwAssigning}
                  className="px-3 py-1.5 text-[12px] border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {tmpl.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Due date */}
        <div>
          <label className="text-[12px] text-muted-foreground block mb-1">
            {t("session.dueDate")}
          </label>
          <input
            type="date"
            value={hwDueDate}
            onChange={(e) => setHwDueDate(e.target.value)}
            className="px-3 py-2 bg-input-background rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Custom instructions */}
        <textarea
          value={homework}
          onChange={(e) => setHomework(e.target.value)}
          placeholder={t("session.homeworkPlaceholder")}
          rows={5}
          className="w-full px-4 py-3 bg-input-background rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-border hover:bg-accent transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span className="text-[14px]">{t("session.saveSession")}</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSaveAndSend}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="text-[14px]">{t("session.saveAndSend")}</span>
        </motion.button>
      </div>
    </div>
  );
}
