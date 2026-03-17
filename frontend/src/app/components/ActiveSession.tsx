import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Square, Pause, Play, ArrowLeft, Loader2, Send, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { appointments } from "./mockData";
import { SOAPTextArea } from "./SOAPTextArea";

type Phase = "recording" | "processing" | "review";

export default function ActiveSession() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const apt = appointments.find((a) => a.id === appointmentId);

  const [phase, setPhase] = useState<Phase>("recording");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [manualNotes, setManualNotes] = useState("");
  const intervalRef = useRef<number | null>(null);
  const [processingStep, setProcessingStep] = useState(0);

  const [soap, setSoap] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [homework, setHomework] = useState("");

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

  const startRecording = () => { setIsRecording(true); setIsPaused(false); };
  const pauseRecording = () => { setIsPaused(true); if (intervalRef.current) clearInterval(intervalRef.current); };
  const resumeRecording = () => setIsPaused(false);

  const stopAndAnalyze = () => {
    setIsRecording(false);
    setIsPaused(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("processing");
    setProcessingStep(0);

    // Simulate progressive processing steps
    setTimeout(() => setProcessingStep(1), 800);
    setTimeout(() => setProcessingStep(2), 1800);
    setTimeout(() => setProcessingStep(3), 2500);
    setTimeout(() => {
      setSoap({
        subjective: "Parent reports the child has been practicing target sounds at home daily. They notice improvement in clarity during conversations with family members. Child is more willing to attempt new words.",
        objective: "Produced /s/ correctly in 7/10 trials in initial word position. /s/ blends (sp, st, sk) correct in 4/10 trials. Oral motor examination reveals improved tongue tip elevation. Attention maintained for 35 minutes with minimal redirection.",
        assessment: "Good progress on /s/ in isolation and initial position. /s/ blends remain challenging but showing improvement from last session (2/10 to 4/10). Recommend continuing current approach with increased blend practice.",
        plan: "1. Continue /s/ blend drills with visual cues\n2. Introduce /s/ in final position next session\n3. Add tongue strengthening exercises to home program\n4. Schedule parent conference for progress review",
      });
      setHomework("1. Practice saying these words 5x each: 'spoon, star, skip, smile, snow'\n2. Tongue push-ups: Press tongue tip to the bumpy spot behind top teeth, hold 5 seconds, repeat 10 times\n3. Read one picture book together and count words with the 'S' sound");
      setPhase("review");
    }, 3200);
  };

  const handleSave = () => {
    toast.success("Session saved successfully!");
    navigate("/");
  };

  const handleSaveAndSend = () => {
    toast.success("Session saved! Homework sent via WhatsApp.");
    navigate("/");
  };

  // Dynamic waveform
  const [waveData, setWaveData] = useState<number[]>(Array(50).fill(4));
  useEffect(() => {
    if (isRecording && !isPaused) {
      const id = setInterval(() => {
        setWaveData(Array.from({ length: 50 }, () => 4 + Math.random() * 40));
      }, 120);
      return () => clearInterval(id);
    } else {
      setWaveData(Array(50).fill(4));
    }
  }, [isRecording, isPaused]);

  if (!apt) {
    return (
      <div className="text-center py-20">
        <h2>Session not found</h2>
        <button onClick={() => navigate("/")} className="mt-4 text-primary hover:underline text-[14px]">Back to Dashboard</button>
      </div>
    );
  }

  const processingSteps = [
    "Transcribing audio recording...",
    "Identifying speech patterns & exercises...",
    "Generating SOAP clinical notes...",
    "Preparing homework assignments...",
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-[14px] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Exit Session
        </button>
        <div className="text-right flex items-center gap-3">
          <div>
            <h2>{apt.patientName}</h2>
            <p className="text-[13px] text-muted-foreground">{apt.date} · {apt.startTime}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[13px]">
            {apt.patientName.split(" ").map((n) => n[0]).join("")}
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
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-2xl p-8 space-y-8"
          >
            <div className="text-center">
              <p className="text-[12px] text-muted-foreground uppercase tracking-wider">Session Recording</p>
              <p className="text-[48px] font-mono mt-2 text-primary tabular-nums">{formatTime(seconds)}</p>
            </div>

            {/* Dynamic Waveform */}
            <div className="flex items-center justify-center gap-[2px] h-12">
              {waveData.map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-primary/50"
                  style={{ height: `${h}px`, transition: "height 0.1s ease" }}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg shadow-red-500/25"
                >
                  <Mic className="w-8 h-8" />
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="w-14 h-14 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
                  >
                    {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={stopAndAnalyze}
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <Square className="w-4 h-4" />
                    <span className="text-[14px]">Stop & Analyze</span>
                  </motion.button>
                </>
              )}
            </div>

            <div className="text-center text-[13px] text-muted-foreground flex items-center justify-center gap-2">
              {isRecording ? (
                isPaused ? (
                  <><MicOff className="w-4 h-4" /> Paused — tap play to resume</>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Recording in progress...</>
                )
              ) : (
                "Tap the microphone to begin recording the session"
              )}
            </div>

            {/* Manual Notes */}
            <div>
              <label className="text-[13px] text-muted-foreground block mb-2">Quick Notes (optional)</label>
              <textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Jot down quick observations while recording..."
                rows={3}
                className="w-full px-4 py-3 bg-input-background rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
              />
            </div>
          </motion.div>
        )}

        {/* Processing Phase */}
        {phase === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-2xl p-12 text-center space-y-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            >
              <Loader2 className="w-14 h-14 mx-auto text-primary" />
            </motion.div>
            <div>
              <h2>AI is analyzing the session...</h2>
              <p className="text-[14px] text-muted-foreground mt-2">This usually takes a few seconds</p>
            </div>
            <div className="space-y-3 max-w-sm mx-auto text-left">
              {processingSteps.map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: processingStep >= i ? 1 : 0.4 }}
                  className="flex items-center gap-3 text-[13px]"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    processingStep > i ? "bg-green-100" : processingStep === i ? "bg-primary/10" : "bg-muted"
                  }`}>
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
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-[14px] text-green-800">AI analysis complete! Review and edit the notes below before saving.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="mb-5">SOAP Notes</h3>
              <div className="space-y-5">
                {(["subjective", "objective", "assessment", "plan"] as const).map((key) => (
                  <SOAPTextArea
                    key={key}
                    label={key}
                    sectionKey={key}
                    value={soap[key]}
                    onChange={(v) => setSoap({ ...soap, [key]: v })}
                    rows={key === "plan" ? 5 : 3}
                  />
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-[14px]">
                  📝
                </div>
                <h3>Homework for Parent</h3>
              </div>
              <textarea
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-input-background rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-border hover:bg-accent transition-colors"
              >
                <Save className="w-4 h-4" />
                <span className="text-[14px]">Save Session</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSaveAndSend}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
              >
                <Send className="w-4 h-4" />
                <span className="text-[14px]">Save & Send via WhatsApp</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
