interface SOAPTextAreaProps {
  label: string;
  sectionKey: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

const sectionInfo: Record<string, { full: string; color: string; hint: string }> = {
  subjective: { full: "Subjective", color: "border-l-blue-400", hint: "What the parent/patient reported" },
  objective: { full: "Objective", color: "border-l-green-400", hint: "Clinical observations & test results" },
  assessment: { full: "Assessment", color: "border-l-amber-400", hint: "Clinical interpretation & progress" },
  plan: { full: "Plan", color: "border-l-purple-400", hint: "Next steps & treatment plan" },
};

export function SOAPTextArea({ label, sectionKey, value, onChange, rows = 3 }: SOAPTextAreaProps) {
  const info = sectionInfo[sectionKey] || { full: label, color: "border-l-gray-400", hint: "" };

  return (
    <div className={`border-l-4 ${info.color} pl-4`}>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[14px] inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent">
          {sectionKey[0].toUpperCase()}
        </span>
        <div>
          <label className="text-[13px] block">{info.full}</label>
          <span className="text-[11px] text-muted-foreground">{info.hint}</span>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-4 py-3 bg-input-background rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-ring resize-none transition-all"
      />
    </div>
  );
}
