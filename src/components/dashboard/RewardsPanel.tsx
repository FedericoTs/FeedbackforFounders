import React, { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { useAuth } from "@/supabase/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Award,
  Check,
  Flame,
  Gift,
  Loader2,
  MessageSquare,
  Star,
  Trophy,
  Users,
  ThumbsUp,
  ArrowRight,
} from "lucide-react";
import { profileService } from "@/services/profile";
import { pointsService } from "@/services/points";
import { rewardsService } from "@/services/rewards";
import { useLoginReward } from "@/lib/useLoginReward";
import { useLoginStreak } from "@/lib/useLoginStreak";
import LoginStreakDisplay from "./LoginStreakDisplay";
import { Link } from "react-router-dom";

interface RewardsPanelProps {
  userId?: string;
  showLoginReward?: boolean;
  showViewAllLink?: boolean;
}

const RewardsPanel = ({
  userId,
  showLoginReward = true,
  showViewAllLink = true,
}: RewardsPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [pointStats, setPointStats] = useState<any>(null);
  const { isProcessing: processingLoginReward, result: loginRewardResult } =
    useLoginReward();
  const { isProcessing: processingLoginStreak, result: loginStreakResult } =
    useLoginStreak();

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchUserData();
    }
  }, [targetUserId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profileData);

      // Get point statistics
      const stats = await pointsService.getUserPointStatistics(targetUserId);
      setPointStats(stats);

      // Get recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", targetUserId)
        .not("points", "eq", 0)
        .order("created_at", { ascending: false })
        .limit(5);

      if (activitiesError) throw activitiesError;
      setRecentActivities(activities || []);

      // Get achievements
      const { data: achievementsData, error: achievementsError } =
        await supabase
          .from("user_achievements")
          .select(
            "achievement_id, earned_at, achievements(title, description, icon, color, points_reward)",
          )
          .eq("user_id", targetUserId)
          .order("earned_at", { ascending: false });

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to load rewards data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateLevelProgress = (
    points: number,
    pointsToNextLevel: number,
  ) => {
    return profileService.calculateLevelProgress(points, pointsToNextLevel);
  };

  const formatDate = (dateString: string) => {
    return profileService.formatDate(dateString);
  };

  const getIconComponent = (iconName: string, className = "h-5 w-5") => {
    const icons: Record<string, React.ReactNode> = {
      Trophy: <Trophy className={className} />,
      Star: <Star className={className} />,
      Award: <Award className={className} />,
      Users: <Users className={className} />,
      Check: <Check className={className} />,
      Gift: <Gift className={className} />,
      MessageSquare: <MessageSquare className={className} />,
      ThumbsUp: <ThumbsUp className={className} />,
    };

    return icons[iconName] || <Star className={className} />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-amber-500" />
            Rewards & Achievements
          </CardTitle>
          {showViewAllLink && (
            <Link to="/dashboard/rewards">
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
        <CardDescription>
          Track your progress and earned rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400">
              Level {userProfile?.level || 1}
            </Badge>
            <span className="text-sm text-slate-600">
              {userProfile?.points || 0} points
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-500">
                Level {userProfile?.level || 1}
              </span>
              <span className="text-xs text-slate-500">
                Level {(userProfile?.level || 1) + 1}
              </span>
            </div>
            <Progress
              value={calculateLevelProgress(
                userProfile?.points || 0,
                userProfile?.points_to_next_level || 100,
              )}
              className="h-2"
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-500">
                {userProfile?.points || 0} points
              </span>
              <span className="text-xs text-slate-500">
                {userProfile?.points_to_next_level || 100} to next level
              </span>
            </div>
          </div>
        </div>

        {showLoginReward && (
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Gift className="h-5 w-5 text-teal-500 mr-2" />
                <span className="font-medium text-sm">Daily Login Reward</span>
              </div>
              {processingLoginReward ? (
                <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
              ) : loginRewardResult?.success &&
                loginRewardResult?.points > 0 ? (
                <Badge className="bg-teal-100 text-teal-700">
                  +{loginRewardResult.points} points
                </Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-700">
                  Already claimed
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-2">
              {loginRewardResult?.message ||
                "Log in daily to earn points and build your streak!"}
            </p>

            {loginStreakResult && loginStreakResult.success && (
              <>
                <Separator className="my-3" />
                <LoginStreakDisplay
                  streak={loginStreakResult.streak}
                  maxStreak={loginStreakResult.maxStreak}
                />
              </>
            )}
          </div>
        )}

        {pointStats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-slate-500 mb-1">Today</h4>
              <p className="text-lg font-semibold text-teal-600">
                +{pointStats.pointsToday}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-slate-500 mb-1">
                This Week
              </h4>
              <p className="text-lg font-semibold text-teal-600">
                +{pointStats.pointsThisWeek}
              </p>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium mb-3">Recent Point Activity</h4>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
                >
                  <div className="mt-0.5">
                    {activity.points > 0 ? (
                      <Star className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Star className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                  {activity.points > 0 && (
                    <Badge className="bg-teal-100 text-teal-700">
                      +{activity.points} points
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              No recent point activity found.
            </p>
          )}
        </div>

        {achievements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Recent Achievements</h4>
            <div className="space-y-3">
              {achievements.slice(0, 3).map((achievement) => (
                <div
                  key={achievement.achievement_id}
                  className="flex items-start gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-full ${achievement.achievements?.color || "bg-amber-100"}`}
                  >
                    {getIconComponent(
                      achievement.achievements?.icon || "Trophy",
                      "h-3.5 w-3.5",
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {achievement.achievements?.title ||
                        "Achievement Unlocked"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(achievement.earned_at)}
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700">
                    +{achievement.achievements?.points_reward || 0} points
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RewardsPanel;
