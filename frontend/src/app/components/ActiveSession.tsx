import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Square, Pause, Play, ArrowLeft, Loader2, Send, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";
import { SOAPTextArea } from "./SOAPTextArea";
import { useTranslation } from "react-i18next";

type Phase = "recording" | "processing" | "review";

export default function ActiveSession() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [phase, setPhase] = useState<Phase>("recording");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [manualNotes, setManualNotes] = useState("");
  const intervalRef = useRef<number | null>(null);
  const [processingStep, setProcessingStep] = useState(0);

  // Real audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Session data
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [patientName, setPatientName] = useState("Session");
  const [appointmentInfo, setAppointmentInfo] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [soap, setSoap] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [homework, setHomework] = useState("");

  // Load appointment info
  useEffect(() => {
    if (!appointmentId) return;
    (async () => {
      try {
        const appt = await api.getAppointment(parseInt(appointmentId));
        const patient = await api.getPatient(appt.patient_id);
        setPatientName(`${patient.first_name} ${patient.last_name}`);
        setAppointmentInfo(new Date(appt.start_time).toLocaleString());
      } catch {
        // Appointment info not critical, continue
      }
    })();
  }, [appointmentId]);

  // Timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRecording, isPaused]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      toast.error(t("session.micPermission"));
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
    }
    setIsPaused(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
    }
    setIsPaused(false);
  };

  const stopAndAnalyze = useCallback(async () => {
    if (!appointmentId) return;

    setIsRecording(false);
    setIsPaused(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Stop the recorder
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });
    }

    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Build audio blob
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    if (audioBlob.size === 0) {
      toast.error(t("session.noAudioRecorded"));
      return;
    }

    setPhase("processing");
    setProcessingStep(0);

    try {
      // Step 1: Upload and start processing
      setProcessingStep(0);
      const result = await api.transcribeAndAnalyze(parseInt(appointmentId), audioBlob);
      setSessionId(result.session_id);
      setProcessingStep(1);

      // Step 2: Poll for completion
      let status = "processing";
      let attempts = 0;
      while (status === "processing" && attempts < 60) {
        await new Promise((r) => setTimeout(r, 2000));
        const statusResult = await api.pollSessionStatus(result.session_id);
        status = statusResult.status;

        if (attempts < 10) setProcessingStep(1);
        else if (attempts < 20) setProcessingStep(2);
        else setProcessingStep(3);

        if (status === "completed" && statusResult.soap) {
          setSoap({
            subjective: statusResult.soap.subjective || "",
            objective: statusResult.soap.objective || "",
            assessment: statusResult.soap.assessment || "",
            plan: statusResult.soap.plan || "",
          });
          setHomework(statusResult.soap.homework_for_parents || "");
          setPhase("review");
          return;
        } else if (status === "failed") {
          toast.error(t("session.aiFailed"));
          setPhase("recording");
          return;
        }
        attempts++;
      }

      if (status === "processing") {
        toast.error(t("session.processingTimeout"));
        setPhase("recording");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t("session.failedProcess"));
      setPhase("recording");
    }
  }, [appointmentId]);

  const handleSave = async () => {
    if (!sessionId) return;
    setSaving(true);
    try {
      await api.updateSession(sessionId, {
        soap_subjective: soap.subjective,
        soap_objective: soap.objective,
        soap_assessment: soap.assessment,
        soap_plan: soap.plan,
        homework_for_parents: homework,
      });
      toast.success(t("session.sessionSaved"));
      navigate("/");
    } catch {
      toast.error(t("session.failedSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSend = async () => {
    if (!sessionId) return;
    setSaving(true);
    try {
      await api.updateSession(sessionId, {
        soap_subjective: soap.subjective,
        soap_objective: soap.objective,
        soap_assessment: soap.assessment,
        soap_plan: soap.plan,
        homework_for_parents: homework,
      });
      await api.sendHomework(sessionId);
      toast.success(t("session.sessionSavedHomework"));
      navigate("/");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to save/send.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Dynamic waveform
  const [waveData, setWaveData] = useState<number[]>(Array(50).fill(4));

  const processingSteps = [
    t("session.uploadingAudio"),
    t("session.transcribing"),
    t("session.generatingSOAP"),
    t("session.preparingHomework"),
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-[14px] transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t("session.exitSession")}
        </button>
        <div className="text-right flex items-center gap-3">
          <div>
            <h2>{patientName}</h2>
            <p className="text-[13px] text-muted-foreground">{appointmentInfo}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[13px]">
            {patientName.split(" ").map((n) => n[0]).join("")}
          </div>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="flex items-center gap-2">
        {(["recording", "processing", "review"] as Phase[]).map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] transition-all ${
              phase === p ? "bg-primary text-primary-foreground" :
              (["recording", "processing", "review"].indexOf(phase) > i) ? "bg-green-500 text-white" :
              "bg-muted text-muted-foreground"
            }`}>
              {["recording", "processing", "review"].indexOf(phase) > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[12px] capitalize ${phase === p ? "text-foreground" : "text-muted-foreground"}`}>{p}</span>
            {i < 2 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Recording Phase */}
        {phase === "recording" && (
          <motion.div key="recording" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-card border border-border rounded-2xl p-8 space-y-8">
            <div className="text-center">
              <p className="text-[12px] text-muted-foreground uppercase tracking-wider">{t("session.sessionRecording")}</p>
              <p className="text-[48px] font-mono mt-2 text-primary tabular-nums">{formatTime(seconds)}</p>
            </div>

            {/* Dynamic Waveform */}
            <div className="flex items-center justify-center gap-[2px] h-12">
              {waveData.map((h, i) => (
                <div key={i} className="w-1 rounded-full bg-primary/50" style={{ height: `${h}px`, transition: "height 0.1s ease" }} />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startRecording} className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg shadow-red-500/25">
                  <Mic className="w-8 h-8" />
                </motion.button>
              ) : (
                <>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={isPaused ? resumeRecording : pauseRecording} className="w-14 h-14 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors">
                    {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={stopAndAnalyze} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20">
                    <Square className="w-4 h-4" />
                    <span className="text-[14px]">{t("session.stopAndAnalyze")}</span>
                  </motion.button>
                </>
              )}
            </div>

            <div className="text-center text-[13px] text-muted-foreground flex items-center justify-center gap-2">
              {isRecording ? (
                isPaused ? (
                  <><MicOff className="w-4 h-4" /> {t("session.paused")}</>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {t("session.recordingInProgress")}</>
                )
              ) : (
                t("session.tapToRecord")
              )}
            </div>

            {/* Manual Notes */}
            <div>
              <label className="text-[13px] text-muted-foreground block mb-2">{t("session.quickNotes")}</label>
              <textarea value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} placeholder={t("session.quickNotesPlaceholder")} rows={3} className="w-full px-4 py-3 bg-input-background rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all" />
            </div>
          </motion.div>
        )}

        {/* Processing Phase */}
        {phase === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-card border border-border rounded-2xl p-12 text-center space-y-8">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
              <Loader2 className="w-14 h-14 mx-auto text-primary" />
            </motion.div>
            <div>
              <h2>{t("session.aiAnalyzing")}</h2>
              <p className="text-[14px] text-muted-foreground mt-2">{t("session.processingTime")}</p>
            </div>
            <div className="space-y-3 max-w-sm mx-auto text-left">
              {processingSteps.map((step, i) => (
                <motion.div key={step} initial={{ opacity: 0.4 }} animate={{ opacity: processingStep >= i ? 1 : 0.4 }} className="flex items-center gap-3 text-[13px]">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${processingStep > i ? "bg-green-100" : processingStep === i ? "bg-primary/10" : "bg-muted"}`}>
                    {processingStep > i ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className={`w-2 h-2 rounded-full ${processingStep === i ? "bg-primary animate-pulse" : "bg-muted-foreground/30"}`} />
                    )}
                  </div>
                  <span className={processingStep >= i ? "text-foreground" : "text-muted-foreground"}>{step}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Review Phase */}
        {phase === "review" && (
          <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-[14px] text-green-800">{t("session.analysisComplete")}</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="mb-5">{t("session.soapNotes")}</h3>
              <div className="space-y-5">
                {(["subjective", "objective", "assessment", "plan"] as const).map((key) => (
                  <SOAPTextArea key={key} label={key} sectionKey={key} value={soap[key]} onChange={(v) => setSoap({ ...soap, [key]: v })} rows={key === "plan" ? 5 : 3} />
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <h3>{t("session.homeworkForParent")}</h3>
              </div>
              <textarea value={homework} onChange={(e) => setHomework(e.target.value)} rows={5} className="w-full px-4 py-3 bg-input-background rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-border hover:bg-accent transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="text-[14px]">{t("session.saveSession")}</span>
              </motion.button>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleSaveAndSend} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="text-[14px]">{t("session.saveAndSend")}</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
