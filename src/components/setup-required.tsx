import { AlertTriangle, GraduationCap, Terminal } from "lucide-react";
import type { getMissingRequiredVars } from "@/lib/config";

export function SetupRequired({
  missing,
}: {
  missing: ReturnType<typeof getMissingRequiredVars>;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#8b5cf6]">
            <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-[#334155]">Gradelys</span>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-8">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[rgba(239,68,68,0.1)]">
              <AlertTriangle className="h-4.5 w-4.5 text-[#EF4444]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#334155]">Configuration required</h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[#64748B]">
                Gradelys has no demo mode — it needs real credentials to run. Add the
                missing environment variables below to <code className="rounded bg-[#E2E8F0] px-1.5 py-0.5 text-[#0EA5E9]">.env.local</code> and
                restart the server.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {missing.map((group) => (
              <div key={group.group} className="rounded-lg border border-[#E2E8F0] bg-white p-4">
                <div className="text-sm font-medium text-[#334155]">{group.label}</div>
                <div className="mt-2 space-y-1.5">
                  {group.vars.map((v) => (
                    <div
                      key={v}
                      className="flex items-center gap-2 rounded-md bg-[#F1F5F9] px-3 py-2 font-mono text-xs text-[#F59E0B]"
                    >
                      <Terminal className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
                      {v}=
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-[#E2E8F0] bg-white p-4 text-sm text-[#64748B]">
            <p>
              1. Copy <code className="rounded bg-[#E2E8F0] px-1.5 py-0.5 text-[#0EA5E9]">.env.example</code> to{" "}
              <code className="rounded bg-[#E2E8F0] px-1.5 py-0.5 text-[#0EA5E9]">.env.local</code>
            </p>
            <p className="mt-1.5">2. Create a free project at <code className="rounded bg-[#E2E8F0] px-1.5 py-0.5 text-[#0EA5E9]">supabase.com</code> and paste its URL + keys</p>
            <p className="mt-1.5">3. Get a Gemini API key at <code className="rounded bg-[#E2E8F0] px-1.5 py-0.5 text-[#0EA5E9]">aistudio.google.com/apikey</code></p>
            <p className="mt-1.5">4. Run the SQL in <code className="rounded bg-[#E2E8F0] px-1.5 py-0.5 text-[#0EA5E9]">supabase/schema.sql</code> against your project</p>
            <p className="mt-1.5">5. (Optional) Configure Whop for payments — see the README's "Configuring Whop" section</p>
            <p className="mt-1.5">6. Restart the dev server — full setup steps are in <code className="rounded bg-[#E2E8F0] px-1.5 py-0.5 text-[#0EA5E9]">README.md</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
