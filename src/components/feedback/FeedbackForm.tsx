import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Send, X, AlertCircle } from "lucide-react";
import { ProjectSection } from "./ProjectSectionMap";

interface FeedbackFormProps {
  section: ProjectSection | null;
  onSubmit: (feedback: {
    content: string;
    rating: number;
    category: string;
    elementSelector?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  existingFeedback?: Array<{
    category: string;
    user: { name: string };
  }>;
  currentUser?: { name?: string } | null;
}

const FEEDBACK_CATEGORIES = [
  { id: "ui", label: "UI Design", color: "bg-blue-100 text-blue-700" },
  {
    id: "ux",
    label: "User Experience",
    color: "bg-purple-100 text-purple-700",
  },
  { id: "content", label: "Content", color: "bg-amber-100 text-amber-700" },
  {
    id: "functionality",
    label: "Functionality",
    color: "bg-green-100 text-green-700",
  },
  {
    id: "performance",
    label: "Performance",
    color: "bg-rose-100 text-rose-700",
  },
];

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  section,
  onSubmit,
  onCancel,
  isSubmitting,
  existingFeedback = [],
  currentUser = null,
}) => {
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(4);
  const [selectedCategory, setSelectedCategory] = useState(
    FEEDBACK_CATEGORIES[0].id,
  );

  // Check which categories the current user has already provided feedback for
  React.useEffect(() => {
    if (section && existingFeedback.length > 0 && currentUser) {
      const userName = currentUser.name || "Anonymous";
      const userFeedbackCategories = existingFeedback
        .filter((f) => f.user.name === userName && f.category)
        .map((f) => f.category);

      setDisabledCategories(userFeedbackCategories);

      // If the currently selected category is disabled, select the first available one
      if (userFeedbackCategories.includes(selectedCategory)) {
        const availableCategories = FEEDBACK_CATEGORIES.filter(
          (cat) => !userFeedbackCategories.includes(cat.id),
        ).map((cat) => cat.id);

        if (availableCategories.length > 0) {
          setSelectedCategory(availableCategories[0]);
        }
      }
    }
  }, [section, existingFeedback, currentUser, selectedCategory]);

  const handleSubmit = async () => {
    await onSubmit({
      content: feedbackText,
      rating,
      category: selectedCategory,
      elementSelector: section?.elementSelector || null,
    });

    // Reset form
    setFeedbackText("");
    setRating(4);
    setSelectedCategory(FEEDBACK_CATEGORIES[0].id);
  };

  return (
    <div className="p-4 h-full overflow-auto">
      {!section ? (
        <div className="text-center py-6">
          <p className="text-slate-500 dark:text-slate-400">
            Select a section to provide feedback
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">
              Feedback for {section.name}
            </h3>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                What do you think about this {section.type.toLowerCase()}?
              </label>
              <Textarea
                placeholder={`Provide specific, constructive feedback about this ${section.type.toLowerCase()}. What works well? What could be improved?`}
                className="min-h-24"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_CATEGORIES.map((category) => {
                  const isDisabled = disabledCategories.includes(category.id);
                  return (
                    <Badge
                      key={category.id}
                      className={`${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${selectedCategory === category.id ? category.color : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
                      onClick={() =>
                        !isDisabled && setSelectedCategory(category.id)
                      }
                    >
                      {category.label}
                      {isDisabled && (
                        <AlertCircle
                          className="h-3 w-3 ml-1"
                          title="You've already provided feedback in this category"
                        />
                      )}
                    </Badge>
                  );
                })}
              </div>
              {disabledCategories.length > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  You can only provide one feedback per section per category
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Additional Categories (Optional)
              </label>
              <FeedbackCategorySelector
                selectedCategories={customCategories}
                availableCategories={availableCategories}
                suggestedCategories={suggestedCategories}
                onCategoriesChange={setCustomCategories}
                onCreateCategory={(category) =>
                  feedbackCategoriesService.createCategory(category)
                }
                maxCategories={5}
              />
              <p className="text-xs text-slate-500 mt-1">
                Add more specific categories to help organize your feedback
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Rating
              </label>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!feedbackText.trim() || isSubmitting}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackForm;
