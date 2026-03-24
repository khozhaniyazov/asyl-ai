import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Target, CheckCircle, Clock, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../api";
import { useTranslation } from "react-i18next";

interface Goal {
  id: number; plan_id: number; type: string; description: string;
  target_sound: string | null; measurable_criteria: string | null;
  status: string; target_date: string | null; achieved_at: string | null;
}

interface Plan {
  id: number; patient_id: number; diagnosis: string | null;
  start_date: string | null; target_end_date: string | null;
  status: string; notes: string | null; goals: Goal[];
  created_at: string | null;
}

interface Props { patientId: number; }

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  achieved: "bg-green-100 text-green-700",
  discontinued: "bg-red-100 text-red-700",
};

export default function TreatmentPlanView({ patientId }: Props) {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState<number | null>(null);
  const [form, setForm] = useState({ diagnosis: "", start_date: "", target_end_date: "", notes: "" });
  const [goalForm, setGoalForm] = useState({ type: "short_term", description: "", target_sound: "", measurable_criteria: "", target_date: "" });

  const load = async () => {
    try { const data = await api.getTreatmentPlans(patientId); setPlans(data); } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [patientId]);

  const handleCreatePlan = async () => {
    try {
      await api.createTreatmentPlan({ patient_id: patientId, ...form, start_date: form.start_date || undefined, target_end_date: form.target_end_date || undefined });
      setShowCreate(false);
      setForm({ diagnosis: "", start_date: "", target_end_date: "", notes: "" });
      load();
    } catch { /* empty */ }
  };

  const handleAddGoal = async (planId: number) => {
    try {
      await api.addGoal(planId, { ...goalForm, target_date: goalForm.target_date || undefined, target_sound: goalForm.target_sound || undefined });
      setShowAddGoal(null);
      setGoalForm({ type: "short_term", description: "", target_sound: "", measurable_criteria: "", target_date: "" });
      load();
    } catch { /* empty */ }
  };

  const handleGoalStatus = async (goalId: number, status: string) => {
    try { await api.updateGoal(goalId, { status }); load(); } catch { /* empty */ }
  };

  const handleDeleteGoal = async (goalId: number) => {
    try { await api.deleteGoal(goalId); load(); } catch { /* empty */ }
  };

  if (loading) return <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2"><Target className="w-4 h-4" />{t("treatment.plans")}</h3>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90"><Plus className="w-3 h-3" />{t("treatment.newPlan")}</button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-accent/50 rounded-xl p-4 space-y-3">
          <input placeholder={t("treatment.diagnosis")} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="w-full px-3 py-2 bg-input-background rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">{t("treatment.startDate")}</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2 bg-input-background rounded-lg text-sm mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">{t("treatment.targetEnd")}</label><input type="date" value={form.target_end_date} onChange={(e) => setForm({ ...form, target_end_date: e.target.value })} className="w-full px-3 py-2 bg-input-background rounded-lg text-sm mt-1" /></div>
          </div>
          <textarea placeholder={t("treatment.notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 bg-input-background rounded-lg text-sm resize-none" />
          <div className="flex gap-2">
            <button onClick={handleCreatePlan} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">{t("common.create")}</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border rounded-lg text-sm">{t("common.cancel")}</button>
          </div>
        </motion.div>
      )}

      {plans.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm"><Target className="w-8 h-8 mx-auto mb-2 opacity-30" />{t("treatment.noPlans")}</div>
      ) : plans.map((plan) => (
        <motion.div key={plan.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
          <button onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/30 transition-colors">
            <div className="text-left">
              <p className="text-sm font-medium">{plan.diagnosis || t("treatment.untitled")}</p>
              <p className="text-xs text-muted-foreground">{plan.start_date || ""} {plan.target_end_date ? `→ ${plan.target_end_date}` : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${plan.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{plan.status}</span>
              <span className="text-xs text-muted-foreground">{plan.goals.length} {t("treatment.goals")}</span>
              {expandedPlan === plan.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {expandedPlan === plan.id && (
            <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
              {plan.notes && <p className="text-xs text-muted-foreground">{plan.notes}</p>}
              {plan.goals.map((goal) => (
                <div key={goal.id} className="flex items-start gap-3 bg-accent/30 rounded-lg p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${goal.type === "long_term" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{goal.type === "long_term" ? t("treatment.longTerm") : t("treatment.shortTerm")}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLORS[goal.status] || "bg-gray-100"}`}>{t(`treatment.goalStatus.${goal.status}`)}</span>
                    </div>
                    <p className="text-sm">{goal.description}</p>
                    {goal.target_sound && <p className="text-xs text-muted-foreground mt-1">{t("treatment.targetSound")}: {goal.target_sound}</p>}
                    {goal.measurable_criteria && <p className="text-xs text-muted-foreground">{t("treatment.criteria")}: {goal.measurable_criteria}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {goal.status !== "achieved" && <button onClick={() => handleGoalStatus(goal.id, "achieved")} className="p-1 rounded hover:bg-green-100" title={t("treatment.markAchieved")}><CheckCircle className="w-3.5 h-3.5 text-green-600" /></button>}
                    {goal.status === "not_started" && <button onClick={() => handleGoalStatus(goal.id, "in_progress")} className="p-1 rounded hover:bg-blue-100" title={t("treatment.markInProgress")}><Clock className="w-3.5 h-3.5 text-blue-600" /></button>}
                    <button onClick={() => handleDeleteGoal(goal.id)} className="p-1 rounded hover:bg-red-100"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                  </div>
                </div>
              ))}

              {showAddGoal === plan.id ? (
                <div className="bg-accent/50 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <select value={goalForm.type} onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value })} className="px-2 py-1.5 bg-input-background rounded-lg text-xs">
                      <option value="short_term">{t("treatment.shortTerm")}</option>
                      <option value="long_term">{t("treatment.longTerm")}</option>
                    </select>
                    <input placeholder={t("treatment.targetSound")} value={goalForm.target_sound} onChange={(e) => setGoalForm({ ...goalForm, target_sound: e.target.value })} className="px-2 py-1.5 bg-input-background rounded-lg text-xs w-20" />
                  </div>
                  <input placeholder={t("treatment.goalDescription")} value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} className="w-full px-2 py-1.5 bg-input-background rounded-lg text-xs" />
                  <input placeholder={t("treatment.measurableCriteria")} value={goalForm.measurable_criteria} onChange={(e) => setGoalForm({ ...goalForm, measurable_criteria: e.target.value })} className="w-full px-2 py-1.5 bg-input-background rounded-lg text-xs" />
                  <div className="flex gap-2">
                    <button onClick={() => handleAddGoal(plan.id)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs">{t("common.create")}</button>
                    <button onClick={() => setShowAddGoal(null)} className="px-3 py-1.5 border border-border rounded-lg text-xs">{t("common.cancel")}</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddGoal(plan.id)} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="w-3 h-3" />{t("treatment.addGoal")}</button>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
