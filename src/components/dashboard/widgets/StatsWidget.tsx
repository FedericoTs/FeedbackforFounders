import React, { useState, useEffect } from "react";
import BaseWidget from "./BaseWidget";
import { BarChart2, MessageSquare, Star, Trophy } from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";

interface StatItem {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

interface StatsWidgetProps {
  stats?: StatItem[];
  className?: string;
  isLoading?: boolean;
  isRemovable?: boolean;
  onRemove?: () => void;
  timeRange?: "day" | "week" | "month" | "all";
}

const defaultStats: StatItem[] = [
  {
    title: "Projects",
    value: 12,
    icon: <BarChart2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />,
    color: "bg-teal-100 dark:bg-teal-900/30",
    description: "Active projects",
  },
  {
    title: "Feedback Received",
    value: 48,
    icon: (
      <MessageSquare className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
    ),
    color: "bg-cyan-100 dark:bg-cyan-900/30",
    description: "Total feedback",
  },
  {
    title: "Points Earned",
    value: 750,
    icon: <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
    color: "bg-amber-100 dark:bg-amber-900/30",
    description: "Reward points",
  },
  {
    title: "Achievements",
    value: 8,
    icon: <Trophy className="h-6 w-6 text-rose-600 dark:text-rose-400" />,
    color: "bg-rose-100 dark:bg-rose-900/30",
    description: "Unlocked badges",
  },
];

const StatsWidget = ({
  stats: initialStats,
  className,
  isLoading: initialLoading = false,
  isRemovable = true,
  onRemove,
  timeRange = "all",
}: StatsWidgetProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatItem[]>(initialStats || defaultStats);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, selectedTimeRange]);

  const fetchStats = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch projects count
      const { count: projectsCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch feedback count
      const { count: feedbackCount } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
        .eq("project_user_id", user.id);

      // Fetch user points
      const { data: userData } = await supabase
        .from("user_profiles")
        .select("points")
        .eq("user_id", user.id)
        .single();

      // Fetch achievements count
      const { count: achievementsCount } = await supabase
        .from("user_achievements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const updatedStats: StatItem[] = [
        {
          title: "Projects",
          value: projectsCount || 0,
          icon: (
            <BarChart2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          ),
          color: "bg-teal-100 dark:bg-teal-900/30",
          description: "Active projects",
        },
        {
          title: "Feedback Received",
          value: feedbackCount || 0,
          icon: (
            <MessageSquare className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
          ),
          color: "bg-cyan-100 dark:bg-cyan-900/30",
          description: "Total feedback",
        },
        {
          title: "Points Earned",
          value: userData?.points || 0,
          icon: <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
          color: "bg-amber-100 dark:bg-amber-900/30",
          description: "Reward points",
        },
        {
          title: "Achievements",
          value: achievementsCount || 0,
          icon: <Trophy className="h-6 w-6 text-rose-600 dark:text-rose-400" />,
          color: "bg-rose-100 dark:bg-rose-900/30",
          description: "Unlocked badges",
        },
      ];

      setStats(updatedStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchStats();
  };

  return (
    <BaseWidget
      title="Overview"
      icon={<BarChart2 className="h-4 w-4" />}
      className={className}
      isLoading={isLoading}
      isRemovable={isRemovable}
      isRefreshable={true}
      onRefresh={handleRefresh}
      onRemove={onRemove}
    >
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-4 bg-white dark:bg-slate-800/60 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stat.value}
                </h3>
                {stat.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {stat.description}
                  </p>
                )}
              </div>
              <div
                className={`h-12 w-12 ${stat.color} rounded-full flex items-center justify-center`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </BaseWidget>
  );
};

export default StatsWidget;
