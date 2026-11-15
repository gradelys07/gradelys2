"use client";

import * as React from "react";
import { getDesktopBridge } from "@/lib/desktop-client";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { planLimits } from "@/lib/config";
import type { Subscription, User } from "@/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const clear = useAuthStore((s) => s.clear);
  const inFlightRef = React.useRef<Promise<void> | null>(null);
  const lastSnapshotRef = React.useRef<string | null>(null);
  const initializedOnceRef = React.useRef(false);

  React.useEffect(() => {
    const supabase = createClient();

    async function loadSessionImpl() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        const isDemo = typeof document !== "undefined" && document.cookie.includes("gradelys_demo=true");
        if (isDemo) {
          const cachedEdu =
            typeof window !== "undefined" ? localStorage.getItem("gradelys_education_system") : null;
          const user: User = {
            id: "00000000-0000-0000-0000-000000000000",
            email: "demo@gradelys.com",
            name: "Demo User",
            level: "High School",
            avatarUrl: null,
            lang: "fr",
            educationSystem: cachedEdu || "Standard",
            role: "user",
            status: "active",
            banReason: undefined,
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            isAnonymous: true,
          };
          const sub: Subscription = {
            userId: "00000000-0000-0000-0000-000000000000",
            plan: "free",
            status: "active",
            creditsRemaining: 3,
            creditsMax: 3,
            resetDate: new Date().toISOString(),
            currentPeriodEnd: new Date().toISOString(),
            whopSubscriptionId: undefined,
          };
          const demoKey = `demo:${cachedEdu || "Standard"}`;
          if (lastSnapshotRef.current !== demoKey) {
            lastSnapshotRef.current = demoKey;
            setSession(user, sub);
          }
          if (!initializedOnceRef.current) {
            initializedOnceRef.current = true;
            setInitialized(true);
          }
          return;
        }

        if (lastSnapshotRef.current !== "signed-out") {
          lastSnapshotRef.current = "signed-out";
          clear();
        }
        if (!initializedOnceRef.current) {
          initializedOnceRef.current = true;
          setInitialized(true);
        }
        return;
      }

      const [{ data: profile }, { data: subscription }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", authUser.id).single(),
        supabase.from("subscriptions").select("*").eq("user_id", authUser.id).single(),
      ]);

      if (profile) {
        const cachedEdu =
          typeof window !== "undefined" ? localStorage.getItem("gradelys_education_system") : null;
        const finalEduSystem = profile.education_system || cachedEdu || "Standard";

        if (typeof window !== "undefined" && profile.education_system) {
          localStorage.setItem("gradelys_education_system", profile.education_system);
        }

        const user: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          level: profile.level,
          avatarUrl: profile.avatar_url,
          lang: profile.lang,
          educationSystem: finalEduSystem,
          role: profile.role,
          status: profile.status,
          banReason: profile.ban_reason,
          createdAt: profile.created_at,
          lastActiveAt: profile.last_active_at,
          isAnonymous: authUser.is_anonymous,
          learningProfile: profile.learning_profile,
        };
        let isExpired = false;
        if (subscription && subscription.plan !== "free" && subscription.current_period_end) {
          isExpired = new Date(subscription.current_period_end) < new Date();
        }

        const sub: Subscription | null = subscription
          ? {
              userId: subscription.user_id,
              plan: isExpired ? "free" : subscription.plan,
              status: isExpired ? "expired" : subscription.status,
              creditsRemaining: isExpired ? planLimits.free.creditsMax : subscription.credits_remaining,
              creditsMax: isExpired ? planLimits.free.creditsMax : subscription.credits_max,
              resetDate: subscription.reset_date,
              currentPeriodEnd: subscription.current_period_end,
              whopSubscriptionId: subscription.whop_subscription_id,
            }
          : null;

        const nextKey = JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          level: user.level,
          avatarUrl: user.avatarUrl,
          lang: user.lang,
          educationSystem: user.educationSystem,
          role: user.role,
          status: user.status,
          isAnonymous: user.isAnonymous,
          learningProfile: user.learningProfile,
          sub,
        });
        if (lastSnapshotRef.current !== nextKey) {
          lastSnapshotRef.current = nextKey;
          setSession(user, sub);
        }
      }
      if (!initializedOnceRef.current) {
        initializedOnceRef.current = true;
        setInitialized(true);
      }
    }

    function loadSession() {
      if (inFlightRef.current) return inFlightRef.current;
      const task = loadSessionImpl().finally(() => {
        if (inFlightRef.current === task) {
          inFlightRef.current = null;
        }
      });
      inFlightRef.current = task;
      return task;
    }

    void loadSession();

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Skip redundant initial/refresh broadcasts for the already-loaded user to avoid UI re-renders & focus/resize jitter
      if (event === "INITIAL_SESSION") return;
      const currentUser = useAuthStore.getState().user;
      if (event === "TOKEN_REFRESHED" && currentUser?.id && currentUser.id === session?.user?.id) {
        return;
      }
      void loadSession();
    });

    const unsubDesktopAuth = getDesktopBridge()?.onAuthChanged?.(() => {
      void loadSession();
    });

    return () => {
      authListener.unsubscribe();
      unsubDesktopAuth?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
