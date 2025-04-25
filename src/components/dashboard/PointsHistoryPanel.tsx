import React, { useState, useEffect } from "react";
import { useAuth } from "@/supabase/auth";
import { pointsService, PointTransaction } from "@/services/points";
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
import { format, formatDistanceToNow } from "date-fns";
import {
  Star,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  BarChart2,
  Clock,
} from "lucide-react";

interface PointsHistoryPanelProps {
  userId?: string;
  className?: string;
}

const PointsHistoryPanel: React.FC<PointsHistoryPanelProps> = ({
  userId,
  className,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("history");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      loadPointsData();
    }
  }, [targetUserId]);

  const loadPointsData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadTransactions(0, true), loadStatistics()]);
    } catch (error) {
      console.error("Error loading points data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (pageNum: number, reset = false) => {
    try {
      if (!targetUserId) return;

      const data = await pointsService.getUserPointTransactions(
        targetUserId,
        limit,
        pageNum * limit,
      );

      if (reset) {
        setTransactions(data);
      } else {
        setTransactions((prev) => [...prev, ...data]);
      }

      setHasMore(data.length === limit);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const loadStatistics = async () => {
    try {
      if (!targetUserId) return;

      const stats = await pointsService.getUserPointStatistics(targetUserId);
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadTransactions(page + 1);
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading && !transactions.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
          <CardDescription>Track your point earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
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
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="h-5 w-5 mr-2 text-amber-500" />
          Points History
        </CardTitle>
        <CardDescription>Track your point earnings</CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="history" className="flex-1">
              History
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex-1">
              Statistics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="history" className="pt-2">
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 bg-amber-100 p-2 rounded-full">
                          <Star className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            {formatActionType(transaction.action_type)}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {transaction.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(
                                new Date(transaction.created_at),
                                {
                                  addSuffix: true,
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-teal-100 text-teal-700 ml-2">
                        +{transaction.points}
                      </Badge>
                    </div>
                  ))}

                  {hasMore && (
                    <div className="pt-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadMore}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        )}
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500">
                    No point transactions found. Complete actions to earn
                    points!
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </TabsContent>

        <TabsContent value="statistics" className="pt-2">
          <CardContent>
            {statistics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <h4 className="text-sm font-medium">Today</h4>
                    </div>
                    <p className="text-2xl font-bold text-teal-600">
                      +{statistics.pointsToday}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Yesterday: +{statistics.pointsYesterday}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <h4 className="text-sm font-medium">This Week</h4>
                    </div>
                    <p className="text-2xl font-bold text-teal-600">
                      +{statistics.pointsThisWeek}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      This Month: +{statistics.pointsThisMonth}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-slate-500" />
                    Top Point Sources
                  </h4>

                  {Object.keys(statistics.topPointSources).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(statistics.topPointSources).map(
                        ([actionType, points]: [string, any]) => (
                          <div
                            key={actionType}
                            className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"
                          >
                            <span className="text-sm">
                              {formatActionType(actionType)}
                            </span>
                            <Badge className="bg-amber-100 text-amber-700">
                              {points} points
                            </Badge>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">
                      No point sources data available yet.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>

      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={loadPointsData}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ChevronUp className="h-4 w-4 mr-2" />
          )}
          Refresh Data
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PointsHistoryPanel;
