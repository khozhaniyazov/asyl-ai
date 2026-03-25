import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Save, Upload, Eye, EyeOff, ShieldCheck, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";
import type { TherapistProfileData } from "../types";
import { KZ_CITIES, SPECIALIZATIONS, AGE_GROUPS } from "../types";
import { useTranslation } from "react-i18next";

export default function MarketplaceProfile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<TherapistProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [form, setForm] = useState({
    bio: "", specializations: [] as string[], education: "", certifications: [] as string[],
    license_number: "", video_intro_url: "",
    years_of_experience: "", city: "", district: "", online_available: false,
    price_range_min: "", price_range_max: "", session_duration: "45",
    languages: ["ru"] as string[], gender: "", is_published: false,
    age_groups: [] as string[],
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMyProfile();
        setProfile(data);
        setForm({
          bio: data.bio || "", specializations: data.specializations || [],
          education: data.education || "", certifications: data.certifications || [],
          license_number: data.license_number || "", video_intro_url: data.video_intro_url || "",
          years_of_experience: data.years_of_experience?.toString() || "",
          city: data.city || "", district: data.district || "",
          online_available: data.online_available, price_range_min: data.price_range_min?.toString() || "",
          price_range_max: data.price_range_max?.toString() || "",
          session_duration: data.session_duration?.toString() || "45",
          languages: data.languages || ["ru"], gender: data.gender || "",
          is_published: data.is_published,
          age_groups: data.age_groups || [],
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
        video_intro_url: form.video_intro_url || null,
        license_number: form.license_number || null,
      };
      if (isNew) {
        const data = await api.createMyProfile(payload);
        setProfile(data);
        setIsNew(false);
      } else {
        const data = await api.updateMyProfile(payload);
        setProfile(data);
      }
      toast.success(t("common.saved"));
    } catch { toast.error(t("common.saveFailed")); }
    setSaving(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await api.uploadProfilePhoto(file);
      setProfile((prev) => prev ? { ...prev, photo_url: result.photo_url } : prev);
      toast.success(t("marketplace.photoUploaded"));
    } catch { toast.error(t("marketplace.photoFailed")); }
  };

  const handleCredentialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingDoc(true);
    try {
      const uploadedDocs: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const result = await api.uploadCredentialDocument(files[i]);
        uploadedDocs.push(result.document_url);
      }
      setProfile((prev) => prev ? {
        ...prev,
        credential_documents: [...(prev.credential_documents || []), ...uploadedDocs],
      } : prev);
      toast.success(t("marketplace.docUploaded"));
    } catch { toast.error(t("marketplace.docFailed")); }
    setUploadingDoc(false);
  };

  const handleRequestVerification = async () => {
    setVerifying(true);
    try {
      await api.requestVerification();
      setProfile((prev) => prev ? { ...prev, verification_status: "pending" } : prev);
      toast.success(t("marketplace.verificationSubmitted"));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t("marketplace.verificationFailed"));
    }
    setVerifying(false);
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

  const toggleAgeGroup = (group: string) => {
    setForm((f) => ({
      ...f,
      age_groups: f.age_groups.includes(group)
        ? f.age_groups.filter((g) => g !== group)
        : [...f.age_groups, group],
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
          <button onClick={async () => {
            try {
              const result = await api.togglePublish();
              setProfile((prev) => prev ? { ...prev, is_published: result.is_published } : prev);
              setForm({ ...form, is_published: result.is_published });
              toast.success(result.is_published ? t("marketplace.published") : t("marketplace.draft"));
            } catch { toast.error(t("common.saveFailed")); }
          }} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border transition-colors ${form.is_published ? "bg-green-100 border-green-300 text-green-700" : "border-border text-muted-foreground"}`}>
            {form.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {form.is_published ? t("marketplace.published") : t("marketplace.draft")}
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90 disabled:opacity-50">
            <Save className="w-3 h-3" />{saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>

      {/* Verification status */}
      {profile && (
        <div className={`rounded-xl p-4 flex items-center justify-between ${
          profile.verification_status === "verified" ? "bg-blue-50 border border-blue-200" :
          profile.verification_status === "pending" ? "bg-yellow-50 border border-yellow-200" :
          profile.verification_status === "rejected" ? "bg-red-50 border border-red-200" :
          "bg-card border border-border"
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${
              profile.verification_status === "verified" ? "text-blue-600" :
              profile.verification_status === "pending" ? "text-yellow-600" :
              profile.verification_status === "rejected" ? "text-red-600" :
              "text-muted-foreground"
            }`} />
            <div>
              <p className="text-sm font-medium">{t(`marketplace.verStatus.${profile.verification_status}`)}</p>
              <p className="text-xs text-muted-foreground">{t(`marketplace.verStatusDesc.${profile.verification_status}`)}</p>
            </div>
          </div>
          {profile.verification_status === "unverified" && (
            <button onClick={handleRequestVerification} disabled={verifying} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
              {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
              {t("marketplace.requestVerification")}
            </button>
          )}
        </div>
      )}

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
        <div>
          <label className="text-xs text-muted-foreground">{t("marketplace.videoIntroUrl")}</label>
          <input type="url" value={form.video_intro_url} onChange={(e) => setForm({ ...form, video_intro_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 bg-input-background rounded-xl text-sm mt-1 outline-none" />
        </div>
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

      {/* Age Groups */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-3">{t("marketplace.ageGroups")}</h3>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map((g) => (
            <button key={g} onClick={() => toggleAgeGroup(g)} className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${form.age_groups.includes(g) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
              {t(`marketplace.age.${g}`)}
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

      {/* Credentials & Verification */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2"><ShieldCheck className="w-4 h-4" />{t("marketplace.credentials")}</h3>
        <div>
          <label className="text-xs text-muted-foreground">{t("marketplace.licenseNumber")}</label>
          <input type="text" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} placeholder="KZ-LOG-2024-XXXX" className="w-full px-3 py-2 bg-input-background rounded-xl text-sm mt-1 outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-2">{t("marketplace.credentialDocs")}</label>
          {profile?.credential_documents && profile.credential_documents.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.credential_documents.map((doc, i) => (
                <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg flex items-center gap-1">
                  <FileUp className="w-3 h-3" />{t("marketplace.document")} {i + 1}
                </span>
              ))}
            </div>
          )}
          <label className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm cursor-pointer hover:bg-accent">
            {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            {t("marketplace.uploadDocument")}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleCredentialUpload} className="hidden" disabled={uploadingDoc} multiple />
          </label>
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
