import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { api } from "../api";
import type { SoundProgress } from "../types";
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

interface Props {
  patientId: number;
}

export default function SoundProgressChart({ patientId }: Props) {
  const { t } = useTranslation();
  const [records, setRecords] = useState<SoundProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getSoundProgress(patientId);
        setRecords(data);
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, [patientId]);

  // Group by sound, get latest stage per sound
  const soundMap = useMemo(() => {
    const map = new Map<string, SoundProgress>();
    // Records come sorted by assessed_at desc, so first occurrence is latest
    for (const r of records) {
      if (!map.has(r.sound)) {
        map.set(r.sound, r);
      }
    }
    return map;
  }, [records]);

  const sounds = Array.from(soundMap.keys()).sort();

  if (loading) {
    return <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (sounds.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        {t("soundProgress.noData")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">{t("soundProgress.title")}</h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {SOUND_STAGES.map((stage) => (
          <div key={stage} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm ${STAGE_COLORS[stage]}`} />
            <span className="text-muted-foreground">{t(`soundProgress.stage.${stage}`)}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="space-y-2">
        {sounds.map((sound) => {
          const record = soundMap.get(sound)!;
          const stageIndex = SOUND_STAGES.indexOf(record.stage);
          const progress = ((stageIndex + 1) / SOUND_STAGES.length) * 100;

          return (
            <motion.div key={sound} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <span className="w-8 text-center text-sm font-medium">{sound}</span>
              <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-lg ${STAGE_COLORS[record.stage]}`}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                  {t(`soundProgress.stage.${record.stage}`)}
                </span>
              </div>
              {record.accuracy_percent != null && (
                <span className="text-xs text-muted-foreground w-12 text-right">{record.accuracy_percent}%</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
