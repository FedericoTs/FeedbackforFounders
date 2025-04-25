import React, { useState, useEffect } from "react";
import { useAuth } from "@/supabase/auth";
import {
  achievementsService,
  Achievement,
  UserAchievement,
  AchievementCategory,
} from "@/services/achievements";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Award,
  Trophy,
  Star,
  Check,
  Calendar,
  MessageSquare,
  FolderPlus,
  Folders,
  Sunrise,
  UserCheck,
  RefreshCw,
  Lock,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

interface AchievementsPanelProps {
  userId?: string;
  className?: string;
  showViewAllLink?: boolean;
  compact?: boolean;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({
  userId,
  className,
  showViewAllLink = true,
  compact = false,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>(
    [],
  );
  const [achievementCategories, setAchievementCategories] = useState<
    AchievementCategory[]
  >([]);
  const [progress, setProgress] = useState<{
    earned: number;
    total: number;
    categories: Record<string, { earned: number; total: number }>;
  }>({ earned: 0, total: 0, categories: {} });
  const [activeTab, setActiveTab] = useState("earned");

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchAchievements();
    }
  }, [targetUserId]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);

      // Get user achievements
      const userAchievementsData =
        await achievementsService.getUserAchievements(targetUserId!);
      setUserAchievements(userAchievementsData);

      // Get achievement categories
      const categoriesData =
        await achievementsService.getAchievementsByCategory();
      setAchievementCategories(categoriesData);

      // Get progress
      const progressData = await achievementsService.getUserAchievementProgress(
        targetUserId!,
      );
      setProgress(progressData);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string, className = "h-5 w-5") => {
    const icons: Record<string, React.ReactNode> = {
      Trophy: <Trophy className={className} />,
      Star: <Star className={className} />,
      Award: <Award className={className} />,
      Check: <Check className={className} />,
      Calendar: <Calendar className={className} />,
      MessageSquare: <MessageSquare className={className} />,
      FolderPlus: <FolderPlus className={className} />,
      Folders: <Folders className={className} />,
      Sunrise: <Sunrise className={className} />,
      UserCheck: <UserCheck className={className} />,
    };

    return icons[iconName] || <Award className={className} />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Loading achievements...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={compact ? "pb-2" : undefined}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-amber-500" />
            Achievements
          </CardTitle>
          {showViewAllLink && (
            <Link to="/dashboard/achievements">
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
        {!compact && (
          <CardDescription>
            Track your achievements and unlock rewards
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className={compact ? "pt-2" : undefined}>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500">
              Progress: {progress.earned} / {progress.total} achievements
            </span>
            <span className="text-xs font-medium">
              {Math.round(
                (progress.earned / Math.max(progress.total, 1)) * 100,
              )}
              %
            </span>
          </div>
          <Progress
            value={(progress.earned / Math.max(progress.total, 1)) * 100}
            className="h-2"
          />
        </div>

        {!compact && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="w-full">
              <TabsTrigger value="earned" className="flex-1">
                Earned ({userAchievements.length})
              </TabsTrigger>
              <TabsTrigger value="available" className="flex-1">
                Available ({progress.total - progress.earned})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <ScrollArea className={compact ? "h-[250px]" : "h-[350px]"}>
          {activeTab === "earned" || compact ? (
            userAchievements.length > 0 ? (
              <div className="space-y-3">
                {userAchievements
                  .slice(0, compact ? 5 : undefined)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <div
                        className={`p-2 rounded-full ${item.achievement?.color || "bg-amber-100"}`}
                      >
                        {getIconComponent(
                          item.achievement?.icon || "Award",
                          "h-4 w-4",
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {item.achievement?.name || "Achievement"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Earned on {formatDate(item.earned_at)}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        +{item.achievement?.points_reward || 0} pts
                      </Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500">No achievements earned yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Complete actions to earn achievements
                </p>
              </div>
            )
          ) : (
            <div className="space-y-6">
              {achievementCategories.map((category) => (
                <div key={category.name}>
                  <h3 className="text-sm font-medium mb-2">{category.name}</h3>
                  <div className="space-y-3">
                    {category.achievements.map((achievement) => {
                      const isEarned = userAchievements.some(
                        (ua) => ua.achievement_id === achievement.id,
                      );
                      return (
                        <div
                          key={achievement.id}
                          className={`flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0 ${isEarned ? "opacity-50" : ""}`}
                        >
                          <div
                            className={`p-2 rounded-full ${achievement.color || "bg-amber-100"}`}
                          >
                            {isEarned ? (
                              getIconComponent(
                                achievement.icon || "Award",
                                "h-4 w-4",
                              )
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {achievement.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {achievement.description}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-slate-50 text-slate-700"
                          >
                            +{achievement.points_reward} pts
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {!compact && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={fetchAchievements}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Achievements
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AchievementsPanel;
