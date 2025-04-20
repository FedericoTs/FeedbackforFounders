import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

interface CollaborationRequest {
  action:
    | "invite"
    | "remove"
    | "update_role"
    | "add_comment"
    | "edit_comment"
    | "delete_comment";
  projectId: string;
  userId: string;
  targetUserId?: string;
  role?: "owner" | "editor" | "viewer";
  commentId?: string;
  content?: string;
  email?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === "POST") {
      const {
        action,
        projectId,
        userId,
        targetUserId,
        role,
        commentId,
        content,
        email,
      } = (await req.json()) as CollaborationRequest;

      // Validate input
      if (!action || !projectId || !userId) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      // Check if user has access to the project
      const { data: collaborator, error: collaboratorError } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .single();

      if (collaboratorError || !collaborator) {
        return new Response(JSON.stringify({ error: "Unauthorized access" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Check permissions based on action
      if (
        (action === "invite" ||
          action === "remove" ||
          action === "update_role") &&
        collaborator.role !== "owner"
      ) {
        return new Response(
          JSON.stringify({
            error: "Only project owners can manage collaborators",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      let result;

      switch (action) {
        case "invite":
          // First check if the user exists by email
          if (!email) {
            return new Response(
              JSON.stringify({ error: "Email is required for invitations" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

          if (userError || !userData) {
            return new Response(JSON.stringify({ error: "User not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          // Check if already a collaborator
          const { data: existingCollaborator } = await supabase
            .from("project_collaborators")
            .select("id")
            .eq("project_id", projectId)
            .eq("user_id", userData.id)
            .single();

          if (existingCollaborator) {
            return new Response(
              JSON.stringify({ error: "User is already a collaborator" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          // Add collaborator
          const { data: newCollaborator, error: addError } = await supabase
            .from("project_collaborators")
            .insert({
              project_id: projectId,
              user_id: userData.id,
              role: role || "viewer",
            })
            .select()
            .single();

          if (addError) {
            throw addError;
          }

          // Record activity
          await supabase.from("project_activity").insert({
            project_id: projectId,
            user_id: userId,
            activity_type: "collaborator_added",
            description: `New collaborator added with ${role || "viewer"} role`,
            metadata: { collaborator_id: userData.id, role: role || "viewer" },
          });

          result = { success: true, collaborator: newCollaborator };
          break;

        case "remove":
          if (!targetUserId) {
            return new Response(
              JSON.stringify({ error: "Target user ID is required" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          // Remove collaborator
          const { data: removedCollaborator, error: removeError } =
            await supabase
              .from("project_collaborators")
              .delete()
              .eq("project_id", projectId)
              .eq("user_id", targetUserId)
              .select()
              .single();

          if (removeError) {
            throw removeError;
          }

          // Record activity
          await supabase.from("project_activity").insert({
            project_id: projectId,
            user_id: userId,
            activity_type: "collaborator_removed",
            description: "Collaborator removed from project",
            metadata: { collaborator_id: targetUserId },
          });

          result = { success: true, removed: removedCollaborator };
          break;

        case "update_role":
          if (!targetUserId || !role) {
            return new Response(
              JSON.stringify({ error: "Target user ID and role are required" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          // Update collaborator role
          const { data: updatedCollaborator, error: updateError } =
            await supabase
              .from("project_collaborators")
              .update({ role })
              .eq("project_id", projectId)
              .eq("user_id", targetUserId)
              .select()
              .single();

          if (updateError) {
            throw updateError;
          }

          // Record activity
          await supabase.from("project_activity").insert({
            project_id: projectId,
            user_id: userId,
            activity_type: "role_updated",
            description: `Collaborator role updated to ${role}`,
            metadata: { collaborator_id: targetUserId, role },
          });

          result = { success: true, collaborator: updatedCollaborator };
          break;

        case "add_comment":
          if (!content) {
            return new Response(
              JSON.stringify({ error: "Comment content is required" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          // Add comment
          const { data: newComment, error: commentError } = await supabase
            .from("project_comments")
            .insert({
              project_id: projectId,
              user_id: userId,
              content,
            })
            .select("*, user:user_id(id, full_name, email, avatar_url)")
            .single();

          if (commentError) {
            throw commentError;
          }

          // Record activity
          await supabase.from("project_activity").insert({
            project_id: projectId,
            user_id: userId,
            activity_type: "comment_added",
            description: "New comment added",
            metadata: { comment_id: newComment.id },
          });

          result = { success: true, comment: newComment };
          break;

        case "edit_comment":
          if (!commentId || !content) {
            return new Response(
              JSON.stringify({ error: "Comment ID and content are required" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          // Check if user owns the comment
          const { data: existingComment, error: commentCheckError } =
            await supabase
              .from("project_comments")
              .select("user_id")
              .eq("id", commentId)
              .single();

          if (commentCheckError || !existingComment) {
            return new Response(
              JSON.stringify({ error: "Comment not found" }),
              {
                status: 404,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          if (existingComment.user_id !== userId) {
            return new Response(
              JSON.stringify({ error: "You can only edit your own comments" }),
              {
                status: 403,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          // Update comment
          const { data: updatedComment, error: updateCommentError } =
            await supabase
              .from("project_comments")
              .update({
                content,
                updated_at: new Date().toISOString(),
              })
              .eq("id", commentId)
              .select("*, user:user_id(id, full_name, email, avatar_url)")
              .single();

          if (updateCommentError) {
            throw updateCommentError;
          }

          result = { success: true, comment: updatedComment };
          break;

        case "delete_comment":
          if (!commentId) {
            return new Response(
              JSON.stringify({ error: "Comment ID is required" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          // Check if user owns the comment
          const { data: commentToDelete, error: deleteCheckError } =
            await supabase
              .from("project_comments")
              .select("user_id")
              .eq("id", commentId)
              .single();

          if (deleteCheckError || !commentToDelete) {
            return new Response(
              JSON.stringify({ error: "Comment not found" }),
              {
                status: 404,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          if (
            commentToDelete.user_id !== userId &&
            collaborator.role !== "owner"
          ) {
            return new Response(
              JSON.stringify({
                error:
                  "You can only delete your own comments or must be project owner",
              }),
              {
                status: 403,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          // Delete comment
          const { data: deletedComment, error: deleteCommentError } =
            await supabase
              .from("project_comments")
              .delete()
              .eq("id", commentId)
              .select()
              .single();

          if (deleteCommentError) {
            throw deleteCommentError;
          }

          result = { success: true, deleted: true, commentId };
          break;

        default:
          return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
      }

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
