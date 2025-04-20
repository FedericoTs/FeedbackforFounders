import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  Calendar as CalendarIcon,
  Users,
  Target,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../supabase/auth";
import { gamificationService } from "@/services/gamification";
import { activityService } from "@/services/activity";

interface Project {
  id: string;
  title: string;
  visibility: "public" | "private";
  status: "active" | "archived" | "draft";
  featured: boolean;
  user_id: string;
}

interface ProjectPromoteDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPromote: () => void;
  userPoints: number;
}

const ProjectPromoteDialog = ({
  project,
  open,
  onOpenChange,
  onPromote,
  userPoints,
}: ProjectPromoteDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [promotionPoints, setPromotionPoints] = useState(50);
  const [audience, setAudience] = useState("all");
  const [duration, setDuration] = useState(7); // days
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Calculate estimated reach based on points and audience
  const calculateEstimatedReach = () => {
    // Base reach calculation
    let baseReach = promotionPoints * 2;

    // Adjust based on audience targeting
    if (audience === "targeted") {
      baseReach = Math.round(baseReach * 0.7); // More focused but smaller audience
    }

    // Adjust based on duration
    const durationMultiplier = 1 + (duration - 1) * 0.1; // Longer durations have diminishing returns

    return Math.round(baseReach * durationMultiplier);
  };

  // Update end date when start date or duration changes
  useEffect(() => {
    if (startDate) {
      const end = new Date(startDate);
      end.setDate(end.getDate() + duration);
      setEndDate(end);
    }
  }, [startDate, duration]);

  const handlePromote = async () => {
    if (!project || !user) return;

    try {
      setIsLoading(true);

      // Check if user has enough points
      if (userPoints < promotionPoints) {
        toast({
          title: "Error",
          description: "You don't have enough points for this promotion",
          variant: "destructive",
        });
        return;
      }

      // Calculate dates
      const start = startDate || new Date();
      const end =
        endDate || new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);

      // Create promotion record
      const promotionData = {
        project_id: project.id,
        user_id: user.id,
        points_allocated: promotionPoints,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        audience_type: audience,
        estimated_reach: calculateEstimatedReach(),
        status: "active",
      };

      const { error: promotionError } = await supabase
        .from("project_promotions")
        .insert(promotionData);

      if (promotionError) throw promotionError;

      // Deduct points from user
      await gamificationService.awardPoints({
        userId: user.id,
        points: -promotionPoints, // Negative points for deduction
        activityType: "project_promotion", // Using a more accurate type
        description: `Spent ${promotionPoints} points to promote project: ${project.title}`,
        metadata: { projectId: project.id, promotionType: audience },
      });

      // Record activity in user_activity table
      await activityService.recordActivity({
        user_id: user.id,
        activity_type: "project_promotion",
        description: `Promoted project: ${project.title} with ${promotionPoints} points`,
        points: -promotionPoints,
        project_id: project.id,
        metadata: {
          projectId: project.id,
          projectTitle: project.title,
          promotionType: audience,
          pointsSpent: promotionPoints,
          duration: duration,
          estimatedReach: calculateEstimatedReach(),
        },
      });

      // Update project to featured if not already
      if (!project.featured) {
        const { error: updateError } = await supabase
          .from("projects")
          .update({ featured: true })
          .eq("id", project.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: "Project promotion started successfully",
      });

      // Notify parent component
      onPromote();
      onOpenChange(false);
    } catch (error) {
      console.error("Error promoting project:", error);
      toast({
        title: "Error",
        description: "Failed to promote project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Promote Project</DialogTitle>
          <DialogDescription>
            Boost your project's visibility and get more feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="points">Point Allocation</Label>
              <Badge className="bg-amber-100 text-amber-700">
                {promotionPoints} points
              </Badge>
            </div>
            <Slider
              id="points"
              min={10}
              max={500}
              step={10}
              value={[promotionPoints]}
              onValueChange={(value) => setPromotionPoints(value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>10 points (minimum)</span>
              <span>500 points (maximum)</span>
            </div>
            <div className="text-sm text-slate-600 mt-2">
              <div className="flex justify-between">
                <span>Your current balance:</span>
                <span className="font-medium">{userPoints} points</span>
              </div>
              <div className="flex justify-between">
                <span>After promotion:</span>
                <span
                  className={`font-medium ${userPoints < promotionPoints ? "text-red-500" : ""}`}
                >
                  {userPoints - promotionPoints} points
                </span>
              </div>
            </div>
            {userPoints < promotionPoints && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                <p className="font-medium">Insufficient points balance</p>
                <p className="text-xs mt-1">
                  You need {promotionPoints - userPoints} more points to promote
                  this project.
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Promotion Duration</Label>
            <RadioGroup
              value={String(duration)}
              onValueChange={(value) => setDuration(parseInt(value))}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="duration-3" />
                <Label htmlFor="duration-3" className="cursor-pointer text-sm">
                  3 days (30% discount)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="7" id="duration-7" />
                <Label htmlFor="duration-7" className="cursor-pointer text-sm">
                  7 days (standard)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="14" id="duration-14" />
                <Label htmlFor="duration-14" className="cursor-pointer text-sm">
                  14 days (20% more reach)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30" id="duration-30" />
                <Label htmlFor="duration-30" className="cursor-pointer text-sm">
                  30 days (50% more reach)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            {startDate && endDate && (
              <p className="text-xs text-slate-500">
                Your promotion will run from {format(startDate, "PPP")} to{" "}
                {format(endDate, "PPP")}.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Target Audience</Label>
            <RadioGroup
              value={audience}
              onValueChange={setAudience}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="audience-all" />
                <Label
                  htmlFor="audience-all"
                  className="cursor-pointer flex items-center"
                >
                  <Users className="h-4 w-4 mr-2" />
                  All users (maximum reach)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="targeted" id="audience-targeted" />
                <Label
                  htmlFor="audience-targeted"
                  className="cursor-pointer flex items-center"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Targeted (users interested in your project category)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Promotion Summary</h3>
              <Badge className="bg-teal-100 text-teal-700">Preview</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Points allocated:</span>
                <span className="font-medium">{promotionPoints}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated reach:</span>
                <span className="font-medium">
                  {calculateEstimatedReach()} users
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Duration:</span>
                <span className="font-medium">{duration} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Target audience:</span>
                <span className="font-medium capitalize">{audience}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-amber-500 mr-2" />
                  <span className="text-sm font-medium">
                    Your project will be featured
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePromote}
            disabled={isLoading || userPoints < promotionPoints}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Promote Project</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectPromoteDialog;
