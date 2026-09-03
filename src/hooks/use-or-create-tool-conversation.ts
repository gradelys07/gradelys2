"use client";

import * as React from "react";
import { useConversations, useCreateConversation } from "@/hooks/use-chat";
import type { ToolKind } from "@/components/space/tool-chat-thread";

export function useOrCreateToolConversation(kind: ToolKind | "chat", spaceId: string, title: string, forceNew = false) {
  const { data: conversations } = useConversations(kind as any, spaceId);
  const createConversation = useCreateConversation();
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const creatingRef = React.useRef(false);

  React.useEffect(() => {
    // If forceNew is true, we ignore existing conversations and immediately create a new one (only once per mount)
    if (forceNew && !conversationId && !creatingRef.current) {
      creatingRef.current = true;
      createConversation.mutateAsync({ spaceId, kind: kind as any, title }).then((res) => {
        setConversationId(res.conversation.id);
      });
      return;
    }

    if (!forceNew && conversations && conversations.length > 0) {
      setConversationId(conversations[0].id);
    } else if (!forceNew && conversations !== undefined && !conversationId && !creatingRef.current) {
      creatingRef.current = true;
      createConversation.mutateAsync({ spaceId, kind: kind as any, title }).then((res) => {
        setConversationId(res.conversation.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, spaceId, forceNew]);

  return conversationId;
}
