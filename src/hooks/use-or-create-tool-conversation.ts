"use client";

import * as React from "react";
import { useConversations, useCreateConversation } from "@/hooks/use-chat";
import type { ToolKind } from "@/components/space/tool-chat-thread";

export function useOrCreateToolConversation(kind: ToolKind | "chat", spaceId: string, title: string) {
  const { data: conversations } = useConversations(kind as any, spaceId);
  const createConversation = useCreateConversation();
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const creatingRef = React.useRef(false);

  React.useEffect(() => {
    if (conversations && conversations.length > 0) {
      setConversationId(conversations[0].id);
    } else if (conversations !== undefined && !conversationId && !creatingRef.current) {
      creatingRef.current = true;
      createConversation.mutateAsync({ spaceId, kind: kind as any, title }).then((res) => {
        setConversationId(res.conversation.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, spaceId]);

  return conversationId;
}
