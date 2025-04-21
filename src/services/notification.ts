import { supabase } from "../../supabase/supabase";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "feedback" | "response" | "achievement" | "system";
  related_id?: string; // Could be feedback_id, project_id, etc.
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Notification[];
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      return [];
    }
  },

  /**
   * Get unread notifications count for a user
   */
  async getUnreadNotificationsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error fetching unread notifications count:", error);
      return 0;
    }
  },

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  },

  /**
   * Create a new notification
   */
  async createNotification(notification: {
    user_id: string;
    title: string;
    message: string;
    type: "feedback" | "response" | "achievement" | "system";
    related_id?: string;
  }): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: notification.user_id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          related_id: notification.related_id,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  },

  /**
   * Create a feedback notification for project owner
   */
  async createFeedbackNotification(
    projectOwnerId: string,
    feedbackId: string,
    projectTitle: string,
    feedbackCategory: string,
  ): Promise<Notification | null> {
    return this.createNotification({
      user_id: projectOwnerId,
      title: "New Feedback Received",
      message: `You received new feedback in the ${feedbackCategory} category for your project "${projectTitle}".`,
      type: "feedback",
      related_id: feedbackId,
    });
  },

  /**
   * Create a response notification for feedback author
   */
  async createResponseNotification(
    feedbackAuthorId: string,
    feedbackId: string,
    projectTitle: string,
    isOfficialResponse: boolean,
  ): Promise<Notification | null> {
    return this.createNotification({
      user_id: feedbackAuthorId,
      title: "Response to Your Feedback",
      message: `${isOfficialResponse ? "The project owner" : "Someone"} responded to your feedback on "${projectTitle}".`,
      type: "response",
      related_id: feedbackId,
    });
  },

  /**
   * Create an achievement notification
   */
  async createAchievementNotification(
    userId: string,
    achievementTitle: string,
    achievementDescription: string,
    points: number,
  ): Promise<Notification | null> {
    return this.createNotification({
      user_id: userId,
      title: `Achievement Unlocked: ${achievementTitle}`,
      message: `${achievementDescription} You earned ${points} points!`,
      type: "achievement",
    });
  },
};
