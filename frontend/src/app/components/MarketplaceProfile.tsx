import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Save, Upload, Eye, EyeOff } from "lucide-react";
import { api } from "../api";
import type { TherapistProfileData } from "../types";
import { KZ_CITIES, SPECIALIZATIONS } from "../types";
import { useTranslation } from "react-i18next";

export default function MarketplaceProfile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<TherapistProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({
    bio: "", specializations: [] as string[], education: "", certifications: [] as string[],
    years_of_experience: "", city: "", district: "", online_available: false,
    price_range_min: "", price_range_max: "", session_duration: "45",
    languages: ["ru"] as string[], gender: "", is_published: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMyProfile();
        setProfile(data);
        setForm({
          bio: data.bio || "", specializations: data.specializations || [],
          education: data.education || "", certifications: data.certifications || [],
          years_of_experience: data.years_of_experience?.toString() || "",
          city: data.city || "", district: data.district || "",
          online_available: data.online_available, price_range_min: data.price_range_min?.toString() || "",
          price_range_max: data.price_range_max?.toString() || "",
          session_duration: data.session_duration?.toString() || "45",
          languages: data.languages || ["ru"], gender: data.gender || "",
          is_published: data.is_published,
        });
      } catch {
        setIsNew(true);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : null,
        price_range_min: form.price_range_min ? Number(form.price_range_min) : null,
        price_range_max: form.price_range_max ? Number(form.price_range_max) : null,
        session_duration: form.session_duration ? Number(form.session_duration) : null,
      };
      if (isNew) {
        const data = await api.createMyProfile(payload);
        setProfile(data);
        setIsNew(false);
      } else {
        const data = await api.updateMyProfile(payload);
        setProfile(data);
      }
    } catch { /* empty */ }
    setSaving(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await api.uploadProfilePhoto(file);
      setProfile((prev) => prev ? { ...prev, photo_url: result.photo_url } : prev);
    } catch { /* empty */ }
  };

  const toggleSpec = (spec: string) => {
    setForm((f) => ({
      ...f,
      specializations: f.specializations.includes(spec)
        ? f.specializations.filter((s) => s !== spec)
        : [...f.specializations, spec],
    }));
  };

  const toggleLang = (lang: string) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter((l) => l !== lang)
        : [...f.languages, lang],
    }));
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("marketplace.myProfile")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("marketplace.myProfileDesc")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setForm({ ...form, is_published: !form.is_published })} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border transition-colors ${form.is_published ? "bg-green-100 border-green-300 text-green-700" : "border-border text-muted-foreground"}`}>
            {form.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {form.is_published ? t("marketplace.published") : t("marketplace.draft")}
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90 disabled:opacity-50">
            <Save className="w-3 h-3" />{saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>

      {/* Photo */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-3">{t("marketplace.photo")}</h3>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
            {profile?.photo_url ? <img src={profile.photo_url} alt="" className="w-full h-full object-cover" /> : <Upload className="w-6 h-6" />}
          </div>
          <label className="px-4 py-2 border border-border rounded-lg text-sm cursor-pointer hover:bg-accent">
            {t("marketplace.uploadPhoto")}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium">{t("marketplace.aboutYou")}</h3>
        <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder={t("marketplace.bioPlaceholder")} rows={4} className="w-full px-3 py-2 bg-input-background rounded-xl text-sm outline-none resize-none" />
        <textarea value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} placeholder={t("marketplace.educationPlaceholder")} rows={2} className="w-full px-3 py-2 bg-input-background rounded-xl text-sm outline-none resize-none" />
      </div>

      {/* Specializations */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-3">{t("marketplace.specializations")}</h3>
        <div className="flex flex-wrap gap-2">
          {SPECIALIZATIONS.map((s) => (
            <button key={s} onClick={() => toggleSpec(s)} className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${form.specializations.includes(s) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
              {t(`marketplace.spec.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Location & Pricing */}
      <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground">{t("marketplace.city")}</label>
          <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 bg-input-background rounded-xl text-sm mt-1">
            <option value="">{t("marketplace.selectCity")}</option>
            {KZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("marketplace.experience")}</label>
          <input type="number" value={form.years_of_experience} onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })} placeholder="5" className="w-full px-3 py-2 bg-input-background rounded-xl text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("marketplace.priceMin")} (₸)</label>
          <input type="number" value={form.price_range_min} onChange={(e) => setForm({ ...form, price_range_min: e.target.value })} placeholder="5000" className="w-full px-3 py-2 bg-input-background rounded-xl text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("marketplace.priceMax")} (₸)</label>
          <input type="number" value={form.price_range_max} onChange={(e) => setForm({ ...form, price_range_max: e.target.value })} placeholder="15000" className="w-full px-3 py-2 bg-input-background rounded-xl text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("marketplace.sessionDuration")} ({t("common.minutes")})</label>
          <input type="number" value={form.session_duration} onChange={(e) => setForm({ ...form, session_duration: e.target.value })} className="w-full px-3 py-2 bg-input-background rounded-xl text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("marketplace.gender")}</label>
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full px-3 py-2 bg-input-background rounded-xl text-sm mt-1">
            <option value="">{t("marketplace.notSpecified")}</option>
            <option value="female">{t("marketplace.female")}</option>
            <option value="male">{t("marketplace.male")}</option>
          </select>
        </div>
      </div>

      {/* Languages & Online */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-medium">{t("marketplace.languages")}</h3>
        <div className="flex gap-2">
          {["ru", "kk", "en"].map((l) => (
            <button key={l} onClick={() => toggleLang(l)} className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${form.languages.includes(l) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
              {t(`marketplace.lang.${l}`)}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
          <input type="checkbox" checked={form.online_available} onChange={(e) => setForm({ ...form, online_available: e.target.checked })} className="rounded" />
          {t("marketplace.onlineAvailable")}
        </label>
      </div>
    </div>
  );
}
