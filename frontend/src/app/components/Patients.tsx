import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, UserPlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  diagnosis: string | null;
  parent_phone: string | null;
  therapist_id: number;
  created_at: string;
}

export default function Patients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ firstName: "", lastName: "", diagnosis: "", parentPhone: "" });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const fetchPatients = useCallback(async () => {
    try {
      const data = await api.getPatients(0, 200, search || undefined);
      setPatients(data);
    } catch {
      toast.error("Failed to load patients.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchPatients, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchPatients]);

  const handleAdd = async () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.firstName) newErrors.firstName = true;
    if (!form.lastName) newErrors.lastName = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      toast.error("Please fill in required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createPatient({
        first_name: form.firstName,
        last_name: form.lastName,
        diagnosis: form.diagnosis || undefined,
        parent_phone: form.parentPhone || undefined,
      });
      setForm({ firstName: "", lastName: "", diagnosis: "", parentPhone: "" });
      setErrors({});
      setShowAdd(false);
      toast.success("Patient added successfully!");
      fetchPatients();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to add patient.");
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (p: Patient) =>
    ((p.first_name?.[0] || "") + (p.last_name?.[0] || "")).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1>Patients</h1>
          <p className="text-[14px] text-muted-foreground">{patients.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-input-background rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-primary/30 w-48 sm:w-60 transition-all"
            />
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[14px] hidden sm:inline">Add Patient</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : patients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h2>No patients {search ? "found" : "yet"}</h2>
          <p className="text-muted-foreground text-[14px] mt-1">
            {search ? `No results for "${search}"` : "Add your first patient to get started!"}
          </p>
          {!search && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[14px]"
            >
              Add Patient
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-[12px] text-muted-foreground">Patient</th>
                  <th className="px-4 py-3 text-[12px] text-muted-foreground hidden sm:table-cell">Diagnosis</th>
                  <th className="px-4 py-3 text-[12px] text-muted-foreground hidden md:table-cell">Parent Phone</th>
                  <th className="px-4 py-3 text-[12px] text-muted-foreground">Added</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/patients/${p.id}`)}
                    className="border-b border-border last:border-0 hover:bg-accent/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[12px] shrink-0">
                          {getInitials(p)}
                        </div>
                        <p className="text-[14px]">{p.first_name} {p.last_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[14px] hidden sm:table-cell">{p.diagnosis || "—"}</td>
                    <td className="px-4 py-3.5 text-[14px] hidden md:table-cell text-muted-foreground">{p.parent_phone || "—"}</td>
                    <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Add Patient Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-card rounded-2xl border border-border w-full max-w-md p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3>Add New Patient</h3>
                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              {[
                { key: "firstName", label: "First Name *", placeholder: "First name" },
                { key: "lastName", label: "Last Name *", placeholder: "Last name" },
                { key: "diagnosis", label: "Diagnosis", placeholder: "e.g. Dysarthria" },
                { key: "parentPhone", label: "Parent Phone", placeholder: "+7 7XX XXX XXXX" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[13px] mb-1 block">{field.label}</label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={(e) => { setForm({ ...form, [field.key]: e.target.value }); setErrors({ ...errors, [field.key]: false }); }}
                    className={`w-full px-3 py-2.5 rounded-xl bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                      errors[field.key] ? "ring-2 ring-destructive" : ""
                    }`}
                  />
                  {errors[field.key] && <p className="text-[11px] text-destructive mt-1">This field is required</p>}
                </div>
              ))}
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-[14px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Patient
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
