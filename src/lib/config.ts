// ═══════════════════════════════════════════════════════════════
// GRADELYS v2.0 — REQUIRED ENVIRONMENT CONFIG
//
// This app has NO demo mode. Every integration below must be
// configured via real credentials in .env.local (see .env.example)
// or the corresponding feature — and in the case of Supabase/Gemini,
// the entire app — refuses to run. There is no local/mock fallback.
// ═══════════════════════════════════════════════════════════════

export interface RequiredVarGroup {
  key: string;
  label: string;
  vars: string[];
  required: boolean;
}

export const REQUIRED_VAR_GROUPS: RequiredVarGroup[] = [
  {
    key: "supabase",
    label: "Supabase (auth + database)",
    vars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    required: true,
  },
  {
    key: "gemini",
    label: "Google Gemini (AI generation)",
    vars: ["GEMINI_API_KEY"],
    required: true,
  },
  {
    key: "whop",
    label: "Whop (payments)",
    vars: ["WHOP_API_KEY", "WHOP_WEBHOOK_SECRET"],
    required: false,
  },
  {
    key: "resend",
    label: "Resend (transactional email)",
    vars: ["RESEND_API_KEY"],
    required: false,
  },
];

function isSet(name: string): boolean {
  let v: string | undefined;
  switch (name) {
    case "NEXT_PUBLIC_SUPABASE_URL": v = process.env.NEXT_PUBLIC_SUPABASE_URL; break;
    case "NEXT_PUBLIC_SUPABASE_ANON_KEY": v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; break;
    case "SUPABASE_SERVICE_ROLE_KEY": v = process.env.SUPABASE_SERVICE_ROLE_KEY; break;
    case "GEMINI_API_KEY": v = process.env.GEMINI_API_KEY; break;
    case "WHOP_API_KEY": v = process.env.WHOP_API_KEY; break;
    case "WHOP_WEBHOOK_SECRET": v = process.env.WHOP_WEBHOOK_SECRET; break;
    case "RESEND_API_KEY": v = process.env.RESEND_API_KEY; break;
    case "SERPER_API_KEY": v = process.env.SERPER_API_KEY; break;
    default: v = process.env[name];
  }
  return Boolean(v && v.trim().length > 0);
}

export function getMissingRequiredVars(): { group: string; label: string; vars: string[] }[] {
  const missing: { group: string; label: string; vars: string[] }[] = [];
  for (const group of REQUIRED_VAR_GROUPS) {
    if (!group.required) continue;
    const missingVars = group.vars.filter((v) => !isSet(v));
    if (missingVars.length > 0) {
      missing.push({ group: group.key, label: group.label, vars: missingVars });
    }
  }
  return missing;
}

export function isAppConfigured(): boolean {
  return getMissingRequiredVars().length === 0;
}

export const integrations = {
  supabase: isSet("NEXT_PUBLIC_SUPABASE_URL") && isSet("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  gemini: isSet("GEMINI_API_KEY"),
  whop: isSet("WHOP_API_KEY"),
  resend: isSet("RESEND_API_KEY"),
  serper: isSet("SERPER_API_KEY"),
};

export const appConfig = {
  name: "Gradelys",
  tagline: "Your AI-powered learning workspace.",
  slogan: "Learn smarter. Not harder.",
  url: process.env.NEXT_PUBLIC_APP_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:3000"),
  supportEmail: "support@gradelys.com",
};

export const planLimits = {
  free: {
    label: "Free",
    price: 0,
    messagesTotal: 3,
    scansTotal: 1,
    studioTotal: 1,
    visualizeTotal: 0,
    quizAllowed: false,
    flashcardsAiAllowed: false,
    spaces: 1,
    sourcesPerSpace: 3,
    creditsMax: 1,
  },
  plus: {
    label: "Plus",
    priceMonthly: 9.99,
    priceAnnual: 83.99,
    scansPerMonth: 100,
    visualizePerMonth: 30,
    studioPerMonth: 20,
    slidesPerMonth: 10,
    spaces: 10,
    sourcesPerSpace: 20,
    creditsMax: 100,
  },
  pro: {
    label: "Pro",
    priceMonthly: 19.99,
    priceAnnual: 167.99,
    scansPerMonth: 300,
    visualizePerMonth: Infinity,
    studioPerMonth: Infinity,
    spaces: Infinity,
    sourcesPerSpace: Infinity,
    creditsMax: 300,
  },
} as const;

export const rechargePacks = [
  { id: "recharge-50", label: "+50 scans", price: 5.0 },
  { id: "recharge-200", label: "+200 scans", price: 15.0, badge: "Best value" },
  { id: "recharge-unlimited", label: "+Unlimited (1 month)", price: 24.99 },
];
