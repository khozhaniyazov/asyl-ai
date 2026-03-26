import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Calendar, Users, FileText, Smartphone, CreditCard, TrendingUp,
  Clock, MessageSquare, CheckCircle, ArrowRight, Stethoscope, X,
  Star, Shield, Zap
} from "lucide-react";
import { LanguageSwitcher } from "./ui/LanguageSwitcher";
import { useAuth } from "../AuthContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  // If already logged in, go to dashboard
  if (!loading && user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const features = [
    { icon: Users, key: "patients" },
    { icon: Calendar, key: "calendar" },
    { icon: FileText, key: "soap" },
    { icon: Smartphone, key: "parentPortal" },
    { icon: CreditCard, key: "payments" },
    { icon: TrendingUp, key: "progress" },
  ];

  const problems = [
    { icon: Clock, key: "lostRecords" },
    { icon: MessageSquare, key: "noParentComm" },
    { icon: FileText, key: "manualNotes" },
    { icon: CreditCard, key: "billingChaos" },
  ];

  const included = [
    "unlimited_patients",
    "unlimited_sessions",
    "parent_portal",
    "homework_library",
    "sound_tracking",
    "kaspi_payments",
    "whatsapp_reminders",
    "ru_kk_interface",
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Asyl AI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => navigate("/login")}
              className="text-[14px] text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              {t("landing.login")}
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[14px] hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
            >
              {t("landing.getStarted")}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[13px] font-medium mb-6">
            <Zap className="w-4 h-4" />
            {t("landing.hero.badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
            {t("landing.hero.title")}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {t("landing.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-xl text-[16px] font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {t("landing.hero.cta")}
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-8 py-4 border border-border rounded-xl text-[16px] hover:bg-accent transition-colors"
            >
              {t("landing.hero.learnMore")}
            </button>
          </div>
          <p className="text-[13px] text-muted-foreground mt-4">
            {t("landing.hero.noCreditCard")}
          </p>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section className="bg-accent/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("landing.problem.title")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {t("landing.problem.subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {problems.map((problem, i) => (
              <motion.div
                key={problem.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-start gap-4 p-5 bg-card rounded-2xl border border-border"
              >
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t(`landing.problem.${problem.key}.title`)}</h3>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">
                    {t(`landing.problem.${problem.key}.desc`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t("landing.features.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-[16px] mb-2">
                {t(`landing.features.${feature.key}.title`)}
              </h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                {t(`landing.features.${feature.key}.desc`)}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-accent/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("landing.howItWorks.title")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[1, 2, 3].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                  <span className="text-primary-foreground text-xl font-bold">{step}</span>
                </div>
                <h3 className="font-semibold text-[16px] mb-2">
                  {t(`landing.howItWorks.step${step}.title`)}
                </h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  {t(`landing.howItWorks.step${step}.desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("landing.pricing.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t("landing.pricing.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-card border-2 border-primary rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[12px] font-medium px-4 py-1 rounded-bl-xl">
              {t("landing.pricing.popular")}
            </div>

            <div className="text-center mb-8">
              <h3 className="font-semibold text-lg mb-2">{t("landing.pricing.planName")}</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold">7 500</span>
                <div className="text-left">
                  <span className="text-muted-foreground text-[14px] block">KZT</span>
                  <span className="text-muted-foreground text-[13px]">{t("landing.pricing.perMonth")}</span>
                </div>
              </div>
              <p className="text-[13px] text-muted-foreground mt-2">
                {t("landing.pricing.trialNote")}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {included.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-[14px]">{t(`landing.pricing.includes.${item}`)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/register")}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl text-[16px] font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {t("landing.pricing.cta")}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Trust Section */}
      <section className="bg-accent/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: Shield, key: "security" },
              { icon: Star, key: "quality" },
              { icon: Smartphone, key: "mobile" },
            ].map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{t(`landing.trust.${item.key}.title`)}</h3>
                <p className="text-[14px] text-muted-foreground">
                  {t(`landing.trust.${item.key}.desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("landing.cta.title")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            {t("landing.cta.subtitle")}
          </p>
          <button
            onClick={() => navigate("/register")}
            className="px-10 py-4 bg-primary text-primary-foreground rounded-xl text-[16px] font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mx-auto"
          >
            {t("landing.cta.button")}
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-[13px] text-muted-foreground mt-4">
            {t("landing.hero.noCreditCard")}
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Asyl AI</span>
            </div>
            <div className="flex items-center gap-6 text-[13px] text-muted-foreground">
              <button onClick={() => navigate("/login")} className="hover:text-foreground transition-colors">
                {t("landing.login")}
              </button>
              <button onClick={() => navigate("/parent/login")} className="hover:text-foreground transition-colors">
                {t("landing.footer.parentPortal")}
              </button>
            </div>
            <p className="text-[12px] text-muted-foreground">
              {t("landing.footer.copyright")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
