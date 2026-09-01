// ═══════════════════════════════════════════════════════════════
// WHOP PIXEL — centralized tracking helper
// All Whop event calls go through this module so tracking is
// type-safe and changes only need to happen in one place.
// ═══════════════════════════════════════════════════════════════

declare global {
  interface Window {
    whop?: {
      track: (event: string, params?: Record<string, any>) => void;
      setScope: (...scopes: string[]) => void;
      scope: (...scopes: string[]) => { track: (event: string, params?: Record<string, any>) => void };
    };
  }
}

function track(event: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.whop) {
    window.whop.track(event, params);
  }
}

// ── Standard Whop Events ─────────────────────────────────────

/** Landing page, pricing page, about page, etc. */
export function trackViewContent(page: string) {
  track("view_content", { page });
}

/** User shows buying intent (visits signup, clicks "Get Started"). */
export function trackLead(source: string) {
  track("lead", { source });
}

/** Successful account creation. */
export function trackCompleteRegistration(method: string) {
  track("complete_registration", { method });
}

// ── Funnel / Conversion Events ───────────────────────────────

/** User views the pricing page. */
export function trackViewPricing(plan?: string) {
  track("view_pricing", { plan });
}

/** User clicks "Upgrade" — enters checkout flow. */
export function trackInitiateCheckout(plan: string, interval: string) {
  track("initiate_checkout", { plan, interval });
}

/** Successful payment (called from webhook or post-checkout). */
export function trackPurchase(plan: string, value?: number) {
  track("purchase", { plan, value });
}

// ── Feature Engagement Events ────────────────────────────────

/** User sends a chat message. */
export function trackChatSent(model: string) {
  track("chat_sent", { model });
}

/** User uploads a document scan. */
export function trackScanUploaded(subject: string) {
  track("scan_uploaded", { subject });
}

/** User creates a flashcard deck. */
export function trackFlashcardsCreated(count?: number) {
  track("flashcards_created", { count });
}

/** User completes a quiz or practice session. */
export function trackQuizCompleted(score?: number) {
  track("quiz_completed", { score });
}

/** User creates a visualization. */
export function trackVisualizationCreated(type: string) {
  track("visualization_created", { type });
}

/** User creates a Studio document. */
export function trackStudioDocCreated(type: string) {
  track("studio_doc_created", { type });
}

/** User creates a new Space. */
export function trackSpaceCreated() {
  track("space_created");
}

/** User creates / saves a note. */
export function trackNoteSaved() {
  track("note_saved");
}

/** User shares content (copy to clipboard, export, etc.). */
export function trackShare(contentType: string) {
  track("share", { content_type: contentType });
}

/** User hits the free plan limit (upsell opportunity). */
export function trackHitLimit(feature: string) {
  track("hit_limit", { feature });
}

/** User clicks an upgrade CTA anywhere in the app. */
export function trackClickUpgrade(location: string) {
  track("click_upgrade", { location });
}
