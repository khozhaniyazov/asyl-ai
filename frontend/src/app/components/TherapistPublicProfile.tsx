import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Star, MapPin, Globe, Clock, Award, ArrowLeft, Calendar, MessageSquare } from "lucide-react";
import { api } from "../api";
import type { TherapistProfilePublic, ReviewData, ReviewAggregation, Availability } from "../types";
import { useTranslation } from "react-i18next";

export default function TherapistPublicProfile() {
  const { t } = useTranslation();
  const { therapistId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TherapistProfilePublic | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [summary, setSummary] = useState<ReviewAggregation | null>(null);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"about" | "reviews" | "booking">("about");

  useEffect(() => {
    if (!therapistId) return;
    const id = Number(therapistId);
    (async () => {
      try {
        const [p, r, s, sl] = await Promise.all([
          api.getPublicProfile(id),
          api.getTherapistReviews(id),
          api.getReviewSummary(id),
          api.getTherapistSlots(id),
        ]);
        setProfile(p);
        setReviews(r);
        setSummary(s);
        setSlots(sl);
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, [therapistId]);

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("marketplace.profileNotFound")}</div>;

  const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button onClick={() => navigate("/marketplace")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />{t("marketplace.backToSearch")}
        </button>

        {/* Profile header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl shrink-0">
              {profile.photo_url ? <img src={profile.photo_url} alt="" className="w-full h-full rounded-full object-cover" /> : profile.therapist_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{profile.therapist_name}</h1>
                {profile.verification_status === "verified" && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">✓ {t("marketplace.verified")}</span>}
              </div>
              {profile.clinic_name && <p className="text-sm text-muted-foreground">{profile.clinic_name}</p>}
              <div className="flex items-center gap-4 mt-2 text-sm">
                {summary && summary.avg_overall && (
                  <div className="flex items-center gap-1">
                    {renderStars(summary.avg_overall)}
                    <span className="text-muted-foreground ml-1">{summary.avg_overall.toFixed(1)} ({summary.total_reviews})</span>
                  </div>
                )}
                {profile.city && <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{profile.city}</span>}
                {profile.online_available && <span className="flex items-center gap-1 text-green-600"><Globe className="w-3.5 h-3.5" />{t("marketplace.online")}</span>}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {profile.years_of_experience && <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />{profile.years_of_experience} {t("marketplace.yearsExp")}</span>}
                {profile.session_duration && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{profile.session_duration} {t("common.minutes")}</span>}
                {profile.price_range_min && <span>{Number(profile.price_range_min).toLocaleString()}–{Number(profile.price_range_max).toLocaleString()} ₸</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
          {(["about", "reviews", "booking"] as const).map((t_) => (
            <button key={t_} onClick={() => setTab(t_)} className={`flex-1 py-2 rounded-lg text-sm transition-colors ${tab === t_ ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {t(`marketplace.tab.${t_}`)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "about" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {profile.bio && <div className="bg-card border border-border rounded-xl p-5"><h3 className="text-sm font-medium mb-2">{t("marketplace.about")}</h3><p className="text-sm text-muted-foreground whitespace-pre-line">{profile.bio}</p></div>}
            {profile.specializations && profile.specializations.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-medium mb-2">{t("marketplace.specializations")}</h3>
                <div className="flex flex-wrap gap-2">{profile.specializations.map((s) => <span key={s} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">{t(`marketplace.spec.${s}`)}</span>)}</div>
              </div>
            )}
            {profile.education && <div className="bg-card border border-border rounded-xl p-5"><h3 className="text-sm font-medium mb-2">{t("marketplace.education")}</h3><p className="text-sm text-muted-foreground whitespace-pre-line">{profile.education}</p></div>}
            {profile.languages && profile.languages.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-medium mb-2">{t("marketplace.languages")}</h3>
                <div className="flex gap-2">{profile.languages.map((l) => <span key={l} className="text-xs bg-accent px-3 py-1 rounded-full">{t(`marketplace.lang.${l}`)}</span>)}</div>
              </div>
            )}
          </motion.div>
        )}

        {tab === "reviews" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {summary && summary.total_reviews > 0 && (
              <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-5 gap-4 text-center">
                {[
                  { label: t("marketplace.ratingOverall"), val: summary.avg_overall },
                  { label: t("marketplace.ratingResults"), val: summary.avg_results },
                  { label: t("marketplace.ratingApproach"), val: summary.avg_approach },
                  { label: t("marketplace.ratingComm"), val: summary.avg_communication },
                  { label: t("marketplace.ratingPunctuality"), val: summary.avg_punctuality },
                ].map((r) => (
                  <div key={r.label}>
                    <p className="text-2xl font-semibold">{r.val ? r.val.toFixed(1) : "—"}</p>
                    <p className="text-[10px] text-muted-foreground">{r.label}</p>
                  </div>
                ))}
              </div>
            )}
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>{t("marketplace.noReviews")}</p></div>
            ) : reviews.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.parent_name || t("marketplace.anonymous")}</span>
                    {r.is_verified && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">✓</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ru-RU")}</span>
                </div>
                {renderStars(r.rating_overall)}
                {r.text && <p className="text-sm text-muted-foreground mt-2">{r.text}</p>}
              </div>
            ))}
          </motion.div>
        )}

        {tab === "booking" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-medium mb-3">{t("marketplace.availableSlots")}</h3>
              {slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("marketplace.noSlots")}</p>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((day, i) => {
                    const daySlots = slots.filter((s) => s.day_of_week === i);
                    return (
                      <div key={i} className="text-center">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{day}</p>
                        {daySlots.map((s) => (
                          <div key={s.id} className="text-xs bg-primary/10 text-primary rounded px-1 py-0.5 mb-1">{s.start_time}–{s.end_time}</div>
                        ))}
                        {daySlots.length === 0 && <span className="text-xs text-muted-foreground/40">—</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <p className="text-sm text-muted-foreground mb-3">{t("marketplace.bookingCta")}</p>
              <button onClick={() => navigate(`/parent/login`)} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90">
                <Calendar className="w-4 h-4 inline mr-2" />{t("marketplace.bookDiagnostic")}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
