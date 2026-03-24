import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Search, MapPin, Star, Globe, Filter, X } from "lucide-react";
import { api } from "../api";
import type { TherapistProfilePublic } from "../types";
import { KZ_CITIES, SPECIALIZATIONS } from "../types";
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
      params.sort_by = filters.sort_by;
      const data = await api.searchProfiles(params);
      setProfiles(data);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = () => load();

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
      <div className="bg-primary/5 border-b border-border px-4 py-8 lg:py-12">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl font-semibold mb-2">{t("marketplace.title")}</h1>
          <p className="text-muted-foreground mb-6">{t("marketplace.subtitle")}</p>
          <div className="flex gap-2 max-w-2xl mx-auto">
            <select value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} className="px-4 py-3 bg-card border border-border rounded-xl text-sm flex-1">
              <option value="">{t("marketplace.allCities")}</option>
              {KZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.specialization} onChange={(e) => setFilters({ ...filters, specialization: e.target.value })} className="px-4 py-3 bg-card border border-border rounded-xl text-sm flex-1">
              <option value="">{t("marketplace.allSpecializations")}</option>
              {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{t(`marketplace.spec.${s}`)}</option>)}
            </select>
            <button onClick={handleSearch} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90 flex items-center gap-2">
              <Search className="w-4 h-4" />{t("marketplace.search")}
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-3 border border-border rounded-xl hover:bg-accent">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="max-w-2xl mx-auto mt-4 bg-card border border-border rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
              <div>
                <label className="text-xs text-muted-foreground">{t("marketplace.language")}</label>
                <select value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })} className="w-full px-2 py-1.5 bg-input-background rounded-lg text-sm mt-1">
                  <option value="">{t("common.all")}</option>
                  <option value="ru">{t("marketplace.lang.ru")}</option>
                  <option value="kk">{t("marketplace.lang.kk")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t("marketplace.minRating")}</label>
                <select value={filters.min_rating} onChange={(e) => setFilters({ ...filters, min_rating: e.target.value })} className="w-full px-2 py-1.5 bg-input-background rounded-lg text-sm mt-1">
                  <option value="">{t("common.all")}</option>
                  <option value="4">4+</option>
                  <option value="4.5">4.5+</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t("marketplace.priceRange")}</label>
                <div className="flex gap-1 mt-1">
                  <input type="number" placeholder="от" value={filters.price_min} onChange={(e) => setFilters({ ...filters, price_min: e.target.value })} className="w-full px-2 py-1.5 bg-input-background rounded-lg text-sm" />
                  <input type="number" placeholder="до" value={filters.price_max} onChange={(e) => setFilters({ ...filters, price_max: e.target.value })} className="w-full px-2 py-1.5 bg-input-background rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={filters.online_only} onChange={(e) => setFilters({ ...filters, online_only: e.target.checked })} className="rounded" />
                  <Globe className="w-3.5 h-3.5" />{t("marketplace.onlineOnly")}
                </label>
              </div>
            </motion.div>
          )}
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
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/marketplace/${p.therapist_id}`)}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg shrink-0">
                    {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full rounded-full object-cover" /> : p.therapist_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium truncate">{p.therapist_name}</h3>
                    {p.clinic_name && <p className="text-xs text-muted-foreground truncate">{p.clinic_name}</p>}
                    {renderStars(p.avg_rating)}
                    <span className="text-xs text-muted-foreground ml-1">({p.review_count})</span>
                  </div>
                </div>
                {p.specializations && p.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.specializations.slice(0, 3).map((s) => (
                      <span key={s} className="text-[10px] bg-accent px-2 py-0.5 rounded-full">{t(`marketplace.spec.${s}`)}</span>
                    ))}
                    {p.specializations.length > 3 && <span className="text-[10px] text-muted-foreground">+{p.specializations.length - 3}</span>}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city || t("marketplace.cityNotSet")}</span>
                  {p.price_range_min && <span>{Number(p.price_range_min).toLocaleString()}–{Number(p.price_range_max).toLocaleString()} ₸</span>}
                </div>
                {p.online_available && <span className="inline-flex items-center gap-1 text-[10px] text-green-600 mt-1"><Globe className="w-3 h-3" />{t("marketplace.online")}</span>}
                {p.verification_status === "verified" && <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 ml-2 mt-1">✓ {t("marketplace.verified")}</span>}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
