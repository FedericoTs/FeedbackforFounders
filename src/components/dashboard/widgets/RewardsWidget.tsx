import React from "react";
import BaseWidget from "./BaseWidget";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { BarChart3, Star, Trophy } from "lucide-react";

interface RewardsWidgetProps {
  user?: {
    email: string;
    avatar?: string;
    level?: number;
    title?: string;
    points?: number;
    nextLevelPoints?: number;
    achievements?: Array<{
      name: string;
      icon: React.ReactNode;
      color: string;
    }>;
  };
  className?: string;
  isLoading?: boolean;
  onRemove?: () => void;
  title?: string;
}

const defaultUser = {
  email: "user@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user@example.com",
  level: 5,
  title: "Feedback Provider",
  points: 750,
  nextLevelPoints: 1100,
  achievements: [
    {
      name: "First Feedback",
      icon: <Trophy className="h-5 w-5 text-teal-500 dark:text-teal-400" />,
      color: "bg-teal-100 dark:bg-teal-900/30",
    },
    {
      name: "Top Reviewer",
      icon: <Star className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />,
      color: "bg-cyan-100 dark:bg-cyan-900/30",
    },
  ],
};

const RewardsWidget = ({
  user = defaultUser,
  className,
  isLoading = false,
  onRemove,
  title = "Your Rewards",
}: RewardsWidgetProps) => {
  const progressPercentage = Math.round(
    (user.points / user.nextLevelPoints) * 100,
  );

  return (
    <BaseWidget
      title={title}
      icon={<Trophy className="h-4 w-4" />}
      className={className}
      isLoading={isLoading}
      isRemovable={true}
      onRemove={onRemove}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 blur-[6px] opacity-50" />
            <Avatar className="h-16 w-16 ring-2 ring-white dark:ring-slate-800">
              <AvatarImage src={user.avatar} alt={user.email} />
              <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
              {user.email}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30">
                <BarChart3 className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400" />
              </div>
              <span>
                Level {user.level} {user.title}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1 text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Level Progress
            </span>
            <span className="font-medium text-teal-600 dark:text-teal-400">
              {progressPercentage}%
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-2 bg-slate-200 dark:bg-slate-700"
          />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>
              {user.points} / {user.nextLevelPoints} points
            </span>
            <span>Next level: {user.level + 1}</span>
          </div>
        </div>

        <Separator className="my-4 bg-slate-200 dark:bg-slate-700" />

        <div className="space-y-3">
          <h4 className="font-medium text-slate-900 dark:text-white text-sm">
            Recent Achievements
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {user.achievements.map((achievement, index) => (
              <div
                key={index}
                className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2 border border-slate-100 dark:border-slate-700 flex flex-col items-center"
              >
                <div
                  className={`h-10 w-10 rounded-full ${achievement.color} flex items-center justify-center mb-1`}
                >
                  {achievement.icon}
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400 text-center">
                  {achievement.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BaseWidget>
  );
};

export default RewardsWidget;
