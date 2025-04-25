import React, { useState, useEffect } from "react";
import { useAuth } from "@/supabase/auth";
import { pointsService } from "@/services/points";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Medal,
  Award,
  Star,
  RefreshCw,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Crown,
  MessageSquare,
  FolderPlus,
  Sparkles,
} from "lucide-react";

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<{
    rank: number;
    total: number;
    percentile?: number;
    points?: number;
    highestRank?: number;
    highestLevel?: number;
  } | null>(null);
  const [timeframe, setTimeframe] = useState<"all" | "month" | "week">("all");
  const [category, setCategory] = useState<
    "points" | "feedback" | "projects" | "achievements"
  >("points");
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"global" | "friends">("global");
  const [rankHistory, setRankHistory] = useState<
    { date: string; rank: number; total: number }[]
  >([]);

  const limit = 10;
  const categories = pointsService.getLeaderboardCategories();
  const timeframes = pointsService.getLeaderboardTimeframes();

  useEffect(() => {
    if (user) {
      loadLeaderboard();
      loadUserRankHistory();
    }
  }, [user, timeframe, category, page, viewMode]);

  useEffect(() => {
    if (leaderboard.length > 0) {
      filterLeaderboard();
    }
  }, [leaderboard, searchQuery]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await pointsService.getLeaderboard(
        timeframe,
        limit,
        page * limit,
        category,
      );
      setLeaderboard(data);

      if (user) {
        const rankData = await pointsService.getUserRank(
          user.id,
          timeframe,
          category,
        );
        setUserRank(rankData);
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRankHistory = async () => {
    if (!user) return;

    try {
      const history = await pointsService.getUserRankHistory(user.id);
      setRankHistory(history);
    } catch (error) {
      console.error("Error loading rank history:", error);
    }
  };

  const filterLeaderboard = () => {
    if (!searchQuery) {
      setFilteredLeaderboard(leaderboard);
      return;
    }

    const filtered = leaderboard.filter((item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredLeaderboard(filtered);
  };

  const refreshLeaderboard = async () => {
    await pointsService.refreshLeaderboard();
    loadLeaderboard();
  };

  const handleNextPage = () => {
    setPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    setPage((prev) => Math.max(0, prev - 1));
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case "points":
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case "feedback":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "projects":
        return <FolderPlus className="h-5 w-5 text-green-500" />;
      case "achievements":
        return <Award className="h-5 w-5 text-purple-500" />;
      default:
        return <Star className="h-5 w-5 text-amber-500" />;
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-amber-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-slate-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-700" />;
      default:
        return <Star className="h-5 w-5 text-slate-300" />;
    }
  };

  const isCurrentUser = (userId: string) => {
    return user && user.id === userId;
  };

  const getPointsLabel = () => {
    switch (category) {
      case "feedback":
        return "Feedback";
      case "projects":
        return "Projects";
      case "achievements":
        return "Achievements";
      default:
        return "Points";
    }
  };

  if (loading && !leaderboard.length) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-amber-500" />
              Leaderboard
            </CardTitle>
            <CardDescription>See who's leading the way</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <Skeleton className="h-10 w-full md:w-1/3" />
                <Skeleton className="h-10 w-full md:w-1/3" />
              </div>
              <div className="space-y-4">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl flex items-center">
                  {getCategoryIcon(category)}
                  <span className="ml-2">Leaderboard</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={refreshLeaderboard}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                See who's leading the way in{" "}
                {timeframes
                  .find((t) => t.id === timeframe)
                  ?.name.toLowerCase() || "all time"}{" "}
                {categories
                  .find((c) => c.id === category)
                  ?.name.toLowerCase() || "points"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search users..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={category}
                      onValueChange={(value) => setCategory(value as any)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center">
                              {getCategoryIcon(cat.id)}
                              <span className="ml-2">{cat.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={timeframe}
                      onValueChange={(value) => setTimeframe(value as any)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeframes.map((time) => (
                          <SelectItem key={time.id} value={time.id}>
                            {time.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* View toggle */}
                <div className="flex justify-center">
                  <Tabs
                    value={viewMode}
                    onValueChange={(v) => setViewMode(v as any)}
                  >
                    <TabsList>
                      <TabsTrigger value="global" className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Global
                      </TabsTrigger>
                      <TabsTrigger
                        value="friends"
                        className="flex items-center"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Friends
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Leaderboard */}
                <ScrollArea className="h-[500px] pr-4">
                  {filteredLeaderboard.length > 0 ? (
                    <div className="space-y-4">
                      {filteredLeaderboard.map((item, index) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-4 p-4 rounded-lg border ${isCurrentUser(item.id) ? "bg-amber-50 border-amber-200" : "border-slate-200"}`}
                        >
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100">
                            {getRankIcon(index + page * limit)}
                          </div>
                          <Avatar className="h-12 w-12 border-2 border-white shadow">
                            <AvatarImage
                              src={item.avatar_url}
                              alt={item.name}
                            />
                            <AvatarFallback className="bg-slate-200">
                              {(item.name || "U").charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center">
                              <p className="text-lg font-medium">
                                {item.name || "Anonymous"}
                              </p>
                              {isCurrentUser(item.id) && (
                                <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                                  You
                                </Badge>
                              )}
                              {index === 0 && page === 0 && (
                                <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                                  <Crown className="h-3 w-3 mr-1" /> Leader
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-slate-500">
                              <span>Level {item.level || 1}</span>
                              {item.percentile && (
                                <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                                  Top {item.percentile}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-amber-600">
                              #{index + 1 + page * limit}
                            </div>
                            <div className="text-sm font-medium">
                              {item.points} {getPointsLabel()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-xl font-medium text-slate-600 mb-2">
                        No results found
                      </p>
                      <p className="text-slate-500">
                        {searchQuery
                          ? "Try a different search term"
                          : "No leaderboard data available"}
                      </p>
                    </div>
                  )}
                </ScrollArea>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <span className="text-sm text-slate-500">
                    Page {page + 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={filteredLeaderboard.length < limit}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Rank Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
                Your Ranking
              </CardTitle>
              <CardDescription>
                Your position on the leaderboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userRank ? (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg">
                    <div className="text-5xl font-bold text-amber-600 mb-2">
                      #{userRank.rank}
                    </div>
                    <div className="text-sm text-slate-500">
                      out of {userRank.total} users
                    </div>
                    {userRank.percentile && (
                      <Badge className="mt-2 bg-amber-100 text-amber-800 border-amber-200">
                        Top {userRank.percentile}%
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to next rank</span>
                      <span className="font-medium">
                        {userRank.rank > 1 ? `#${userRank.rank - 1}` : "#1"}
                      </span>
                    </div>
                    <Progress
                      value={
                        userRank.rank > 1
                          ? 100 - ((userRank.rank - 1) / userRank.total) * 100
                          : 100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="text-sm text-slate-500 mb-1">
                        Best Rank
                      </div>
                      <div className="text-2xl font-bold">
                        #{userRank.highestRank || userRank.rank}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="text-sm text-slate-500 mb-1">
                        Highest Level
                      </div>
                      <div className="text-2xl font-bold">
                        {userRank.highestLevel || "--"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Your {getPointsLabel()}
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold">
                          {userRank.points || 0}
                        </div>
                        <div className="text-sm text-slate-500">
                          {getPointsLabel()} earned
                        </div>
                      </div>
                      {getCategoryIcon(category)}
                    </div>
                  </div>

                  {rankHistory.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Rank History</h4>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <div className="space-y-2">
                          {rankHistory.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {new Date(item.date).toLocaleDateString()}
                              </span>
                              <span className="font-medium">#{item.rank}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">
                    Start earning points to appear on the leaderboard!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
