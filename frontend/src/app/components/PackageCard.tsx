import { useState, useEffect } from "react";
import { Package, AlertTriangle } from "lucide-react";
import { api } from "../api";
import type { PackageBalance } from "../types";
import { useTranslation } from "react-i18next";

interface Props {
  patientId: number;
}

export default function PackageCard({ patientId }: Props) {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<PackageBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getPackageBalance(patientId);
        setBalance(data);
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, [patientId]);

  if (loading) return <div className="h-20 bg-muted animate-pulse rounded-xl" />;
  if (!balance || !balance.active_package_id) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 text-center text-sm text-muted-foreground">
        <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
        {t("packages.noActive")}
      </div>
    );
  }

  const pct = balance.total_sessions > 0 ? (balance.used_sessions / balance.total_sessions) * 100 : 0;
  const isLow = balance.remaining_sessions <= 2;

  return (
    <div className={`bg-card border rounded-xl p-4 ${isLow ? "border-orange-300" : "border-border"}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Package className="w-4 h-4" />{t("packages.sessionPackage")}
        </h4>
        {isLow && <AlertTriangle className="w-4 h-4 text-orange-500" />}
      </div>
      <div className="flex items-end justify-between mb-2">
        <div>
          <span className="text-2xl font-semibold">{balance.remaining_sessions}</span>
          <span className="text-sm text-muted-foreground ml-1">/ {balance.total_sessions}</span>
        </div>
        <span className="text-xs text-muted-foreground">{t("packages.sessionsLeft")}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${isLow ? "bg-orange-400" : "bg-primary"}`} style={{ width: `${100 - pct}%` }} />
      </div>
    </div>
  );
}
