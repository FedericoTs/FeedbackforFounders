import { useState, useEffect } from "react";
import { useAuth } from "../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { rewardsService } from "@/services/rewards";
import { supabase } from "../../supabase/supabase";

/**
 * Hook to check for and process daily login rewards
 */
export function useLoginReward() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    points: number;
    message?: string;
  } | null>(null);

  useEffect(() => {
    // Only process login rewards if we have a user and haven't already processed
    if (user && !isProcessing && !result) {
      processLoginReward();
    }
  }, [user]);

  const processLoginReward = async () => {
    try {
      setIsProcessing(true);

      // Check if we've already processed a login reward today
      const lastLoginCheck = localStorage.getItem("last_login_check");
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

      if (lastLoginCheck === today) {
        // Already checked today, don't process again
        setIsProcessing(false);
        return;
      }

      // Process the login reward
      const rewardResult = await rewardsService.recordDailyLogin(user.id);
      setResult(rewardResult);

      // Store today's date to prevent multiple checks
      localStorage.setItem("last_login_check", today);

      // Ensure the user's points are updated in the database
      try {
        if (rewardResult.success && rewardResult.points > 0) {
          console.log(
            `[Login Reward] Successfully awarded ${rewardResult.points} points for daily login`,
          );

          // Get current user data
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("points")
            .eq("id", user.id)
            .single();

          if (!userError && userData) {
            console.log(
              `[Login Reward] Current user points: ${userData.points}`,
            );
          }
        }
      } catch (syncError) {
        console.error("[Login Reward] Error syncing user points:", syncError);
      }

      // Reward toast is handled by the rewardsService.processReward function
      // If for some reason the toast didn't show, we could add a fallback here
      if (rewardResult.success && rewardResult.points > 0) {
        console.log("[Login Reward] Successfully processed login reward");
      }
    } catch (error) {
      console.error("Error processing login reward:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, result };
}
