import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Send, Camera } from "lucide-react";

interface FeedbackFormProps {
  selectedElement: {
    selector: string;
    xpath: string;
    elementType: string;
    dimensions: { width: number; height: number; top: number; left: number };
  } | null;
  onClose: () => void;
  onSubmit: (feedback: {
    elementSelector: string;
    elementXPath: string;
    content: string;
    category: string;
    subcategory: string;
    severity: number;
    metadata: Record<string, any>;
  }) => void;
}

const CATEGORIES = {
  "UI Design": [
    "Color & Contrast",
    "Typography",
    "Layout",
    "Visual Hierarchy",
    "Consistency",
    "Responsiveness",
  ],
  "UX Flow": [
    "Navigation",
    "User Journey",
    "Intuitiveness",
    "Efficiency",
    "Learnability",
    "Error Prevention",
  ],
  Content: [
    "Clarity",
    "Grammar & Spelling",
    "Tone & Voice",
    "Completeness",
    "Relevance",
    "Localization",
  ],
  Functionality: [
    "Bugs",
    "Performance",
    "Feature Request",
    "Browser Compatibility",
    "Form Validation",
  ],
  Performance: [
    "Loading Speed",
    "Responsiveness",
    "Resource Usage",
    "Animation Smoothness",
    "Network Efficiency",
  ],
  Accessibility: [
    "Screen Reader Support",
    "Keyboard Navigation",
    "Color Contrast",
    "Text Sizing",
    "Alternative Text",
    "ARIA Attributes",
  ],
  "Business Logic": [
    "Process Flow",
    "Business Rules",
    "Edge Cases",
    "Integration Points",
    "Data Validation",
  ],
  General: ["Suggestion", "Question", "Praise", "Concern", "Other"],
};

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  selectedElement,
  onClose,
  onSubmit,
}) => {
  const [feedback, setFeedback] = useState({
    content: "",
    category: "",
    subcategory: "",
    severity: 3,
  });
  const [charCount, setCharCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setFeedback({ ...feedback, content });
    setCharCount(content.length);
  };

  const handleCategoryChange = (category: string) => {
    setFeedback({ ...feedback, category, subcategory: "" });
  };

  const handleSubcategoryChange = (subcategory: string) => {
    setFeedback({ ...feedback, subcategory });
  };

  const handleSeverityChange = (severity: string) => {
    setFeedback({ ...feedback, severity: parseInt(severity) });
  };

  const handleSubmit = async () => {
    if (!selectedElement) return;
    if (!feedback.content || feedback.content.length < 30) {
      // Show error
      return;
    }

    setIsSubmitting(true);

    try {
      // Get browser and device info
      const metadata = {
        browser: navigator.userAgent,
        device: /Mobile|Android|iPhone/i.test(navigator.userAgent)
          ? "Mobile"
          : "Desktop",
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
      };

      await onSubmit({
        elementSelector: selectedElement.selector,
        elementXPath: selectedElement.xpath,
        content: feedback.content,
        category: feedback.category,
        subcategory: feedback.subcategory,
        severity: feedback.severity,
        metadata,
      });

      // Reset form
      setFeedback({
        content: "",
        category: "",
        subcategory: "",
        severity: 3,
      });
      setCharCount(0);
      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedElement) return null;

  return (
    <div className="fixed right-0 top-14 bottom-0 w-96 bg-white dark:bg-slate-900 shadow-lg border-l border-slate-200 dark:border-slate-800 z-40 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Provide Feedback</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4">
          <Badge className="mb-2">{selectedElement.elementType}</Badge>
          <div className="text-sm text-slate-500 dark:text-slate-400 break-all">
            {selectedElement.selector}
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div>
            <Label htmlFor="feedback-content" className="mb-2 block">
              Your Feedback <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="feedback-content"
              placeholder="Describe what you think about this element. Be specific and constructive."
              className="min-h-[120px]"
              value={feedback.content}
              onChange={handleContentChange}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>
                {charCount < 30 ? (
                  <span className="text-amber-500">
                    Minimum 30 characters ({30 - charCount} more needed)
                  </span>
                ) : (
                  <span className="text-green-500">Looks good!</span>
                )}
              </span>
              <span>{charCount}/2000</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category" className="mb-2 block">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={feedback.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CATEGORIES).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subcategory" className="mb-2 block">
                Subcategory
              </Label>
              <Select
                value={feedback.subcategory}
                onValueChange={handleSubcategoryChange}
                disabled={!feedback.category}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {feedback.category &&
                    CATEGORIES[
                      feedback.category as keyof typeof CATEGORIES
                    ].map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="severity" className="mb-2 block">
              Severity/Priority
            </Label>
            <Select
              value={feedback.severity.toString()}
              onValueChange={handleSeverityChange}
            >
              <SelectTrigger id="severity">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  1 - Minor suggestion (cosmetic)
                </SelectItem>
                <SelectItem value="2">
                  2 - Minor improvement (small enhancement)
                </SelectItem>
                <SelectItem value="3">
                  3 - Moderate issue (affects some users)
                </SelectItem>
                <SelectItem value="4">
                  4 - Major issue (affects many users)
                </SelectItem>
                <SelectItem value="5">
                  5 - Critical issue (breaks functionality)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4">
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !feedback.content ||
                feedback.content.length < 30 ||
                !feedback.category
              }
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Submit Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
