import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { activityService } from "@/services/activity";
import { useAuth } from "../../supabase/auth";

const ActivityTrackingStoryboard = () => {
  const { user } = useAuth();

  const createTestActivity = async () => {
    if (!user) {
      alert("Please log in to create a test activity");
      return;
    }

    try {
      const result = await activityService.recordActivity({
        user_id: user.id,
        activity_type: "test_activity",
        description: "Test activity created from storyboard",
        points: 10,
        metadata: { source: "storyboard", timestamp: new Date().toISOString() },
      });

      if (result.success) {
        alert("Test activity created successfully!");
      } else {
        alert(
          `Failed to create test activity: ${result.error?.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error creating test activity:", error);
      alert(
        `Error creating test activity: ${error.message || "Unknown error"}`,
      );
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Activity Tracking Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This storyboard allows you to test the activity tracking
            functionality.
          </p>
          <Button
            onClick={createTestActivity}
            className="bg-teal-500 hover:bg-teal-600"
          >
            Create Test Activity
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityTrackingStoryboard;
