import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Save, CheckCircle, Key, MessageCircle, Sparkles, Clock, Loader2 } from "lucide-react";
import { api } from "../api";
import AvailabilitySettings from "./AvailabilitySettings";
import { useTranslation } from "react-i18next";

const tabs = ["Profile", "Availability", "Integrations", "Templates"] as const;

export default function Settings() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Profile");
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "", clinic: "", email: "", phone: "",
    defaultDuration: "45", defaultPrice: "15000",
  });
  const [kaspiKey, setKaspiKey] = useState("");
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [templatePref, setTemplatePref] = useState(
    "Generate concise SOAP notes. Keep homework assignments short and parent-friendly. Use simple language. Include 2-3 specific exercises with clear instructions."
  );

  useEffect(() => {
    (async () => {
      try {
        const me = await api.getMe();
        setProfile({
          name: me.full_name || "",
          clinic: me.clinic_name || "",
          email: me.email || "",
          phone: "",
          defaultDuration: "45",
          defaultPrice: "15000",
        });
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1>{t("settings.title")}</h1>

      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-[13px] whitespace-nowrap transition-all ${activeTab === tab ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
            {tab === "Profile" ? t("settings.profile") : tab === "Availability" ? t("availability.title") : tab === "Integrations" ? t("settings.integrations") : t("settings.templates")}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {activeTab === "Profile" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-lg">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-[20px]">
                {profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <h3>{profile.name}</h3>
                <p className="text-[13px] text-muted-foreground">{profile.clinic}</p>
              </div>
            </div>
            {[
              { key: "name", label: t("settings.fullName") },
              { key: "clinic", label: t("settings.clinicName") },
              { key: "email", label: t("settings.email"), type: "email" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-[13px] mb-1 block">{field.label}</label>
                <input type={field.type || "text"} value={(profile as any)[field.key]} onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
              </div>
            ))}
            <div>
              <label className="text-[13px] mb-1 block">{t("settings.language")}</label>
              <div className="flex gap-2">
                <button onClick={() => i18n.changeLanguage("ru")} className={`px-4 py-2 rounded-xl text-[14px] transition-all ${i18n.language === "ru" ? "bg-primary text-primary-foreground" : "bg-input-background"}`}>{t("settings.russian")}</button>
                <button onClick={() => i18n.changeLanguage("kk")} className={`px-4 py-2 rounded-xl text-[14px] transition-all ${i18n.language === "kk" ? "bg-primary text-primary-foreground" : "bg-input-background"}`}>{t("settings.kazakh")}</button>
              </div>
            </div>
            <button onClick={() => toast.success(t("settings.profileSaved"))} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity">
              <Save className="w-4 h-4" /><span className="text-[14px]">{t("settings.saveChanges")}</span>
            </button>
          </div>
        )}

        {activeTab === "Availability" && (
          <div className="bg-card border border-border rounded-2xl p-6 max-w-3xl">
            <AvailabilitySettings />
          </div>
        )}

        {activeTab === "Integrations" && (
          <div className="space-y-4 max-w-lg">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center"><Key className="w-5 h-5 text-yellow-700" /></div>
                <div><h3>{t("settings.kaspiApi")}</h3><p className="text-[12px] text-muted-foreground">{t("settings.kaspiDesc")}</p></div>
              </div>
              <input type="password" value={kaspiKey} onChange={(e) => setKaspiKey(e.target.value)} placeholder="sk_live_XXXXXXXXXXXXX" className="w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
              <button onClick={() => toast.success(t("settings.apiKeySaved"))} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-[14px] hover:opacity-90 transition-opacity">{t("settings.saveApiKey")}</button>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-green-700" /></div>
                <div><h3>{t("settings.whatsappBusiness")}</h3><p className="text-[12px] text-muted-foreground">{t("settings.whatsappDesc")}</p></div>
              </div>
              {whatsappConnected ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3"><CheckCircle className="w-5 h-5" /><span className="text-[14px]">{t("settings.connectedActive")}</span></div>
              ) : (
                <button onClick={() => { setWhatsappConnected(true); toast.success(t("settings.whatsappConnected")); }} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-[14px] hover:bg-green-700 transition-colors">{t("settings.connectWhatsapp")}</button>
              )}
            </div>
          </div>
        )}

        {activeTab === "Templates" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Sparkles className="w-5 h-5 text-primary" /></div>
              <div><h3>{t("settings.aiPromptPreferences")}</h3><p className="text-[12px] text-muted-foreground">{t("settings.aiPromptDesc")}</p></div>
            </div>
            <textarea value={templatePref} onChange={(e) => setTemplatePref(e.target.value)} rows={6} className="w-full px-4 py-3 bg-input-background rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all" />
            <button onClick={() => toast.success(t("settings.preferencesSaved"))} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity">
              <Save className="w-4 h-4" /><span className="text-[14px]">{t("settings.savePreferences")}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
