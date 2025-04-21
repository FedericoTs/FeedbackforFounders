import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  Laptop,
  Loader2,
  MessageSquare,
  Palette,
  Smartphone,
  Star,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";

interface ProjectCreator {
  name: string;
  avatar: string;
  level: number;
}

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  creator: ProjectCreator;
  feedbackCount: number;
  pointsReward: number;
  type: "website" | "mobile" | "design" | string;
  onClick?: () => void;
}

export function ProjectCard({
  id,
  title,
  description,
  category,
  tags,
  creator,
  feedbackCount,
  pointsReward,
  type,
  onClick,
}: ProjectCardProps) {
  const { user } = useAuth();
  const [projectPoints, setProjectPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProjectPoints(user.id, id);
    }
  }, [user, id]);

  const fetchProjectPoints = async (userId: string, projectId: string) => {
    try {
      setLoading(true);
      // Query user_activity table to get points earned for this specific project
      const { data, error } = await supabase
        .from("user_activity")
        .select("points")
        .eq("user_id", userId)
        .eq("project_id", projectId);

      if (error) {
        console.error("Error fetching project points:", error);
        return;
      }

      // Sum up all points from activities related to this project
      const totalPoints =
        data?.reduce((sum, activity) => sum + (activity.points || 0), 0) || 0;
      setProjectPoints(totalPoints);
    } catch (error) {
      console.error("Unexpected error fetching project points:", error);
    } finally {
      setLoading(false);
    }
  };
  // Get project icon based on type
  const getProjectIcon = (type: string) => {
    switch (type) {
      case "website":
        return <Laptop className="h-5 w-5 text-teal-600 dark:text-teal-400" />;
      case "mobile":
        return (
          <Smartphone className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        );
      case "design":
        return <Palette className="h-5 w-5 text-rose-600 dark:text-rose-400" />;
      default:
        return <Laptop className="h-5 w-5 text-teal-600 dark:text-teal-400" />;
    }
  };

  // Get badge color based on project type
  const getBadgeClass = (type: string) => {
    switch (type) {
      case "website":
        return "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400";
      case "mobile":
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400";
      case "design":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400";
      default:
        return "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400";
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              {getProjectIcon(type)}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.avatar}`}
                  />
                  <AvatarFallback>{creator.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {creator.name} · Level {creator.level}
                </span>
              </div>
            </div>
          </div>
          <Badge className={getBadgeClass(type)}>{category}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
          {description}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
            <MessageSquare className="h-4 w-4" />
            <span>{feedbackCount}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span>
                +{projectPoints !== null ? projectPoints : pointsReward} pts
              </span>
            )}
          </div>
        </div>
        <Button
          size="sm"
          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
          onClick={onClick}
        >
          Give Feedback
        </Button>
      </CardFooter>
    </Card>
  );
}
