import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../supabase/auth";
import { projectService, ProjectGoal } from "@/services/project";
// Import the standardized workflow functions instead of direct activity service
// import { activityService } from "@/services/activity";
import {
  processGoalCreationActivity,
  processGoalUpdateActivity,
  processGoalCompletionActivity,
  processGoalDeletionActivity,
} from "@/lib/activityWorkflows";
import {
  BarChart2,
  Check,
  Edit,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Target,
  ThumbsUp,
  Trash2,
  Users,
} from "lucide-react";

interface ProjectGoalsPanelProps {
  projectId: string;
}

const ProjectGoalsPanel = ({ projectId }: ProjectGoalsPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<ProjectGoal[]>([]);
  const [showAddGoalDialog, setShowAddGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ProjectGoal | null>(null);
  const [newGoal, setNewGoal] = useState<Partial<ProjectGoal>>({
    project_id: projectId,
    title: "",
    description: "",
    target_value: 10,
    current_value: 0,
    goal_type: "feedback_count",
    status: "in_progress",
  });

  useEffect(() => {
    if (projectId && user) {
      fetchGoals();
    }
  }, [projectId, user]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const goalsData = await projectService.getProjectGoals(projectId);
      setGoals(goalsData);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast({
        title: "Error",
        description: "Failed to load project goals. Please try again.",
        variant: "destructive",
      });
      setGoals([]); // Set empty array to prevent undefined errors
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    try {
      if (!user) return;
      if (!newGoal.title) {
        toast({
          title: "Error",
          description: "Please provide a title for the goal",
          variant: "destructive",
        });
        return;
      }

      // Step 1-3: Data validation and preparation
      console.log("Goal creation workflow: Validating and preparing data");

      // Step 4: Goal Persistence - Save goal details to the project_goals table
      console.log("Goal creation workflow: Persisting goal data");
      const createdGoal = await projectService.createProjectGoal(
        newGoal as Omit<ProjectGoal, "id" | "created_at" | "updated_at">,
        user.id,
      );

      // Step 5-6: Activity Recording and Points Update using standardized workflow function
      await processGoalCreationActivity({
        userId: user.id,
        goalTitle: newGoal.title,
        goalType: newGoal.goal_type,
        projectId: projectId,
      });

      // Step 7: Completion - Reset form (reward toast is handled by activityWorkflows)
      console.log("Goal creation workflow: Completing process");

      // Reset form and close dialog
      setNewGoal({
        project_id: projectId,
        title: "",
        description: "",
        target_value: 10,
        current_value: 0,
        goal_type: "feedback_count",
        status: "in_progress",
      });
      setShowAddGoalDialog(false);
      fetchGoals();
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGoal = async () => {
    try {
      if (!user || !editingGoal) return;

      // Step 1-3: Data validation and preparation
      console.log("Goal update workflow: Validating and preparing data");

      // Step 4: Goal Update Persistence - Update goal details in the project_goals table
      console.log("Goal update workflow: Persisting goal updates");
      const updatedGoal = await projectService.updateProjectGoal(
        editingGoal.id,
        editingGoal,
        user.id,
      );

      // Step 5-6: Activity Recording and Points Update using standardized workflow function
      await processGoalUpdateActivity({
        userId: user.id,
        goalTitle: editingGoal.title,
        goalType: editingGoal.goal_type,
        projectId: editingGoal.project_id,
      });

      // Step 7: Completion - Reset form (reward toast is handled by activityWorkflows)
      console.log("Goal update workflow: Completing process");

      setEditingGoal(null);
      fetchGoals();
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      if (!user) return;

      // Step 1-2: Confirmation handled by the AlertDialog component
      console.log("Goal deletion workflow: Confirmation received");

      // Get goal details before deletion for activity recording
      const goalToDelete = goals.find((goal) => goal.id === goalId);
      if (!goalToDelete) {
        throw new Error("Goal not found");
      }

      // Step 3: Goal Removal - Remove goal from the project_goals table
      console.log("Goal deletion workflow: Removing goal");
      await projectService.deleteProjectGoal(goalId, user.id);

      // Step 4-5: Activity Recording and Points Update using standardized workflow function
      await processGoalDeletionActivity({
        userId: user.id,
        goalTitle: goalToDelete.title,
        goalType: goalToDelete.goal_type,
        projectId: goalToDelete.project_id,
      });

      // Step 6: Completion - Refresh goals (reward toast is handled by activityWorkflows)
      console.log("Goal deletion workflow: Completing process");

      fetchGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Error",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsCompleted = async (goal: ProjectGoal) => {
    try {
      if (!user) return;

      // Step 1: Status Update - Update goal status to "completed" in the project_goals table
      console.log("Goal completion workflow: Updating status");
      await projectService.updateProjectGoal(
        goal.id,
        { status: "completed" },
        user.id,
      );

      // Step 3-4: Activity Recording and Points Update using standardized workflow function
      await processGoalCompletionActivity({
        userId: user.id,
        goalTitle: goal.title,
        goalType: goal.goal_type,
        projectId: goal.project_id,
        currentValue: goal.current_value,
        targetValue: goal.target_value,
      });

      // Step 5: Completion - Refresh goals (reward toast is handled by activityWorkflows)
      console.log("Goal completion workflow: Completing process");

      fetchGoals();
    } catch (error) {
      console.error("Error updating goal status:", error);
      toast({
        title: "Error",
        description: "Failed to update goal status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getGoalTypeIcon = (goalType: string) => {
    switch (goalType) {
      case "feedback_count":
        return <MessageSquare className="h-4 w-4" />;
      case "positive_feedback":
        return <ThumbsUp className="h-4 w-4" />;
      case "engagement":
        return <Users className="h-4 w-4" />;
      case "custom":
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getGoalTypeLabel = (goalType: string) => {
    switch (goalType) {
      case "feedback_count":
        return "Feedback Count";
      case "positive_feedback":
        return "Positive Feedback";
      case "engagement":
        return "User Engagement";
      case "custom":
      default:
        return "Custom Goal";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400";
      case "cancelled":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400";
      case "in_progress":
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400";
    }
  };

  const calculateProgress = (current: number, target: number) => {
    if (target <= 0) return 0;
    const progress = (current / target) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Project Goals</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Set and track specific validation and feedback goals for your
            project
          </p>
        </div>
        <Button onClick={() => setShowAddGoalDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="bg-slate-50 dark:bg-slate-800/50">
          <CardContent className="pt-6 text-center">
            <Target className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No goals yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Set specific goals to track the success of your project
            </p>
            <Button onClick={() => setShowAddGoalDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div
                      className="mr-2 p-2 rounded-full bg-slate-100 dark:bg-slate-800"
                      title={getGoalTypeLabel(goal.goal_type)}
                    >
                      {getGoalTypeIcon(goal.goal_type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <Badge className={getStatusBadgeClass(goal.status)}>
                        {goal.status === "in_progress"
                          ? "In Progress"
                          : goal.status === "completed"
                            ? "Completed"
                            : "Cancelled"}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => setEditingGoal(goal)}
                        disabled={goal.status === "completed"}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit Goal
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleMarkAsCompleted(goal)}
                        disabled={goal.status === "completed"}
                      >
                        <Check className="h-4 w-4 mr-2" /> Mark as Completed
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this goal? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {goal.description && (
                  <CardDescription className="mt-2">
                    {goal.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Progress</span>
                      <span>
                        {goal.current_value} / {goal.target_value}
                      </span>
                    </div>
                    <Progress
                      value={calculateProgress(
                        goal.current_value,
                        goal.target_value,
                      )}
                      className="h-2"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Goal Type: {getGoalTypeLabel(goal.goal_type)}</span>
                    <span>
                      {calculateProgress(
                        goal.current_value,
                        goal.target_value,
                      ).toFixed(0)}
                      % Complete
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Goal Dialog */}
      <Dialog open={showAddGoalDialog} onOpenChange={setShowAddGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Set a specific goal to track the success of your project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title *</Label>
              <Input
                id="title"
                value={newGoal.title}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, title: e.target.value })
                }
                placeholder="e.g., Reach 100 feedback submissions"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newGoal.description}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, description: e.target.value })
                }
                placeholder="Describe what you want to achieve with this goal"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goal-type">Goal Type</Label>
                <Select
                  value={newGoal.goal_type}
                  onValueChange={(value) =>
                    setNewGoal({
                      ...newGoal,
                      goal_type: value as ProjectGoal["goal_type"],
                    })
                  }
                >
                  <SelectTrigger id="goal-type">
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feedback_count">
                      Feedback Count
                    </SelectItem>
                    <SelectItem value="positive_feedback">
                      Positive Feedback
                    </SelectItem>
                    <SelectItem value="engagement">User Engagement</SelectItem>
                    <SelectItem value="custom">Custom Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-value">Target Value</Label>
                <Input
                  id="target-value"
                  type="number"
                  min="1"
                  value={newGoal.target_value}
                  onChange={(e) =>
                    setNewGoal({
                      ...newGoal,
                      target_value: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-value">Current Value</Label>
              <Input
                id="current-value"
                type="number"
                min="0"
                value={newGoal.current_value}
                onChange={(e) =>
                  setNewGoal({
                    ...newGoal,
                    current_value: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddGoalDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateGoal}>Create Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog
        open={editingGoal !== null}
        onOpenChange={(open) => !open && setEditingGoal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update the details of your project goal
            </DialogDescription>
          </DialogHeader>
          {editingGoal && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Goal Title *</Label>
                <Input
                  id="edit-title"
                  value={editingGoal.title}
                  onChange={(e) =>
                    setEditingGoal({ ...editingGoal, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingGoal.description || ""}
                  onChange={(e) =>
                    setEditingGoal({
                      ...editingGoal,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-goal-type">Goal Type</Label>
                  <Select
                    value={editingGoal.goal_type}
                    onValueChange={(value) =>
                      setEditingGoal({
                        ...editingGoal,
                        goal_type: value as ProjectGoal["goal_type"],
                      })
                    }
                  >
                    <SelectTrigger id="edit-goal-type">
                      <SelectValue placeholder="Select goal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feedback_count">
                        Feedback Count
                      </SelectItem>
                      <SelectItem value="positive_feedback">
                        Positive Feedback
                      </SelectItem>
                      <SelectItem value="engagement">
                        User Engagement
                      </SelectItem>
                      <SelectItem value="custom">Custom Goal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-target-value">Target Value</Label>
                  <Input
                    id="edit-target-value"
                    type="number"
                    min="1"
                    value={editingGoal.target_value}
                    onChange={(e) =>
                      setEditingGoal({
                        ...editingGoal,
                        target_value: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-current-value">Current Value</Label>
                <Input
                  id="edit-current-value"
                  type="number"
                  min="0"
                  value={editingGoal.current_value}
                  onChange={(e) =>
                    setEditingGoal({
                      ...editingGoal,
                      current_value: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editingGoal.status}
                  onValueChange={(value) =>
                    setEditingGoal({
                      ...editingGoal,
                      status: value as ProjectGoal["status"],
                    })
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGoal(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGoal}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectGoalsPanel;
