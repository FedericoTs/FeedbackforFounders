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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Copy,
  Link,
  Mail,
  MoreHorizontal,
  Plus,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
  MessageSquare,
  Loader2,
  Clock,
  Edit,
  Check,
  Shield,
  Eye,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";

interface ProjectCollaborationPanelProps {
  projectId: string;
  projectTitle: string;
}

interface Collaborator {
  id: string;
  user_id: string;
  project_id: string;
  role: "owner" | "editor" | "viewer";
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

const ProjectCollaborationPanel = ({
  projectId,
  projectTitle,
}: ProjectCollaborationPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");
  const [newCollaboratorRole, setNewCollaboratorRole] = useState<
    "editor" | "viewer"
  >("viewer");
  const [addingCollaborator, setAddingCollaborator] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");

  useEffect(() => {
    if (projectId && user) {
      fetchCollaborators();
      fetchComments();
      generateShareLink();
    }
  }, [projectId, user]);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("project_collaborators")
        .select("*, user:user_id(id, full_name, email, avatar_url)")
        .eq("project_id", projectId);

      if (error) throw error;

      // If no collaborators found, add the current user as owner
      if (data.length === 0 && user) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, full_name, email, avatar_url")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;

        const newCollaborator = {
          id: `temp-${Date.now()}`,
          user_id: user.id,
          project_id: projectId,
          role: "owner" as const,
          created_at: new Date().toISOString(),
          user: userData,
        };

        // Add to database
        const { error: insertError } = await supabase
          .from("project_collaborators")
          .insert({
            user_id: user.id,
            project_id: projectId,
            role: "owner",
          });

        if (insertError) throw insertError;

        setCollaborators([newCollaborator]);
      } else {
        setCollaborators(data || []);
      }
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      toast({
        title: "Error",
        description: "Failed to load collaborators. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("project_comments")
        .select("*, user:user_id(id, full_name, email, avatar_url)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateShareLink = () => {
    // Generate a unique share link for the project
    const baseUrl = window.location.origin;
    const shareToken = btoa(`project:${projectId}`);
    setShareLink(`${baseUrl}/shared/project/${shareToken}`);
  };

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingCollaborator(true);

      // First, check if the user exists
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, full_name, email, avatar_url")
        .eq("email", newCollaboratorEmail.trim())
        .single();

      if (userError) {
        toast({
          title: "Error",
          description: "User not found. They need to sign up first.",
          variant: "destructive",
        });
        return;
      }

      // Check if user is already a collaborator
      const isAlreadyCollaborator = collaborators.some(
        (collab) => collab.user_id === userData.id,
      );

      if (isAlreadyCollaborator) {
        toast({
          title: "Error",
          description: "This user is already a collaborator on this project",
          variant: "destructive",
        });
        return;
      }

      // Add the collaborator
      const { error: insertError } = await supabase
        .from("project_collaborators")
        .insert({
          user_id: userData.id,
          project_id: projectId,
          role: newCollaboratorRole,
        });

      if (insertError) throw insertError;

      // Refresh collaborators list
      fetchCollaborators();

      toast({
        title: "Success",
        description: `${userData.full_name || userData.email} has been added as a collaborator`,
      });

      // Reset form
      setNewCollaboratorEmail("");
      setShowAddCollaborator(false);
    } catch (error) {
      console.error("Error adding collaborator:", error);
      toast({
        title: "Error",
        description: "Failed to add collaborator. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const { error } = await supabase
        .from("project_collaborators")
        .delete()
        .eq("id", collaboratorId);

      if (error) throw error;

      // Update local state
      setCollaborators(
        collaborators.filter((collab) => collab.id !== collaboratorId),
      );

      toast({
        title: "Success",
        description: "Collaborator has been removed",
      });
    } catch (error) {
      console.error("Error removing collaborator:", error);
      toast({
        title: "Error",
        description: "Failed to remove collaborator. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCollaboratorRole = async (
    collaboratorId: string,
    newRole: "owner" | "editor" | "viewer",
  ) => {
    try {
      const { error } = await supabase
        .from("project_collaborators")
        .update({ role: newRole })
        .eq("id", collaboratorId);

      if (error) throw error;

      // Update local state
      setCollaborators(
        collaborators.map((collab) =>
          collab.id === collaboratorId ? { ...collab, role: newRole } : collab,
        ),
      );

      toast({
        title: "Success",
        description: "Collaborator role has been updated",
      });
    } catch (error) {
      console.error("Error updating collaborator role:", error);
      toast({
        title: "Error",
        description: "Failed to update collaborator role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      setSendingComment(true);

      const { data, error } = await supabase
        .from("project_comments")
        .insert({
          project_id: projectId,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select("*, user:user_id(id, full_name, email, avatar_url)")
        .single();

      if (error) throw error;

      // Add to local state
      setComments([...comments, data]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingComment(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditedCommentContent(comment.content);
  };

  const handleSaveEditedComment = async () => {
    if (!editingCommentId || !editedCommentContent.trim()) return;

    try {
      const { error } = await supabase
        .from("project_comments")
        .update({ content: editedCommentContent.trim() })
        .eq("id", editingCommentId);

      if (error) throw error;

      // Update local state
      setComments(
        comments.map((comment) =>
          comment.id === editingCommentId
            ? { ...comment, content: editedCommentContent.trim() }
            : comment,
        ),
      );

      // Reset editing state
      setEditingCommentId(null);
      setEditedCommentContent("");

      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("project_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      // Update local state
      setComments(comments.filter((comment) => comment.id !== commentId));

      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400";
      case "editor":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400";
      case "viewer":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const isCurrentUserOwner = () => {
    if (!user) return false;
    return collaborators.some(
      (collab) => collab.user_id === user.id && collab.role === "owner",
    );
  };

  const canEditComment = (comment: Comment) => {
    if (!user) return false;
    return comment.user_id === user.id;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Collaborators Section */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-slate-500" />
                  Collaborators
                </div>
                <Badge className="ml-2">{collaborators.length}</Badge>
              </CardTitle>
              <CardDescription>
                People with access to this project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          collaborator.user?.avatar_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${collaborator.user?.email}`
                        }
                        alt={collaborator.user?.full_name || ""}
                      />
                      <AvatarFallback>
                        {(
                          collaborator.user?.full_name?.[0] ||
                          collaborator.user?.email?.[0] ||
                          ""
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {collaborator.user?.full_name ||
                          collaborator.user?.email ||
                          "Unknown User"}
                      </p>
                      <Badge className={getRoleBadgeClass(collaborator.role)}>
                        {collaborator.role}
                      </Badge>
                    </div>
                  </div>

                  {isCurrentUserOwner() &&
                    user?.id !== collaborator.user_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateCollaboratorRole(
                                collaborator.id,
                                "editor",
                              )
                            }
                            disabled={collaborator.role === "editor"}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Make Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateCollaboratorRole(
                                collaborator.id,
                                "viewer",
                              )
                            }
                            disabled={collaborator.role === "viewer"}
                          >
                            <Eye className="h-4 w-4 mr-2" /> Make Viewer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateCollaboratorRole(
                                collaborator.id,
                                "owner",
                              )
                            }
                            disabled={collaborator.role === "owner"}
                          >
                            <Shield className="h-4 w-4 mr-2" /> Make Owner
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Remove
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove Collaborator
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove{" "}
                                  {collaborator.user?.full_name ||
                                    collaborator.user?.email ||
                                    "this user"}{" "}
                                  from this project? They will no longer have
                                  access.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleRemoveCollaborator(collaborator.id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </div>
              ))}

              {isCurrentUserOwner() && (
                <div>
                  {showAddCollaborator ? (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="colleague@example.com"
                          value={newCollaboratorEmail}
                          onChange={(e) =>
                            setNewCollaboratorEmail(e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={newCollaboratorRole}
                          onValueChange={(value) =>
                            setNewCollaboratorRole(value as "editor" | "viewer")
                          }
                        >
                          <SelectTrigger id="role">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editor">
                              Editor (can edit)
                            </SelectItem>
                            <SelectItem value="viewer">
                              Viewer (can view only)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddCollaborator(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAddCollaborator}
                          disabled={addingCollaborator}
                        >
                          {addingCollaborator ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>Add</>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAddCollaborator(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Collaborator
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Link className="h-5 w-5 mr-2 text-slate-500" />
                Share Project
              </CardTitle>
              <CardDescription>Share this project with others</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input value={shareLink} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={copyShareLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments Section */}
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-slate-500" />
                Team Discussion
              </CardTitle>
              <CardDescription>
                Internal discussion about {projectTitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-[400px]">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500">
                      No comments yet. Start the discussion!
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            comment.user?.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.email}`
                          }
                          alt={comment.user?.full_name || ""}
                        />
                        <AvatarFallback>
                          {(
                            comment.user?.full_name?.[0] ||
                            comment.user?.email?.[0] ||
                            ""
                          ).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium text-sm">
                              {comment.user?.full_name ||
                                comment.user?.email ||
                                "Unknown User"}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(comment.created_at)}
                            </div>
                          </div>
                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editedCommentContent}
                                onChange={(e) =>
                                  setEditedCommentContent(e.target.value)
                                }
                                className="min-h-[80px]"
                              />
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditedCommentContent("");
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSaveEditedComment}
                                >
                                  <Check className="h-4 w-4 mr-1" /> Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          )}
                        </div>
                        {canEditComment(comment) &&
                          editingCommentId !== comment.id && (
                            <div className="flex space-x-2 mt-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleEditComment(comment)}
                              >
                                <Edit className="h-3 w-3 mr-1" /> Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Comment
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this
                                      comment? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteComment(comment.id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t pt-3">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || sendingComment}
                  >
                    {sendingComment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectCollaborationPanel;
