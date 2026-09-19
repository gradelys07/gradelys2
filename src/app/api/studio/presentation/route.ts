import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";
import { generatePresentationStream } from "@/lib/gemini/presentation-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { topic, context } = await req.json().catch(() => ({}));
  if (!topic) return errorResponse("topic is required");

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = generatePresentationStream(topic, context);
        for await (const event of generator) {
          const data = JSON.stringify(event);
          controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        }
        controller.close();
      } catch (err: any) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
