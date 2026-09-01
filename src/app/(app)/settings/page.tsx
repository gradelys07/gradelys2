"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { validatePassword } from "@/lib/security";
import { rechargePacks } from "@/lib/config";
import { getCheckoutUrl } from "@/lib/whop/client";
import { trackClickUpgrade, trackInitiateCheckout } from "@/lib/whop/tracking";
import Link from "next/link";
import { useTranslation } from "@/i18n/locale-provider";

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-display-md text-text-primary">{t("settings.title")}</h1>

      <Tabs defaultValue="profile" className="mt-8">
        <TabsList>
          <TabsTrigger value="profile">{t("settings.profile")}</TabsTrigger>
          <TabsTrigger value="subscription">{t("settings.subscription")}</TabsTrigger>
          <TabsTrigger value="preferences">{t("settings.preferences")}</TabsTrigger>
          <TabsTrigger value="security">{t("settings.security")}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6"><ProfileTab /></TabsContent>
        <TabsContent value="subscription" className="mt-6"><SubscriptionTab /></TabsContent>
        <TabsContent value="preferences" className="mt-6"><PreferencesTab /></TabsContent>
        <TabsContent value="security" className="mt-6"><SecurityTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const subscription = useAuthStore((s) => s.subscription);
  const [name, setName] = React.useState(user?.name || "");
  const [level, setLevel] = React.useState(user?.level || "High School");
  const [educationSystem, setEducationSystem] = React.useState(user?.educationSystem || "Standard");
  const [saving, setSaving] = React.useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ name, level, education_system: educationSystem }).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSession({ ...user, name, level, educationSystem }, subscription);
    toast.success("Profile updated");
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={user?.name || "?"} src={user?.avatarUrl} size="xl" />
        <div>
          <p className="text-body-sm font-medium text-text-primary">{user?.email}</p>
          <p className="text-label-md text-text-muted">Member since {user && new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="level">Education level</Label>
        <select
          id="level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="flex h-10 w-full rounded-md border border-border bg-elevated px-3 text-body-md text-text-primary focus-visible:outline-none focus-visible:border-primary"
        >
          {["Middle School", "High School", "University", "Graduate", "Professional"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="educationSystem">Education System (Country format for Exams)</Label>
        <select
          id="educationSystem"
          value={educationSystem}
          onChange={(e) => setEducationSystem(e.target.value)}
          className="flex h-10 w-full rounded-md border border-border bg-elevated px-3 text-body-md text-text-primary focus-visible:outline-none focus-visible:border-primary"
        >
          {["Standard", "Algérie - BAC", "Algérie - BEM", "France - Baccalauréat", "France - Brevet", "US - High School", "US - College", "UK - A-Levels", "UK - GCSE"].map((sys) => (
            <option key={sys} value={sys}>{sys}</option>
          ))}
        </select>
      </div>
      <Button type="submit" loading={saving}>Save changes</Button>
    </form>
  );
}

function SubscriptionTab() {
  const subscription = useAuthStore((s) => s.subscription);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border-strong bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-heading-sm text-text-primary capitalize">{subscription?.plan} plan</p>
            <p className="text-body-sm text-text-muted">
              {subscription?.creditsRemaining} / {subscription?.creditsMax} scan credits remaining
            </p>
          </div>
          <Badge variant={subscription?.plan === "free" ? "default" : "primary"}>{subscription?.status}</Badge>
        </div>
        {subscription?.plan === "free" && (
          <Link href="/pricing" onClick={() => trackClickUpgrade("settings_subscription")}>
            <Button className="mt-4">Upgrade plan</Button>
          </Link>
        )}
      </div>

      <div>
        <h3 className="text-heading-sm text-text-primary">Recharge scan credits</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {rechargePacks.map((pack) => {
            const url = getCheckoutUrl(pack.id);
            return (
              <a
                key={pack.id}
                href={url || "/pricing"}
                target={url ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={() => trackInitiateCheckout(pack.id, "one-time")}
                className="rounded-lg border border-border bg-surface p-4 text-center transition-colors hover:border-border-strong"
              >
                <p className="text-heading-sm text-text-primary">{pack.label}</p>
                <p className="mt-1 text-body-sm text-text-muted">${pack.price}</p>
                {"badge" in pack && pack.badge && <Badge variant="success" className="mt-2">{pack.badge}</Badge>}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PreferencesTab() {
  const notifications = useSettingsStore((s) => s.notifications);
  const setNotification = useSettingsStore((s) => s.setNotification);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const setReduceMotion = useSettingsStore((s) => s.setReduceMotion);
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-heading-sm text-text-primary">Language</h3>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className="mt-2 flex h-10 w-48 rounded-md border border-border bg-elevated px-3 text-body-md text-text-primary"
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
          <option value="es">Español</option>
        </select>
      </div>

      <div>
        <h3 className="text-heading-sm text-text-primary">Notifications</h3>
        <div className="mt-3 space-y-3">
          {[
            { key: "emailDigest" as const, label: "Weekly progress digest" },
            { key: "emailProduct" as const, label: "Product updates" },
            { key: "emailReminders" as const, label: "Study reminders" },
            { key: "pushEnabled" as const, label: "Push notifications" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-md border border-border-subtle bg-surface px-4 py-3">
              <span className="text-body-sm text-text-secondary">{item.label}</span>
              <Switch checked={notifications[item.key]} onCheckedChange={(v) => setNotification(item.key, v)} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border-subtle bg-surface px-4 py-3">
        <span className="text-body-sm text-text-secondary">Reduce motion</span>
        <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
      </div>
    </div>
  );
}

function SecurityTab() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const router = useRouter();

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const validation = validatePassword(next);
    if (!validation.valid) {
      toast.error(validation.reason || "Invalid password");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCurrent("");
    setNext("");
    toast.success("Password updated");
  }

  async function handleDeleteAccount() {
    if (!confirm("This will permanently delete your account and all data. Continue?")) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ status: "deleted" }).eq("id", user.id);
    }
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleChangePassword} className="space-y-4">
        <h3 className="text-heading-sm text-text-primary">Change password</h3>
        <div>
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" />
        </div>
        <Button type="submit" loading={saving}>Update password</Button>
      </form>

      <div>
        <h3 className="text-heading-sm text-text-primary">Data & privacy</h3>
        <p className="mt-2 text-body-sm text-text-secondary">
          Read our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> to learn how we handle your data.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--accent-red-subtle)] bg-[var(--accent-red-subtle)]/30 p-5">
        <h3 className="text-heading-sm text-red">Danger zone</h3>
        <p className="mt-1 text-body-sm text-text-secondary">Permanently delete your account and all associated data.</p>
        <Button variant="danger" className="mt-3" onClick={handleDeleteAccount}>Delete account</Button>
      </div>
    </div>
  );
}
