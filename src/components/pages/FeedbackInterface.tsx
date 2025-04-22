import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Code,
  ExternalLink,
  Eye,
  MessageSquare,
  MousePointer,
  Palette,
  Plus,
  Send,
  Smartphone,
  Star,
  ThumbsUp,
  X,
} from "lucide-react";

// Mock project data
const mockProject = {
  id: "1",
  title: "E-commerce Website Redesign",
  description:
    "I've redesigned the user interface and checkout flow for an e-commerce website. Looking for feedback on the overall design, usability, and suggestions for improvement. The website sells handmade crafts and artisanal products.",
  category: "Web Design",
  tags: ["UI/UX", "E-commerce", "Responsive"],
  creator: {
    name: "Sarah Johnson",
    avatar: "sarah",
    level: 4,
  },
  feedbackCount: 12,
  pointsReward: 75,
  createdAt: "2023-06-15T10:30:00Z",
  type: "website",
  url: "https://example.com/project",
  screenshots: [
    "https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=800&q=80",
    "https://images.unsplash.com/photo-1573867639040-6dd25fa5f597?w=800&q=80",
    "https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=800&q=80",
  ],
};

// Mock feedback data
const mockFeedback = [
  {
    id: "f1",
    user: {
      name: "Alex Rivera",
      avatar: "alex",
      level: 5,
    },
    content:
      "The overall design looks clean and modern. I like the color scheme and typography choices. The product cards could use a bit more spacing between them for better readability.",
    createdAt: "2023-06-16T14:30:00Z",
    rating: 4,
    pointsEarned: 25,
    coordinates: { x: 320, y: 150 },
    element: "Product Grid",
  },
  {
    id: "f2",
    user: {
      name: "Emma Wilson",
      avatar: "emma",
      level: 4,
    },
    content:
      "The checkout process feels a bit lengthy. Consider reducing the number of steps or implementing a progress indicator to show users where they are in the process.",
    createdAt: "2023-06-17T09:45:00Z",
    rating: 3,
    pointsEarned: 20,
    coordinates: { x: 520, y: 350 },
    element: "Checkout Form",
  },
];

// Feedback point component
const FeedbackPoint = ({ point, isActive, onClick }) => {
  return (
    <div
      className={`absolute cursor-pointer transition-all duration-200 ${isActive ? "z-20" : "z-10"}`}
      style={{
        left: `${point.coordinates.x}px`,
        top: `${point.coordinates.y}px`,
      }}
      onClick={onClick}
    >
      <div
        className={`h-6 w-6 rounded-full flex items-center justify-center ${isActive ? "bg-teal-500 text-white" : "bg-white border-2 border-teal-500 text-teal-500"}`}
      >
        {point.id.replace("f", "")}
      </div>
      {isActive && (
        <div className="absolute top-8 left-0 w-64 bg-white dark:bg-slate-800 shadow-lg rounded-lg p-3 z-30 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${point.user.avatar}`}
              />
              <AvatarFallback>{point.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="text-xs font-medium text-slate-900 dark:text-white">
              {point.user.name}
            </div>
            <div className="ml-auto flex">
              {Array.from({ length: point.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="h-3 w-3 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
            {point.content}
          </p>
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-500">
            <span>{point.element}</span>
            <span>+{point.pointsEarned} pts</span>
          </div>
        </div>
      )}
    </div>
  );
};

const FeedbackInterface = () => {
  const [activeTab, setActiveTab] = useState("preview");
  const [activeFeedbackPoint, setActiveFeedbackPoint] = useState(null);
  const [newFeedbackMode, setNewFeedbackMode] = useState(false);
  const [newFeedbackPosition, setNewFeedbackPosition] = useState({
    x: 0,
    y: 0,
  });
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(4);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get project ID from URL params
  const { id } = useParams();
  const project = mockProject; // In a real app, fetch project by ID

  const handlePreviewClick = (e) => {
    if (!newFeedbackMode) return;

    // Get click coordinates relative to the preview container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNewFeedbackPosition({ x, y });
  };

  const handleSubmitFeedback = async () => {
    try {
      // In a real app, this would use the feedbackService
      console.log("Submitting feedback:", {
        position: newFeedbackPosition,
        text: feedbackText,
        rating: feedbackRating,
      });

      // Simulate feedback submission and quality analysis
      // This would normally call feedbackService.submitFeedback()

      // Simulate quality metrics based on feedback length and rating
      const specificityScore = Math.min(0.9, feedbackText.length / 300);
      const actionabilityScore = Math.min(
        0.9,
        feedbackText.includes("should") ||
          feedbackText.includes("could") ||
          feedbackText.includes("would")
          ? 0.8
          : 0.5,
      );
      const noveltyScore = 0.7; // Simulated value

      // Calculate quality points (simplified version of the algorithm)
      const qualityScore =
        (specificityScore + actionabilityScore + noveltyScore) / 3;
      const qualityPoints = Math.round(qualityScore * 25);

      // Simulate award toast for base feedback points
      setTimeout(() => {
        const baseFeedbackEvent = new CustomEvent("award:received", {
          detail: {
            points: 10,
            title: "Feedback Submitted!",
            description: "Thanks for providing feedback",
            variant: "default",
          },
        });
        window.dispatchEvent(baseFeedbackEvent);
      }, 500);

      // If quality score is good, show quality bonus toast
      if (qualityScore > 0.6 && feedbackText.length > 100) {
        setTimeout(() => {
          const qualityFeedbackEvent = new CustomEvent("award:received", {
            detail: {
              points: qualityPoints,
              title: "Quality Feedback!",
              description: `Your detailed feedback earned you ${qualityPoints} bonus points!`,
              variant: "feedback",
              metadata: {
                specificityScore,
                actionabilityScore,
                noveltyScore,
              },
            },
          });
          window.dispatchEvent(qualityFeedbackEvent);
        }, 2000); // Show after the base points toast
      }

      // Reset feedback form
      setNewFeedbackMode(false);
      setFeedbackText("");
      setFeedbackRating(4);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const handleCancelFeedback = () => {
    setNewFeedbackMode(false);
    setFeedbackText("");
    setFeedbackRating(4);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {project.title}
          </h1>
          <Badge
            className={`ml-2 ${project.type === "website" ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400" : project.type === "mobile" ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400"}`}
          >
            {project.category}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Visit Project
          </a>
          <Button
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            onClick={() => setNewFeedbackMode(!newFeedbackMode)}
          >
            {newFeedbackMode ? (
              <>
                <X className="h-4 w-4 mr-2" /> Cancel Feedback
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" /> Add Feedback
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-6">
        {/* Project Info */}
        <div className="w-1/3">
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  Description
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {project.description}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  Created By
                </h3>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.creator.avatar}`}
                    />
                    <AvatarFallback>{project.creator.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {project.creator.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Level {project.creator.level}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  Reward
                </h3>
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="font-medium">
                    {project.pointsReward} points
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 shadow-sm mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Feedback Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                  <MousePointer className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-white">
                    Click on the design
                  </span>{" "}
                  to add feedback to specific elements.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-white">
                    Provide detailed feedback
                  </span>{" "}
                  about what works well and what could be improved.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                  <Star className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-white">
                    Rate the design
                  </span>{" "}
                  to help the creator understand your overall impression.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                  <ThumbsUp className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-white">
                    Be constructive
                  </span>{" "}
                  and provide actionable suggestions for improvement.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview and Feedback Area */}
        <div className="w-2/3">
          <Tabs
            defaultValue="preview"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="preview" className="relative">
                <Eye className="h-4 w-4 mr-2" />
                Preview
                {newFeedbackMode && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-teal-500 animate-pulse"></span>
                )}
              </TabsTrigger>
              <TabsTrigger value="feedback">
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback ({mockFeedback.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-0">
              <Card className="bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
                <div className="relative">
                  {/* Preview Image */}
                  <div
                    className="relative w-full h-[500px] overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
                    onClick={handlePreviewClick}
                  >
                    <img
                      src={project.screenshots[currentImageIndex]}
                      alt="Project Preview"
                      className="max-w-full max-h-full object-contain"
                    />

                    {/* Image Navigation */}
                    {project.screenshots.length > 1 && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                        {project.screenshots.map((_, index) => (
                          <button
                            key={index}
                            className={`h-2 w-2 rounded-full ${index === currentImageIndex ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-600"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(index);
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Existing Feedback Points */}
                    {mockFeedback.map((feedback) => (
                      <FeedbackPoint
                        key={feedback.id}
                        point={feedback}
                        isActive={activeFeedbackPoint === feedback.id}
                        onClick={() =>
                          setActiveFeedbackPoint(
                            activeFeedbackPoint === feedback.id
                              ? null
                              : feedback.id,
                          )
                        }
                      />
                    ))}

                    {/* New Feedback Point */}
                    {newFeedbackMode && (
                      <div
                        className="absolute z-20"
                        style={{
                          left: `${newFeedbackPosition.x}px`,
                          top: `${newFeedbackPosition.y}px`,
                        }}
                      >
                        <div className="h-6 w-6 rounded-full bg-teal-500 text-white flex items-center justify-center animate-pulse">
                          <Plus className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* New Feedback Form */}
                  {newFeedbackMode && newFeedbackPosition.x !== 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Add Your Feedback
                      </h3>
                      <Textarea
                        placeholder="What do you think about this element? Provide specific, constructive feedback..."
                        className="mb-3 min-h-24"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Rating:
                          </span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => setFeedbackRating(rating)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`h-5 w-5 ${rating <= feedbackRating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelFeedback}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                            onClick={handleSubmitFeedback}
                            disabled={!feedbackText.trim()}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Submit Feedback
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="mt-0">
              <Card className="bg-white dark:bg-slate-800 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    All Feedback
                  </CardTitle>
                  <CardDescription>
                    {mockFeedback.length} feedback items provided by the
                    community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockFeedback.map((feedback, index) => (
                      <div key={feedback.id}>
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${feedback.user.avatar}`}
                            />
                            <AvatarFallback>
                              {feedback.user.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                  {feedback.user.name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  Level {feedback.user.level} ·{" "}
                                  {new Date(
                                    feedback.createdAt,
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex">
                                {Array.from({
                                  length: feedback.rating,
                                }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="h-4 w-4 fill-amber-400 text-amber-400"
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                              {feedback.content}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {feedback.element}
                              </Badge>
                              <div className="text-xs text-amber-600 dark:text-amber-400">
                                +{feedback.pointsEarned} points earned
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < mockFeedback.length - 1 && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default FeedbackInterface;
