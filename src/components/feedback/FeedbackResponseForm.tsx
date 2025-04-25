import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

interface FeedbackResponseFormProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  initialContent?: string;
  isEditing?: boolean;
  placeholder?: string;
}

const FeedbackResponseForm: React.FC<FeedbackResponseFormProps> = ({
  onSubmit,
  onCancel,
  initialContent = "",
  isEditing = false,
  placeholder = "Write your response...",
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent(""); // Clear content after successful submission
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[100px] resize-none"
        disabled={isSubmitting}
      />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={!content.trim() || isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="h-4 w-4 mr-2" />
              {isEditing ? "Updating..." : "Submitting..."}
            </>
          ) : isEditing ? (
            "Update Response"
          ) : (
            "Submit Response"
          )}
        </Button>
      </div>
    </form>
  );
};

export default FeedbackResponseForm;
