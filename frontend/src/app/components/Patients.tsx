import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, UserPlus, X, Filter } from "lucide-react";
import { toast } from "sonner";
import { patients as initialPatients } from "./mockData";
import type { Patient } from "./mockData";

export default function Patients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [patientList, setPatientList] = useState(initialPatients);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(
    () =>
      patientList.filter(
        (p) =>
          (p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.diagnosis.toLowerCase().includes(search.toLowerCase())) &&
          (statusFilter === "all" || p.status === statusFilter)
      ),
    [search, patientList, statusFilter]
  );

  const paginated = filtered.slice(0, page * perPage);

  const [form, setForm] = useState({ name: "", age: "", diagnosis: "", parentName: "", parentPhone: "" });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleAdd = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.name) newErrors.name = true;
    if (!form.age) newErrors.age = true;
    if (!form.parentPhone) newErrors.parentPhone = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }
    const newPatient: Patient = {
      id: String(Date.now()),
      name: form.name,
      age: parseInt(form.age),
      diagnosis: form.diagnosis || "Not specified",
      parentName: form.parentName,
      parentPhone: form.parentPhone,
      status: "active",
      nextAppointment: null,
      totalPaid: 0,
      outstanding: 0,
    };
    setPatientList([newPatient, ...patientList]);
    setForm({ name: "", age: "", diagnosis: "", parentName: "", parentPhone: "" });
    setErrors({});
    setShowAdd(false);
    toast.success(`${newPatient.name} added successfully!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1>Patients</h1>
          <p className="text-[14px] text-muted-foreground">{patientList.length} total · {patientList.filter((p) => p.status === "active").length} active</p>
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

      {/* Filter chips */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[12px] capitalize transition-all ${
              statusFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
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
                  <th className="px-4 py-3 text-[12px] text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-[12px] text-muted-foreground hidden lg:table-cell">Balance</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/patients/${p.id}`)}
                    className="border-b border-border last:border-0 hover:bg-accent/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[12px] shrink-0">
                          {p.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-[14px]">{p.name}</p>
                          <p className="text-[12px] text-muted-foreground">Age {p.age}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[14px] hidden sm:table-cell">{p.diagnosis}</td>
                    <td className="px-4 py-3.5 text-[14px] hidden md:table-cell text-muted-foreground">{p.parentPhone}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] ${
                          p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {p.outstanding > 0 ? (
                        <span className="text-[13px] text-red-600">-{p.outstanding.toLocaleString()} KZT</span>
                      ) : (
                        <span className="text-[13px] text-green-600">Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginated.length < filtered.length && (
            <div className="p-4 text-center border-t border-border">
              <button onClick={() => setPage((p) => p + 1)} className="text-[14px] text-primary hover:underline">
                Load more ({filtered.length - paginated.length} remaining)
              </button>
            </div>
          )}
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
                { key: "name", label: "Patient Name *", placeholder: "Full name" },
                { key: "age", label: "Age *", placeholder: "Age", type: "number" },
                { key: "diagnosis", label: "Diagnosis", placeholder: "e.g. Dysarthria" },
                { key: "parentName", label: "Parent Name", placeholder: "Parent full name" },
                { key: "parentPhone", label: "Parent Phone *", placeholder: "+7 7XX XXX XXXX" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[13px] mb-1 block">{field.label}</label>
                  <input
                    type={field.type || "text"}
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
              <button onClick={handleAdd} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-[14px] hover:opacity-90 transition-opacity">
                Add Patient
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
