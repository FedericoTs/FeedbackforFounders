import { useState, useEffect } from "react";
import { useAuth } from "../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "../../supabase/supabase";

interface LoginStreakResult {
  success: boolean;
  message?: string;
  streak: number;
  maxStreak: number;
  bonusPoints?: number;
  basePoints?: number;
  totalPoints?: number;
  streakBroken?: boolean;
  newRecord?: boolean;
  alreadyLoggedIn?: boolean;
}

/**
 * Hook to check and process daily login streak
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
      const lastLoginCheck = localStorage.getItem("last_streak_check");
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

      if (lastLoginCheck === today) {
        // Already checked today, don't process again
        setIsProcessing(false);
        return;
      }

      // Process the login streak
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-daily-streak",
        {
          body: { userId: user.id },
        },
      );

      if (error) {
        console.error("[Login Streak] Error processing login streak:", error);
        setResult({
          success: false,
          message: "Failed to process login streak",
          streak: 0,
          maxStreak: 0,
        });
        return;
      }

      setResult(data);

      // Store today's date to prevent multiple checks
      localStorage.setItem("last_streak_check", today);

      // Ensure the user's points are updated in the database
      try {
        if (data.success && !data.alreadyLoggedIn && data.totalPoints > 0) {
          console.log(
            `[Login Streak] Successfully processed streak. Total points: ${data.totalPoints}`,
          );

          // Get current user data to verify points were updated
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("points")
            .eq("id", user.id)
            .single();

          if (!userError && userData) {
            console.log(
              `[Login Streak] Current user points: ${userData.points}`,
            );
          }
        }
      } catch (syncError) {
        console.error("[Login Streak] Error syncing user points:", syncError);
      }

      // Show toast notification for streak achievements
      if (data.success && !data.alreadyLoggedIn) {
        // If it's a new record or a significant streak milestone
        if (
          data.newRecord ||
          data.streak === 7 ||
          data.streak === 14 ||
          data.streak === 30 ||
          data.streak === 100
        ) {
          toast({
            title: "Login Streak Achievement",
            description: data.message,
          });
        }

        // If there are bonus points
        if (data.bonusPoints > 0) {
          toast({
            title: "Streak Bonus Points",
            description: `You earned ${data.bonusPoints} bonus points for your ${data.streak}-day streak!`,
          });
        }
      }

      // If the streak was broken, show a gentle reminder
      if (data.streakBroken) {
        toast({
          title: "Streak Reset",
          description:
            "Your login streak was reset. Come back tomorrow to start building it again!",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in login streak processing:", error);
      setResult({
        success: false,
        message: "An error occurred while processing your login streak",
        streak: 0,
        maxStreak: 0,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, result };
}
