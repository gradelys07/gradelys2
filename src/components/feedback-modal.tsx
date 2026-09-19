"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, MessageSquareHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [message, setMessage] = React.useState("");
  const [teamMessage, setTeamMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please leave a message.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          message: message.trim(),
          team_message: teamMessage.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit feedback");
      }

      toast.success("Thank you for your feedback!");
      onOpenChange(false);
      
      // Reset form
      setTimeout(() => {
        setRating(0);
        setMessage("");
        setTeamMessage("");
      }, 300);
    } catch (err) {
      toast.error("An error occurred while submitting feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Share your feedback">
      <form onSubmit={handleSubmit} className="p-5">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    star <= (hoverRating || rating)
                      ? "fill-yellow text-yellow"
                      : "text-border hover:text-yellow/50"
                  )}
                />
              </button>
            ))}
          </div>
          <span className="text-label-md text-text-muted">
            {rating === 0 ? "Select a rating" : `You rated it ${rating} star${rating > 1 ? "s" : ""}`}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-label-md font-medium text-text-secondary">
              What do you think? <span className="text-red">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you love or what could be better..."
              required
              className="min-h-[100px] w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-text-primary placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-label-md font-medium text-text-secondary">
              <MessageSquareHeart className="h-4 w-4" /> Message for the team (Optional)
            </label>
            <textarea
              value={teamMessage}
              onChange={(e) => setTeamMessage(e.target.value)}
              placeholder="Any specific feature requests or improvements?"
              className="min-h-[80px] w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-text-primary placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || rating === 0 || !message.trim()}>
            {isSubmitting ? "Sending..." : "Send Feedback"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
