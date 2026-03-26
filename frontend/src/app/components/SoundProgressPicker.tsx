import { useState } from "react";
import { motion } from "motion/react";
import { Plus, X, Check } from "lucide-react";
import { SOUND_STAGES } from "../types";
import { useTranslation } from "react-i18next";

const STAGE_COLORS: Record<string, string> = {
  not_started: "bg-gray-200",
  isolation: "bg-red-300",
  syllables: "bg-orange-300",
  words: "bg-yellow-300",
  phrases: "bg-lime-300",
  connected_speech: "bg-green-400",
  automated: "bg-emerald-500",
};

interface SoundUpdate {
  sound: string;
  stage: typeof SOUND_STAGES[number];
  accuracy?: number;
}

interface Props {
  initialSounds?: SoundUpdate[];
  onChange: (sounds: SoundUpdate[]) => void;
}

export default function SoundProgressPicker({ initialSounds = [], onChange }: Props) {
  const { t } = useTranslation();
  const [sounds, setSounds] = useState<SoundUpdate[]>(initialSounds);
  const [newSound, setNewSound] = useState("");

  const addSound = () => {
    if (!newSound.trim()) return;
    const updated = [...sounds, { sound: newSound.trim().toUpperCase(), stage: "not_started" }];
    setSounds(updated);
    onChange(updated);
    setNewSound("");
  };

  const removeSound = (index: number) => {
    const updated = sounds.filter((_, i) => i !== index);
    setSounds(updated);
    onChange(updated);
  };

  const updateStage = (index: number, stage: typeof SOUND_STAGES[number]) => {
    const updated = [...sounds];
    updated[index] = { ...updated[index], stage };
    setSounds(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("soundProgress.updateProgress")}</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSound}
            onChange={(e) => setNewSound(e.target.value)}
            placeholder="Р, Ш, Л..."
            className="w-20 px-2 py-1 text-xs border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => e.key === 'Enter' && addSound()}
          />
          <button onClick={addSound} className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sounds.map((s, idx) => (
          <motion.div key={`${s.sound}-${idx}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-muted/30 border border-border/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-primary">{s.sound}</span>
              <button onClick={() => removeSound(idx)} className="text-muted-foreground hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SOUND_STAGES.map((stage) => (
                <button
                  key={stage}
                  onClick={() => updateStage(idx, stage)}
                  className={`px-2 py-1 rounded-md text-[10px] transition-all border ${
                    s.stage === stage 
                      ? `${STAGE_COLORS[stage]} border-primary shadow-sm font-medium` 
                      : "bg-card border-border hover:bg-accent text-muted-foreground"
                  }`}
                >
                  {s.stage === stage && <Check className="w-2.5 h-2.5 inline mr-1" />}
                  {t(`soundProgress.stage_short.${stage}`)}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
        {sounds.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">
            {t("soundProgress.noActiveSounds")}
          </p>
        )}
      </div>
    </div>
  );
}
