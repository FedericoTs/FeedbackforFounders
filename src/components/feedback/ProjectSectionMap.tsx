import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Check, Layout, MousePointer } from "lucide-react";

export interface ProjectSection {
  id: string;
  name: string;
  type: string;
  hasFeedback: boolean;
  feedbackCount: number;
  domPath?: string;
  visualBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  priority: number;
  elementSelector?: string; // Added this field to fix the error
}

interface ProjectSectionMapProps {
  sections: ProjectSection[];
  activeSection: string | null;
  onSelectSection: (sectionId: string) => void;
  progress: number;
}

const ProjectSectionMap: React.FC<ProjectSectionMapProps> = ({
  sections,
  activeSection,
  onSelectSection,
  progress,
}) => {
  // Sort sections by priority
  const sortedSections = [...sections].sort((a, b) => a.priority - b.priority);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
          Sections
        </h3>
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <ScrollArea className="flex-1 px-4 py-2">
        <div className="space-y-3">
          {sortedSections.map((section) => (
            <div
              key={section.id}
              className={`p-3 rounded-md cursor-pointer transition-colors ${activeSection === section.id ? "bg-teal-50 dark:bg-teal-900/20 border-l-2 border-teal-500" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-2 border-transparent"}`}
              onClick={() => onSelectSection(section.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center ${section.hasFeedback ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
                  >
                    {section.hasFeedback ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Layout className="h-3 w-3" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {section.name}
                  </span>
                </div>
                {section.feedbackCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-slate-50 dark:bg-slate-800"
                  >
                    {section.feedbackCount}
                  </Badge>
                )}
              </div>
              <div className="pl-8">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {section.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <MousePointer className="h-3 w-3" />
          <span>Click on a section to provide feedback</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectSectionMap;
