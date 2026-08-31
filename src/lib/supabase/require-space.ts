import { errorResponse } from "@/lib/supabase/route-helpers";

/**
 * Practice, Visualize, and Studio are all scoped to a Space and require at
 * least one ready source in that space — this mirrors the product decision
 * that these tools only make sense grounded in real material.
 */
export async function requireSpaceWithSource(supabase: any, userId: string, spaceId: string | undefined) {
  if (!spaceId) {
    return { ok: false as const, response: errorResponse("spaceId is required — select a space first.", 400) };
  }

  const { data: space } = await supabase
    .from("spaces")
    .select("id, user_id")
    .eq("id", spaceId)
    .eq("user_id", userId)
    .single();

  if (!space) {
    return { ok: false as const, response: errorResponse("Space not found", 404) };
  }

  const { count } = await supabase
    .from("space_sources")
    .select("id", { count: "exact", head: true })
    .eq("space_id", spaceId)
    .eq("status", "ready");

  if (!count || count === 0) {
    return {
      ok: false as const,
      response: errorResponse("Add at least one source to this space before generating content.", 400),
    };
  }

  return { ok: true as const, response: null };
}
