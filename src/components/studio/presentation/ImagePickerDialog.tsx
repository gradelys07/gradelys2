import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import React, { useState, useRef } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, Link as LinkIcon } from "lucide-react";

interface ImagePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageSelect: (url: string) => void;
}

export function ImagePickerDialog({ open, onOpenChange, onImageSelect }: ImagePickerDialogProps) {
  const [activeTab, setActiveTab] = useState("link");
  const [url, setUrl] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onImageSelect(url.trim());
      onOpenChange(false);
      setUrl("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: Size check (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      // Downscale and compress image to avoid massive JSON payloads (413 errors)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to WebP or JPEG
        const compressedBase64 = canvas.toDataURL("image/webp", 0.7);
        onImageSelect(compressedBase64);
        onOpenChange(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      // Use pollinations.ai for instant image generation
      const encodedPrompt = encodeURIComponent(aiPrompt.trim());
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&width=1280&height=720`;
      
      // We can directly pass the URL since it generates on the fly when requested
      onImageSelect(imageUrl);
      onOpenChange(false);
      setAiPrompt("");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Add Image">
      <div className="p-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link"><LinkIcon className="h-4 w-4 mr-2" /> Link</TabsTrigger>
            <TabsTrigger value="upload"><UploadCloud className="h-4 w-4 mr-2" /> Upload</TabsTrigger>
            <TabsTrigger value="ai"><Sparkles className="h-4 w-4 mr-2" /> AI</TabsTrigger>
          </TabsList>

          {/* LINK TAB */}
          <TabsContent value="link">
            <form onSubmit={handleUrlSubmit} className="space-y-4 pt-4">
              <Input
                placeholder="https://example.com/image.jpg"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">Add Image</Button>
            </form>
          </TabsContent>

          {/* UPLOAD TAB */}
          <TabsContent value="upload">
            <div className="space-y-4 pt-4">
              <div 
                className="border-2 border-dashed border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-purple-300 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-10 w-10 mb-3 text-gray-400" />
                <p className="text-sm font-medium">Click to upload image</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>
          </TabsContent>

          {/* AI TAB */}
          <TabsContent value="ai">
            <form onSubmit={handleAIGenerate} className="space-y-4 pt-4">
              <p className="text-xs text-gray-500">Describe the image you want. Our AI will generate it instantly.</p>
              <Input
                placeholder="e.g. A futuristic city in 2026, cyberpunk style"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                required
              />
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isGenerating}>
                {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : "Generate & Add"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </Dialog>
  );
}
