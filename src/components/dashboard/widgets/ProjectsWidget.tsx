import React from "react";
import BaseWidget from "./BaseWidget";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, Code, Users } from "lucide-react";

interface ProjectItem {
  id: string;
  title: string;
  icon: "code" | "users" | "file";
  status: "active" | "in-review" | "completed";
  progress: number;
  lastUpdated: string;
  team: Array<{ name: string; avatar: string }>;
  feedbackCount: number;
}

interface ProjectsWidgetProps {
  projects?: ProjectItem[];
  className?: string;
  isLoading?: boolean;
  onRemove?: () => void;
}

const defaultProjects: ProjectItem[] = [
  {
    id: "1",
    title: "Website Redesign",
    icon: "code",
    status: "active",
    progress: 75,
    lastUpdated: "2 days ago",
    team: [
      {
        name: "User 1",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
      },
      {
        name: "User 2",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
      },
      {
        name: "User 3",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user3",
      },
    ],
    feedbackCount: 12,
  },
  {
    id: "2",
    title: "Mobile App UX",
    icon: "users",
    status: "in-review",
    progress: 90,
    lastUpdated: "5 days ago",
    team: [
      {
        name: "User 4",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user4",
      },
      {
        name: "User 5",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user5",
      },
    ],
    feedbackCount: 8,
  },
];

const ProjectsWidget = ({
  projects = defaultProjects,
  className,
  isLoading = false,
  onRemove,
}: ProjectsWidgetProps) => {
  const getProjectIcon = (icon: string) => {
    switch (icon) {
      case "code":
        return <Code className="h-5 w-5 text-teal-600 dark:text-teal-400" />;
      case "users":
        return <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />;
      case "file":
        return (
          <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        );
      default:
        return (
          <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/70">
            Active
          </Badge>
        );
      case "in-review":
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/70">
            In Review
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/70">
            Completed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
            Unknown
          </Badge>
        );
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-teal-600 dark:text-teal-400";
      case "in-review":
        return "text-amber-600 dark:text-amber-400";
      case "completed":
        return "text-emerald-600 dark:text-emerald-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <BaseWidget
      title="Recent Projects"
      icon={<FileText className="h-4 w-4" />}
      className={className}
      isLoading={isLoading}
      isRemovable={true}
      onRemove={onRemove}
    >
      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-100 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  {getProjectIcon(project.icon)}
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    {project.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Last updated {project.lastUpdated}
                  </p>
                </div>
              </div>
              {getStatusBadge(project.status)}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Progress
                </span>
                <span className={getProgressColor(project.status)}>
                  {project.progress}%
                </span>
              </div>
              <Progress
                value={project.progress}
                className="h-2 bg-slate-200 dark:bg-slate-700"
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex -space-x-2">
                {project.team.map((member, index) => (
                  <Avatar
                    key={index}
                    className="h-7 w-7 border-2 border-white dark:border-slate-800"
                  >
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <MessageSquare className="h-4 w-4" />
                <span>{project.feedbackCount} feedbacks</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </BaseWidget>
  );
};

export default ProjectsWidget;
