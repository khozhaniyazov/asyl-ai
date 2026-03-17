import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Save, CheckCircle, Key, MessageCircle, Sparkles } from "lucide-react";

const tabs = ["Profile", "Integrations", "Templates"] as const;

export default function Settings() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Profile");
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
      <h1>Settings</h1>

      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-[13px] transition-all ${activeTab === tab ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            {tab}
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
              { key: "name", label: "Full Name" },
              { key: "clinic", label: "Clinic Name" },
              { key: "email", label: "Email", type: "email" },
              { key: "phone", label: "Phone" },
              { key: "defaultDuration", label: "Default Session Duration (min)", type: "number" },
              { key: "defaultPrice", label: "Default Price per Session (KZT)", type: "number" },
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
            <button
              onClick={() => toast.success("Profile saved!")}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
            >
              <Save className="w-4 h-4" />
              <span className="text-[14px]">Save Changes</span>
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
                  <h3>Kaspi API</h3>
                  <p className="text-[12px] text-muted-foreground">Generate payment links for parents</p>
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
                Save API Key
              </button>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <h3>WhatsApp Business</h3>
                  <p className="text-[12px] text-muted-foreground">Send homework & payment reminders</p>
                </div>
              </div>
              {whatsappConnected ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-[14px]">Connected and active</span>
                </div>
              ) : (
                <button
                  onClick={() => { setWhatsappConnected(true); toast.success("WhatsApp connected!"); }}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-[14px] hover:bg-green-700 transition-colors"
                >
                  Connect WhatsApp
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
                <h3>AI Prompt Preferences</h3>
                <p className="text-[12px] text-muted-foreground">Customize how AI generates notes</p>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground">
              This text is prepended to the AI analysis as instructions. Customize it to match your preferred documentation style.
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
              <span className="text-[14px]">Save Preferences</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
