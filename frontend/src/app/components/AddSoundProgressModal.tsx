import { useState } from "react";
import { Plus, X, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { SOUND_STAGES } from "../types";
import { api } from "../api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Props {
  patientId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSoundProgressModal({ patientId, isOpen, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [sound, setSound] = useState("");
  const [stage, setStage] = useState<typeof SOUND_STAGES[number]>("isolation");
  const [accuracy, setAccuracy] = useState(50);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!sound.trim()) {
      toast.error(t("soundProgress.enterSound"));
      return;
    }
    setLoading(true);
    try {
      await api.createSoundProgress({
        patient_id: patientId,
        sound: sound.trim().toUpperCase(),
        stage,
        accuracy_percent: accuracy,
      });
      toast.success(t("soundProgress.saved"));
      onSuccess();
      onClose();
      setSound("");
      setStage("isolation");
      setAccuracy(50);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("soundProgress.addRecord")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-[13px] font-medium mb-1 block">{t("soundProgress.soundLabel")}</label>
            <input 
              type="text" 
              value={sound} 
              onChange={(e) => setSound(e.target.value)}
              placeholder="Р, Ш, Л..."
              className="w-full px-3 py-2 bg-input-background rounded-xl text-[14px] border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium mb-2 block">{t("soundProgress.stageLabel")}</label>
            <div className="flex flex-wrap gap-2">
              {SOUND_STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStage(s)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] border transition-all ${
                    stage === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-accent text-muted-foreground"
                  }`}
                >
                  {t(`soundProgress.stage_short.${s}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[13px] font-medium mb-1 block">{t("soundProgress.accuracyLabel")} ({accuracy}%)</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="5"
              value={accuracy} 
              onChange={(e) => setAccuracy(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
