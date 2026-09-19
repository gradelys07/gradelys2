"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { Subscription, User } from "@/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const clear = useAuthStore((s) => s.clear);

  React.useEffect(() => {
    const supabase = createClient();

    async function loadSession() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        const isDemo = typeof document !== 'undefined' && document.cookie.includes("gradelys_demo=true");
        if (isDemo) {
          const user: User = {
            id: "demo-user",
            email: "demo@gradelys.com",
            name: "Demo User",
            level: "High School",
            avatarUrl: null,
            lang: "fr",
            educationSystem: "international",
            role: "user",
            status: "active",
            banReason: undefined,
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            isAnonymous: true,
          };
          const sub: Subscription = {
            userId: "demo-user",
            plan: "free",
            status: "active",
            creditsRemaining: 10,
            creditsMax: 10,
            resetDate: new Date().toISOString(),
            currentPeriodEnd: new Date().toISOString(),
            whopSubscriptionId: undefined,
          };
          setSession(user, sub);
          setInitialized(true);
          return;
        }

        clear();
        setInitialized(true);
        return;
      }

      const [{ data: profile }, { data: subscription }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", authUser.id).single(),
        supabase.from("subscriptions").select("*").eq("user_id", authUser.id).single(),
      ]);

      if (profile) {
        const user: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          level: profile.level,
          avatarUrl: profile.avatar_url,
          lang: profile.lang,
          educationSystem: profile.education_system,
          role: profile.role,
          status: profile.status,
          banReason: profile.ban_reason,
          createdAt: profile.created_at,
          lastActiveAt: profile.last_active_at,
          isAnonymous: authUser.is_anonymous,
          learningProfile: profile.learning_profile,
        };
        const sub: Subscription | null = subscription
          ? {
              userId: subscription.user_id,
              plan: subscription.plan,
              status: subscription.status,
              creditsRemaining: subscription.credits_remaining,
              creditsMax: subscription.credits_max,
              resetDate: subscription.reset_date,
              currentPeriodEnd: subscription.current_period_end,
              whopSubscriptionId: subscription.whop_subscription_id,
            }
          : null;
        setSession(user, sub);
      }
      setInitialized(true);
    }

    loadSession();

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      loadSession();
    });

    return () => authListener.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
