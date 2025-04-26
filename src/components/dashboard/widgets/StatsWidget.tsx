import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import BaseWidget from "./BaseWidget";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "@/supabase/auth";
import { BarChart, Activity, Users, MessageSquare } from "lucide-react";

interface StatsWidgetProps {
  title?: string;
  className?: string;
}

interface Stats {
  projectCount: number;
  feedbackCount: number;
  feedbackResponseRate: number;
  activeUsers: number;
}

const StatsWidget: React.FC<StatsWidgetProps> = ({
  title = "Overview",
  className = "",
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch project count
        const { count: projectCount, error: projectError } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", user.id);

        if (projectError) throw projectError;

        // Fetch feedback count
        const { count: feedbackCount, error: feedbackError } = await supabase
          .from("feedback")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (feedbackError) throw feedbackError;

        // For demo purposes, we'll use mock data for some stats
        setStats({
          projectCount: projectCount || 0,
          feedbackCount: feedbackCount || 0,
          feedbackResponseRate: 78, // Mock data
          activeUsers: 42, // Mock data
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <BaseWidget title={title} className={className}>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-8 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
      </BaseWidget>
    );
  }

  if (error) {
    return (
      <BaseWidget title={title} className={className}>
        <div className="text-center text-red-500 p-4">{error}</div>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget title={title} className={className}>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Projects</p>
                <h4 className="text-2xl font-bold">
                  {stats?.projectCount || 0}
                </h4>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BarChart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Feedback</p>
                <h4 className="text-2xl font-bold">
                  {stats?.feedbackCount || 0}
                </h4>
              </div>
              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Response Rate</p>
                <h4 className="text-2xl font-bold">
                  {stats?.feedbackResponseRate || 0}%
                </h4>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Users</p>
                <h4 className="text-2xl font-bold">
                  {stats?.activeUsers || 0}
                </h4>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BaseWidget>
  );
};

export default StatsWidget;
