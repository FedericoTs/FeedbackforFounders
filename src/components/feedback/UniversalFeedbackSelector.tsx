import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Globe, Code, Server } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ProxyFrame from "./ProxyFrame";
import DirectSelectionFrame from "./DirectSelectionFrame";

interface UniversalFeedbackSelectorProps {
  onFeedbackSubmit: (feedback: any) => void;
  className?: string;
}

const UniversalFeedbackSelector: React.FC<UniversalFeedbackSelectorProps> = ({
  onFeedbackSubmit,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState("direct");
  const [url, setUrl] = useState("https://example.com");
  const [inputUrl, setInputUrl] = useState("https://example.com");
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState("bug");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle element selection
  const handleElementSelected = (element: any) => {
    console.log("Element selected:", element);
    setSelectedElement(element);
  };

  // Handle URL change
  const handleUrlChange = (e: React.FormEvent) => {
    e.preventDefault();
    setUrl(inputUrl);
  };

  // Handle feedback submission
  const handleSubmit = () => {
    if (!selectedElement) {
      setError("Please select an element first");
      return;
    }

    if (!feedbackText) {
      setError("Please enter feedback text");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Create feedback object
    const feedback = {
      url,
      element: selectedElement,
      feedbackText,
      feedbackType,
      timestamp: new Date().toISOString(),
      selectionMethod: activeTab,
    };

    // Submit feedback
    try {
      onFeedbackSubmit(feedback);

      // Reset form
      setSelectedElement(null);
      setFeedbackText("");
      setFeedbackType("bug");

      // Show success message
      alert("Feedback submitted successfully!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setError(
        `Failed to submit feedback: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>Website Feedback Tool</CardTitle>
          <CardDescription>
            Select an element on the website and provide feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUrlChange} className="flex space-x-2 mb-4">
            <div className="flex-grow">
              <Label htmlFor="url" className="sr-only">
                Website URL
              </Label>
              <Input
                id="url"
                placeholder="Enter website URL"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit">Load</Button>
          </form>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="direct" className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                Direct Access
              </TabsTrigger>
              <TabsTrigger value="proxy" className="flex items-center">
                <Server className="h-4 w-4 mr-2" />
                Proxy Mode
              </TabsTrigger>
            </TabsList>

            <TabsContent value="direct" className="mt-0">
              <DirectSelectionFrame
                url={url}
                onElementSelected={handleElementSelected}
                height={400}
              />
            </TabsContent>

            <TabsContent value="proxy" className="mt-0">
              <ProxyFrame
                url={url}
                onElementSelected={handleElementSelected}
                height={400}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provide Feedback</CardTitle>
          <CardDescription>
            Describe the issue or suggestion for the selected element
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="feedback-type">Feedback Type</Label>
              <select
                id="feedback-type"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md mt-1"
              >
                <option value="bug">Bug Report</option>
                <option value="improvement">Improvement Suggestion</option>
                <option value="question">Question</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="feedback-text">Feedback</Label>
              <Textarea
                id="feedback-text"
                placeholder="Describe your feedback here..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label>Selected Element</Label>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md mt-1">
                {selectedElement ? (
                  <div className="text-sm">
                    <div className="font-medium">
                      {selectedElement.elementType} {selectedElement.selector}
                    </div>
                    {selectedElement.text && (
                      <div className="text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {selectedElement.text}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Size: {selectedElement.dimensions.width}×
                      {selectedElement.dimensions.height}px
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                    No element selected. Click "Select Element" above to choose
                    an element.
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedElement || !feedbackText}
              className="w-full"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UniversalFeedbackSelector;
