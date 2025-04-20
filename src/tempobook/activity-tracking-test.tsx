import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { activityService } from "@/services/activity";
import { projectService } from "@/services/project";
import { useAuth } from "../../supabase/auth";

const ActivityTrackingTest = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Test Project");
  const [projectDescription, setProjectDescription] = useState(
    "This is a test project created from the activity tracking test tool.",
  );

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

  const createTestProject = async () => {
    if (!user) {
      alert("Please log in to create a test project");
      return;
    }

    try {
      setLoading(true);
      const project = await projectService.createProject(
        {
          title: projectTitle,
          description: projectDescription,
          visibility: "public",
          category: "test",
          tags: ["test", "activity-tracking"],
        },
        user.id,
      );

      alert(`Test project created successfully! ID: ${project.id}`);
      fetchActivities();
    } catch (error) {
      console.error("Error creating test project:", error);
      alert(`Error creating test project: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Activity Tracking Test Suite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Create Test Activity</h3>
              <Button
                onClick={createTestActivity}
                className="bg-teal-500 hover:bg-teal-600 mb-4"
                disabled={loading || !user}
              >
                Create Test Activity
              </Button>

              <h3 className="text-lg font-medium mb-4 mt-6">
                Create Test Project
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="projectTitle">Project Title</Label>
                  <Input
                    id="projectTitle"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <div>
                  <Label htmlFor="projectDescription">
                    Project Description
                  </Label>
                  <Textarea
                    id="projectDescription"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="mb-4"
                  />
                </div>
                <Button
                  onClick={createTestProject}
                  className="bg-blue-500 hover:bg-blue-600"
                  disabled={loading || !user}
                >
                  Create Test Project
                </Button>
              </div>
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
