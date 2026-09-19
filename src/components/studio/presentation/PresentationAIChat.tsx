import React, { useState, useRef, useEffect } from "react";
import { usePresentationStore } from "./store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Wand2, X } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function PresentationAIChat({ onClose }: { onClose: () => void }) {
  const { document, setDocument, activeSlideId, updateSlide, updateTheme } = usePresentationStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Strip massive base64 strings to avoid 413 Payload Too Large and Gemini context limits
      let cleanDocument = document;
      if (document) {
        const docString = JSON.stringify(document);
        // Regex to match base64 data URIs and replace them with a placeholder (catch both src and url properties)
        const cleanedString = docString.replace(/("(?:src|url)":\s*"data:image\/[^;]+;base64,)[^"]+(")/g, '$1[BASE64_IMAGE_DATA]$2');
        cleanDocument = JSON.parse(cleanedString);
      }

      const res = await fetch("/api/studio/presentation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          presentation: cleanDocument,
          activeSlideId
        })
      });

      if (!res.ok) throw new Error("Failed to communicate with AI");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullAssistantResponse = "";
      
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.error) throw new Error(data.error);
              if (data.chunk) {
                fullAssistantResponse += data.chunk;
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = fullAssistantResponse;
                  return newMsgs;
                });
              }
            } catch (e) {
              // ignore parse errors for partial chunks
            }
          }
        }
      }

      // Check if the AI returned modification blocks
      const jsonMatch = fullAssistantResponse.match(/\`\`\`json_presentation\n([\s\S]*?)\n\`\`\`/);
      const slideMatch = fullAssistantResponse.match(/\`\`\`json_slide_update\n([\s\S]*?)\n\`\`\`/);
      const themeMatch = fullAssistantResponse.match(/\`\`\`json_theme_update\n([\s\S]*?)\n\`\`\`/);

      if (slideMatch && slideMatch[1]) {
        try {
          const updatedData = JSON.parse(slideMatch[1]);
          const slidesToUpdate = Array.isArray(updatedData) ? updatedData : [updatedData];
          let updatedCount = 0;

          slidesToUpdate.forEach((updatedSlide: any) => {
            if (updatedSlide && updatedSlide.id) {
              // Restore any stripped base64 images
              if (document && document.slides) {
                if (updatedSlide.elements) {
                  updatedSlide.elements.forEach((element: any) => {
                    const hasBase64Src = element.properties?.src?.includes("[BASE64_IMAGE_DATA]");
                    const hasBase64Url = element.properties?.url?.includes("[BASE64_IMAGE_DATA]");
                    
                    if (element.type === "image" && (hasBase64Src || hasBase64Url)) {
                      for (const oldSlide of document.slides) {
                        const oldElement = oldSlide.elements?.find((e: any) => e.id === element.id);
                        if (oldElement && oldElement.type === "image") {
                          if (hasBase64Src && oldElement.properties.src) {
                            element.properties.src = oldElement.properties.src;
                          }
                          if (hasBase64Url && oldElement.properties.url) {
                            element.properties.url = oldElement.properties.url;
                          }
                          break;
                        }
                      }
                    }
                  });
                }
              }
              updateSlide(updatedSlide.id, updatedSlide);
              updatedCount++;
            }
          });
          
          if (updatedCount > 0) {
            toast.success("AI a mis à jour la diapositive !");
          }
        } catch (e) {
          console.error("Failed to parse AI slide update", e);
          toast.error("Données de diapositive invalides générées par l'IA.");
        }
      }

      if (themeMatch && themeMatch[1]) {
        try {
          const updatedTheme = JSON.parse(themeMatch[1]);
          updateTheme(updatedTheme);
          toast.success("Thème mis à jour !");
        } catch (e) {
          console.error("Failed to parse AI theme update", e);
          toast.error("Données de thème invalides générées par l'IA.");
        }
      }

      if (jsonMatch && jsonMatch[1]) {
        try {
          const updatedDoc = JSON.parse(jsonMatch[1]);
          if (updatedDoc && updatedDoc.slides) {
            
            // Restore any stripped base64 images
            if (document && document.slides) {
              updatedDoc.slides.forEach((slide: any) => {
                if (slide.elements) {
                  slide.elements.forEach((element: any) => {
                    const hasBase64Src = element.properties?.src?.includes("[BASE64_IMAGE_DATA]");
                    const hasBase64Url = element.properties?.url?.includes("[BASE64_IMAGE_DATA]");
                    
                    if (element.type === "image" && (hasBase64Src || hasBase64Url)) {
                      // Find original element to restore src
                      for (const oldSlide of document.slides) {
                        const oldElement = oldSlide.elements?.find((e: any) => e.id === element.id);
                        if (oldElement && oldElement.type === "image") {
                          if (hasBase64Src && oldElement.properties.src) {
                            element.properties.src = oldElement.properties.src;
                          }
                          if (hasBase64Url && oldElement.properties.url) {
                            element.properties.url = oldElement.properties.url;
                          }
                          break;
                        }
                      }
                    }
                  });
                }
              });
            }

            setDocument(updatedDoc);
            toast.success("La présentation entière a été régénérée !");
          }
        } catch (e) {
          console.error("Failed to parse AI presentation modification", e);
          toast.error("L'IA a tenté de modifier la présentation mais a généré des données invalides.");
        }
      }

    } catch (err: any) {
      toast.error(err.message || "Failed to communicate with Copilot");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-80 border-l bg-white flex flex-col shrink-0 relative z-20 shadow-xl">
      <div className="p-3 border-b bg-purple-50 flex justify-between items-center shrink-0">
        <span className="font-semibold text-sm text-purple-900 flex items-center gap-2">
          <Wand2 className="h-4 w-4" /> Gradelys AI
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-10">
            <Wand2 className="h-8 w-8 mx-auto text-purple-200 mb-3" />
            <p>I am Gradelys AI.</p>
            <p className="mt-2 text-xs">Ask me to add slides, change the layout, rewrite text, or find images online!</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div 
              className={`max-w-[90%] p-3 rounded-2xl ${
                m.role === "user" 
                  ? "bg-purple-600 text-white rounded-br-sm" 
                  : "bg-gray-100 text-gray-900 rounded-bl-sm"
              }`}
            >
              {m.role === "user" ? (
                <p className="text-sm">{m.content}</p>
              ) : (
                <div className="text-sm prose prose-sm prose-purple max-w-none">
                  <Markdown content={m.content.replace(/\`\`\`json_(presentation|slide_update|theme_update)\n[\s\S]*?\n\`\`\`/g, "*(Applied presentation modifications)*")} />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              <span className="text-xs text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask AI to modify..."
            className="flex-1 text-sm rounded-full"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full shrink-0 bg-purple-600 hover:bg-purple-700" 
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
