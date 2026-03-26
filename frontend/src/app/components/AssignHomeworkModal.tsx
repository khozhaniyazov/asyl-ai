import { useState, useEffect } from "react";
import { BookOpen, Loader2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { api } from "../api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { HomeworkTemplate } from "../types";

interface Props {
  patientId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignHomeworkModal({ patientId, isOpen, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [templates, setTemplates] = useState<HomeworkTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          const data = await api.getHomeworkTemplates();
          setTemplates(data);
        } catch { /* ignore */ }
      })();
    }
  }, [isOpen]);

  const handleAssign = async () => {
    if (!instructions.trim()) {
      toast.error(t("session.homeworkPlaceholder"));
      return;
    }
    setLoading(true);
    try {
      await api.createHomeworkAssignment({
        patient_id: patientId,
        custom_instructions: instructions.trim(),
        due_date: dueDate || undefined,
      });
      toast.success(t("session.homeworkAssigned"));
      onSuccess();
      onClose();
      setInstructions("");
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (tmpl: HomeworkTemplate) => {
    setInstructions(tmpl.instructions || tmpl.description || "");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t("session.homeworkForParent")}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Templates */}
          {templates.length > 0 && (
            <div>
              <p className="text-[12px] text-muted-foreground mb-2">{t("session.pickTemplate")}</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                {templates.map((tmpl) => (
                  <button 
                    key={tmpl.id} 
                    onClick={() => applyTemplate(tmpl)}
                    className="px-3 py-1.5 text-[11px] border border-border rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-[13px] font-medium mb-1.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              {t("session.dueDate")}
            </label>
            <input 
              type="date" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-input-background rounded-xl border border-border text-[14px] outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="text-[13px] font-medium mb-1.5 block">{t("session.homeworkPlaceholder")}</label>
            <textarea 
              value={instructions} 
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="..."
              rows={5}
              className="w-full px-4 py-3 bg-input-background rounded-xl border border-border text-[14px] outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={handleAssign} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("session.sendHomework")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
