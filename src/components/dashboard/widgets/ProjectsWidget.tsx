import React from "react";
import BaseWidget from "./BaseWidget";
import { FolderKanban } from "lucide-react";
import VirtualizedProjectsList from "../VirtualizedProjectsList";

interface ProjectsWidgetProps {
  className?: string;
}

export const ProjectsWidget: React.FC<ProjectsWidgetProps> = ({
  className,
}) => {
  return (
    <BaseWidget
      title="Recent Projects"
      icon={<FolderKanban className="h-4 w-4" />}
      className={className}
      isRefreshable
      onRefresh={() => console.log("Refreshing projects")}
    >
      <VirtualizedProjectsList limit={5} showLoadMore={false} />
    </BaseWidget>
  );
};

export default ProjectsWidget;
