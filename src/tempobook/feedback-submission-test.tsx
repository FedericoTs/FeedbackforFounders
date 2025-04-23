import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Star, Send } from "lucide-react";
import { feedbackService } from "@/services/feedback";
import { useToast } from "@/components/ui/use-toast";
import FeedbackQualityIndicator from "@/components/FeedbackQualityIndicator";

const FeedbackSubmissionTest = () => {
  const { toast } = useToast();
  const [feedbackText, setFeedbackText] = useState("");
  const [category, setCategory] = useState("UI Design");
  const [rating, setRating] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qualityMetrics, setQualityMetrics] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(null);

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Error",
        description: "Please enter feedback text",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use real project ID from sample projects and current user ID if available
      const mockProjectId = "sample-1";
      const mockUserId = "test-user-id";
      const mockSectionId = "navigation";

      const result = await feedbackService.submitFeedback({
        projectId: mockProjectId,
        userId: mockUserId,
        sectionId: mockSectionId,
        sectionName: "Test Section",
        sectionType: "Component",
        content: feedbackText,
        category: category,
        rating: rating, // Include rating in the submission
        pageUrl: "https://example.com/test-page", // Include page URL for testing
        quickReactions: {}, // Add empty quick reactions object
      });

      if (result.success) {
        toast({
          title: "Feedback Submitted",
          description: `Successfully submitted feedback and earned ${result.points} points!`,
          variant: "default",
        });

        setQualityMetrics(result.qualityMetrics);
        setPointsEarned(result.points);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to submit feedback",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Feedback Submission Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="feedback">Your Feedback</Label>
          <Textarea
            id="feedback"
            placeholder="Enter your feedback here. Try to be specific, actionable, and provide novel insights for better quality scores."
            className="min-h-32"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UI Design">UI Design</SelectItem>
                <SelectItem value="User Experience">User Experience</SelectItem>
                <SelectItem value="Content">Content</SelectItem>
                <SelectItem value="Functionality">Functionality</SelectItem>
                <SelectItem value="Performance">Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !feedbackText.trim()}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" /> Submit Feedback
            </>
          )}
        </Button>

        {qualityMetrics && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">
              Feedback Quality Analysis
            </h3>
            <FeedbackQualityIndicator metrics={qualityMetrics} />
            {pointsEarned && (
              <div className="mt-4 text-center">
                <span className="text-amber-600 font-semibold text-lg">
                  +{pointsEarned} points earned!
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackSubmissionTest;
