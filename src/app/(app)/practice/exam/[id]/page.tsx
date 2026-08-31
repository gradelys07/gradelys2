import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/route-helpers";
import { ExamPaper } from "@/components/practice/exam-paper";
import type { Exam } from "@/types";

export const dynamic = "force-dynamic";

export default async function ExamPage({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser();
  if (!user) return null;

  const { data: examData, error } = await supabase
    .from("exams")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !examData) {
    notFound();
  }

  const exam: Exam = {
    id: examData.id,
    userId: examData.user_id,
    spaceId: examData.space_id,
    subject: examData.subject,
    format: examData.format,
    difficulty: examData.difficulty,
    duration: examData.duration,
    totalPoints: examData.total_points,
    contentJson: examData.content_json,
    createdAt: examData.created_at,
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl py-8 px-4 sm:px-6">
          <ExamPaper exam={exam} />
        </div>
      </main>
    </div>
  );
}
