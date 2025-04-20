import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Calendar, Award } from "lucide-react";

interface LoginStreakDisplayProps {
  streak: number;
  maxStreak: number;
  className?: string;
}

const LoginStreakDisplay = ({
  streak,
  maxStreak,
  className = "",
}: LoginStreakDisplayProps) => {
  // Calculate progress to next milestone
  const getNextMilestone = () => {
    if (streak < 3) return 3;
    if (streak < 7) return 7;
    if (streak < 14) return 14;
    if (streak < 30) return 30;
    if (streak < 60) return 60;
    if (streak < 100) return 100;
    if (streak < 180) return 180;
    if (streak < 365) return 365;
    return Math.ceil(streak / 100) * 100; // Next hundred
  };

  const nextMilestone = getNextMilestone();
  const progress = (streak / nextMilestone) * 100;

  // Get streak tier and color
  const getStreakTier = () => {
    if (streak >= 365) return { name: "Diamond", color: "text-blue-400" };
    if (streak >= 180) return { name: "Platinum", color: "text-cyan-500" };
    if (streak >= 100) return { name: "Gold", color: "text-amber-500" };
    if (streak >= 30) return { name: "Silver", color: "text-slate-400" };
    if (streak >= 7) return { name: "Bronze", color: "text-amber-700" };
    return { name: "Beginner", color: "text-slate-600" };
  };

  const tier = getStreakTier();

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className={`h-5 w-5 ${tier.color}`} />
          <span className="font-medium text-sm">Login Streak</span>
        </div>
        <Badge
          className={`${streak >= 30 ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" : "bg-amber-100 text-amber-700"}`}
        >
          {streak} days
        </Badge>
      </div>

      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-slate-500">
          <span>{streak} days</span>
          <span>{nextMilestone} days</span>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-1 text-slate-600">
          <Trophy className="h-3 w-3 text-amber-500" />
          <span>Best: {maxStreak} days</span>
        </div>
        <div className="flex items-center gap-1 text-slate-600">
          <Award className="h-3 w-3 text-cyan-500" />
          <span>Tier: {tier.name}</span>
        </div>
      </div>
    </div>
  );
};

export default LoginStreakDisplay;
