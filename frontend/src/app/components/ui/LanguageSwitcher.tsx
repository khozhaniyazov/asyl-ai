import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n } = useTranslation();

  const toggleLang = () => {
    const next = i18n.language === "ru" ? "kk" : "ru";
    i18n.changeLanguage(next);
  };

  return (
    <button
      onClick={toggleLang}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:bg-accent/50 transition-all ${className}`}
      title={i18n.language === "ru" ? "Қазақшаға ауысу" : "Переключить на русский"}
    >
      <Globe className="w-4 h-4 text-primary" />
      <span className="text-[13px] font-medium">
        {i18n.language === "ru" ? "RU" : "KK"}
      </span>
    </button>
  );
}
