import { useState, useEffect } from "react";
import { useAuth } from "@/supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/supabase/supabase";

interface LoginStreakResult {
  success: boolean;
  streak: number;
  maxStreak: number;
  message?: string;
}

/**
 * Hook to check and update the user's login streak
 */
export function useLoginStreak() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<LoginStreakResult | null>(null);

  useEffect(() => {
    // Only process login streak if we have a user and haven't already processed
    if (user && !isProcessing && !result) {
      processLoginStreak();
    }
  }, [user]);

  const processLoginStreak = async () => {
    try {
      setIsProcessing(true);

      // Check if we've already processed a login streak today
      const lastStreakCheck = localStorage.getItem("last_streak_check");
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

      if (lastStreakCheck === today) {
        // Already checked today, don't process again
        setIsProcessing(false);
        return;
      }

      // Get the user's current streak data
      const { data: streakData, error: streakError } = await supabase
        .from("user_login_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (streakError && streakError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" error, which is expected for new users
        console.error("Error fetching streak data:", streakError);
        setIsProcessing(false);
        return;
      }

      // Call the Supabase Edge Function to process the streak
      const { data: streakResult, error: functionError } =
        await supabase.functions.invoke("supabase-functions-daily-streak", {
          body: { userId: user.id },
        });

      if (functionError) {
        console.error("Error processing login streak:", functionError);
        setIsProcessing(false);
        return;
      }

      // Store today's date to prevent multiple checks
      localStorage.setItem("last_streak_check", today);

      // Set the result
      setResult({
        success: true,
        streak: streakResult?.streak || 1,
        maxStreak: streakResult?.maxStreak || 1,
        message: streakResult?.message || "Login streak updated!",
      });

      // Show a toast for streak milestones
      if (streakResult?.streakMilestone) {
        toast({
          title: "Streak Milestone!",
          description: `You've logged in for ${streakResult.streak} days in a row! Keep it up!`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error processing login streak:", error);
      setResult({
        success: false,
        streak: 0,
        maxStreak: 0,
        message: "Failed to process login streak.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, result };
}
