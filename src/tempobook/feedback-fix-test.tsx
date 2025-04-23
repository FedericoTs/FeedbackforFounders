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

const FeedbackFixTest = () => {
  const { toast } = useToast();
  const [feedbackText, setFeedbackText] = useState("");
  const [category, setCategory] = useState("UI Design");
  const [rating, setRating] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

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
    setResult(null);

    try {
      // Use sample project ID and user ID
      const mockProjectId = "sample-1";
      const mockUserId = "test-user-id";
      const mockSectionId = "test-section";

      const submission = {
        projectId: mockProjectId,
        userId: mockUserId,
        sectionId: mockSectionId,
        sectionName: "Test Section",
        sectionType: "Component",
        content: feedbackText,
        category: category,
        rating: rating,
        elementSelector: null, // Test with null element selector
      };

      console.log("Submitting feedback:", submission);
      const result = await feedbackService.submitFeedback(submission);
      console.log("Submission result:", result);

      setResult(result);

      if (result.success) {
        toast({
          title: "Success",
          description: "Feedback submitted successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to submit feedback",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setResult({ success: false, error: String(error) });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error),
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
          Feedback Submission Fix Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="feedback">Your Feedback</Label>
          <Textarea
            id="feedback"
            placeholder="Enter your feedback here"
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

        {result && (
          <div
            className={`mt-6 p-4 rounded-lg ${result.success ? "bg-green-50" : "bg-red-50"}`}
          >
            <h3 className="text-lg font-medium mb-2">Submission Result</h3>
            <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackFixTest;
