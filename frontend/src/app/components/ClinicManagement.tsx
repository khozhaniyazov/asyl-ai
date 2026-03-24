import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Building2, Plus, UserPlus, Trash2, Crown, Shield, User, Loader2 } from "lucide-react";
import { api } from "../api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Member {
  id: number; therapist_id: number; therapist_name: string;
  therapist_email: string; role: string; joined_at: string | null;
}

interface ClinicData {
  id: number; name: string; address: string | null; phone: string | null;
  my_role: string; members: Member[]; created_at: string | null;
}

const ROLE_ICONS: Record<string, typeof Crown> = { owner: Crown, admin: Shield, therapist: User };

export default function ClinicManagement() {
  const { t } = useTranslation();
  const [clinics, setClinics] = useState<ClinicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("therapist");

  const load = async () => {
    try { const data = await api.getMyClinics(); setClinics(data); } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await api.createClinic(form);
      setShowCreate(false);
      setForm({ name: "", address: "", phone: "" });
      load();
      toast.success(t("clinic.created"));
    } catch { toast.error(t("clinic.createFailed")); }
  };

  const handleInvite = async (clinicId: number) => {
    if (!inviteEmail.trim()) return;
    try {
      await api.inviteToClinic(clinicId, { therapist_email: inviteEmail, role: inviteRole });
      setShowInvite(null);
      setInviteEmail("");
      load();
      toast.success(t("clinic.invited"));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t("clinic.inviteFailed"));
    }
  };

  const handleRemove = async (clinicId: number, membershipId: number) => {
    try { await api.removeClinicMember(clinicId, membershipId); load(); } catch { /* empty */ }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("clinic.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("clinic.description")}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90">
          <Plus className="w-4 h-4" />{t("clinic.createClinic")}
        </button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-lg">
          <h3 className="text-base font-medium">{t("clinic.createClinic")}</h3>
          <input placeholder={t("clinic.clinicName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-input-background rounded-xl text-sm outline-none" />
          <input placeholder={t("clinic.address")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 bg-input-background rounded-xl text-sm outline-none" />
          <input placeholder={t("clinic.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-input-background rounded-xl text-sm outline-none" />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm">{t("common.create")}</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border rounded-xl text-sm">{t("common.cancel")}</button>
          </div>
        </motion.div>
      )}

      {clinics.length === 0 && !showCreate ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("clinic.noClinics")}</p>
        </div>
      ) : clinics.map((clinic) => (
        <motion.div key={clinic.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium flex items-center gap-2"><Building2 className="w-4 h-4" />{clinic.name}</h3>
              {clinic.address && <p className="text-xs text-muted-foreground mt-0.5">{clinic.address}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-accent px-2 py-0.5 rounded-full">{t(`clinic.role.${clinic.my_role}`)}</span>
              {(clinic.my_role === "owner" || clinic.my_role === "admin") && (
                <button onClick={() => setShowInvite(showInvite === clinic.id ? null : clinic.id)} className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-accent">
                  <UserPlus className="w-3 h-3" />{t("clinic.invite")}
                </button>
              )}
            </div>
          </div>

          {showInvite === clinic.id && (
            <div className="px-5 py-3 bg-accent/30 border-b border-border flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">{t("clinic.therapistEmail")}</label>
                <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com" className="w-full px-3 py-2 bg-input-background rounded-lg text-sm mt-1" />
              </div>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="px-3 py-2 bg-input-background rounded-lg text-sm">
                <option value="therapist">{t("clinic.role.therapist")}</option>
                <option value="admin">{t("clinic.role.admin")}</option>
              </select>
              <button onClick={() => handleInvite(clinic.id)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">{t("clinic.invite")}</button>
            </div>
          )}

          <div className="divide-y divide-border">
            {clinic.members.map((member) => {
              const RoleIcon = ROLE_ICONS[member.role] || User;
              return (
                <div key={member.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                      {member.therapist_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm">{member.therapist_name}</p>
                      <p className="text-xs text-muted-foreground">{member.therapist_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><RoleIcon className="w-3 h-3" />{t(`clinic.role.${member.role}`)}</span>
                    {member.role !== "owner" && (clinic.my_role === "owner" || clinic.my_role === "admin") && (
                      <button onClick={() => handleRemove(clinic.id, member.id)} className="p-1 rounded hover:bg-red-100"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
