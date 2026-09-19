"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { nanoid } from "nanoid";

/**
 * This page acts as a bridge: it creates an empty presentation document,
 * then immediately redirects to the editor with the conversation context.
 * If there's a saved prompt, it's passed along for the editor chat to use.
 */
export default function PresentationBridgePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const spaceId = searchParams.get("spaceId");
  const [status, setStatus] = useState("Preparing your presentation...");

  useEffect(() => {
    async function createAndRedirect() {
      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
          setStatus("Authentication error");
          return;
        }

        // Create an empty presentation document
        const emptyPresentation = {
          metadata: { title: "New Presentation" },
          theme: {
            fontFamily: "Inter",
            primaryColor: "#1a1a2e",
            secondaryColor: "#6c63ff",
            backgroundColor: "#ffffff",
          },
          slides: [
            {
              id: nanoid(),
              layout: "title",
              background: { type: "solid", value: "#ffffff" },
              elements: [
                {
                  id: nanoid(),
                  type: "text",
                  x: 120,
                  y: 180,
                  width: 720,
                  height: 120,
                  rotation: 0,
                  zIndex: 1,
                  properties: {
                    content: "New Presentation",
                    fontSize: 44,
                    color: "#1a1a2e",
                    fontWeight: "bold",
                    alignment: "center",
                  },
                },
                {
                  id: nanoid(),
                  type: "text",
                  x: 200,
                  y: 320,
                  width: 560,
                  height: 60,
                  rotation: 0,
                  zIndex: 2,
                  properties: {
                    content: "Click on the chat to start editing with AI",
                    fontSize: 20,
                    color: "#666666",
                    alignment: "center",
                  },
                },
              ],
            },
          ],
        };

        const { data: docData, error } = await supabase
          .from("studio_documents")
          .insert({
            user_id: authData.user.id,
            type: "slides",
            title: "New Presentation",
            content: JSON.stringify(emptyPresentation),
            space_id: spaceId || null,
          })
          .select()
          .single();

        if (error || !docData) {
          setStatus("Failed to create presentation");
          console.error("Error creating presentation:", error);
          return;
        }

        // Build redirect URL with conversation context
        let redirectUrl = `/studio/documents/${docData.id}`;
        const params = new URLSearchParams();
        if (conversationId) params.set("conversationId", conversationId);
        if (spaceId) params.set("spaceId", spaceId);
        if (params.toString()) redirectUrl += `?${params.toString()}`;

        router.replace(redirectUrl);
      } catch (err: any) {
        setStatus("Error: " + (err.message || "Unknown error"));
      }
    }

    createAndRedirect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 min-h-[calc(100vh-64px)] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-gray-600 font-medium">{status}</p>
    </div>
  );
}
