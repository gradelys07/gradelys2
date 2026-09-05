import { Resend } from "resend";

function getClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured — email sending is unavailable.");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = `${process.env.RESEND_FROM_NAME || "Gradelys"} <${
  process.env.RESEND_FROM_EMAIL || "noreply@gradelys.com"
}>`;

async function send(to: string, subject: string, html: string) {
  const client = getClient();
  return client.emails.send({ from: FROM, to, subject, html });
}

const wrapper = (title: string, body: string) => `
<div style="font-family:-apple-system,Inter,sans-serif;background:#F8FAFC;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;padding:32px;">
    <div style="font-size:20px;font-weight:700;color:#334155;margin-bottom:4px;">Gradelys</div>
    <div style="height:1px;background:#E2E8F0;margin:16px 0 24px;"></div>
    <h1 style="font-size:20px;color:#334155;margin:0 0 16px;">${title}</h1>
    <div style="font-size:14px;line-height:1.6;color:#64748B;">${body}</div>
  </div>
</div>`;

export const emails = {
  welcome: (to: string, name: string) =>
    send(
      to,
      "Welcome to Gradelys 🎓",
      wrapper(
        `Welcome, ${name}!`,
        `Your account is ready. You've got 3 free scans and unlimited AI chat to get started. Jump back in and turn your first document into a study plan.`
      )
    ),
  passwordReset: (to: string, resetLink: string) =>
    send(
      to,
      "Reset your Gradelys password",
      wrapper(
        "Reset your password",
        `We received a request to reset your password. This link expires in 1 hour.<br/><br/><a href="${resetLink}" style="color:#0EA5E9;">Reset password →</a>`
      )
    ),
  subscriptionConfirmed: (to: string, plan: string) =>
    send(
      to,
      `You're now on Gradelys ${plan} 🚀`,
      wrapper(
        `Welcome to ${plan}`,
        `Your subscription is active. Your new credits and features are available immediately in your dashboard.`
      )
    ),
  weeklyDigest: (to: string, stats: { streak: number; cardsReviewed: number }) =>
    send(
      to,
      "Your week on Gradelys",
      wrapper(
        "Your weekly recap",
        `🔥 ${stats.streak}-day streak · 🃏 ${stats.cardsReviewed} flashcards reviewed. Keep the momentum going!`
      )
    ),
  lowCredits: (to: string, remaining: number) =>
    send(
      to,
      "You're running low on scan credits",
      wrapper(
        "Low on credits",
        `You have ${remaining} scan credits left this month. Upgrade or recharge to keep scanning without interruption.`
      )
    ),
};
