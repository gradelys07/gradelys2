import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/route-helpers";
import { LearningProfile } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { supabase, user, response } = await requireUser();
    if (response) return response;

    const body = await req.json();
    const { name, age, role, level, specialty, difficulties, interests } = body;

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Fetch existing profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("learning_profile, name")
      .eq("id", user!.id)
      .single();

    const lp: LearningProfile = {
      ...(profile?.learning_profile || {}),
      interactions: profile?.learning_profile?.interactions || 0,
      fastResponses: profile?.learning_profile?.fastResponses || 0,
      slowResponses: profile?.learning_profile?.slowResponses || 0,
      successByHour: profile?.learning_profile?.successByHour || {},
      formatPreference: profile?.learning_profile?.formatPreference || { flashcard: 0, quiz: 0, explain: 0 },
      recurringWeaknesses: profile?.learning_profile?.recurringWeaknesses || [],
      analogyReaction: profile?.learning_profile?.analogyReaction || { positive: 0, negative: 0, neutral: 0 },
    };

    // Format the new detailed description
    let newDescription = `L'utilisateur se fait appeler ${name || profile?.name || "l'utilisateur"}.`;
    if (age) {
      newDescription += ` Il/Elle a ${age} ans.`;
    }
    newDescription += ` Il/Elle est un(e) ${role}.`;
    
    if (role === "Étudiant" && level) {
      newDescription += ` Niveau d'études : ${level}.`;
    }
    if (specialty) {
      if (role === "Étudiant") newDescription += ` Filière/Spécialité : ${specialty}.`;
      else if (role === "Professeur") newDescription += ` Matière enseignée : ${specialty}.`;
      else if (role === "Professionnel") newDescription += ` Domaine professionnel : ${specialty}.`;
      else newDescription += ` Situation : ${specialty}.`;
    }
    if (difficulties) {
      newDescription += ` Ses principales difficultés : ${difficulties}.`;
    }
    if (interests) {
      newDescription += ` Ses centres d'intérêts : ${interests}.`;
    }

    // Append to existing if any, though usually it's empty at onboarding
    if (lp.detailedDescription) {
       lp.detailedDescription = newDescription + "\n\n" + lp.detailedDescription;
    } else {
       lp.detailedDescription = newDescription;
    }
    lp.onboardingCompleted = true;

    // Update both learning_profile and potentially the name if changed
    const updateData: any = { learning_profile: lp };
    if (name && name !== profile?.name) {
      updateData.name = name;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user!.id);

    if (error) throw error;

    return NextResponse.json({ success: true, learning_profile: lp, name: name || profile?.name });
  } catch (error: any) {
    console.error("[Onboarding API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
