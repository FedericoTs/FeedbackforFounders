import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Crosshair,
  List,
  Maximize2,
  Minimize2,
  X,
  Home,
  Award,
} from "lucide-react";

interface FeedbackToolbarProps {
  projectName: string;
  projectUrl: string;
  points: number;
  isSelectionModeActive: boolean;
  isSplitView: boolean;
  onToggleSelectionMode: () => void;
  onToggleFeedbackList: () => void;
  onToggleViewMode: () => void;
  onExit: () => void;
}

const FeedbackToolbar: React.FC<FeedbackToolbarProps> = ({
  projectName,
  projectUrl,
  points,
  isSelectionModeActive,
  isSplitView,
  onToggleSelectionMode,
  onToggleFeedbackList,
  onToggleViewMode,
  onExit,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-14 px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <Home className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{projectName}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
            {projectUrl}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isSelectionModeActive ? "default" : "outline"}
                size="sm"
                onClick={onToggleSelectionMode}
              >
                <Crosshair className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Element Selection Tool</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFeedbackList}
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Feedback List</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onToggleViewMode}>
                {isSplitView ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isSplitView ? "Full View" : "Split View"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Badge variant="secondary" className="ml-2">
          <Award className="h-3 w-3 mr-1" />
          {points} points
        </Badge>

        <Button variant="ghost" size="sm" onClick={onExit}>
          <X className="h-4 w-4 mr-1" />
          Exit
        </Button>
      </div>
    </div>
  );
};

export default FeedbackToolbar;
