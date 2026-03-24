import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Search, BookOpen, Trash2, Edit2, X } from "lucide-react";
import { api } from "../api";
import type { HomeworkTemplate } from "../types";
import { HOMEWORK_CATEGORIES } from "../types";
import { useTranslation } from "react-i18next";

export default function HomeworkLibrary() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<HomeworkTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", category: "other" as string,
    instructions: "", target_sounds: "", age_range: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getHomeworkTemplates(category || undefined, search || undefined);
      setTemplates(data);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [category, search]);

  const resetForm = () => {
    setForm({ title: "", description: "", category: "other", instructions: "", target_sounds: "", age_range: "" });
    setEditingId(null);
    setShowCreate(false);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.updateHomeworkTemplate(editingId, form);
      } else {
        await api.createHomeworkTemplate(form);
      }
      resetForm();
      load();
    } catch { /* empty */ }
  };

  const handleDelete = async (id: number) => {
    try { await api.deleteHomeworkTemplate(id); load(); } catch { /* empty */ }
  };

  const startEdit = (t: HomeworkTemplate) => {
    setForm({
      title: t.title, description: t.description || "", category: t.category,
      instructions: t.instructions || "", target_sounds: t.target_sounds || "", age_range: t.age_range || "",
    });
    setEditingId(t.id);
    setShowCreate(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("homework.library")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("homework.libraryDesc")}</p>
        </div>
        <button onClick={() => { resetForm(); setShowCreate(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />{t("homework.newTemplate")}
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder={t("homework.searchTemplates")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-input-background rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 bg-input-background rounded-xl text-sm outline-none">
          <option value="">{t("homework.allCategories")}</option>
          {HOMEWORK_CATEGORIES.map((c) => <option key={c} value={c}>{t(`homework.category.${c}`)}</option>)}
        </select>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">{editingId ? t("homework.editTemplate") : t("homework.newTemplate")}</h3>
            <button onClick={resetForm}><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder={t("homework.title")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-2 bg-input-background rounded-xl text-sm outline-none" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 bg-input-background rounded-xl text-sm outline-none">
              {HOMEWORK_CATEGORIES.map((c) => <option key={c} value={c}>{t(`homework.category.${c}`)}</option>)}
            </select>
            <input placeholder={t("homework.targetSounds")} value={form.target_sounds} onChange={(e) => setForm({ ...form, target_sounds: e.target.value })} className="px-3 py-2 bg-input-background rounded-xl text-sm outline-none" />
            <input placeholder={t("homework.ageRange")} value={form.age_range} onChange={(e) => setForm({ ...form, age_range: e.target.value })} className="px-3 py-2 bg-input-background rounded-xl text-sm outline-none" />
          </div>
          <textarea placeholder={t("homework.description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-input-background rounded-xl text-sm outline-none resize-none" />
          <textarea placeholder={t("homework.instructions")} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={3} className="w-full px-3 py-2 bg-input-background rounded-xl text-sm outline-none resize-none" />
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90">{editingId ? t("common.save") : t("common.create")}</button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("homework.noTemplates")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <motion.div key={tmpl.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-medium">{tmpl.title}</h4>
                  <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full mt-1 inline-block">{t(`homework.category.${tmpl.category}`)}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(tmpl)} className="p-1.5 rounded-lg hover:bg-accent"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(tmpl.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {tmpl.description && <p className="text-xs text-muted-foreground line-clamp-2">{tmpl.description}</p>}
              {tmpl.target_sounds && <p className="text-xs"><span className="text-muted-foreground">{t("homework.sounds")}:</span> {tmpl.target_sounds}</p>}
              {tmpl.age_range && <p className="text-xs"><span className="text-muted-foreground">{t("homework.age")}:</span> {tmpl.age_range}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
