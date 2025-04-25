import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePointsAnimation } from "@/hooks/usePointsAnimation";
import { pointsService } from "@/services/points";
import { useAuth } from "@/supabase/auth";
import { useToast } from "@/components/ui/use-toast";

const PointsSystemDemo: React.FC = () => {
  const { user } = useAuth();
  const { showAward } = usePointsAnimation();
  const { toast } = useToast();

  const handleAwardPoints = async (
    points: number,
    actionType: string,
    description: string,
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to earn points",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await pointsService.awardPoints({
        userId: user.id,
        actionType,
        description,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: `Awarded ${result.points} points!`,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to award points",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error awarding points:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleShowAnimation = (
    points: number,
    message: string,
    variant: "default" | "level" | "achievement" | "streak" = "default",
  ) => {
    showAward({ points, message, variant });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Points System Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Award Points</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                handleAwardPoints(5, "daily_login", "Logged in today")
              }
              variant="outline"
            >
              Daily Login (+5)
            </Button>
            <Button
              onClick={() =>
                handleAwardPoints(10, "feedback_given", "Provided feedback")
              }
              variant="outline"
            >
              Give Feedback (+10)
            </Button>
            <Button
              onClick={() =>
                handleAwardPoints(
                  20,
                  "project_created",
                  "Created a new project",
                )
              }
              variant="outline"
            >
              Create Project (+20)
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Animation Demo</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                handleShowAnimation(5, "Daily login reward", "default")
              }
              variant="outline"
            >
              Points Animation
            </Button>
            <Button
              onClick={() =>
                handleShowAnimation(50, "Leveled up to level 2!", "level")
              }
              variant="outline"
            >
              Level Up Animation
            </Button>
            <Button
              onClick={() =>
                handleShowAnimation(
                  25,
                  "Achievement: First Feedback",
                  "achievement",
                )
              }
              variant="outline"
            >
              Achievement Animation
            </Button>
            <Button
              onClick={() =>
                handleShowAnimation(15, "5-day login streak bonus!", "streak")
              }
              variant="outline"
            >
              Streak Animation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsSystemDemo;
