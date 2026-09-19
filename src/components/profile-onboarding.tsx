"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useTranslation } from "@/i18n/locale-provider";
import { Brain, ChevronRight, Loader2, Target, Sparkles, GraduationCap, Heart, AlertCircle, User as UserIcon, Globe, Calendar } from "lucide-react";

export function ProfileOnboarding() {
  const { user, setSession, subscription } = useAuthStore();
  const { locale, setLocale } = useSettingsStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [role, setRole] = useState("Étudiant");
  const [level, setLevel] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [difficulties, setDifficulties] = useState("");
  const [interests, setInterests] = useState("");

  const isDemo = user?.isAnonymous;
  const isCompleted = user?.learningProfile?.onboardingCompleted;

  useEffect(() => {
    if (user && !name) setName(user.name || "");
  }, [user, name]);

  useEffect(() => {
    if (user && !isDemo && !isCompleted) {
      const hasSeenTour = localStorage.getItem("gradelys:onboarding_completed");
      if (hasSeenTour) {
        const t = setTimeout(() => setIsOpen(true), 1500);
        return () => clearTimeout(t);
      } else {
        const interval = setInterval(() => {
          if (localStorage.getItem("gradelys:onboarding_completed")) {
            setIsOpen(true);
            clearInterval(interval);
          }
        }, 2000);
        return () => clearInterval(interval);
      }
    }
  }, [user, isDemo, isCompleted]);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/profiles/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age: parseInt(age) || null, role, level, specialty, difficulties, interests }),
      });

      const data = await res.json();
      if (data.success && user) {
        setSession({ ...user, name: data.name, learningProfile: data.learning_profile }, subscription);
        setIsOpen(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    if (step === 1) return true; // Language is pre-selected by default in the store
    if (step === 2) return name.trim().length > 0 && age.trim().length > 0 && !isNaN(parseInt(age));
    if (step === 3) return true; // Role is always selected
    if (step === 4) {
      if (role === "Étudiant") return level.trim().length > 0;
      if (role === "Professeur" || role === "Professionnel") return specialty.trim().length > 0;
      return true; // Autre is optional
    }
    return true; // Difficulties and interests are optional
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
    else handleSubmit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col"
      >
        <div className="bg-[var(--primary-subtle)] p-6 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"></div>
          
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm mb-3 relative z-10">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 relative z-10">
            {t("onboarding.title")}
          </h2>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" /> {t("onboarding.step1.language")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "en", label: "English 🇺🇸" },
                      { id: "fr", label: "Français 🇫🇷" },
                      { id: "ar", label: "العربية 🇸🇦" },
                      { id: "es", label: "Español 🇪🇸" }
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => setLocale(lang.id as any)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          locale === lang.id
                            ? "border-primary bg-[var(--primary-subtle)] text-primary"
                            : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-primary" /> {t("onboarding.step2.name")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("onboarding.step2.namePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> {t("onboarding.step2.age")}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    placeholder={t("onboarding.step2.agePlaceholder")}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-3 block">{t("onboarding.step3.role")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "Étudiant", label: t("onboarding.roles.student") },
                      { id: "Professeur", label: t("onboarding.roles.teacher") },
                      { id: "Professionnel", label: t("onboarding.roles.professional") },
                      { id: "Autre", label: t("onboarding.roles.other") }
                    ].map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setRole(r.id);
                          setLevel("");
                          setSpecialty("");
                        }}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          role === r.id
                            ? "border-primary bg-[var(--primary-subtle)] text-primary"
                            : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {role === "Étudiant" && (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" /> {t("onboarding.step4.studentLevel")}
                      </label>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
                      >
                        <option value="">{t("onboarding.level.select")}</option>
                        <option value="Lycée">{t("onboarding.level.highschool")}</option>
                        <option value="Licence">{t("onboarding.level.bachelors")}</option>
                        <option value="Master">{t("onboarding.level.masters")}</option>
                        <option value="Doctorat">{t("onboarding.level.phd")}</option>
                        <option value="Formation professionnelle">{t("onboarding.level.vocational")}</option>
                        <option value="Autre">{t("onboarding.level.other")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" /> {t("onboarding.step4.studentSpecialty")} <span className="text-slate-400 font-normal">({t("common.optional")})</span>
                      </label>
                      <input
                        type="text"
                        placeholder={t("onboarding.step4.studentSpecialtyPlaceholder")}
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
                      />
                    </div>
                  </>
                )}

                {role === "Professeur" && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" /> {t("onboarding.step4.teacherSpecialty")}
                    </label>
                    <input
                      type="text"
                      placeholder={t("onboarding.step4.teacherSpecialtyPlaceholder")}
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
                    />
                  </div>
                )}

                {role === "Professionnel" && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" /> {t("onboarding.step4.proSpecialty")}
                    </label>
                    <input
                      type="text"
                      placeholder={t("onboarding.step4.proSpecialtyPlaceholder")}
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
                    />
                  </div>
                )}

                {role === "Autre" && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" /> {t("onboarding.step4.otherSpecialty")} <span className="text-slate-400 font-normal">({t("common.optional")})</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t("onboarding.step4.otherSpecialtyPlaceholder")}
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-secondary" /> {t("onboarding.step5.difficulties")}
                  </label>
                  <textarea
                    placeholder={t("onboarding.step5.difficultiesPlaceholder")}
                    value={difficulties}
                    onChange={(e) => setDifficulties(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-sm outline-none transition-colors focus:border-secondary focus:bg-white min-h-[90px] resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" /> {t("onboarding.step5.interests")} <span className="text-slate-400 font-normal">({t("common.optional")})</span>
                  </label>
                  <textarea
                    placeholder={t("onboarding.step5.interestsPlaceholder")}
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3.5 text-sm outline-none transition-colors focus:border-pink-500 focus:bg-white min-h-[90px] resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${step === i ? "w-6 bg-primary" : "w-2 bg-slate-200"}`} />
              ))}
            </div>

            <button
              onClick={nextStep}
              disabled={loading || !isStepValid()}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : step < 5 ? (
                <>{t("onboarding.btn.continue")} <ChevronRight className="h-4 w-4" /></>
              ) : (
                t("onboarding.btn.finish")
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
