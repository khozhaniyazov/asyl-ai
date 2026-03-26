import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Star, Globe, Filter, X, Clock, Users, Award, Calendar, ShieldCheck } from "lucide-react";
import { LanguageSwitcher } from "./ui/LanguageSwitcher";
import { api } from "../api";
import type { TherapistProfilePublic } from "../types";
import { KZ_CITIES, SPECIALIZATIONS, AGE_GROUPS } from "../types";
import { useTranslation } from "react-i18next";

export default function MarketplaceSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<TherapistProfilePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: "", specialization: "", language: "", gender: "",
    price_min: "", price_max: "", online_only: false, min_rating: "",
    age_group: "", verified_only: false,
    sort_by: "rating",
  });

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (filters.city) params.city = filters.city;
      if (filters.specialization) params.specialization = filters.specialization;
      if (filters.language) params.language = filters.language;
      if (filters.gender) params.gender = filters.gender;
      if (filters.price_min) params.price_min = Number(filters.price_min);
      if (filters.price_max) params.price_max = Number(filters.price_max);
      if (filters.online_only) params.online_only = true;
      if (filters.min_rating) params.min_rating = Number(filters.min_rating);
      if (filters.age_group) params.age_group = filters.age_group;
      if (filters.verified_only) params.verified_only = true;
      params.sort_by = filters.sort_by;
      const data = await api.searchProfiles(params);
      setProfiles(data);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = () => load();

  const activeFilterCount = [
    filters.language, filters.gender, filters.price_min, filters.price_max,
    filters.min_rating, filters.age_group, filters.online_only, filters.verified_only,
  ].filter(Boolean).length;

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-xs text-muted-foreground">{t("marketplace.noRatings")}</span>;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        ))}
        <span className="text-xs ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background px-4 py-8 lg:py-16">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{t("marketplace.title")}</motion.h1>
          <div className="absolute top-0 right-0">
            <LanguageSwitcher className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm" />
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">{t("marketplace.subtitle")}</motion.p>
          
          <div className="flex flex-col md:flex-row gap-3 max-w-4xl mx-auto glass shadow-luxe p-3 rounded-2xl">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                <select value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-transparent border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer">
                  <option value="">{t("marketplace.allCities")}</option>
                  {KZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="w-px h-8 bg-border/50 self-center hidden md:block" />
              <div className="relative flex-1">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                <select value={filters.specialization} onChange={(e) => setFilters({ ...filters, specialization: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-transparent border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer">
                  <option value="">{t("marketplace.allSpecializations")}</option>
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{t(`marketplace.spec.${s}`)}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-3 border border-border/50 rounded-xl hover:bg-accent/50 transition-all relative flex items-center gap-2 text-sm ${showFilters ? 'bg-primary/10 border-primary/30 text-primary' : ''}`}>
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{t("common.filters.title")}</span>
                {activeFilterCount > 0 && <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold shadow-lg shadow-primary/20">{activeFilterCount}</span>}
              </button>
              <button onClick={handleSearch} className="px-8 py-3 bg-primary text-primary-foreground font-medium rounded-xl text-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-primary/25">
                <Search className="w-4 h-4" />{t("marketplace.search")}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -10, height: 0 }} className="max-w-3xl mx-auto mt-4 overflow-hidden">
                <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-left shadow-lg">
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-primary uppercase tracking-wider">{t("marketplace.language")}</label>
                    <select value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })} className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                      <option value="">{t("common.all")}</option>
                      <option value="ru">{t("marketplace.lang.ru")}</option>
                      <option value="kk">{t("marketplace.lang.kk")}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-primary uppercase tracking-wider">{t("marketplace.minRating")}</label>
                    <select value={filters.min_rating} onChange={(e) => setFilters({ ...filters, min_rating: e.target.value })} className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                      <option value="">{t("common.all")}</option>
                      <option value="4">4+ ★</option>
                      <option value="4.5">4.5+ ★</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-primary uppercase tracking-wider">{t("marketplace.priceRange")}</label>
                    <div className="flex gap-2">
                      <input type="number" placeholder="min" value={filters.price_min} onChange={(e) => setFilters({ ...filters, price_min: e.target.value })} className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                      <input type="number" placeholder="max" value={filters.price_max} onChange={(e) => setFilters({ ...filters, price_max: e.target.value })} className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-primary uppercase tracking-wider">{t("marketplace.ageGroup")}</label>
                    <select value={filters.age_group} onChange={(e) => setFilters({ ...filters, age_group: e.target.value })} className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                      <option value="">{t("common.all")}</option>
                      {AGE_GROUPS.map((g) => <option key={g} value={g}>{t(`marketplace.age.${g}`)}</option>)}
                    </select>
                  </div>
                  
                  <div className="col-span-2 flex gap-6 pt-2">
                    <label className="flex items-center gap-3 text-sm cursor-pointer group">
                      <div className={`w-10 h-6 rounded-full transition-all relative ${filters.online_only ? 'bg-primary' : 'bg-muted'}`}>
                        <input type="checkbox" checked={filters.online_only} onChange={(e) => setFilters({ ...filters, online_only: e.target.checked })} className="hidden" />
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${filters.online_only ? 'translate-x-4' : ''}`} />
                      </div>
                      <span className="flex items-center gap-1.5 font-medium group-hover:text-primary transition-colors"><Globe className="w-4 h-4" />{t("marketplace.onlineOnly")}</span>
                    </label>

                    <label className="flex items-center gap-3 text-sm cursor-pointer group">
                      <div className={`w-10 h-6 rounded-full transition-all relative ${filters.verified_only ? 'bg-blue-600' : 'bg-muted'}`}>
                        <input type="checkbox" checked={filters.verified_only} onChange={(e) => setFilters({ ...filters, verified_only: e.target.checked })} className="hidden" />
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${filters.verified_only ? 'translate-x-4' : ''}`} />
                      </div>
                      <span className="flex items-center gap-1.5 font-medium group-hover:text-blue-600 transition-colors"><ShieldCheck className="w-4 h-4" />{t("marketplace.verifiedOnly")}</span>
                    </label>
                  </div>

                  <div className="col-span-2 flex justify-end items-end gap-3">
                    <button onClick={() => {
                      setFilters({ ...filters, city: "", specialization: "", language: "", gender: "", price_min: "", price_max: "", online_only: false, verified_only: false, min_rating: "", age_group: "" });
                    }} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">{t("common.filters.reset")}</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{profiles.length} {t("marketplace.specialistsFound")}</p>
          <select value={filters.sort_by} onChange={(e) => { setFilters({ ...filters, sort_by: e.target.value }); setTimeout(load, 0); }} className="px-3 py-1.5 bg-input-background rounded-lg text-sm">
            <option value="rating">{t("marketplace.sortByRating")}</option>
            <option value="price_asc">{t("marketplace.sortByPriceAsc")}</option>
            <option value="price_desc">{t("marketplace.sortByPriceDesc")}</option>
            <option value="experience">{t("marketplace.sortByExperience")}</option>
            <option value="newest">{t("marketplace.sortByNewest")}</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">{t("marketplace.noResults")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((p, idx) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/marketplace/${p.therapist_id}`)}
                className="group glass p-6 cursor-pointer hover:shadow-luxe hover:border-primary/40 hover:-translate-y-2 transition-all duration-500 rounded-2xl"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary text-xl font-bold ring-4 ring-background shadow-lg overflow-hidden transition-transform group-hover:scale-105">
                      {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : p.therapist_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    {p.verification_status === "verified" && (
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
                        <div className="bg-blue-600 rounded-full p-1 shadow-inner relative overflow-hidden">
                          <ShieldCheck className="w-2.5 h-2.5 text-white" />
                          <div className="absolute inset-0 badge-shimmer" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                       <h3 className="text-[15px] font-bold truncate group-hover:text-primary transition-colors">{p.therapist_name}</h3>
                    </div>
                    {p.clinic_name && <p className="text-xs text-muted-foreground truncate font-medium">{p.clinic_name}</p>}
                    <div className="flex items-center gap-1.5 mt-1">
                      {renderStars(p.avg_rating)}
                      <span className="text-[11px] text-muted-foreground font-medium">({p.review_count})</span>
                    </div>
                  </div>
                </div>

                {p.specializations && p.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.specializations.slice(0, 3).map((s) => (
                      <span key={s} className="text-[10px] bg-primary/5 text-primary-foreground/80 px-2 py-0.5 rounded-lg border border-primary/10 font-medium">{t(`marketplace.spec.${s}`)}</span>
                    ))}
                    {p.specializations.length > 3 && <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-lg">+{p.specializations.length - 3}</span>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t("marketplace.location")}</span>
                    <span className="text-xs font-medium flex items-center gap-1 truncate"><MapPin className="w-3 h-3 text-red-400" />{p.city || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t("marketplace.pricePerSession")}</span>
                    <span className="text-xs font-bold text-foreground truncate">{p.price_range_min ? `${Number(p.price_range_min).toLocaleString()} ₸` : "-"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 text-[10px]">
                  {p.online_available && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-lg border border-green-100 font-bold uppercase transition-colors group-hover:bg-green-100">
                      <Globe className="w-3 h-3 animate-pulse" />{t("marketplace.online")}
                    </div>
                  )}
                  {p.next_available_slot && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-bold uppercase transition-colors group-hover:bg-blue-100 ml-auto">
                      <Calendar className="w-3 h-3" />{new Date(p.next_available_slot).toLocaleDateString("ru-RU", { day: "numeric" })}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
