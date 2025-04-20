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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
import {
  projectService,
  ProjectQuestionnaire,
  Question,
} from "@/services/project";
import {
  ClipboardList,
  Copy,
  Edit,
  Eye,
  Loader2,
  MoreHorizontal,
  Plus,
  Send,
  Star,
  Trash2,
  Type,
  ListChecks,
  MessageSquare,
  MoveVertical,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectQuestionnairesPanelProps {
  projectId: string;
}

const ProjectQuestionnairesPanel = ({
  projectId,
}: ProjectQuestionnairesPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [questionnaires, setQuestionnaires] = useState<ProjectQuestionnaire[]>(
    [],
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] =
    useState<ProjectQuestionnaire | null>(null);
  const [viewingQuestionnaire, setViewingQuestionnaire] =
    useState<ProjectQuestionnaire | null>(null);
  const [newQuestionnaire, setNewQuestionnaire] = useState<
    Partial<ProjectQuestionnaire>
  >({
    project_id: projectId,
    title: "",
    description: "",
    questions: [],
    is_active: true,
  });
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    id: crypto.randomUUID(),
    text: "",
    required: false,
    type: "text",
    order: 0,
  });

  useEffect(() => {
    if (projectId && user) {
      fetchQuestionnaires();
    }
  }, [projectId, user]);

  const fetchQuestionnaires = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjectQuestionnaires(projectId);
      setQuestionnaires(data);
    } catch (error) {
      console.error("Error fetching questionnaires:", error);
      toast({
        title: "Error",
        description: "Failed to load questionnaires. Please try again.",
        variant: "destructive",
      });
      setQuestionnaires([]); // Set empty array to prevent undefined errors
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.text) {
      toast({
        title: "Error",
        description: "Question text is required",
        variant: "destructive",
      });
      return;
    }

    let questionToAdd: Question;

    switch (currentQuestion.type) {
      case "multiple_choice":
        questionToAdd = {
          id: currentQuestion.id || crypto.randomUUID(),
          text: currentQuestion.text,
          required: currentQuestion.required || false,
          type: "multiple_choice",
          options: (currentQuestion as any).options || ["Option 1"],
          allow_multiple: (currentQuestion as any).allow_multiple || false,
          order:
            newQuestionnaire.questions?.length ||
            editingQuestionnaire?.questions?.length ||
            0,
        };
        break;
      case "rating":
        questionToAdd = {
          id: currentQuestion.id || crypto.randomUUID(),
          text: currentQuestion.text,
          required: currentQuestion.required || false,
          type: "rating",
          max_rating: (currentQuestion as any).max_rating || 5,
          order:
            newQuestionnaire.questions?.length ||
            editingQuestionnaire?.questions?.length ||
            0,
        };
        break;
      case "text":
      default:
        questionToAdd = {
          id: currentQuestion.id || crypto.randomUUID(),
          text: currentQuestion.text,
          required: currentQuestion.required || false,
          type: "text",
          placeholder: (currentQuestion as any).placeholder || "",
          order:
            newQuestionnaire.questions?.length ||
            editingQuestionnaire?.questions?.length ||
            0,
        };
    }

    if (editingQuestionnaire) {
      // Check if we're editing an existing question
      const existingIndex = editingQuestionnaire.questions.findIndex(
        (q) => q.id === questionToAdd.id,
      );

      if (existingIndex >= 0) {
        // Update existing question
        const updatedQuestions = [...editingQuestionnaire.questions];
        updatedQuestions[existingIndex] = questionToAdd;
        setEditingQuestionnaire({
          ...editingQuestionnaire,
          questions: updatedQuestions,
        });
      } else {
        // Add new question
        setEditingQuestionnaire({
          ...editingQuestionnaire,
          questions: [...editingQuestionnaire.questions, questionToAdd],
        });
      }
    } else {
      // Add to new questionnaire
      setNewQuestionnaire({
        ...newQuestionnaire,
        questions: [...(newQuestionnaire.questions || []), questionToAdd],
      });
    }

    // Reset current question
    setCurrentQuestion({
      id: crypto.randomUUID(),
      text: "",
      required: false,
      type: "text",
      order: 0,
    });
  };

  const handleEditQuestion = (question: Question) => {
    setCurrentQuestion(question);
  };

  const handleRemoveQuestion = (questionId: string) => {
    if (editingQuestionnaire) {
      setEditingQuestionnaire({
        ...editingQuestionnaire,
        questions: editingQuestionnaire.questions.filter(
          (q) => q.id !== questionId,
        ),
      });
    } else {
      setNewQuestionnaire({
        ...newQuestionnaire,
        questions: (newQuestionnaire.questions || []).filter(
          (q) => q.id !== questionId,
        ),
      });
    }
  };

  const handleMoveQuestion = (questionId: string, direction: "up" | "down") => {
    const questions = editingQuestionnaire
      ? [...editingQuestionnaire.questions]
      : [...(newQuestionnaire.questions || [])];

    const index = questions.findIndex((q) => q.id === questionId);
    if (index < 0) return;

    if (direction === "up" && index > 0) {
      // Swap with previous question
      [questions[index - 1], questions[index]] = [
        questions[index],
        questions[index - 1],
      ];
    } else if (direction === "down" && index < questions.length - 1) {
      // Swap with next question
      [questions[index], questions[index + 1]] = [
        questions[index + 1],
        questions[index],
      ];
    }

    // Update order property
    const updatedQuestions = questions.map((q, i) => ({ ...q, order: i }));

    if (editingQuestionnaire) {
      setEditingQuestionnaire({
        ...editingQuestionnaire,
        questions: updatedQuestions,
      });
    } else {
      setNewQuestionnaire({
        ...newQuestionnaire,
        questions: updatedQuestions,
      });
    }
  };

  const handleAddOption = () => {
    if (currentQuestion.type !== "multiple_choice") return;

    const currentOptions = (currentQuestion as any).options || [];
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentOptions, `Option ${currentOptions.length + 1}`],
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    if (currentQuestion.type !== "multiple_choice") return;

    const options = [...((currentQuestion as any).options || [])];
    options[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options,
    });
  };

  const handleRemoveOption = (index: number) => {
    if (currentQuestion.type !== "multiple_choice") return;

    const options = [...((currentQuestion as any).options || [])];
    options.splice(index, 1);
    setCurrentQuestion({
      ...currentQuestion,
      options,
    });
  };

  const handleCreateQuestionnaire = async () => {
    try {
      if (!user) return;
      if (!newQuestionnaire.title) {
        toast({
          title: "Error",
          description: "Please provide a title for the questionnaire",
          variant: "destructive",
        });
        return;
      }

      if (
        !newQuestionnaire.questions ||
        newQuestionnaire.questions.length === 0
      ) {
        toast({
          title: "Error",
          description: "Please add at least one question",
          variant: "destructive",
        });
        return;
      }

      const createdQuestionnaire = await projectService.createQuestionnaire(
        newQuestionnaire as Omit<
          ProjectQuestionnaire,
          "id" | "created_at" | "updated_at"
        >,
        user.id,
      );

      // Import and use activityService to record this activity
      const { activityService } = await import("@/services/activity");
      await activityService.recordActivity({
        user_id: user.id,
        activity_type: "questionnaire_created",
        description: `Created questionnaire: ${newQuestionnaire.title}`,
        project_id: projectId,
        metadata: {
          questionnaireTitle: newQuestionnaire.title,
          questionCount: newQuestionnaire.questions?.length || 0,
        },
      });

      toast({
        title: "Success",
        description: "Questionnaire created successfully",
      });

      // Reset form and close dialog
      setNewQuestionnaire({
        project_id: projectId,
        title: "",
        description: "",
        questions: [],
        is_active: true,
      });
      setShowAddDialog(false);
      fetchQuestionnaires();
    } catch (error) {
      console.error("Error creating questionnaire:", error);
      toast({
        title: "Error",
        description: "Failed to create questionnaire. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuestionnaire = async () => {
    try {
      if (!user || !editingQuestionnaire) return;

      if (!editingQuestionnaire.title) {
        toast({
          title: "Error",
          description: "Please provide a title for the questionnaire",
          variant: "destructive",
        });
        return;
      }

      if (editingQuestionnaire.questions.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one question",
          variant: "destructive",
        });
        return;
      }

      await projectService.updateQuestionnaire(
        editingQuestionnaire.id,
        editingQuestionnaire,
        user.id,
      );

      toast({
        title: "Success",
        description: "Questionnaire updated successfully",
      });

      setEditingQuestionnaire(null);
      fetchQuestionnaires();
    } catch (error) {
      console.error("Error updating questionnaire:", error);
      toast({
        title: "Error",
        description: "Failed to update questionnaire. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestionnaire = async (questionnaireId: string) => {
    try {
      if (!user) return;

      await projectService.deleteQuestionnaire(questionnaireId, user.id);

      toast({
        title: "Success",
        description: "Questionnaire deleted successfully",
      });

      fetchQuestionnaires();
    } catch (error) {
      console.error("Error deleting questionnaire:", error);
      toast({
        title: "Error",
        description: "Failed to delete questionnaire. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (questionnaire: ProjectQuestionnaire) => {
    try {
      if (!user) return;

      await projectService.updateQuestionnaire(
        questionnaire.id,
        { is_active: !questionnaire.is_active },
        user.id,
      );

      toast({
        title: "Success",
        description: questionnaire.is_active
          ? "Questionnaire deactivated"
          : "Questionnaire activated",
      });

      fetchQuestionnaires();
    } catch (error) {
      console.error("Error toggling questionnaire status:", error);
      toast({
        title: "Error",
        description: "Failed to update questionnaire status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyShareLink = (questionnaireId: string) => {
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/questionnaire/${questionnaireId}`;
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied",
      description: "Questionnaire link has been copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderQuestionForm = () => {
    return (
      <div className="space-y-4 border p-4 rounded-md bg-slate-50 dark:bg-slate-800/50">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium">
            {currentQuestion.id &&
            (editingQuestionnaire?.questions.some(
              (q) => q.id === currentQuestion.id,
            ) ||
              newQuestionnaire.questions?.some(
                (q) => q.id === currentQuestion.id,
              ))
              ? "Edit Question"
              : "Add Question"}
          </h3>
          <Select
            value={currentQuestion.type}
            onValueChange={(value) => {
              // Reset question when changing type but keep text and required
              const { text, required } = currentQuestion;
              let newQuestion: Partial<Question> = {
                id: currentQuestion.id,
                text,
                required,
                type: value as Question["type"],
                order: currentQuestion.order,
              };

              // Add type-specific properties
              if (value === "multiple_choice") {
                newQuestion = {
                  ...newQuestion,
                  options: ["Option 1"],
                  allow_multiple: false,
                };
              } else if (value === "rating") {
                newQuestion = {
                  ...newQuestion,
                  max_rating: 5,
                };
              } else if (value === "text") {
                newQuestion = {
                  ...newQuestion,
                  placeholder: "",
                };
              }

              setCurrentQuestion(newQuestion);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Input</SelectItem>
              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="question-text">Question Text *</Label>
          <Input
            id="question-text"
            value={currentQuestion.text}
            onChange={(e) =>
              setCurrentQuestion({ ...currentQuestion, text: e.target.value })
            }
            placeholder="Enter your question here"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="required"
            checked={currentQuestion.required}
            onCheckedChange={(checked) =>
              setCurrentQuestion({ ...currentQuestion, required: checked })
            }
          />
          <Label htmlFor="required">Required question</Label>
        </div>

        {/* Type-specific options */}
        {currentQuestion.type === "text" && (
          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder (optional)</Label>
            <Input
              id="placeholder"
              value={(currentQuestion as any).placeholder || ""}
              onChange={(e) =>
                setCurrentQuestion({
                  ...currentQuestion,
                  placeholder: e.target.value,
                })
              }
              placeholder="Enter placeholder text"
            />
          </div>
        )}

        {currentQuestion.type === "rating" && (
          <div className="space-y-2">
            <Label htmlFor="max-rating">Maximum Rating</Label>
            <Select
              value={String((currentQuestion as any).max_rating || 5)}
              onValueChange={(value) =>
                setCurrentQuestion({
                  ...currentQuestion,
                  max_rating: parseInt(value),
                })
              }
            >
              <SelectTrigger id="max-rating">
                <SelectValue placeholder="Select max rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="10">10 Points</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {currentQuestion.type === "multiple_choice" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="allow-multiple"
                checked={(currentQuestion as any).allow_multiple || false}
                onCheckedChange={(checked) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    allow_multiple: checked,
                  })
                }
              />
              <Label htmlFor="allow-multiple">Allow multiple selections</Label>
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {((currentQuestion as any).options || []).map(
                  (option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={option}
                        onChange={(e) =>
                          handleUpdateOption(index, e.target.value)
                        }
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                        disabled={
                          ((currentQuestion as any).options || []).length <= 1
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ),
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Option
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <Button
            type="button"
            onClick={() =>
              setCurrentQuestion({
                id: crypto.randomUUID(),
                text: "",
                required: false,
                type: "text",
                order: 0,
              })
            }
            variant="outline"
          >
            Clear
          </Button>
          <Button type="button" onClick={handleAddQuestion}>
            {currentQuestion.id &&
            (editingQuestionnaire?.questions.some(
              (q) => q.id === currentQuestion.id,
            ) ||
              newQuestionnaire.questions?.some(
                (q) => q.id === currentQuestion.id,
              ))
              ? "Update Question"
              : "Add Question"}
          </Button>
        </div>
      </div>
    );
  };

  const renderQuestionsList = (questions: Question[]) => {
    if (questions.length === 0) {
      return (
        <div className="text-center py-4 text-slate-500">
          No questions added yet. Add your first question above.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {questions
          .sort((a, b) => a.order - b.order)
          .map((question) => (
            <div
              key={question.id}
              className="border rounded-md p-4 bg-white dark:bg-slate-900"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs font-normal">
                      {question.type === "text"
                        ? "Text"
                        : question.type === "multiple_choice"
                          ? "Multiple Choice"
                          : "Rating"}
                    </Badge>
                    {question.required && (
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        Required
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-medium mt-2">{question.text}</h4>

                  {question.type === "text" && (
                    <p className="text-sm text-slate-500 mt-1">
                      {(question as any).placeholder
                        ? `Placeholder: ${(question as any).placeholder}`
                        : "No placeholder text"}
                    </p>
                  )}

                  {question.type === "multiple_choice" && (
                    <div className="mt-2">
                      <p className="text-sm text-slate-500 mb-1">
                        {(question as any).allow_multiple
                          ? "Multiple selections allowed"
                          : "Single selection only"}
                      </p>
                      <div className="space-y-1">
                        {(question as any).options.map(
                          (option: string, i: number) => (
                            <div
                              key={i}
                              className="text-sm pl-2 border-l-2 border-slate-200"
                            >
                              {option}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {question.type === "rating" && (
                    <p className="text-sm text-slate-500 mt-1">
                      Maximum rating: {(question as any).max_rating}
                    </p>
                  )}
                </div>

                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveQuestion(question.id, "up")}
                    className="h-8 w-8"
                    title="Move up"
                  >
                    <MoveVertical className="h-4 w-4 rotate-180" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveQuestion(question.id, "down")}
                    className="h-8 w-8"
                    title="Move down"
                  >
                    <MoveVertical className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditQuestion(question)}
                    className="h-8 w-8"
                    title="Edit question"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveQuestion(question.id)}
                    className="h-8 w-8 text-red-500"
                    title="Remove question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
      </div>
    );
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
          <h2 className="text-xl font-bold">Questionnaires</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Create custom questionnaires to gather structured feedback
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Questionnaire
        </Button>
      </div>

      {questionnaires.length === 0 ? (
        <Card className="bg-slate-50 dark:bg-slate-800/50">
          <CardContent className="pt-6 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No questionnaires yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Create custom questionnaires to gather structured feedback from
              your audience
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Your First Questionnaire
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {questionnaires.map((questionnaire) => (
            <Card key={questionnaire.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {questionnaire.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge
                        className={`${questionnaire.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"}`}
                      >
                        {questionnaire.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-normal">
                        {questionnaire.questions.length} questions
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
                        onClick={() => setViewingQuestionnaire(questionnaire)}
                      >
                        <Eye className="h-4 w-4 mr-2" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCopyShareLink(questionnaire.id)}
                      >
                        <Copy className="h-4 w-4 mr-2" /> Copy Share Link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setEditingQuestionnaire(questionnaire)}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(questionnaire)}
                      >
                        {questionnaire.is_active ? (
                          <>
                            <X className="h-4 w-4 mr-2" /> Deactivate
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" /> Activate
                          </>
                        )}
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
                            <AlertDialogTitle>
                              Delete Questionnaire
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this
                              questionnaire? This action cannot be undone and
                              all responses will be lost.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteQuestionnaire(questionnaire.id)
                              }
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
                {questionnaire.description && (
                  <CardDescription className="mt-2">
                    {questionnaire.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Created: {formatDate(questionnaire.created_at)}</span>
                    <span>Updated: {formatDate(questionnaire.updated_at)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {questionnaire.questions.slice(0, 3).map((question) => (
                      <Badge
                        key={question.id}
                        variant="outline"
                        className="text-xs font-normal"
                      >
                        {question.text.length > 30
                          ? `${question.text.substring(0, 30)}...`
                          : question.text}
                      </Badge>
                    ))}
                    {questionnaire.questions.length > 3 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        +{questionnaire.questions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setViewingQuestionnaire(questionnaire)}
                >
                  <Eye className="h-4 w-4 mr-2" /> Preview Questionnaire
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add Questionnaire Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Questionnaire</DialogTitle>
            <DialogDescription>
              Design a custom questionnaire to gather feedback from your
              audience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Questionnaire Title *</Label>
                <Input
                  id="title"
                  value={newQuestionnaire.title}
                  onChange={(e) =>
                    setNewQuestionnaire({
                      ...newQuestionnaire,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g., User Experience Feedback"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="status"
                    checked={newQuestionnaire.is_active}
                    onCheckedChange={(checked) =>
                      setNewQuestionnaire({
                        ...newQuestionnaire,
                        is_active: checked,
                      })
                    }
                  />
                  <Label htmlFor="status">
                    {newQuestionnaire.is_active ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newQuestionnaire.description || ""}
                onChange={(e) =>
                  setNewQuestionnaire({
                    ...newQuestionnaire,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the purpose of this questionnaire"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Questions</h3>
              {renderQuestionForm()}

              <div className="mt-6">
                <h4 className="text-md font-medium mb-3">Question List</h4>
                {renderQuestionsList(newQuestionnaire.questions as Question[])}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewQuestionnaire({
                  project_id: projectId,
                  title: "",
                  description: "",
                  questions: [],
                  is_active: true,
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateQuestionnaire}>
              Create Questionnaire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Questionnaire Dialog */}
      <Dialog
        open={editingQuestionnaire !== null}
        onOpenChange={(open) => !open && setEditingQuestionnaire(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Questionnaire</DialogTitle>
            <DialogDescription>
              Update your questionnaire details and questions
            </DialogDescription>
          </DialogHeader>
          {editingQuestionnaire && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Questionnaire Title *</Label>
                  <Input
                    id="edit-title"
                    value={editingQuestionnaire.title}
                    onChange={(e) =>
                      setEditingQuestionnaire({
                        ...editingQuestionnaire,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-status"
                      checked={editingQuestionnaire.is_active}
                      onCheckedChange={(checked) =>
                        setEditingQuestionnaire({
                          ...editingQuestionnaire,
                          is_active: checked,
                        })
                      }
                    />
                    <Label htmlFor="edit-status">
                      {editingQuestionnaire.is_active ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Textarea
                  id="edit-description"
                  value={editingQuestionnaire.description || ""}
                  onChange={(e) =>
                    setEditingQuestionnaire({
                      ...editingQuestionnaire,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Questions</h3>
                {renderQuestionForm()}

                <div className="mt-6">
                  <h4 className="text-md font-medium mb-3">Question List</h4>
                  {renderQuestionsList(editingQuestionnaire.questions)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingQuestionnaire(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateQuestionnaire}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Questionnaire Dialog */}
      <Dialog
        open={viewingQuestionnaire !== null}
        onOpenChange={(open) => !open && setViewingQuestionnaire(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {viewingQuestionnaire?.title || "Questionnaire Preview"}
            </DialogTitle>
            <DialogDescription>
              {viewingQuestionnaire?.description ||
                "Preview how your questionnaire will appear to users"}
            </DialogDescription>
          </DialogHeader>
          {viewingQuestionnaire && (
            <div className="space-y-6 py-4">
              <div className="space-y-6">
                {viewingQuestionnaire.questions
                  .sort((a, b) => a.order - b.order)
                  .map((question) => (
                    <div key={question.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{question.text}</h4>
                        {question.required && (
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            Required
                          </Badge>
                        )}
                      </div>

                      {question.type === "text" && (
                        <Textarea
                          placeholder={
                            (question as any).placeholder ||
                            "Enter your answer here"
                          }
                          disabled
                        />
                      )}

                      {question.type === "multiple_choice" && (
                        <div className="space-y-2">
                          {(question as any).options.map(
                            (option: string, i: number) => (
                              <div
                                key={i}
                                className="flex items-center space-x-2"
                              >
                                {(question as any).allow_multiple ? (
                                  <input
                                    type="checkbox"
                                    id={`option-${question.id}-${i}`}
                                    disabled
                                    className="h-4 w-4 rounded border-slate-300"
                                  />
                                ) : (
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    id={`option-${question.id}-${i}`}
                                    disabled
                                    className="h-4 w-4 border-slate-300"
                                  />
                                )}
                                <Label
                                  htmlFor={`option-${question.id}-${i}`}
                                  className="text-sm font-normal"
                                >
                                  {option}
                                </Label>
                              </div>
                            ),
                          )}
                        </div>
                      )}

                      {question.type === "rating" && (
                        <div className="flex space-x-1">
                          {Array.from(
                            { length: (question as any).max_rating },
                            (_, i) => (
                              <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                disabled
                                className="h-8 w-8 p-0"
                              >
                                {i + 1}
                              </Button>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This is a preview of how your questionnaire will appear to
                  users. To share this questionnaire, use the "Copy Share Link"
                  option from the questionnaire card menu.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingQuestionnaire(null)}
            >
              Close Preview
            </Button>
            <Button
              onClick={() => {
                if (viewingQuestionnaire) {
                  handleCopyShareLink(viewingQuestionnaire.id);
                }
              }}
            >
              <Copy className="h-4 w-4 mr-2" /> Copy Share Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectQuestionnairesPanel;
