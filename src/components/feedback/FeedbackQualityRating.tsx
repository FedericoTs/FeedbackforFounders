import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackQualityRatingProps {
  feedbackId: string;
  onRate: (
    feedbackId: string,
    rating: number,
    comment: string,
  ) => Promise<void>;
  currentRating?: number;
  currentComment?: string;
  disabled?: boolean;
}

const FeedbackQualityRating: React.FC<FeedbackQualityRatingProps> = ({
  feedbackId,
  onRate,
  currentRating = 0,
  currentComment = "",
  disabled = false,
}) => {
  const [rating, setRating] = useState<number>(currentRating);
  const [comment, setComment] = useState<string>(currentComment);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRatingChange = (newRating: number) => {
    if (disabled) return;
    setRating(newRating);
  };

  const handleSubmit = async () => {
    if (disabled || rating === 0) return;

    setIsSubmitting(true);
    try {
      await onRate(feedbackId, rating, comment);
    } catch (error) {
      console.error("Error rating feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Rate Feedback Quality
        </label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={cn(
                "p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              )}
              onClick={() => handleRatingChange(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              disabled={disabled}
            >
              <Star
                className={cn(
                  "h-6 w-6",
                  (hoveredRating ? star <= hoveredRating : star <= rating)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-slate-300 dark:text-slate-600",
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
            {rating > 0 ? (
              <span>
                {rating === 1
                  ? "Poor"
                  : rating === 2
                    ? "Fair"
                    : rating === 3
                      ? "Good"
                      : rating === 4
                        ? "Very Good"
                        : "Excellent"}
              </span>
            ) : (
              "Select a rating"
            )}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Comment (Optional)
        </label>
        <Textarea
          placeholder="Add a comment about the quality of this feedback..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={disabled}
          className="min-h-[80px]"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={disabled || rating === 0 || isSubmitting}
        className="w-full"
      >
        {isSubmitting
          ? "Submitting..."
          : currentRating > 0
            ? "Update Rating"
            : "Submit Rating"}
      </Button>
    </div>
  );
};

export default FeedbackQualityRating;
