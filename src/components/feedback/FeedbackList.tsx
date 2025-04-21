import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  X,
  Search,
  Filter,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface Feedback {
  id: string;
  elementSelector: string;
  elementType: string;
  content: string;
  category: string;
  subcategory: string;
  severity: number;
  sentiment?: number;
  createdAt: string;
  user: {
    name: string;
    avatar?: string;
  };
}

interface FeedbackListProps {
  feedbackItems: Feedback[];
  onClose: () => void;
  onSelectFeedback: (feedbackId: string) => void;
}

const FeedbackList: React.FC<FeedbackListProps> = ({
  feedbackItems,
  onClose,
  onSelectFeedback,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("");

  const filteredFeedback = feedbackItems.filter((item) => {
    // Apply search filter
    if (
      searchTerm &&
      !item.content.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.category.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.subcategory.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Apply category filter
    if (categoryFilter && item.category !== categoryFilter) {
      return false;
    }

    // Apply severity filter
    if (severityFilter && item.severity.toString() !== severityFilter) {
      return false;
    }

    // Apply sentiment filter
    if (sentimentFilter) {
      if (sentimentFilter === "positive" && (item.sentiment || 0) <= 0) {
        return false;
      }
      if (sentimentFilter === "negative" && (item.sentiment || 0) >= 0) {
        return false;
      }
      if (sentimentFilter === "neutral" && (item.sentiment || 0) !== 0) {
        return false;
      }
    }

    return true;
  });

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 1:
        return "Minor";
      case 2:
        return "Low";
      case 3:
        return "Moderate";
      case 4:
        return "Major";
      case 5:
        return "Critical";
      default:
        return "Unknown";
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
      case 2:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case 3:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case 4:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case 5:
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const uniqueCategories = Array.from(
    new Set(feedbackItems.map((item) => item.category)),
  );

  return (
    <div className="fixed left-0 top-14 bottom-0 w-96 bg-white dark:bg-slate-900 shadow-lg border-r border-slate-200 dark:border-slate-800 z-40 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Feedback List</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search feedback..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severities</SelectItem>
                <SelectItem value="1">1 - Minor</SelectItem>
                <SelectItem value="2">2 - Low</SelectItem>
                <SelectItem value="3">3 - Moderate</SelectItem>
                <SelectItem value="4">4 - Major</SelectItem>
                <SelectItem value="5">5 - Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">
              {filteredFeedback.length} feedback items
            </div>
            {(searchTerm ||
              categoryFilter ||
              severityFilter ||
              sentimentFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("");
                  setSeverityFilter("");
                  setSentimentFilter("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            {filteredFeedback.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No feedback items match your filters</p>
              </div>
            ) : (
              filteredFeedback.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                  onClick={() => onSelectFeedback(item.id)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge
                          variant="outline"
                          className="mb-1 text-xs font-normal"
                        >
                          {item.elementType}
                        </Badge>
                        <Badge
                          className={`ml-2 text-xs ${getSeverityColor(item.severity)}`}
                        >
                          {getSeverityLabel(item.severity)}
                        </Badge>
                      </div>
                      {item.sentiment !== undefined && (
                        <Badge
                          variant="outline"
                          className={`${item.sentiment > 0 ? "text-green-600" : item.sentiment < 0 ? "text-red-600" : "text-slate-600"}`}
                        >
                          {item.sentiment > 0 ? (
                            <ThumbsUp className="h-3 w-3 mr-1" />
                          ) : item.sentiment < 0 ? (
                            <ThumbsDown className="h-3 w-3 mr-1" />
                          ) : (
                            "Neutral"
                          )}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-sm line-clamp-3">{item.content}</div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between text-xs text-slate-500">
                    <div className="flex items-center">
                      <div
                        className="h-5 w-5 rounded-full bg-slate-300 mr-2"
                        style={{
                          backgroundImage: item.user.avatar
                            ? `url(${item.user.avatar})`
                            : undefined,
                          backgroundSize: "cover",
                        }}
                      />
                      {item.user.name}
                    </div>
                    <div>{formatDate(item.createdAt)}</div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackList;
