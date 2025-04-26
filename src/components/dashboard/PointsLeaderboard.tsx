import React, { useState, useEffect } from "react";
import { useAuth } from "@/supabase/auth";
import { pointsService } from "@/services/points";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  RefreshCw,
  ChevronDown,
  Users,
} from "lucide-react";

interface PointsLeaderboardProps {
  className?: string;
  limit?: number;
  showUserRank?: boolean;
  compact?: boolean;
}

const PointsLeaderboard: React.FC<PointsLeaderboardProps> = ({
  className,
  limit = 10,
  showUserRank = true,
  compact = false,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<{
    rank: number;
    total: number;
  } | null>(null);
  const [timeframe, setTimeframe] = useState<"all" | "month" | "week">("all");

  useEffect(() => {
    if (user) {
      loadLeaderboard();
    }
  }, [user, timeframe]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await pointsService.getLeaderboard(timeframe, limit);
      setLeaderboard(data);

      if (showUserRank && user) {
        const rankData = await pointsService.getUserRank(user.id, timeframe);
        setUserRank(rankData);
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-slate-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-700" />;
      default:
        return <Star className="h-5 w-5 text-slate-300" />;
    }
  };

  const isCurrentUser = (userId: string) => {
    return user && user.id === userId;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Points Leaderboard</CardTitle>
          <CardDescription>Top contributors by points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-16" />
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
            <Trophy className="h-5 w-5 mr-2 text-amber-500" />
            Points Leaderboard
          </CardTitle>
          {!compact && (
            <Button
              variant="ghost"
              size="icon"
              onClick={loadLeaderboard}
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        {!compact && (
          <CardDescription>Top contributors by points</CardDescription>
        )}
      </CardHeader>

      {!compact && (
        <div className="px-6">
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">
                All Time
              </TabsTrigger>
              <TabsTrigger value="month" className="flex-1">
                This Month
              </TabsTrigger>
              <TabsTrigger value="week" className="flex-1">
                This Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <CardContent className={compact ? "pt-2" : undefined}>
        <ScrollArea className={compact ? "h-[200px]" : "h-[350px]"}>
          {leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-2 rounded-md ${isCurrentUser(item.id) ? "bg-slate-50" : ""}`}
                >
                  <div className="flex items-center justify-center h-8 w-8">
                    {getRankIcon(index)}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.avatar_url} alt={item.name} />
                    <AvatarFallback>
                      {(item.name || "U").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {item.name || "Anonymous"}
                      {isCurrentUser(item.id) && (
                        <span className="ml-2 text-xs text-slate-500">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      Level {item.level || 1}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {item.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500">No leaderboard data available</p>
            </div>
          )}
        </ScrollArea>

        {showUserRank && userRank && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {(user?.user_metadata?.name || "U").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">Your Rank</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-slate-50">
                  #{userRank.rank}
                </Badge>
                <span className="text-xs text-slate-500">
                  of {userRank.total}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {!compact && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => loadLeaderboard()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Leaderboard
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export { PointsLeaderboard };
export default PointsLeaderboard;
