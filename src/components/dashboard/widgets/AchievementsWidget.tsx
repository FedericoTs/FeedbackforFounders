import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award, Star, MessageSquare, FolderPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  earnedAt?: string;
}

interface AchievementsWidgetProps {
  achievements?: Achievement[];
  className?: string;
}

const AchievementsWidget: React.FC<AchievementsWidgetProps> = ({
  achievements = [],
  className,
}) => {
  // Default achievements if none provided
  const defaultAchievements: Achievement[] = [
    {
      id: "1",
      name: "First Feedback",
      description: "Provided your first piece of feedback",
      icon: <MessageSquare className="h-4 w-4 text-blue-500" />,
      earned: true,
      earnedAt: "2023-11-15",
    },
    {
      id: "2",
      name: "Project Creator",
      description: "Created your first project",
      icon: <FolderPlus className="h-4 w-4 text-green-500" />,
      earned: true,
      earnedAt: "2023-11-10",
    },
    {
      id: "3",
      name: "Feedback Master",
      description: "Received 10 pieces of quality feedback",
      icon: <Award className="h-4 w-4 text-purple-500" />,
      earned: false,
    },
    {
      id: "4",
      name: "Streak Champion",
      description: "Logged in for 7 consecutive days",
      icon: <Star className="h-4 w-4 text-amber-500" />,
      earned: false,
    },
  ];

  const displayAchievements =
    achievements.length > 0 ? achievements : defaultAchievements;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-3">
            {displayAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center gap-3 p-3 rounded-md ${achievement.earned ? "bg-amber-50" : "bg-slate-50 opacity-70"}`}
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white shadow-sm">
                  {achievement.icon || (
                    <Award className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{achievement.name}</p>
                    {achievement.earned && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 text-xs"
                      >
                        Earned
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {achievement.description}
                  </p>
                  {achievement.earnedAt && (
                    <p className="text-xs text-slate-400 mt-1">
                      Earned on{" "}
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AchievementsWidget;
