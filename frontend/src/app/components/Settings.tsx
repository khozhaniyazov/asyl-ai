import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Save, CheckCircle, Key, MessageCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const tabs = ["Profile", "Integrations", "Templates"] as const;

export default function Settings() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Profile");
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState({
    name: "Dr. Dana Karimova",
    clinic: "SpeechCare Almaty",
    email: "dana@speechcare.kz",
    phone: "+7 701 999 0000",
    defaultDuration: "45",
    defaultPrice: "15000",
  });
  const [kaspiKey, setKaspiKey] = useState("");
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [templatePref, setTemplatePref] = useState(
    "Generate concise SOAP notes. Keep homework assignments short and parent-friendly. Use simple language. Include 2-3 specific exercises with clear instructions."
  );

  return (
    <div className="space-y-6">
      <h1>{t("settings.title")}</h1>

      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-[13px] transition-all ${activeTab === tab ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            {tab === "Profile" ? t("settings.profile") : tab === "Integrations" ? t("settings.integrations") : t("settings.templates")}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {activeTab === "Profile" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-lg">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-[20px]">
                DK
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
              { key: "phone", label: t("settings.phone") },
              { key: "defaultDuration", label: t("settings.defaultDuration"), type: "number" },
              { key: "defaultPrice", label: t("settings.defaultPrice"), type: "number" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-[13px] mb-1 block">{field.label}</label>
                <input
                  type={field.type || "text"}
                  value={(profile as any)[field.key]}
                  onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            ))}
            <div>
              <label className="text-[13px] mb-1 block">{t("settings.language")}</label>
              <div className="flex gap-2">
                <button onClick={() => i18n.changeLanguage("ru")} className={`px-4 py-2 rounded-xl text-[14px] transition-all ${i18n.language === "ru" ? "bg-primary text-primary-foreground" : "bg-input-background"}`}>{t("settings.russian")}</button>
                <button onClick={() => i18n.changeLanguage("kk")} className={`px-4 py-2 rounded-xl text-[14px] transition-all ${i18n.language === "kk" ? "bg-primary text-primary-foreground" : "bg-input-background"}`}>{t("settings.kazakh")}</button>
              </div>
            </div>
            <button
              onClick={() => toast.success("Profile saved!")}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
            >
              <Save className="w-4 h-4" />
              <span className="text-[14px]">{t("settings.saveChanges")}</span>
            </button>
          </div>
        )}

        {activeTab === "Integrations" && (
          <div className="space-y-4 max-w-lg">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Key className="w-5 h-5 text-yellow-700" />
                </div>
                <div>
                  <h3>{t("settings.kaspiApi")}</h3>
                  <p className="text-[12px] text-muted-foreground">{t("settings.kaspiDesc")}</p>
                </div>
              </div>
              <input
                type="password"
                value={kaspiKey}
                onChange={(e) => setKaspiKey(e.target.value)}
                placeholder="sk_live_XXXXXXXXXXXXX"
                className="w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <button
                onClick={() => { toast.success("Kaspi API key saved!"); }}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-[14px] hover:opacity-90 transition-opacity"
              >
                {t("settings.saveApiKey")}
              </button>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <h3>{t("settings.whatsappBusiness")}</h3>
                  <p className="text-[12px] text-muted-foreground">{t("settings.whatsappDesc")}</p>
                </div>
              </div>
              {whatsappConnected ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-[14px]">{t("settings.connectedActive")}</span>
                </div>
              ) : (
                <button
                  onClick={() => { setWhatsappConnected(true); toast.success("WhatsApp connected!"); }}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-[14px] hover:bg-green-700 transition-colors"
                >
                  {t("settings.connectWhatsapp")}
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "Templates" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3>{t("settings.aiPromptPreferences")}</h3>
                <p className="text-[12px] text-muted-foreground">{t("settings.aiPromptDesc")}</p>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground">
              {t("settings.templateInstructions")}
            </p>
            <textarea
              value={templatePref}
              onChange={(e) => setTemplatePref(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-input-background rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
            />
            <div className="bg-accent/50 rounded-xl p-3">
              <p className="text-[12px] text-muted-foreground">
                💡 Example: "Keep SOAP notes under 100 words each. Write homework in numbered steps. Use Kazakh language for parent-facing homework."
              </p>
            </div>
            <button
              onClick={() => toast.success("Template preferences saved!")}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
            >
              <Save className="w-4 h-4" />
              <span className="text-[14px]">{t("settings.savePreferences")}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
