import { useTranslation } from "react-i18next";

interface SOAPTextAreaProps {
  label: string;
  sectionKey: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

const sectionColors: Record<string, string> = {
  subjective: "border-l-blue-400",
  objective: "border-l-green-400",
  assessment: "border-l-amber-400",
  plan: "border-l-purple-400",
};

export function SOAPTextArea({ label, sectionKey, value, onChange, rows = 3 }: SOAPTextAreaProps) {
  const { t } = useTranslation();
  const color = sectionColors[sectionKey] || "border-l-gray-400";
  const fullName = t(`soap.${sectionKey}` as any);
  const hint = t(`soap.${sectionKey}Hint` as any);
  const letter = t(`soap.${sectionKey[0].toUpperCase()}` as any);

  return (
    <div className={`border-l-4 ${color} pl-4`}>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[14px] inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent">{letter}</span>
        <div>
          <label className="text-[13px] block">{fullName}</label>
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        </div>
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full px-4 py-3 bg-input-background rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-ring resize-none transition-all" />
    </div>
  );
}
