import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, X, Clock, Calendar, User } from "lucide-react";
import { api } from "../api";
import type { MarketplaceBookingData } from "../types";
import { useTranslation } from "react-i18next";

export default function IncomingBookings() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<MarketplaceBookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getIncomingBookings(filter || undefined);
      setBookings(data);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleConfirm = async (id: number) => {
    try { await api.confirmBooking(id); load(); } catch { /* empty */ }
  };

  const handleReject = async (id: number) => {
    try { await api.rejectBooking(id); load(); } catch { /* empty */ }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("marketplace.incomingBookings")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("marketplace.incomingBookingsDesc")}</p>
      </div>

      <div className="flex gap-2">
        {["pending", "confirmed", "cancelled", ""].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
            {s ? t(`marketplace.bookingStatus.${s}`) : t("common.all")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("marketplace.noBookings")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b, idx) => {
            const date = new Date(b.requested_slot);
            return (
              <motion.div key={b.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${b.type === "diagnostic" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {t(`marketplace.bookingType.${b.type}`)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === "pending" ? "bg-yellow-100 text-yellow-700" : b.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {t(`marketplace.bookingStatus.${b.status}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-muted-foreground" />{date.toLocaleDateString("ru-RU")} {date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {b.notes && <p className="text-xs text-muted-foreground mt-1">{b.notes}</p>}
                    {b.deposit_paid && <span className="text-xs text-green-600 mt-1 inline-block">{t("marketplace.depositPaid")} {b.deposit_amount ? `${Number(b.deposit_amount).toLocaleString()} ₸` : ""}</span>}
                  </div>
                  {b.status === "pending" && (
                    <div className="flex gap-1">
                      <button onClick={() => handleConfirm(b.id)} className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200" title={t("marketplace.confirm")}>
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleReject(b.id)} className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200" title={t("marketplace.reject")}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
