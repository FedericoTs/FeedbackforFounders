import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { activityService } from "@/services/activity";
import { processGoalCreationActivity } from "@/lib/activityWorkflows";
import { useAuth } from "../../supabase/auth";
import { supabase } from "../../supabase/supabase";

const ActivityTrackingTest = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Test Project");
  const [projectDescription, setProjectDescription] = useState(
    "This is a test project created from the activity tracking test tool.",
  );
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await activityService.getUserActivities(user.id, 20);
      setActivities(data);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTestActivity = async () => {
    if (!user) {
      alert("Please log in to create a test activity");
      return;
    }

    try {
      const result = await activityService.recordActivity({
        user_id: user.id,
        activity_type: "test_activity",
        description: "Test activity created from test tool",
        points: 10,
        metadata: { source: "test_tool", timestamp: new Date().toISOString() },
      });

      if (result.success) {
        alert("Test activity created successfully!");
        fetchActivities();
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

  const testGoalCreation = async () => {
    if (!user) {
      alert("Please log in to test goal creation");
      return;
    }

    try {
      setLoading(true);
      // Use a fixed project ID for testing or create a new one
      const projectId = "test-project-id";

      const testResult = await processGoalCreationActivity({
        userId: user.id,
        goalTitle: "Test Goal " + new Date().toISOString().substring(0, 19),
        goalType: "milestone",
        projectId,
      });

      setResult(testResult);
      alert(`Goal creation test result: ${JSON.stringify(testResult)}`);
      fetchActivities();
    } catch (error) {
      console.error("Error testing goal creation:", error);
      alert(`Error testing goal creation: ${error.message || "Unknown error"}`);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Activity Tracking Test Suite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Test Actions</h3>
              <Button
                onClick={createTestActivity}
                className="bg-teal-500 hover:bg-teal-600 mb-4 w-full"
                disabled={loading || !user}
              >
                Create Test Activity
              </Button>

              <Button
                onClick={testGoalCreation}
                className="bg-blue-500 hover:bg-blue-600 mb-4 w-full"
                disabled={loading || !user}
              >
                Test Goal Creation Activity
              </Button>

              {result && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                  <h3 className="font-semibold mb-2">Result:</h3>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Recent Activities</h3>
              <Button
                onClick={fetchActivities}
                className="bg-slate-500 hover:bg-slate-600 mb-4"
                disabled={loading || !user}
              >
                Refresh Activities
              </Button>

              <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                {loading ? (
                  <p>Loading activities...</p>
                ) : activities.length > 0 ? (
                  <ul className="space-y-2">
                    {activities.map((activity) => (
                      <li key={activity.id} className="border-b pb-2">
                        <p className="font-medium">{activity.activity_type}</p>
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                        {activity.points !== 0 && (
                          <p className="text-xs text-teal-600">
                            Points: {activity.points}
                          </p>
                        )}
                        {activity.metadata && (
                          <details className="mt-1">
                            <summary className="text-xs cursor-pointer text-slate-500">
                              Metadata
                            </summary>
                            <pre className="text-xs mt-1 p-2 bg-slate-50 rounded">
                              {JSON.stringify(activity.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No activities found.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityTrackingTest;
