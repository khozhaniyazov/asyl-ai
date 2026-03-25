import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, Navigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, Users, DollarSign, Settings, Search, Bell, Menu, X, LogOut, Stethoscope, Plus, Globe, BookOpen, ClipboardList, UserCircle, Inbox, MessageCircle, BarChart3, Building2, Wallet, Shield } from "lucide-react";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import { useTranslation } from "react-i18next";

export default function TherapistLayout() {
  const { user, loading, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      try { const patients = await api.getPatients(0, 5, searchQuery); setSearchResults(patients); } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!user.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  const initials = user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const navItems = [
    { to: "/", icon: CalendarDays, label: t("nav.dashboard") },
    { to: "/patients", icon: Users, label: t("nav.patients") },
    { to: "/homework", icon: BookOpen, label: t("nav.homework") },
    { to: "/messages", icon: MessageCircle, label: t("nav.messages") },
    { to: "/waitlist", icon: ClipboardList, label: t("nav.waitlist") },
    { to: "/finance", icon: DollarSign, label: t("nav.finance") },
    { to: "/payouts", icon: Wallet, label: "Payouts" },
    { to: "/analytics", icon: BarChart3, label: t("nav.analytics") },
    { to: "/profile", icon: UserCircle, label: t("nav.marketplace") },
    { to: "/bookings", icon: Inbox, label: t("nav.bookings") },
    { to: "/clinic", icon: Building2, label: t("nav.clinic") },
    ...(user.is_admin ? [{ to: "/admin", icon: Shield, label: "Admin" }] : []),
    { to: "/settings", icon: Settings, label: t("nav.settings") },
  ];

  const notifications = [
    { id: 1, text: t("notifications.aiCompleted"), time: "2 мин", unread: true },
    { id: 2, text: t("notifications.paymentReceived"), time: "1 час", unread: true },
  ];
  const unreadCount = notifications.filter((n) => n.unread).length;

  const toggleLang = () => {
    const next = i18n.language === "ru" ? "kk" : "ru";
    i18n.changeLanguage(next);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AnimatePresence>
        {sidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      </AnimatePresence>

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-sidebar-border flex flex-col transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Stethoscope className="w-5 h-5 text-primary-foreground" /></div>
          <div>
            <h3 className="text-[15px]">{t("nav.logoped")}</h3>
            <p className="text-[11px] text-muted-foreground">{t("nav.speechTherapy")}</p>
          </div>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <item.icon className="w-5 h-5" /><span className="text-[14px]">{item.label}</span>
            </NavLink>
          ))}
          <div className="pt-4 px-3"><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">{t("nav.quickActions")}</p></div>
          <button onClick={() => { navigate("/patients"); setSidebarOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all w-full">
            <Plus className="w-5 h-5" /><span className="text-[14px]">{t("nav.newPatient")}</span>
          </button>
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[13px]">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] truncate">{user.full_name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.clinic_name || user.email}</p>
            </div>
          </div>
          <button onClick={toggleLang} className="flex items-center gap-3 px-3 py-2 mt-1 rounded-xl text-muted-foreground hover:bg-accent/50 w-full transition-all">
            <Globe className="w-4 h-4" /><span className="text-[13px]">{i18n.language === "ru" ? "Қазақша" : "Русский"}</span>
          </button>
          <button onClick={() => { logout(); navigate("/login"); }} className="flex items-center gap-3 px-3 py-2 mt-1 rounded-xl text-muted-foreground hover:bg-accent/50 w-full transition-all">
            <LogOut className="w-4 h-4" /><span className="text-[13px]">{t("auth.logout")}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center px-4 lg:px-6 gap-4 bg-card shrink-0">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
          <div className="flex-1 max-w-md relative" ref={searchRef}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder={t("search.searchPatients")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} className="w-full pl-9 pr-4 py-2 bg-input-background rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
            <AnimatePresence>
              {searchFocused && searchQuery && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="absolute left-0 right-0 top-12 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">{t("search.noResults")} "{searchQuery}"</div>
                  ) : searchResults.map((p: any) => (
                    <button key={p.id} onClick={() => { navigate(`/patients/${p.id}`); setSearchQuery(""); setSearchFocused(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[12px] shrink-0">{(p.first_name?.[0] || "") + (p.last_name?.[0] || "")}</div>
                      <div><p className="text-[13px]">{p.first_name} {p.last_name}</p><p className="text-[11px] text-muted-foreground">{p.diagnosis || t("search.noDiagnosis")}</p></div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-xl hover:bg-accent transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center">{unreadCount}</span>}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.15 }} className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h4 className="text-[14px]">{t("notifications.title")}</h4>
                    <span className="text-[11px] text-primary cursor-pointer hover:underline">{t("notifications.markAllRead")}</span>
                  </div>
                  {notifications.map((n) => (
                    <div key={n.id} className={`px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border last:border-0 ${n.unread ? "bg-primary/[0.03]" : ""}`}>
                      <div className="flex items-start gap-2">
                        {n.unread && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                        <div className={n.unread ? "" : "ml-4"}><p className="text-[13px]">{n.text}</p><p className="text-[11px] text-muted-foreground mt-1">{n.time}</p></div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[13px] cursor-pointer">{initials}</div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
